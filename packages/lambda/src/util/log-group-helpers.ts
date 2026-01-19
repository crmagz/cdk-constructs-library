import {RemovalPolicy} from 'aws-cdk-lib';
import {LogGroup, LogGroupClass, RetentionDays, ILogGroup} from 'aws-cdk-lib/aws-logs';
import {Construct} from 'constructs';

/**
 * Properties for creating a Lambda log group.
 *
 * @internal
 */
export type LogGroupProps = {
    /** Function name (used to construct the log group name) */
    functionName: string;

    /** Log retention period */
    retention?: RetentionDays;

    /** Removal policy for the log group */
    removalPolicy?: RemovalPolicy;

    /**
     * Log group class (default: INFREQUENT_ACCESS)
     *
     * @remarks
     * INFREQUENT_ACCESS is more cost-effective for logs that are rarely queried.
     * Set to STANDARD if you need real-time log tailing or frequent queries.
     */
    logGroupClass?: LogGroupClass;
};

/**
 * Creates a CloudWatch log group for a Lambda function.
 *
 * @remarks
 * Lambda automatically creates log groups on first invocation, but creating
 * them explicitly allows us to:
 * - Set retention policies upfront
 * - Control removal behavior on stack deletion
 * - Avoid permission issues with auto-created groups
 * - Use INFREQUENT_ACCESS class by default for cost savings
 *
 * @param scope - The construct scope
 * @param props - Log group configuration
 * @returns The created log group
 *
 * @internal
 */
export const createLambdaLogGroup = (scope: Construct, props: LogGroupProps): ILogGroup => {
    const logGroup = new LogGroup(scope, `${props.functionName}-logs`, {
        logGroupName: `/aws/lambda/${props.functionName}`,
        retention: props.retention ?? RetentionDays.ONE_WEEK,
        removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
        logGroupClass: props.logGroupClass ?? LogGroupClass.INFREQUENT_ACCESS,
    });

    return logGroup;
};

/**
 * Generates the standard log group name for a Lambda function.
 *
 * @param functionName - The Lambda function name
 * @returns The log group name in AWS standard format
 *
 * @internal
 */
export const getLambdaLogGroupName = (functionName: string): string => {
    return `/aws/lambda/${functionName}`;
};
