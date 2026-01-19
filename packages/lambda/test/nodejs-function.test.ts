import {App, Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import {createNodejsFunction} from '../src';

describe('createNodejsFunction', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates function with minimal configuration (VPC enabled by default)', () => {
        const resources = createNodejsFunction(stack, {
            functionName: 'test-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda function created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'test-function',
            Runtime: 'nodejs22.x',
            Architectures: ['arm64'],
            MemorySize: 256,
            Timeout: 30,
        });

        // Verify security group created (VPC enabled by default)
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        expect(resources.function).toBeDefined();
        expect(resources.role).toBeDefined();
        expect(resources.logGroup).toBeDefined();
        expect(resources.securityGroup).toBeDefined();
    });

    test('creates function with full configuration', () => {
        const resources = createNodejsFunction(stack, {
            functionName: 'full-config-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            memorySize: 512,
            timeout: Duration.seconds(60),
            handler: 'customHandler',
            sourceMap: true,
            externalModules: ['@aws-sdk/*', 'pg-native'],
            environment: {
                TABLE_NAME: 'my-table',
                LOG_LEVEL: 'debug',
            },
            layerArns: ['arn:aws:lambda:us-east-1:123456789012:layer:my-layer:1'],
            logRetention: RetentionDays.ONE_MONTH,
            logRemovalPolicy: RemovalPolicy.RETAIN,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'full-config-function',
            MemorySize: 512,
            Timeout: 60,
            Environment: {
                Variables: {
                    TABLE_NAME: 'my-table',
                    LOG_LEVEL: 'debug',
                },
            },
        });

        expect(resources.function).toBeDefined();
    });

    test('creates CloudWatch log group with correct retention', () => {
        createNodejsFunction(stack, {
            functionName: 'log-test-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            logRetention: RetentionDays.TWO_WEEKS,
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::Logs::LogGroup', 1);
        template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: '/aws/lambda/log-test-function',
            RetentionInDays: 14,
        });
    });

    test('creates execution role with basic Lambda permissions', () => {
        createNodejsFunction(stack, {
            functionName: 'role-test-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::IAM::Role', 1);
        template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: 'role-test-function-role',
            AssumeRolePolicyDocument: {
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                    },
                ],
            },
            ManagedPolicyArns: Match.arrayWith([
                Match.objectLike({
                    'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('AWSLambdaBasicExecutionRole')])]),
                }),
                Match.objectLike({
                    'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole')])]),
                }),
            ]),
        });
    });

    test('creates security group when VPC enabled (default)', () => {
        const resources = createNodejsFunction(stack, {
            functionName: 'vpc-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for Lambda function vpc-function',
            GroupName: 'vpc-function-sg',
            VpcId: 'vpc-12345',
        });

        expect(resources.securityGroup).toBeDefined();
    });

    test('skips VPC and security group when disableVpc is true', () => {
        const resources = createNodejsFunction(stack, {
            functionName: 'no-vpc-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: '',
                privateSubnetIds: [],
            },
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // No security group created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 0);

        // Role should NOT have VPC execution policy
        template.hasResourceProperties('AWS::IAM::Role', {
            ManagedPolicyArns: Match.not(
                Match.arrayWith([
                    Match.objectLike({
                        'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole')])]),
                    }),
                ])
            ),
        });

        expect(resources.securityGroup).toBeUndefined();
    });

    test('attaches Lambda layers correctly', () => {
        createNodejsFunction(stack, {
            functionName: 'layer-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            layerArns: ['arn:aws:lambda:us-east-1:123456789012:layer:layer1:1', 'arn:aws:lambda:us-east-1:123456789012:layer:layer2:2'],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: ['arn:aws:lambda:us-east-1:123456789012:layer:layer1:1', 'arn:aws:lambda:us-east-1:123456789012:layer:layer2:2'],
        });
    });

    test('sets environment variables correctly', () => {
        createNodejsFunction(stack, {
            functionName: 'env-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            environment: {
                DATABASE_URL: 'postgres://localhost:5432/db',
                CACHE_TTL: '3600',
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    DATABASE_URL: 'postgres://localhost:5432/db',
                    CACHE_TTL: '3600',
                }),
            },
        });
    });

    test('applies custom IAM policy statements', () => {
        createNodejsFunction(stack, {
            functionName: 'policy-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            policyStatements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                    resources: ['arn:aws:dynamodb:us-east-1:123456789012:table/my-table'],
                }),
            ],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    Match.objectLike({
                        Action: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                        Effect: 'Allow',
                        Resource: 'arn:aws:dynamodb:us-east-1:123456789012:table/my-table',
                    }),
                ]),
            },
        });
    });

    test('returns all expected resources', () => {
        const resources = createNodejsFunction(stack, {
            functionName: 'resource-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        expect(resources).toHaveProperty('function');
        expect(resources).toHaveProperty('role');
        expect(resources).toHaveProperty('logGroup');
        expect(resources).toHaveProperty('securityGroup');

        expect(resources.function).toBeDefined();
        expect(resources.role).toBeDefined();
        expect(resources.logGroup).toBeDefined();
        expect(resources.securityGroup).toBeDefined();
    });

    test('uses ARM64 architecture by default', () => {
        createNodejsFunction(stack, {
            functionName: 'arm64-function',
            entryPath: path.join(__dirname, 'fixtures/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Architectures: ['arm64'],
        });
    });
});
