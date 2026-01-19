import {App, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {Function, Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {createPrivateRestApi} from '../src';

describe('createPrivateRestApi', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates REST API with private endpoint type', () => {
        createPrivateRestApi(stack, {
            apiName: 'test-private-api',
            vpcEndpointId: 'vpce-12345',
            integration: {
                nodejsLambda: {
                    functionName: 'test-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify REST API created with private endpoint
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Name: 'test-private-api',
            EndpointConfiguration: {
                Types: ['PRIVATE'],
            },
        });
    });

    test('attaches Node.js Lambda correctly', () => {
        const resources = createPrivateRestApi(stack, {
            apiName: 'nodejs-api',
            vpcEndpointId: 'vpce-12345',
            integration: {
                nodejsLambda: {
                    functionName: 'nodejs-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'nodejs-handler',
            Runtime: 'nodejs22.x',
        });

        expect(resources.lambdaResources).toBeDefined();
        expect(resources.lambdaFunction).toBeDefined();
    });

    test('attaches Python Lambda correctly', () => {
        const resources = createPrivateRestApi(stack, {
            apiName: 'python-api',
            vpcEndpointId: 'vpce-12345',
            integration: {
                pythonLambda: {
                    functionName: 'python-handler',
                    entryPath: path.join(__dirname, 'fixtures/python'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'python-handler',
            Runtime: 'python3.13',
        });

        expect(resources.lambdaResources).toBeDefined();
    });

    test('uses existing Lambda function when provided', () => {
        const existingFunction = new Function(stack, 'existing-fn', {
            functionName: 'existing-function',
            code: Code.fromInline('exports.handler = () => {}'),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_22_X,
        });

        const resources = createPrivateRestApi(stack, {
            apiName: 'existing-lambda-api',
            vpcEndpointId: 'vpce-12345',
            integration: {
                existingFunction,
            },
        });

        const template = Template.fromStack(stack);

        // Should only have the existing function
        template.resourceCountIs('AWS::Lambda::Function', 1);

        expect(resources.lambdaResources).toBeUndefined();
        expect(resources.lambdaFunction).toBe(existingFunction);
    });

    test('creates API key when required', () => {
        const resources = createPrivateRestApi(stack, {
            apiName: 'api-with-key',
            vpcEndpointId: 'vpce-12345',
            integration: {
                nodejsLambda: {
                    functionName: 'key-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
            requireApiKey: true,
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
        template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);

        expect(resources.apiKey).toBeDefined();
        expect(resources.usagePlan).toBeDefined();
    });

    test('skips API key when not required', () => {
        const resources = createPrivateRestApi(stack, {
            apiName: 'api-no-key',
            vpcEndpointId: 'vpce-12345',
            integration: {
                nodejsLambda: {
                    functionName: 'no-key-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
            requireApiKey: false,
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::ApiGateway::ApiKey', 0);
        template.resourceCountIs('AWS::ApiGateway::UsagePlan', 0);

        expect(resources.apiKey).toBeUndefined();
        expect(resources.usagePlan).toBeUndefined();
    });

    test('returns all expected resources', () => {
        const resources = createPrivateRestApi(stack, {
            apiName: 'resource-api',
            vpcEndpointId: 'vpce-12345',
            integration: {
                nodejsLambda: {
                    functionName: 'resource-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
            requireApiKey: true,
        });

        expect(resources).toHaveProperty('api');
        expect(resources).toHaveProperty('lambdaFunction');
        expect(resources).toHaveProperty('lambdaResources');
        expect(resources).toHaveProperty('apiKey');
        expect(resources).toHaveProperty('usagePlan');
    });

    test('configures resource policy with VPC endpoint', () => {
        createPrivateRestApi(stack, {
            apiName: 'policy-api',
            vpcEndpointId: 'vpce-policy-test',
            integration: {
                nodejsLambda: {
                    functionName: 'policy-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {
                        vpcId: 'vpc-12345',
                        privateSubnetIds: ['subnet-1', 'subnet-2'],
                    },
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify resource policy exists
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Policy: Match.objectLike({
                Statement: Match.arrayWith([
                    Match.objectLike({
                        Effect: 'Deny',
                        Condition: {
                            StringNotEquals: {
                                'aws:SourceVpce': 'vpce-policy-test',
                            },
                        },
                    }),
                ]),
            }),
        });
    });
});
