import {IFunction} from 'aws-cdk-lib/aws-lambda';
import {ApiKey, RestApi, UsagePlan} from 'aws-cdk-lib/aws-apigateway';
import type {FunctionResources} from '@cdk-constructs/lambda';
import type {LambdaIntegrationConfig} from './integration';

/**
 * Base properties shared by all REST API constructs.
 *
 * @remarks
 * This type defines the common configuration options for REST APIs
 * regardless of endpoint type. Both private and regional APIs extend this type.
 *
 * @public
 */
export type BaseRestApiProps = {
    /** API name - used as construct ID and REST API name */
    apiName: string;

    /** API description displayed in the AWS Console */
    description?: string;

    /**
     * Lambda integration configuration
     *
     * @remarks
     * Defines how the API integrates with Lambda. You can either create
     * a new function (Node.js or Python) or use an existing function.
     */
    integration: LambdaIntegrationConfig;

    /**
     * Enable API key requirement (default: true)
     *
     * @remarks
     * When true, all API requests must include a valid API key in the
     * `x-api-key` header. An API key and usage plan will be created.
     *
     * @default true
     */
    requireApiKey?: boolean;

    /**
     * SSM parameter path for API key storage
     *
     * @remarks
     * When provided, the API key value will be stored in SSM Parameter Store
     * at this path for easy retrieval by other services.
     */
    apiKeyParameterPath?: string;

    /**
     * Stage name for the API deployment
     *
     * @remarks
     * The stage name is used in the API URL path. Common values are
     * 'prod', 'staging', 'dev'.
     *
     * @default 'prod'
     */
    stageName?: string;
};

/**
 * Resources created by REST API constructs.
 *
 * @remarks
 * This type represents all AWS resources created when provisioning a
 * REST API. Use these references to:
 * - Configure additional routes
 * - Access API key values
 * - Add custom domain mappings
 *
 * @public
 */
export type RestApiResources = {
    /** The REST API construct */
    api: RestApi;

    /** API key (only present when requireApiKey is true) */
    apiKey?: ApiKey;

    /** API key value (only present when requireApiKey is true) */
    apiKeyValue?: string;

    /** Usage plan (only present when requireApiKey is true) */
    usagePlan?: UsagePlan;

    /** Lambda resources (only present when Lambda was created) */
    lambdaResources?: FunctionResources;

    /** The integrated Lambda function */
    lambdaFunction: IFunction;
};
