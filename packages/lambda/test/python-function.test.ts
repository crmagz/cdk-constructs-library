import {App, Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import {createPythonFunction} from '../src';

describe('createPythonFunction', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates function with minimal configuration (VPC enabled by default)', () => {
        const resources = createPythonFunction(stack, {
            functionName: 'test-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda function created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'test-python-function',
            Runtime: 'python3.13',
            Architectures: ['arm64'],
            MemorySize: 256,
            Timeout: 30,
            Handler: 'lambda_function.lambda_handler',
        });

        // Verify security group created (VPC enabled by default)
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        expect(resources.function).toBeDefined();
        expect(resources.role).toBeDefined();
        expect(resources.logGroup).toBeDefined();
        expect(resources.securityGroup).toBeDefined();
    });

    test('creates function with full configuration', () => {
        const resources = createPythonFunction(stack, {
            functionName: 'full-config-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            memorySize: 1024,
            timeout: Duration.seconds(120),
            handler: 'app.main_handler',
            runtime: Runtime.PYTHON_3_12,
            environment: {
                BUCKET_NAME: 'my-bucket',
                DEBUG: 'true',
            },
            layerArns: ['arn:aws:lambda:us-east-1:123456789012:layer:python-layer:1'],
            logRetention: RetentionDays.ONE_MONTH,
            logRemovalPolicy: RemovalPolicy.RETAIN,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'full-config-python-function',
            Runtime: 'python3.12',
            MemorySize: 1024,
            Timeout: 120,
            Handler: 'app.main_handler',
            Environment: {
                Variables: {
                    BUCKET_NAME: 'my-bucket',
                    DEBUG: 'true',
                },
            },
        });

        expect(resources.function).toBeDefined();
    });

    test('creates CloudWatch log group with correct retention', () => {
        createPythonFunction(stack, {
            functionName: 'log-test-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            logRetention: RetentionDays.THREE_MONTHS,
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::Logs::LogGroup', 1);
        template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: '/aws/lambda/log-test-python-function',
            RetentionInDays: 90,
        });
    });

    test('creates execution role with basic Lambda permissions', () => {
        createPythonFunction(stack, {
            functionName: 'role-test-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::IAM::Role', 1);
        template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: 'role-test-python-function-role',
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
        const resources = createPythonFunction(stack, {
            functionName: 'vpc-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for Lambda function vpc-python-function',
            GroupName: 'vpc-python-function-sg',
            VpcId: 'vpc-12345',
        });

        expect(resources.securityGroup).toBeDefined();
    });

    test('skips VPC and security group when disableVpc is true', () => {
        const resources = createPythonFunction(stack, {
            functionName: 'no-vpc-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
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
        createPythonFunction(stack, {
            functionName: 'layer-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            layerArns: ['arn:aws:lambda:us-east-1:123456789012:layer:pandas:1', 'arn:aws:lambda:us-east-1:123456789012:layer:numpy:2'],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Layers: ['arn:aws:lambda:us-east-1:123456789012:layer:pandas:1', 'arn:aws:lambda:us-east-1:123456789012:layer:numpy:2'],
        });
    });

    test('sets environment variables correctly', () => {
        createPythonFunction(stack, {
            functionName: 'env-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            environment: {
                S3_BUCKET: 'data-bucket',
                REGION: 'us-east-1',
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    S3_BUCKET: 'data-bucket',
                    REGION: 'us-east-1',
                }),
            },
        });
    });

    test('applies custom IAM policy statements', () => {
        createPythonFunction(stack, {
            functionName: 'policy-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
            policyStatements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['s3:GetObject', 's3:PutObject'],
                    resources: ['arn:aws:s3:::my-bucket/*'],
                }),
            ],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    Match.objectLike({
                        Action: ['s3:GetObject', 's3:PutObject'],
                        Effect: 'Allow',
                        Resource: 'arn:aws:s3:::my-bucket/*',
                    }),
                ]),
            },
        });
    });

    test('returns all expected resources', () => {
        const resources = createPythonFunction(stack, {
            functionName: 'resource-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
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
        createPythonFunction(stack, {
            functionName: 'arm64-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
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

    test('uses Python 3.13 runtime by default', () => {
        createPythonFunction(stack, {
            functionName: 'runtime-python-function',
            entryPath: path.join(__dirname, 'fixtures/python'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'python3.13',
        });
    });
});
