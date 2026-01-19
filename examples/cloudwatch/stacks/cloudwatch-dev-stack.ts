import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createCloudWatchAlarms, createSnsTopics, createPagerDutyLambda, CloudWatchAlarmsProps, PagerDutyPriority} from '../../../packages/cloudwatch/src';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Validates that no P1 priorities are configured in test alarms.
 * Test environments should not create high-priority incidents.
 *
 * @throws Error if any alarm has P1 priority configured for PagerDuty
 */
const validateNoP1Priorities = (props: Partial<CloudWatchAlarmsProps>): void => {
    const alarms = props.cloudwatch?.alarms ?? [];

    for (const alarm of alarms) {
        if (alarm.pagerDuty?.priority === PagerDutyPriority.P1) {
            throw new Error(
                `Test alarm "${alarm.alarmName}" has PagerDuty P1 priority configured. ` +
                    'Test environments must not use P1 priorities to avoid triggering high-priority incident responses.'
            );
        }
    }
};

/**
 * Development environment CloudWatch stack.
 *
 * @remarks
 * This stack creates CloudWatch resources for development:
 * - SNS topics for alarm notifications
 * - CloudWatch alarms for Lambda metrics
 * - Optional PagerDuty integration (requires Lambda ARN in environments.local.ts)
 *
 * To configure, create `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   pagerDutyLambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-handler',
 * };
 * ```
 */
export class CloudWatchDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create SNS Topics
        const snsTopics = this.createSnsTopics();

        // Create CloudWatch Alarms (without PagerDuty)
        const alarms = this.createCloudWatchAlarms();

        // Output SNS Topic ARNs
        snsTopics.forEach((topic, index) => {
            new CfnOutput(this, `SnsTopicArn${index}`, {
                value: topic.topicArn,
                description: `SNS Topic ARN ${index + 1}`,
            });
        });

        // Output Alarm names
        alarms.forEach((alarm, index) => {
            new CfnOutput(this, `AlarmName${index}`, {
                value: alarm.alarmName,
                description: `CloudWatch Alarm ${index + 1}`,
            });
        });
    }

    private createSnsTopics() {
        const config = ConfigResolver.getSnsTopicsDevConfig();

        return createSnsTopics(this, {
            env: config.env!,
            sns: config.sns!,
        });
    }

    private createCloudWatchAlarms() {
        const config = ConfigResolver.getAlarmsDevConfig();

        return createCloudWatchAlarms(this, {
            env: config.env!,
            cloudwatch: config.cloudwatch!,
        });
    }
}

/**
 * Development environment CloudWatch stack with PagerDuty integration.
 *
 * @remarks
 * This stack creates CloudWatch resources with PagerDuty integration:
 * - PagerDuty Lambda function for processing alarm events
 * - CloudWatch alarms with PagerDuty EventBridge rules
 *
 * Validates that no P1 priorities are configured to prevent
 * triggering high-priority incidents in test environments.
 */
export class CloudWatchPagerDutyDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // First create the PagerDuty Lambda
        const pdLambdaResources = this.createPagerDutyLambda();

        // Output Lambda details
        new CfnOutput(this, 'PagerDutyLambdaArn', {
            value: pdLambdaResources.function.functionArn,
            description: 'PagerDuty Lambda function ARN',
        });

        new CfnOutput(this, 'PagerDutyLambdaName', {
            value: pdLambdaResources.function.functionName,
            description: 'PagerDuty Lambda function name',
        });

        // Then create alarms with PagerDuty integration using the Lambda ARN
        const alarms = this.createCloudWatchAlarmsWithPagerDuty(pdLambdaResources.function.functionArn);

        alarms.forEach((alarm, index) => {
            new CfnOutput(this, `AlarmName${index}`, {
                value: alarm.alarmName,
                description: `CloudWatch Alarm with PagerDuty ${index + 1}`,
            });
        });
    }

    private createPagerDutyLambda() {
        const config = ConfigResolver.getPagerDutyLambdaDevConfig();
        const {vpcId, privateSubnetIds, functionName, secretName, ...restConfig} = config;
        const hasVpcConfig = vpcId && privateSubnetIds && privateSubnetIds.length > 0;

        return createPagerDutyLambda(this, {
            ...restConfig,
            // Use default naming: pagerduty-cloudwatch-{env}-{region_short}
            functionName: functionName,
            secretName: secretName ?? 'pagerduty/cloudwatch-dev',
            environment: 'dev',
            region: this.region,
            account: this.account,
            vpc: hasVpcConfig
                ? {
                      vpcId: vpcId!,
                      privateSubnetIds: privateSubnetIds!,
                  }
                : undefined,
        });
    }

    private createCloudWatchAlarmsWithPagerDuty(pagerDutyLambdaArn: string) {
        const config = ConfigResolver.getAlarmsWithPagerDutyDevConfig();

        // Validate no P1 priorities in test environment
        validateNoP1Priorities(config);

        return createCloudWatchAlarms(this, {
            env: config.env!,
            cloudwatch: config.cloudwatch!,
            pagerDutyLambda: {
                lambdaArn: pagerDutyLambdaArn,
            },
        });
    }
}

/**
 * Development environment PagerDuty Lambda stack.
 *
 * @remarks
 * This stack creates the PagerDuty integration Lambda:
 * - Processes CloudWatch alarm events from EventBridge
 * - Sends events to PagerDuty Events API v2
 * - Uses Secrets Manager for API token storage
 *
 * To configure VPC, create `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 * };
 * ```
 */
export class PagerDutyLambdaDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const resources = this.createPagerDutyLambda();

        new CfnOutput(this, 'PagerDutyLambdaArn', {
            value: resources.function.functionArn,
            description: 'PagerDuty Lambda function ARN - use this for CloudWatch alarm integration',
        });

        new CfnOutput(this, 'PagerDutyLambdaName', {
            value: resources.function.functionName,
            description: 'PagerDuty Lambda function name',
        });

        new CfnOutput(this, 'PagerDutyLogGroupName', {
            value: resources.logGroup.logGroupName,
            description: 'CloudWatch Log Group for PagerDuty Lambda',
        });
    }

    private createPagerDutyLambda() {
        const config = ConfigResolver.getPagerDutyLambdaDevConfig();
        const {vpcId, privateSubnetIds, functionName, secretName, ...restConfig} = config;
        const hasVpcConfig = vpcId && privateSubnetIds && privateSubnetIds.length > 0;

        return createPagerDutyLambda(this, {
            ...restConfig,
            // Use default naming: pagerduty-cloudwatch-{env}-{region_short}
            functionName: functionName,
            secretName: secretName ?? 'pagerduty/cloudwatch-dev',
            environment: 'dev',
            region: this.region,
            account: this.account,
            vpc: hasVpcConfig
                ? {
                      vpcId: vpcId!,
                      privateSubnetIds: privateSubnetIds!,
                  }
                : undefined,
        });
    }
}
