import {Duration} from 'aws-cdk-lib';
import {ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';
import {CloudWatchAlarmsProps, SnsTopicsProps, PagerDutyLambdaProps, PagerDutySeverity, PagerDutyPriority} from '../../../packages/cloudwatch/src';
import {LocalConfig} from './config-resolver';

/**
 * Development environment CloudWatch alarms configuration.
 *
 * @remarks
 * This configuration is appropriate for dev/test environments:
 * - SNS topic for alarm notifications
 * - Sample alarms for Lambda and API Gateway metrics
 * - P5/low severity PagerDuty integration (disabled by default)
 */
export const ALARMS_DEV_CONFIG: Partial<CloudWatchAlarmsProps> & LocalConfig = {
    env: {
        name: 'dev',
        region: 'us-east-1',
        account: '123456789012',
    },
    cloudwatch: {
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:cloudwatch-alarms-dev',
        alarms: [
            {
                alarmName: 'lambda-duration-alarm',
                metric: {
                    namespace: 'AWS/Lambda',
                    metricName: 'Duration',
                    statistic: 'Average',
                    period: Duration.minutes(5),
                    dimensionsMap: {FunctionName: 'example-nodejs-lambda-dev'},
                },
                threshold: 5000,
                comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
                description: 'Alert when Lambda duration exceeds 5 seconds',
            },
            {
                alarmName: 'lambda-errors-alarm',
                metric: {
                    namespace: 'AWS/Lambda',
                    metricName: 'Errors',
                    statistic: 'Sum',
                    period: Duration.minutes(5),
                    dimensionsMap: {FunctionName: 'example-nodejs-lambda-dev'},
                },
                threshold: 1,
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                evaluationPeriods: 1,
                description: 'Alert when Lambda errors occur',
            },
        ],
    },
};

/**
 * Development environment CloudWatch alarms with PagerDuty integration.
 *
 * @remarks
 * This configuration includes PagerDuty integration for testing:
 * - Uses P5 priority (lowest) to avoid triggering real incidents
 * - Uses WARNING severity to avoid high-priority alerts
 */
export const ALARMS_WITH_PAGERDUTY_DEV_CONFIG: Partial<CloudWatchAlarmsProps> & LocalConfig = {
    env: {
        name: 'dev',
        region: 'us-east-1',
        account: '123456789012',
    },
    cloudwatch: {
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:cloudwatch-alarms-pd-dev',
        alarms: [
            {
                alarmName: 'lambda-throttles-alarm',
                metric: {
                    namespace: 'AWS/Lambda',
                    metricName: 'Throttles',
                    statistic: 'Sum',
                    period: Duration.minutes(5),
                    dimensionsMap: {FunctionName: 'example-nodejs-lambda-dev'},
                },
                threshold: 5,
                comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluationPeriods: 2,
                description: 'Lambda throttling detected',
                pagerDuty: {
                    optIn: true,
                    serviceKey: 'INFRASTRUCTURE',
                    severity: PagerDutySeverity.WARNING,
                    priority: PagerDutyPriority.P5,
                    component: 'lambda',
                    group: 'dev-services',
                },
            },
        ],
    },
    // Note: Override pagerDutyLambdaArn in environments.local.ts with your real ARN
    pagerDutyLambda: {
        lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-cloudwatch-dev-use1',
    },
};

/**
 * Development environment SNS topics configuration.
 *
 * @remarks
 * Creates SNS topics for CloudWatch alarm notifications.
 */
export const SNS_TOPICS_DEV_CONFIG: Partial<SnsTopicsProps> & LocalConfig = {
    env: {
        name: 'dev',
        region: 'us-east-1',
        account: '123456789012',
    },
    sns: {
        topics: [
            {
                topicName: 'cloudwatch-alarms',
                displayName: 'CloudWatch Alarms - Dev',
                subscriptions: [
                    {
                        id: 'dev-email',
                        protocol: 'email',
                        endpoint: 'dev-alerts@example.com',
                    },
                ],
            },
            {
                topicName: 'cloudwatch-alarms-pd',
                displayName: 'CloudWatch Alarms PagerDuty - Dev',
            },
        ],
    },
};

/**
 * Development environment PagerDuty Lambda configuration.
 *
 * @remarks
 * Creates a Lambda function for PagerDuty integration:
 * - Processes CloudWatch alarm events from EventBridge
 * - Sends events to PagerDuty Events API v2
 * - Uses Secrets Manager for API token storage
 *
 * Default function name: `pagerduty-cloudwatch-dev-use1` (based on env and region)
 */
export const PAGERDUTY_LAMBDA_DEV_CONFIG: Partial<PagerDutyLambdaProps> & LocalConfig = {
    // functionName is not set - uses default: pagerduty-cloudwatch-{env}-{region_short}
    secretName: 'pagerduty/cloudwatch-dev',

    // VPC configuration - override in environments.local.ts
    vpcId: undefined,
    privateSubnetIds: undefined,
};
