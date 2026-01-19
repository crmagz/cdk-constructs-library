import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {ISecurityGroup} from 'aws-cdk-lib/aws-ec2';
import {PolicyStatement, IRole} from 'aws-cdk-lib/aws-iam';
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import {ILogGroup, LogGroupClass, RetentionDays} from 'aws-cdk-lib/aws-logs';

/**
 * VPC configuration for Lambda functions.
 *
 * @remarks
 * VPC-attached Lambdas use Elastic Network Interfaces (ENIs) which have
 * provisioning overhead:
 * - Initial cold start: Additional 10-30 seconds for ENI attachment
 * - Deprovisioning: ENIs are cached for ~15 minutes after function idle
 *
 * @public
 */
export type VpcConfig = {
    /** VPC ID where the Lambda will be deployed */
    vpcId: string;

    /** Private subnet IDs for Lambda ENI placement */
    privateSubnetIds: string[];
};

/**
 * Base properties shared by all Lambda function constructs.
 *
 * @remarks
 * This type defines the common configuration options for Lambda functions
 * regardless of runtime. Both Node.js and Python functions extend this type.
 *
 * VPC attachment is enabled by default for security. Set `disableVpc: true`
 * to opt-out for functions that don't require VPC resources.
 *
 * @public
 */
export type BaseFunctionProps = {
    /** Function name - used as construct ID and AWS function name */
    functionName: string;

    /** Absolute path to the Lambda entry file */
    entryPath: string;

    /**
     * VPC configuration (required by default for security)
     *
     * @remarks
     * VPC-attached Lambdas use Elastic Network Interfaces (ENIs) which have
     * provisioning overhead:
     * - Initial cold start: Additional 10-30 seconds for ENI attachment
     * - Deprovisioning: ENIs are cached for ~15 minutes after function idle
     *
     * Set `disableVpc: true` to opt-out of VPC attachment for functions that
     * don't require VPC resources (e.g., public API consumers only).
     */
    vpc: VpcConfig;

    /**
     * Disable VPC attachment (default: false - VPC enabled by default)
     *
     * @remarks
     * When true, the function will not be attached to the VPC and will not
     * create a security group. Use this for functions that only access
     * public APIs or AWS services via public endpoints.
     */
    disableVpc?: boolean;

    /**
     * Memory size in MB (default: 256)
     *
     * @remarks
     * Lambda allocates CPU power proportional to memory. 1,769 MB equals
     * one vCPU. For compute-intensive workloads, increase memory to get
     * more CPU.
     */
    memorySize?: number;

    /**
     * Timeout duration (default: 30 seconds)
     *
     * @remarks
     * Maximum execution time before Lambda terminates the function.
     * API Gateway has a 29-second timeout, so functions behind APIGW
     * should stay under that limit.
     */
    timeout?: Duration;

    /** Environment variables passed to the Lambda function */
    environment?: Record<string, string>;

    /**
     * Additional IAM policy statements for the execution role
     *
     * @remarks
     * These statements are added to the Lambda's execution role in addition
     * to the basic Lambda execution permissions (CloudWatch Logs, VPC ENI).
     */
    policyStatements?: PolicyStatement[];

    /**
     * Lambda layer ARNs to attach
     *
     * @remarks
     * Layers provide additional code and content to functions. Common uses:
     * - Shared libraries (e.g., AWS SDK extensions)
     * - Custom runtimes
     * - Configuration files
     */
    layerArns?: string[];

    /**
     * CloudWatch log retention period (default: ONE_WEEK)
     *
     * @remarks
     * Logs older than this period are automatically deleted.
     */
    logRetention?: RetentionDays;

    /**
     * Removal policy for the CloudWatch log group (default: DESTROY)
     *
     * @remarks
     * DESTROY removes the log group when the stack is deleted.
     * RETAIN keeps the log group for debugging purposes.
     */
    logRemovalPolicy?: RemovalPolicy;

    /**
     * CloudWatch log group class (default: INFREQUENT_ACCESS)
     *
     * @remarks
     * INFREQUENT_ACCESS is more cost-effective for logs that are rarely queried.
     * Set to STANDARD if you need real-time log tailing or frequent queries.
     *
     * @default LogGroupClass.INFREQUENT_ACCESS
     */
    logGroupClass?: LogGroupClass;
};

/**
 * Resources created by Lambda function constructs.
 *
 * @remarks
 * This type represents all AWS resources created when provisioning a
 * Lambda function. Use these references to:
 * - Grant additional permissions to the role
 * - Configure integrations with other services
 * - Access the function for testing
 *
 * @public
 */
export type FunctionResources = {
    /** The Lambda function construct */
    function: IFunction;

    /** The Lambda execution role */
    role: IRole;

    /** The CloudWatch log group for function logs */
    logGroup: ILogGroup;

    /**
     * Security group for VPC-attached functions
     *
     * @remarks
     * Only present when VPC is enabled (default). Use this to configure
     * egress rules or allow ingress from other security groups.
     */
    securityGroup?: ISecurityGroup;
};
