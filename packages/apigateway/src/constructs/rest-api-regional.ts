import {Duration} from 'aws-cdk-lib';
import {BasePathMapping, DomainName, EndpointType, LambdaIntegration, MethodLoggingLevel, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import {createNodejsFunction, createPythonFunction, FunctionResources} from '@cdk-constructs/lambda';
import {DEFAULT_CORS_PREFLIGHT_OPTIONS} from '../config/cors';
import type {RegionalRestApiProps} from '../types/rest-api-regional';
import type {RestApiResources} from '../types/rest-api-base';
import {createApiKeyWithUsagePlan} from '../util/api-key-helpers';

/**
 * Creates a regional REST API with Lambda integration.
 *
 * @remarks
 * This function creates a REST API with REGIONAL endpoint type that is
 * accessible from the public internet. Features include:
 * - Regional endpoint type for lower latency in a single region
 * - Automatic Lambda creation (Node.js or Python) or existing function integration
 * - Optional API key and usage plan creation
 * - Optional custom domain base path mapping
 * - CORS preflight configuration
 * - CloudWatch logging enabled
 *
 * Regional APIs should be protected with WAF and/or API keys for security.
 * Consider using `@cdk-constructs/waf` to add Web Application Firewall protection.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the regional REST API
 * @returns Object containing all created resources
 *
 * @example
 * ```typescript
 * import { createRegionalRestApi } from '@cdk-constructs/apigateway';
 * import * as path from 'path';
 *
 * const resources = createRegionalRestApi(this, {
 *   apiName: 'public-api',
 *   integration: {
 *     nodejsLambda: {
 *       functionName: 'public-handler',
 *       entryPath: path.join(__dirname, '../lambda/handler.ts'),
 *       vpc: { vpcId: '', privateSubnetIds: [] },
 *       disableVpc: true,
 *     },
 *   },
 *   requireApiKey: true,
 * });
 *
 * // With custom domain
 * const resourcesWithDomain = createRegionalRestApi(this, {
 *   apiName: 'public-api-v2',
 *   integration: { existingFunction: myFunction },
 *   domainNameArn: 'arn:aws:apigateway:us-east-1::/domainnames/api.example.com',
 *   basePath: 'v2',
 * });
 * ```
 *
 * @see {@link RegionalRestApiProps} for configuration options
 * @see {@link RestApiResources} for returned resources
 * @public
 */
export const createRegionalRestApi = (scope: Construct, props: RegionalRestApiProps): RestApiResources => {
    // Resolve Lambda function
    const {lambdaFunction, lambdaResources} = resolveLambdaIntegration(scope, props);

    // Create the REST API
    const api = new RestApi(scope, props.apiName, {
        restApiName: props.apiName,
        description: props.description ?? `Regional REST API: ${props.apiName}`,
        endpointConfiguration: {
            types: [EndpointType.REGIONAL],
        },
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

    // Add custom domain base path mapping if configured
    if (props.domainNameArn) {
        const domainName = DomainName.fromDomainNameAttributes(scope, `${props.apiName}-domain`, {
            domainName: extractDomainNameFromArn(props.domainNameArn),
            domainNameAliasHostedZoneId: '',
            domainNameAliasTarget: '',
        });

        new BasePathMapping(scope, `${props.apiName}-base-path-mapping`, {
            domainName,
            restApi: api,
            basePath: props.basePath,
            stage: api.deploymentStage,
        });
    }

    return result;
};

/**
 * Resolves Lambda integration configuration to a function.
 *
 * @internal
 */
const resolveLambdaIntegration = (scope: Construct, props: RegionalRestApiProps): {lambdaFunction: IFunction; lambdaResources?: FunctionResources} => {
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

/**
 * Extracts domain name from API Gateway domain name ARN.
 *
 * @internal
 */
const extractDomainNameFromArn = (arn: string): string => {
    // ARN format: arn:aws:apigateway:region::/domainnames/domain.example.com
    const parts = arn.split('/');
    return parts[parts.length - 1];
};
