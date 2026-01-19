import {App, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {Function, Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {createRegionalRestApi} from '../src';

describe('createRegionalRestApi', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates REST API with regional endpoint type', () => {
        createRegionalRestApi(stack, {
            apiName: 'test-regional-api',
            integration: {
                nodejsLambda: {
                    functionName: 'test-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify REST API created with regional endpoint
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Name: 'test-regional-api',
            EndpointConfiguration: {
                Types: ['REGIONAL'],
            },
        });
    });

    test('attaches Node.js Lambda correctly', () => {
        const resources = createRegionalRestApi(stack, {
            apiName: 'nodejs-regional-api',
            integration: {
                nodejsLambda: {
                    functionName: 'nodejs-regional-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'nodejs-regional-handler',
            Runtime: 'nodejs22.x',
        });

        expect(resources.lambdaResources).toBeDefined();
        expect(resources.lambdaFunction).toBeDefined();
    });

    test('attaches Python Lambda correctly', () => {
        const resources = createRegionalRestApi(stack, {
            apiName: 'python-regional-api',
            integration: {
                pythonLambda: {
                    functionName: 'python-regional-handler',
                    entryPath: path.join(__dirname, 'fixtures/python'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
        });

        const template = Template.fromStack(stack);

        // Verify Lambda created
        template.resourceCountIs('AWS::Lambda::Function', 1);
        template.hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'python-regional-handler',
            Runtime: 'python3.13',
        });

        expect(resources.lambdaResources).toBeDefined();
    });

    test('uses existing Lambda function when provided', () => {
        const existingFunction = new Function(stack, 'existing-fn', {
            functionName: 'existing-regional-function',
            code: Code.fromInline('exports.handler = () => {}'),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_22_X,
        });

        const resources = createRegionalRestApi(stack, {
            apiName: 'existing-lambda-regional-api',
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

    test('creates API key when required (default)', () => {
        const resources = createRegionalRestApi(stack, {
            apiName: 'regional-api-with-key',
            integration: {
                nodejsLambda: {
                    functionName: 'key-regional-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
        template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);

        expect(resources.apiKey).toBeDefined();
        expect(resources.usagePlan).toBeDefined();
    });

    test('skips API key when not required', () => {
        const resources = createRegionalRestApi(stack, {
            apiName: 'regional-api-no-key',
            integration: {
                nodejsLambda: {
                    functionName: 'no-key-regional-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
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

    test('configures custom domain base path mapping when provided', () => {
        createRegionalRestApi(stack, {
            apiName: 'domain-api',
            integration: {
                nodejsLambda: {
                    functionName: 'domain-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
            domainNameArn: 'arn:aws:apigateway:us-east-1::/domainnames/api.example.com',
            basePath: 'v1',
        });

        const template = Template.fromStack(stack);

        // Verify base path mapping created
        template.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1);
        template.hasResourceProperties('AWS::ApiGateway::BasePathMapping', {
            BasePath: 'v1',
        });
    });

    test('no resource policy for regional APIs', () => {
        createRegionalRestApi(stack, {
            apiName: 'no-policy-api',
            integration: {
                nodejsLambda: {
                    functionName: 'no-policy-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
                },
            },
        });

        const template = Template.fromStack(stack);

        // Regional APIs should not have a policy
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Policy: Match.absent(),
        });
    });

    test('returns all expected resources', () => {
        const resources = createRegionalRestApi(stack, {
            apiName: 'resource-regional-api',
            integration: {
                nodejsLambda: {
                    functionName: 'resource-regional-handler',
                    entryPath: path.join(__dirname, 'fixtures/handler.ts'),
                    vpc: {vpcId: '', privateSubnetIds: []},
                    disableVpc: true,
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
});
