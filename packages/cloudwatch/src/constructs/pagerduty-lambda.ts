import {Construct} from 'constructs';
import {Duration} from 'aws-cdk-lib';
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {createNodejsFunction, FunctionResources, VpcConfig} from '@cdk-constructs/lambda';
import * as path from 'path';
import {DEFAULT_PAGERDUTY_SECRET_NAME, PAGERDUTY_SECRET_NAME_ENV_VAR} from '../constant/secret';

/**
 * Converts a full AWS region name to short format.
 * @example 'us-east-1' -> 'use1', 'eu-west-2' -> 'euw2'
 */
const toShortRegion = (region: string): string => {
    const parts = region.split('-');
    if (parts.length === 3) {
        // us-east-1 -> use1
        return `${parts[0]}${parts[1][0]}${parts[2]}`;
    }
    return region;
};

/**
 * Properties for creating a PagerDuty Lambda function.
 */
export type PagerDutyLambdaProps = {
    /**
     * Name of the Lambda function.
     *
     * @remarks
     * If not provided, the function will be named `pagerduty-cloudwatch-{env}-{region_short}`.
     * For example: `pagerduty-cloudwatch-dev-use1`
     */
    functionName?: string;

    /**
     * Environment name (e.g., 'dev', 'staging', 'prod').
     */
    environment: string;

    /**
     * AWS region.
     */
    region: string;

    /**
     * AWS account ID.
     */
    account: string;

    /**
     * VPC configuration for the Lambda function.
     *
     * @remarks
     * If provided, the Lambda will be deployed in the specified VPC.
     * Set disableVpc to true if you don't want VPC connectivity.
     */
    vpc?: VpcConfig;

    /**
     * Whether to disable VPC connectivity.
     *
     * @default false
     */
    disableVpc?: boolean;

    /**
     * Name of the secret in AWS Secrets Manager containing PagerDuty configuration.
     *
     * @remarks
     * The secret should contain a JSON object with apiToken and services configuration.
     *
     * @default 'pagerduty-cloudwatch-integration'
     */
    secretName?: string;

    /**
     * Lambda function memory size in MB.
     *
     * @default 256
     */
    memorySize?: number;

    /**
     * Lambda function timeout.
     *
     * @default Duration.seconds(30)
     */
    timeout?: Duration;

    /**
     * CloudWatch log retention period.
     *
     * @default RetentionDays.ONE_WEEK
     */
    logRetention?: RetentionDays;

    /**
     * Additional environment variables for the Lambda function.
     */
    additionalEnvironment?: Record<string, string>;

    /**
     * Additional IAM policy statements to attach to the Lambda role.
     */
    additionalPolicies?: PolicyStatement[];
};

/**
 * Creates a PagerDuty Lambda function for processing CloudWatch alarm events.
 *
 * @remarks
 * This construct creates a Lambda function that receives CloudWatch alarm state
 * changes via EventBridge and creates/resolves incidents in PagerDuty.
 *
 * The Lambda:
 * - Retrieves PagerDuty configuration from Secrets Manager
 * - Maps CloudWatch alarm events to PagerDuty Events API v2 format
 * - Triggers incidents for ALARM state
 * - Resolves incidents for OK state
 * - Acknowledges incidents for INSUFFICIENT_DATA state
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Resources including the Lambda function, role, and log group
 *
 * @example
 * ```typescript
 * import {createPagerDutyLambda} from '@cdk-constructs/cloudwatch';
 * import {Duration} from 'aws-cdk-lib';
 *
 * const {function: pdLambda, role, logGroup} = createPagerDutyLambda(this, {
 *     environment: 'prod',
 *     region: 'us-east-1',
 *     account: '123456789012',
 *     secretName: 'my-org/pagerduty-config',
 *     vpc: {
 *         vpcId: 'vpc-12345',
 *         privateSubnetIds: ['subnet-1', 'subnet-2']
 *     }
 * });
 *
 * // Use the Lambda ARN in CloudWatch alarms configuration
 * const alarms = createCloudWatchAlarms(this, {
 *     // ...
 *     pagerDutyLambda: {
 *         lambdaArn: pdLambda.functionArn
 *     }
 * });
 * ```
 *
 * @see {@link PagerDutyLambdaProps} for configuration options
 * @see https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-send-an-event-to-pagerduty
 * @public
 */
export const createPagerDutyLambda = (scope: Construct, props: PagerDutyLambdaProps): FunctionResources => {
    const shortRegion = toShortRegion(props.region);
    const functionName = props.functionName ?? `pagerduty-cloudwatch-${props.environment}-${shortRegion}`;
    const secretName = props.secretName ?? DEFAULT_PAGERDUTY_SECRET_NAME;

    // Path to the Lambda handler
    const lambdaPath = path.join(__dirname, '../lambda/pagerduty/index.ts');

    // Create IAM policy to allow reading the PagerDuty secret
    const secretPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [`arn:aws:secretsmanager:${props.region}:${props.account}:secret:${secretName}-??????`],
    });

    // Combine additional policies with the secret policy
    const policyStatements = [secretPolicy, ...(props.additionalPolicies || [])];

    // Build environment variables
    const environment: Record<string, string> = {
        [PAGERDUTY_SECRET_NAME_ENV_VAR]: secretName,
        LOG_LEVEL: 'info',
        ...props.additionalEnvironment,
    };

    // Create the Lambda function using the lambda package
    // Note: description is not supported by the lambda package, it's set at the CDK level
    const resources = createNodejsFunction(scope, {
        functionName,
        entryPath: lambdaPath,
        vpc: props.vpc ?? {vpcId: '', privateSubnetIds: []},
        disableVpc: props.disableVpc ?? !props.vpc,
        memorySize: props.memorySize ?? 256,
        timeout: props.timeout ?? Duration.seconds(30),
        environment,
        policyStatements,
        logRetention: props.logRetention ?? RetentionDays.ONE_WEEK,
        // Bundle axios and loglevel which are runtime dependencies
        externalModules: ['@aws-sdk/*'],
    });

    return resources;
};
