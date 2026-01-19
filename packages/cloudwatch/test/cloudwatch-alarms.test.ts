import {App, Duration, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {ComparisonOperator, TreatMissingData} from 'aws-cdk-lib/aws-cloudwatch';
import {createCloudWatchAlarms, PagerDutySeverity, PagerDutyPriority} from '../src';

describe('createCloudWatchAlarms', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates alarm with minimal configuration', () => {
        const alarms = createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'test-alarm',
                        metric: {
                            namespace: 'AWS/Lambda',
                            metricName: 'Duration',
                            statistic: 'Average',
                        },
                        threshold: 5000,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            AlarmName: 'test-alarm-dev-us-east-1',
            Namespace: 'AWS/Lambda',
            MetricName: 'Duration',
            Statistic: 'Average',
            Threshold: 5000,
            ComparisonOperator: 'GreaterThanThreshold',
            EvaluationPeriods: 2, // default
        });

        expect(alarms).toHaveLength(1);
        expect(alarms[0]).toBeDefined();
    });

    test('creates alarm with full configuration', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'api-errors',
                        metric: {
                            namespace: 'AWS/ApiGateway',
                            metricName: '5XXError',
                            statistic: 'Sum',
                            period: Duration.minutes(1),
                            dimensionsMap: {ApiName: 'my-api'},
                        },
                        threshold: 10,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                        evaluationPeriods: 3,
                        datapointsToAlarm: 2,
                        treatMissingData: TreatMissingData.NOT_BREACHING,
                        description: 'API Gateway 5XX errors exceed threshold',
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            AlarmName: 'api-errors-prod-us-east-1',
            AlarmDescription: 'API Gateway 5XX errors exceed threshold',
            Namespace: 'AWS/ApiGateway',
            MetricName: '5XXError',
            Statistic: 'Sum',
            Period: 60,
            Threshold: 10,
            ComparisonOperator: 'GreaterThanOrEqualToThreshold',
            EvaluationPeriods: 3,
            DatapointsToAlarm: 2,
            TreatMissingData: 'notBreaching',
            Dimensions: [{Name: 'ApiName', Value: 'my-api'}],
        });
    });

    test('creates alarm with SNS actions', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'sns-test',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'Errors',
                            statistic: 'Sum',
                        },
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            AlarmActions: ['arn:aws:sns:us-east-1:123456789012:alerts'],
            OKActions: ['arn:aws:sns:us-east-1:123456789012:alerts'],
            InsufficientDataActions: ['arn:aws:sns:us-east-1:123456789012:alerts'],
        });
    });

    test('creates alarm with per-alarm SNS topics', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:default-alerts',
                alarms: [
                    {
                        alarmName: 'multi-topic',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'Errors',
                            statistic: 'Sum',
                        },
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                        snsTopicArns: ['arn:aws:sns:us-east-1:123456789012:critical', 'arn:aws:sns:us-east-1:123456789012:ops-team'],
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            AlarmActions: Match.arrayWith(['arn:aws:sns:us-east-1:123456789012:critical', 'arn:aws:sns:us-east-1:123456789012:ops-team']),
        });
    });

    test('creates multiple alarms', () => {
        const alarms = createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'alarm-1',
                        metric: {namespace: 'NS1', metricName: 'M1', statistic: 'Sum'},
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                    },
                    {
                        alarmName: 'alarm-2',
                        metric: {namespace: 'NS2', metricName: 'M2', statistic: 'Average'},
                        threshold: 2,
                        comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
                    },
                    {
                        alarmName: 'alarm-3',
                        metric: {namespace: 'NS3', metricName: 'M3', statistic: 'Maximum'},
                        threshold: 3,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
        expect(alarms).toHaveLength(3);
    });

    test('creates alarm with PagerDuty integration', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'critical-alarm',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'CriticalErrors',
                            statistic: 'Sum',
                        },
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                        pagerDuty: {
                            optIn: true,
                            serviceKey: 'INFRASTRUCTURE',
                            severity: PagerDutySeverity.CRITICAL,
                            priority: PagerDutyPriority.P1,
                            component: 'api',
                            group: 'production',
                        },
                    },
                ],
            },
            pagerDutyLambda: {
                lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-handler',
            },
        });

        const template = Template.fromStack(stack);

        // Verify alarm is created
        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);

        // Verify EventBridge rule is created for PagerDuty
        template.resourceCountIs('AWS::Events::Rule', 1);
        template.hasResourceProperties('AWS::Events::Rule', {
            Name: 'critical-alarm-prod-us-east-1-pd-event-rule',
            Description: Match.stringLikeRegexp('PagerDuty'),
            EventPattern: {
                source: ['aws.cloudwatch'],
                'detail-type': ['CloudWatch Alarm State Change'],
            },
        });
    });

    test('skips PagerDuty integration when optIn is false', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'no-pd-alarm',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'Errors',
                            statistic: 'Sum',
                        },
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                        pagerDuty: {
                            optIn: false,
                            serviceKey: 'INFRASTRUCTURE',
                            severity: PagerDutySeverity.WARNING,
                        },
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        // Alarm should be created
        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);

        // No EventBridge rule should be created
        template.resourceCountIs('AWS::Events::Rule', 0);
    });

    test('skips PagerDuty integration when not configured', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'sns-only-alarm',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'Errors',
                            statistic: 'Sum',
                        },
                        threshold: 1,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                        // No pagerDuty config
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
        template.resourceCountIs('AWS::Events::Rule', 0);
    });

    test('throws error when PagerDuty enabled but Lambda ARN not provided', () => {
        expect(() => {
            createCloudWatchAlarms(stack, {
                env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
                cloudwatch: {
                    snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                    alarms: [
                        {
                            alarmName: 'pd-without-lambda',
                            metric: {
                                namespace: 'Custom',
                                metricName: 'Errors',
                                statistic: 'Sum',
                            },
                            threshold: 1,
                            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                            pagerDuty: {
                                optIn: true,
                                serviceKey: 'INFRASTRUCTURE',
                                severity: PagerDutySeverity.ERROR,
                            },
                        },
                    ],
                },
                // No pagerDutyLambda provided
            });
        }).toThrow(/pagerDutyLambda.lambdaArn is not provided/);
    });

    test('uses default values for optional alarm properties', () => {
        createCloudWatchAlarms(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            cloudwatch: {
                snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
                alarms: [
                    {
                        alarmName: 'defaults-test',
                        metric: {
                            namespace: 'Custom',
                            metricName: 'Test',
                            statistic: 'Sum',
                            // period not specified - should default to 5 minutes
                        },
                        threshold: 100,
                        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                        // evaluationPeriods not specified - should default to 2
                        // treatMissingData not specified - should default to BREACHING
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            Period: 300, // 5 minutes in seconds
            EvaluationPeriods: 2,
            TreatMissingData: 'breaching',
        });
    });
});
