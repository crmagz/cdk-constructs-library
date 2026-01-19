import {Duration} from 'aws-cdk-lib';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {RegionalRestApiProps} from '../../../packages/apigateway/src';
import {LocalConfig} from './config-resolver';
import * as path from 'path';

/**
 * Development environment API Gateway configuration.
 *
 * @remarks
 * This configuration is appropriate for dev/test environments:
 * - Regional endpoint (public)
 * - API key required for security
 * - Lambda created and attached automatically
 * - Standard timeouts and memory
 */
export const DEV_CONFIG: Partial<RegionalRestApiProps> & LocalConfig = {
    apiName: 'example-api-dev',
    description: 'Development API Gateway with Lambda integration',

    // API key required by default
    requireApiKey: true,

    // Stage name
    stageName: 'dev',

    // VPC configuration for Lambda - override in environments.local.ts
    vpcId: undefined,
    privateSubnetIds: undefined,

    // Lambda integration will be configured in the stack
    // using these values to create the function
};

/**
 * Lambda configuration for the API.
 *
 * @remarks
 * Exported separately so the stack can build the full integration config.
 */
export const LAMBDA_CONFIG = {
    functionName: 'example-api-handler-dev',
    entryPath: path.join(__dirname, '../../lambda/example-nodejs-lambda/index.ts'),
    memorySize: 256,
    timeout: Duration.seconds(29),
    sourceMap: true,
    logRetention: RetentionDays.ONE_WEEK,
    environment: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
    },
};
