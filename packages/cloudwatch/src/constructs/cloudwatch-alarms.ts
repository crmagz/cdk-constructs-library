import {Construct} from 'constructs';
import {Duration} from 'aws-cdk-lib';
import {Alarm, Metric, TreatMissingData} from 'aws-cdk-lib/aws-cloudwatch';
import {SnsAction} from 'aws-cdk-lib/aws-cloudwatch-actions';
import {Topic} from 'aws-cdk-lib/aws-sns';
import {Rule, EventField, RuleTargetInput} from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import {Function} from 'aws-cdk-lib/aws-lambda';
import {CloudWatchAlarmsProps, CloudWatchAlarmConfig} from '../types/alarm';

/**
 * Creates CloudWatch alarms with metrics, SNS notifications, and optional PagerDuty integration.
 *
 * @remarks
 * This construct creates CloudWatch alarms based on the provided configuration array.
 * Each alarm can send notifications to SNS topics and optionally trigger PagerDuty
 * incidents via EventBridge rules.
 *
 * Features:
 * - Metric-based alarm creation with configurable thresholds
 * - SNS topic notifications (single global topic or per-alarm topics)
 * - Optional PagerDuty integration via EventBridge rules
 * - Templated naming with environment and region to avoid conflicts
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Array of created Alarm constructs
 *
 * @example
 * ```typescript
 * import {createCloudWatchAlarms, PagerDutySeverity} from '@cdk-constructs/cloudwatch';
 * import {ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';
 * import {Duration} from 'aws-cdk-lib';
 *
 * // Basic alarm (SNS only)
 * const alarms = createCloudWatchAlarms(this, {
 *     env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
 *     cloudwatch: {
 *         snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
 *         alarms: [
 *             {
 *                 alarmName: 'lambda-duration-alarm',
 *                 metric: {
 *                     namespace: 'AWS/Lambda',
 *                     metricName: 'Duration',
 *                     statistic: 'Average',
 *                     period: Duration.minutes(5),
 *                     dimensionsMap: {FunctionName: 'my-function'}
 *                 },
 *                 threshold: 5000,
 *                 comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
 *                 evaluationPeriods: 2,
 *                 description: 'Alert when Lambda duration exceeds threshold'
 *             }
 *         ]
 *     }
 * });
 *
 * // With PagerDuty integration
 * const alarmsWithPD = createCloudWatchAlarms(this, {
 *     env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
 *     cloudwatch: {
 *         snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
 *         alarms: [
 *             {
 *                 alarmName: 'api-errors',
 *                 metric: {
 *                     namespace: 'AWS/ApiGateway',
 *                     metricName: '5XXError',
 *                     statistic: 'Sum',
 *                     period: Duration.minutes(1),
 *                     dimensionsMap: {ApiName: 'my-api'}
 *                 },
 *                 threshold: 10,
 *                 comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
 *                 description: 'Critical API errors',
 *                 pagerDuty: {
 *                     optIn: true,
 *                     serviceKey: 'INFRASTRUCTURE',
 *                     severity: PagerDutySeverity.CRITICAL
 *                 }
 *             }
 *         ]
 *     },
 *     pagerDutyLambda: {
 *         lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-handler'
 *     }
 * });
 * ```
 *
 * @see {@link CloudWatchAlarmsProps} for configuration options
 * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html
 * @public
 */
export const createCloudWatchAlarms = (scope: Construct, props: CloudWatchAlarmsProps): Alarm[] => {
    const createdAlarms: Alarm[] = [];

    props.cloudwatch.alarms.forEach((alarmConfig: CloudWatchAlarmConfig, index: number) => {
        const alarmId = `${alarmConfig.alarmName}-${props.env.name}-${props.env.region}-${index}`;
        const alarmName = `${alarmConfig.alarmName}-${props.env.name}-${props.env.region}`;

        // Create the metric
        const metric = new Metric({
            namespace: alarmConfig.metric.namespace,
            metricName: alarmConfig.metric.metricName,
            statistic: alarmConfig.metric.statistic,
            period: alarmConfig.metric.period ?? Duration.minutes(5),
            dimensionsMap: alarmConfig.metric.dimensionsMap,
        });

        // Create the alarm with templated naming
        const alarm = new Alarm(scope, alarmId, {
            alarmName: alarmName,
            alarmDescription: alarmConfig.description ?? `CloudWatch alarm for ${alarmConfig.alarmName} in ${props.env.name}`,
            metric,
            threshold: alarmConfig.threshold,
            comparisonOperator: alarmConfig.comparisonOperator,
            evaluationPeriods: alarmConfig.evaluationPeriods ?? 2,
            datapointsToAlarm: alarmConfig.datapointsToAlarm,
            treatMissingData: alarmConfig.treatMissingData ?? TreatMissingData.BREACHING,
        });

        // Determine which SNS topics to use: per-alarm topics or global topic
        const snsTopicArnsToUse = alarmConfig.snsTopicArns ?? [props.cloudwatch.snsTopicArn];

        // Add SNS actions for all topics
        snsTopicArnsToUse.forEach((topicArn, snsIndex) => {
            const snsTopic = Topic.fromTopicArn(scope, `alarm-sns-topic-${alarmId}-${snsIndex}`, topicArn);
            const snsAction = new SnsAction(snsTopic);
            alarm.addAlarmAction(snsAction);
            alarm.addOkAction(snsAction);
            alarm.addInsufficientDataAction(snsAction);
        });

        // Create EventBridge rule for PagerDuty integration (only if configured and opted in)
        if (alarmConfig.pagerDuty?.optIn) {
            // Validate that pagerDutyLambda is provided when PagerDuty is enabled
            if (!props.pagerDutyLambda?.lambdaArn) {
                throw new Error(`PagerDuty integration is enabled for alarm "${alarmConfig.alarmName}" but pagerDutyLambda.lambdaArn is not provided in props`);
            }

            const targetLambdaArn = props.pagerDutyLambda.lambdaArn;

            // Parse ARN to extract account and region for cross-account validation
            // ARN format: arn:aws:lambda:region:account-id:function:function-name
            const arnParts = targetLambdaArn.split(':');
            const lambdaRegion = arnParts[3];
            const lambdaAccount = arnParts[4];

            // Create Lambda function reference with explicit environment info
            const targetLambda = Function.fromFunctionAttributes(scope, `alarm-pd-lambda-${alarmId}`, {
                functionArn: targetLambdaArn,
                sameEnvironment: lambdaAccount === props.env.account && lambdaRegion === props.env.region,
            });

            const eventRuleId = `${alarmId}-pd-event-rule`;
            const eventRule = new Rule(scope, eventRuleId, {
                ruleName: `${alarmName}-pd-event-rule`,
                description: `EventBridge rule for ${alarmName} alarm (PagerDuty)`,
                eventPattern: {
                    source: ['aws.cloudwatch'],
                    detailType: ['CloudWatch Alarm State Change'],
                    resources: [alarm.alarmArn],
                },
            });

            // Add Lambda target with CloudWatch event fields + PagerDuty configuration
            // Use EventField.fromPath to extract individual fields from the CloudWatch event
            eventRule.addTarget(
                new LambdaFunction(targetLambda, {
                    event: RuleTargetInput.fromObject({
                        // CloudWatch event fields extracted from EventBridge event
                        source: EventField.fromPath('$.source'),
                        'detail-type': EventField.fromPath('$.detail-type'),
                        time: EventField.fromPath('$.time'),
                        region: EventField.fromPath('$.region'),
                        account: EventField.fromPath('$.account'),
                        detail: EventField.fromPath('$.detail'),
                        // Add PagerDuty configuration as metadata
                        // The handler will look up team, escalation policy, and integration key from the service
                        pdConfig: {
                            alarmName: alarmName,
                            alarmArn: alarm.alarmArn,
                            alarmDescription: alarmConfig.description ?? `CloudWatch alarm for ${alarmConfig.alarmName} in ${props.env.name}`,
                            region: props.env.region,
                            account: props.env.account,
                            threshold: alarmConfig.threshold,
                            metricNamespace: alarmConfig.metric.namespace,
                            metricName: alarmConfig.metric.metricName,
                            serviceKey: alarmConfig.pagerDuty.serviceKey,
                            severity: alarmConfig.pagerDuty.severity,
                            priority: alarmConfig.pagerDuty.priority,
                            component: alarmConfig.pagerDuty.component,
                            group: alarmConfig.pagerDuty.group,
                        },
                    }),
                })
            );
        }

        createdAlarms.push(alarm);
    });

    return createdAlarms;
};
