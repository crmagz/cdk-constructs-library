// Construct functions
export {createPrivateRestApi} from './constructs/rest-api-private';
export {createRegionalRestApi} from './constructs/rest-api-regional';
export {createApiGatewayVpcEndpoint, lookupVpcEndpoint} from './constructs/vpc-endpoint';

// Config
export {DEFAULT_CORS_PREFLIGHT_OPTIONS, createCorsOptions} from './config/cors';

// Types - Integration
export type {LambdaIntegrationConfig} from './types';

// Types - REST API
export type {BaseRestApiProps, RestApiResources} from './types';

// Types - Private REST API
export type {PrivateRestApiProps} from './types';

// Types - Regional REST API
export type {RegionalRestApiProps} from './types';

// Types - VPC Endpoint
export type {VpcEndpointProps, VpcEndpointResources} from './types';

// Re-export Lambda types for convenience
export type {NodejsFunctionProps, PythonFunctionProps, FunctionResources, VpcConfig} from '@cdk-constructs/lambda';
export {createNodejsFunction, createPythonFunction} from '@cdk-constructs/lambda';
