import {Duration} from 'aws-cdk-lib';
import {EndpointType, LambdaIntegration, MethodLoggingLevel, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import {createNodejsFunction, createPythonFunction, FunctionResources} from '@cdk-constructs/lambda';
import {DEFAULT_CORS_PREFLIGHT_OPTIONS} from '../config/cors';
import type {PrivateRestApiProps} from '../types/rest-api-private';
import type {RestApiResources} from '../types/rest-api-base';
import {createApiKeyWithUsagePlan} from '../util/api-key-helpers';
import {lookupVpcEndpoint} from './vpc-endpoint';

/**
 * Creates a private REST API with Lambda integration.
 *
 * @remarks
 * This function creates a REST API with PRIVATE endpoint type that is only
 * accessible from within a VPC through a VPC endpoint. Features include:
 * - Private endpoint type with VPC endpoint restriction
 * - Resource policy limiting access to the specified VPC endpoint
 * - Automatic Lambda creation (Node.js or Python) or existing function integration
 * - Optional API key and usage plan creation
 * - CORS preflight configuration
 * - CloudWatch logging enabled
 *
 * The API is only accessible from resources within the VPC that can reach
 * the VPC endpoint. This provides network-level isolation for internal APIs.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the private REST API
 * @returns Object containing all created resources
 *
 * @example
 * ```typescript
 * import { createPrivateRestApi } from '@cdk-constructs/apigateway';
 * import * as path from 'path';
 *
 * const resources = createPrivateRestApi(this, {
 *   apiName: 'internal-api',
 *   vpcEndpointId: 'vpce-12345',
 *   integration: {
 *     nodejsLambda: {
 *       functionName: 'internal-handler',
 *       entryPath: path.join(__dirname, '../lambda/handler.ts'),
 *       vpc: {
 *         vpcId: 'vpc-12345',
 *         privateSubnetIds: ['subnet-1', 'subnet-2'],
 *       },
 *     },
 *   },
 *   requireApiKey: true,
 *   apiKeyParameterPath: '/api/internal/key',
 * });
 * ```
 *
 * @see {@link PrivateRestApiProps} for configuration options
 * @see {@link RestApiResources} for returned resources
 * @public
 */
export const createPrivateRestApi = (scope: Construct, props: PrivateRestApiProps): RestApiResources => {
    // Resolve Lambda function
    const {lambdaFunction, lambdaResources} = resolveLambdaIntegration(scope, props);

    // Create resource policy to restrict access to VPC endpoint
    const resourcePolicy = new PolicyDocument({
        statements: [
            new PolicyStatement({
                effect: Effect.DENY,
                principals: [new AnyPrincipal()],
                actions: ['execute-api:Invoke'],
                resources: ['execute-api:/*'],
                conditions: {
                    StringNotEquals: {
                        'aws:SourceVpce': props.vpcEndpointId,
                    },
                },
            }),
            new PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new AnyPrincipal()],
                actions: ['execute-api:Invoke'],
                resources: ['execute-api:/*'],
            }),
        ],
    });

    // Create the REST API
    const api = new RestApi(scope, props.apiName, {
        restApiName: props.apiName,
        description: props.description ?? `Private REST API: ${props.apiName}`,
        endpointConfiguration: {
            types: [EndpointType.PRIVATE],
            vpcEndpoints: [lookupVpcEndpoint(scope, props.vpcEndpointId)],
        },
        policy: resourcePolicy,
        deployOptions: {
            stageName: props.stageName ?? 'prod',
            loggingLevel: MethodLoggingLevel.INFO,
            dataTraceEnabled: true,
            metricsEnabled: true,
        },
        defaultCorsPreflightOptions: DEFAULT_CORS_PREFLIGHT_OPTIONS,
    });

    // Create Lambda integration
    const lambdaIntegration = new LambdaIntegration(lambdaFunction, {
        timeout: props.integration.integrationTimeout ?? Duration.seconds(29),
        proxy: true,
    });

    // Add proxy resource for all paths (handles /{proxy+})
    api.root.addProxy({
        defaultIntegration: lambdaIntegration,
        anyMethod: true,
        defaultMethodOptions: {
            apiKeyRequired: props.requireApiKey !== false,
        },
    });

    // Add methods for root path (/) - GET, POST, PUT, DELETE, PATCH
    // Note: OPTIONS is handled by CORS, ANY would conflict with proxy
    const rootMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    rootMethods.forEach(method => {
        api.root.addMethod(method, lambdaIntegration, {
            apiKeyRequired: props.requireApiKey !== false,
        });
    });

    const result: RestApiResources = {
        api,
        lambdaFunction,
        lambdaResources,
    };

    // Create API key and usage plan if required
    if (props.requireApiKey !== false) {
        const apiKeyResult = createApiKeyWithUsagePlan(scope, {
            apiName: props.apiName,
            api,
            stageName: props.stageName ?? 'prod',
            ssmParameterPath: props.apiKeyParameterPath,
        });

        result.apiKey = apiKeyResult.apiKey;
        result.usagePlan = apiKeyResult.usagePlan;
    }

    return result;
};

/**
 * Resolves Lambda integration configuration to a function.
 *
 * @internal
 */
const resolveLambdaIntegration = (scope: Construct, props: PrivateRestApiProps): {lambdaFunction: IFunction; lambdaResources?: FunctionResources} => {
    const {integration} = props;

    if (integration.existingFunction) {
        return {
            lambdaFunction: integration.existingFunction,
        };
    }

    if (integration.nodejsLambda) {
        const resources = createNodejsFunction(scope, integration.nodejsLambda);
        return {
            lambdaFunction: resources.function,
            lambdaResources: resources,
        };
    }

    if (integration.pythonLambda) {
        const resources = createPythonFunction(scope, integration.pythonLambda);
        return {
            lambdaFunction: resources.function,
            lambdaResources: resources,
        };
    }

    throw new Error('Lambda integration configuration must specify nodejsLambda, pythonLambda, or existingFunction');
};
