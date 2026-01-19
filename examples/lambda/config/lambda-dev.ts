import {Duration} from 'aws-cdk-lib';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {NodejsFunctionProps, PythonFunctionProps} from '../../../packages/lambda/src';
import {LocalConfig} from './config-resolver';
import * as path from 'path';

/**
 * Development environment Node.js Lambda configuration.
 *
 * @remarks
 * This configuration is appropriate for dev/test environments:
 * - VPC enabled by default (override with disableVpc: true)
 * - Standard memory allocation
 * - Short log retention for cost savings
 * - Source maps enabled for debugging
 */
export const NODEJS_DEV_CONFIG: Partial<NodejsFunctionProps> & LocalConfig = {
    functionName: 'example-nodejs-lambda-dev',

    // Entry path to Lambda handler
    entryPath: path.join(__dirname, '../example-nodejs-lambda/index.ts'),

    // VPC configuration - override in environments.local.ts
    // Set disableVpc: true to run without VPC
    vpcId: undefined,
    privateSubnetIds: undefined,

    // Function configuration
    memorySize: 256,
    timeout: Duration.seconds(30),

    // Enable source maps for easier debugging
    sourceMap: true,

    // Environment variables
    environment: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
    },

    // Log retention for dev - 1 week
    logRetention: RetentionDays.ONE_WEEK,
};

/**
 * Development environment Python Lambda configuration.
 *
 * @remarks
 * This configuration is appropriate for dev/test environments:
 * - Uses FastAPI with Mangum adapter for API Gateway integration
 * - VPC enabled by default (override with disableVpc: true)
 * - Standard memory allocation
 * - Short log retention for cost savings
 */
export const PYTHON_DEV_CONFIG: Partial<PythonFunctionProps> & LocalConfig = {
    functionName: 'example-python-lambda-dev',

    // Entry path to Lambda handler directory
    entryPath: path.join(__dirname, '../example-python-lambda'),

    // Handler: module.function format
    handler: 'lambda_function.lambda_handler',

    // VPC configuration - override in environments.local.ts
    vpcId: undefined,
    privateSubnetIds: undefined,

    // Function configuration
    memorySize: 256,
    timeout: Duration.seconds(30),

    // Environment variables
    environment: {
        LOG_LEVEL: 'INFO',
    },

    // Log retention for dev - 1 week
    logRetention: RetentionDays.ONE_WEEK,
};

/** @deprecated Use NODEJS_DEV_CONFIG instead */
export const DEV_CONFIG = NODEJS_DEV_CONFIG;
