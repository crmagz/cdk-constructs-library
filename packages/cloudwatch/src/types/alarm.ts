import {ComparisonOperator, TreatMissingData} from 'aws-cdk-lib/aws-cloudwatch';
import {CloudWatchMetricConfig} from './metric';
import {PagerDutySeverity, PagerDutyPriority} from '../enum/pagerduty';
import {EnvironmentConfig} from './sns';

/**
 * PagerDuty integration configuration for a CloudWatch alarm.
 *
 * @remarks
 * When configured on an alarm, enables automatic incident creation in PagerDuty
 * when the alarm transitions to ALARM state. The alarm ARN is used as the
 * deduplication key, so subsequent triggers update the same incident.
 *
 * @example
 * ```typescript
 * const pagerDutyConfig: PagerDutyAlarmConfig = {
 *     optIn: true,
 *     serviceKey: 'INFRASTRUCTURE',
 *     severity: PagerDutySeverity.CRITICAL,
 *     priority: PagerDutyPriority.P1,
 *     component: 'api-gateway',
 *     group: 'production'
 * };
 * ```
 */
export type PagerDutyAlarmConfig = {
    /**
     * Opt-in flag to enable PagerDuty integration for this alarm.
     *
     * @remarks
     * When true, an EventBridge rule is created to trigger the PagerDuty Lambda
     * when the alarm state changes.
     */
    optIn: boolean;

    /**
     * Service key to route this alarm to.
     *
     * @remarks
     * This key must match a service configuration in the PagerDuty secret.
     * The service configuration determines the team, escalation policy,
     * and integration key used for incidents.
     *
     * @example 'INFRASTRUCTURE', 'PLATFORM', 'APPLICATION'
     */
    serviceKey: string;

    /**
     * PagerDuty severity level for incidents.
     *
     * @remarks
     * Maps to the event severity in PagerDuty Events API v2.
     */
    severity: PagerDutySeverity;

    /**
     * Optional priority level (overrides service default).
     *
     * @remarks
     * If not specified, uses the default priority from the service configuration.
     */
    priority?: PagerDutyPriority;

    /**
     * Optional component name for the incident.
     *
     * @remarks
     * Identifies the specific component that triggered the alarm.
     *
     * @example 'api-gateway', 'database', 'cache'
     */
    component?: string;

    /**
     * Optional group name for the incident.
     *
     * @remarks
     * Logical grouping of components for organization.
     *
     * @example 'production-services', 'data-pipeline'
     */
    group?: string;
};

/**
 * Configuration for a single CloudWatch alarm.
 *
 * @remarks
 * Defines a CloudWatch alarm with its metric, thresholds, and optional
 * integrations for SNS notifications and PagerDuty incidents.
 *
 * @example
 * ```typescript
 * const alarmConfig: CloudWatchAlarmConfig = {
 *     alarmName: 'api-5xx-errors',
 *     metric: {
 *         namespace: 'AWS/ApiGateway',
 *         metricName: '5XXError',
 *         statistic: 'Sum',
 *         period: Duration.minutes(1),
 *         dimensionsMap: { ApiName: 'my-api' }
 *     },
 *     threshold: 10,
 *     comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
 *     evaluationPeriods: 2,
 *     datapointsToAlarm: 2,
 *     description: 'Alert when API 5XX errors exceed threshold',
 *     pagerDuty: {
 *         optIn: true,
 *         serviceKey: 'INFRASTRUCTURE',
 *         severity: PagerDutySeverity.ERROR
 *     }
 * };
 * ```
 */
export type CloudWatchAlarmConfig = {
    /**
     * The name of the alarm.
     *
     * @remarks
     * The final alarm name will be templated with environment and region
     * to ensure uniqueness across environments.
     */
    alarmName: string;

    /** The metric configuration for this alarm */
    metric: CloudWatchMetricConfig;

    /**
     * The threshold value to compare the metric against.
     *
     * @example 5000 (for duration in ms), 10 (for error count)
     */
    threshold: number;

    /**
     * The comparison operator for the threshold.
     *
     * @example ComparisonOperator.GREATER_THAN_THRESHOLD
     */
    comparisonOperator: ComparisonOperator;

    /**
     * Number of periods over which data is compared to the threshold.
     *
     * @default 2
     */
    evaluationPeriods?: number;

    /**
     * Number of data points that must be breaching to trigger the alarm.
     *
     * @remarks
     * Must be less than or equal to evaluationPeriods.
     */
    datapointsToAlarm?: number;

    /**
     * How to handle missing data points.
     *
     * @default TreatMissingData.BREACHING
     */
    treatMissingData?: TreatMissingData;

    /** Description of the alarm */
    description?: string;

    /**
     * Optional array of SNS topic ARNs for this specific alarm.
     *
     * @remarks
     * If provided, these SNS topics are used instead of the global snsTopicArn.
     * If not provided, the global snsTopicArn from CloudWatchAlarmsConfig is used.
     */
    snsTopicArns?: string[];

    /**
     * PagerDuty integration configuration for this alarm.
     *
     * @remarks
     * When configured with optIn: true, an EventBridge rule is created to
     * trigger the PagerDuty Lambda when the alarm state changes.
     */
    pagerDuty?: PagerDutyAlarmConfig;
};

/**
 * Configuration for multiple CloudWatch alarms.
 *
 * @remarks
 * Groups multiple alarm configurations with a shared SNS topic for notifications.
 */
export type CloudWatchAlarmsConfig = {
    /** Array of alarm configurations */
    alarms: CloudWatchAlarmConfig[];

    /**
     * Default SNS topic ARN for alarm notifications.
     *
     * @remarks
     * Used for alarms that don't specify their own snsTopicArns.
     */
    snsTopicArn: string;
};

/**
 * Configuration for the PagerDuty Lambda function reference.
 *
 * @remarks
 * When PagerDuty integration is enabled for alarms, EventBridge rules
 * need to target a PagerDuty Lambda function. This configuration specifies
 * how to locate that Lambda.
 */
export type PagerDutyLambdaReference = {
    /**
     * The ARN of the PagerDuty Lambda function.
     *
     * @remarks
     * This Lambda receives CloudWatch alarm events and creates PagerDuty incidents.
     */
    lambdaArn: string;
};

/**
 * Props for creating CloudWatch alarms.
 *
 * @remarks
 * Combines environment configuration with alarm settings and optional
 * PagerDuty integration.
 *
 * @example
 * ```typescript
 * const props: CloudWatchAlarmsProps = {
 *     env: { name: 'prod', region: 'us-east-1', account: '123456789012' },
 *     cloudwatch: {
 *         snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
 *         alarms: [...]
 *     },
 *     pagerDutyLambda: {
 *         lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-handler'
 *     }
 * };
 * ```
 */
export type CloudWatchAlarmsProps = EnvironmentConfig & {
    /** CloudWatch alarms configuration */
    cloudwatch: CloudWatchAlarmsConfig;

    /**
     * Optional PagerDuty Lambda reference.
     *
     * @remarks
     * Required if any alarm has pagerDuty.optIn set to true.
     * If not provided and an alarm has PagerDuty enabled, an error is thrown.
     */
    pagerDutyLambda?: PagerDutyLambdaReference;
};
