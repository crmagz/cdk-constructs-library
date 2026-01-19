import {App, Duration, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {createPagerDutyLambda} from '../src';

describe('createPagerDutyLambda', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates Lambda with minimal configuration (no VPC)', () => {
        const resources = createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // Verify Lambda function created with default naming: pagerduty-cloudwatch-{env}-{region_short}
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'pagerduty-cloudwatch-dev-use1',
            Runtime: 'nodejs22.x',
            MemorySize: 256,
            Timeout: 30,
        });

        // Verify resources are returned
        expect(resources.function).toBeDefined();
        expect(resources.role).toBeDefined();
        expect(resources.logGroup).toBeDefined();
    });

    test('creates Lambda with custom function name', () => {
        createPagerDutyLambda(stack, {
            functionName: 'my-custom-pagerduty-lambda',
            environment: 'prod',
            region: 'us-east-1',
            account: '123456789012',
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // Custom function name is used as-is
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'my-custom-pagerduty-lambda',
        });
    });

    test('creates Lambda with custom memory and timeout', () => {
        createPagerDutyLambda(stack, {
            environment: 'prod',
            region: 'us-east-1',
            account: '123456789012',
            memorySize: 512,
            timeout: Duration.seconds(60),
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            MemorySize: 512,
            Timeout: 60,
        });
    });

    test('creates Lambda with Secrets Manager permissions', () => {
        createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            secretName: 'my-pagerduty-secret',
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // Verify IAM policy for Secrets Manager access
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    Match.objectLike({
                        Action: 'secretsmanager:GetSecretValue',
                        Effect: 'Allow',
                        Resource: Match.stringLikeRegexp('my-pagerduty-secret'),
                    }),
                ]),
            },
        });
    });

    test('creates Lambda with default secret name', () => {
        createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // Verify environment variable for secret name
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    PAGERDUTY_SECRET_NAME: 'pagerduty-cloudwatch-integration',
                }),
            },
        });
    });

    test('creates Lambda with custom secret name in environment', () => {
        createPagerDutyLambda(stack, {
            environment: 'prod',
            region: 'us-east-1',
            account: '123456789012',
            secretName: 'org/pagerduty-config',
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    PAGERDUTY_SECRET_NAME: 'org/pagerduty-config',
                }),
            },
        });
    });

    test('creates Lambda with additional environment variables', () => {
        createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            additionalEnvironment: {
                CUSTOM_VAR: 'custom-value',
                ANOTHER_VAR: 'another-value',
            },
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    CUSTOM_VAR: 'custom-value',
                    ANOTHER_VAR: 'another-value',
                }),
            },
        });
    });

    test('creates Lambda with VPC configuration', () => {
        const resources = createPagerDutyLambda(stack, {
            environment: 'prod',
            region: 'us-east-1',
            account: '123456789012',
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        const template = Template.fromStack(stack);

        // Verify security group is created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        // Verify Lambda has VPC config
        template.hasResourceProperties('AWS::Lambda::Function', {
            VpcConfig: {
                SubnetIds: ['subnet-1', 'subnet-2'],
            },
        });

        expect(resources.securityGroup).toBeDefined();
    });

    test('creates Lambda without VPC when disabled', () => {
        const resources = createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1'],
            },
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        // No security group should be created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 0);

        expect(resources.securityGroup).toBeUndefined();
    });

    test('creates CloudWatch log group with specified retention', () => {
        createPagerDutyLambda(stack, {
            environment: 'prod',
            region: 'us-east-1',
            account: '123456789012',
            logRetention: RetentionDays.ONE_MONTH,
            disableVpc: true,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: 30,
        });
    });

    test('returns all expected resources', () => {
        const resources = createPagerDutyLambda(stack, {
            environment: 'dev',
            region: 'us-east-1',
            account: '123456789012',
            disableVpc: true,
        });

        expect(resources).toHaveProperty('function');
        expect(resources).toHaveProperty('role');
        expect(resources).toHaveProperty('logGroup');

        expect(resources.function).toBeDefined();
        expect(resources.role).toBeDefined();
        expect(resources.logGroup).toBeDefined();
    });
});
