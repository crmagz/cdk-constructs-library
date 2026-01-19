import {ApiKey, Period, RestApi, UsagePlan} from 'aws-cdk-lib/aws-apigateway';
import {StringParameter} from 'aws-cdk-lib/aws-ssm';
import {Construct} from 'constructs';

/**
 * Properties for creating an API key with usage plan.
 *
 * @internal
 */
export type ApiKeyConfig = {
    /** API name for key naming */
    apiName: string;

    /** The REST API to associate the key with */
    api: RestApi;

    /** Stage name for the usage plan */
    stageName: string;

    /** Optional SSM parameter path to store the API key value */
    ssmParameterPath?: string;
};

/**
 * Result of API key creation.
 *
 * @internal
 */
export type ApiKeyResult = {
    /** The created API key */
    apiKey: ApiKey;

    /** The usage plan */
    usagePlan: UsagePlan;

    /** The API key value (if SSM storage was configured) */
    apiKeyValue?: string;

    /** The SSM parameter (if storage was configured) */
    ssmParameter?: StringParameter;
};

/**
 * Creates an API key with associated usage plan.
 *
 * @remarks
 * Creates an API key and usage plan for rate limiting and tracking.
 * Optionally stores the API key value in SSM Parameter Store for
 * retrieval by other services.
 *
 * @param scope - The construct scope
 * @param config - API key configuration
 * @returns The created API key and usage plan
 *
 * @internal
 */
export const createApiKeyWithUsagePlan = (scope: Construct, config: ApiKeyConfig): ApiKeyResult => {
    // Create API key
    const apiKey = new ApiKey(scope, `${config.apiName}-api-key`, {
        apiKeyName: `${config.apiName}-key`,
        description: `API key for ${config.apiName}`,
        enabled: true,
    });

    // Create usage plan
    const usagePlan = new UsagePlan(scope, `${config.apiName}-usage-plan`, {
        name: `${config.apiName}-usage-plan`,
        description: `Usage plan for ${config.apiName}`,
        apiStages: [
            {
                api: config.api,
                stage: config.api.deploymentStage,
            },
        ],
        throttle: {
            rateLimit: 1000,
            burstLimit: 2000,
        },
        quota: {
            limit: 100000,
            period: Period.MONTH,
        },
    });

    // Associate API key with usage plan
    usagePlan.addApiKey(apiKey);

    const result: ApiKeyResult = {
        apiKey,
        usagePlan,
    };

    // Store API key value in SSM if path provided
    if (config.ssmParameterPath) {
        const ssmParameter = new StringParameter(scope, `${config.apiName}-api-key-param`, {
            parameterName: config.ssmParameterPath,
            stringValue: apiKey.keyId,
            description: `API key ID for ${config.apiName}`,
        });

        result.ssmParameter = ssmParameter;
    }

    return result;
};
