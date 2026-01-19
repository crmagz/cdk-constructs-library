import {Duration} from 'aws-cdk-lib';
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import type {NodejsFunctionProps, PythonFunctionProps, FunctionResources} from '@cdk-constructs/lambda';

/**
 * Lambda integration configuration for API Gateway.
 *
 * @remarks
 * Exactly one of `nodejsLambda`, `pythonLambda`, or `existingFunction` must be provided.
 * When `nodejsLambda` or `pythonLambda` is provided, the function will be automatically
 * created and integrated with the API Gateway.
 *
 * @public
 */
export type LambdaIntegrationConfig = {
    /**
     * Node.js Lambda configuration (creates and attaches)
     *
     * @remarks
     * When provided, a new Node.js Lambda function will be created using
     * the `createNodejsFunction` construct and integrated with the API.
     */
    nodejsLambda?: NodejsFunctionProps;

    /**
     * Python Lambda configuration (creates and attaches)
     *
     * @remarks
     * When provided, a new Python Lambda function will be created using
     * the `createPythonFunction` construct and integrated with the API.
     */
    pythonLambda?: PythonFunctionProps;

    /**
     * Existing Lambda function to integrate
     *
     * @remarks
     * Use this when you have an existing Lambda function that should be
     * integrated with the API Gateway. No new function will be created.
     */
    existingFunction?: IFunction;

    /**
     * Integration timeout (default: 29 seconds)
     *
     * @remarks
     * API Gateway has a maximum timeout of 29 seconds. The integration
     * timeout should be less than or equal to this limit.
     *
     * @default Duration.seconds(29)
     */
    integrationTimeout?: Duration;
};

/**
 * Result of Lambda integration creation.
 *
 * @remarks
 * Contains the Lambda resources if a new function was created,
 * otherwise just the existing function reference.
 *
 * @internal
 */
export type LambdaIntegrationResult = {
    /** The Lambda function (created or existing) */
    function: IFunction;

    /** Lambda resources (only present when function was created) */
    lambdaResources?: FunctionResources;
};
