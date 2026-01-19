import {CloudWatchAlarmsProps, SnsTopicsProps, PagerDutyLambdaProps} from '../../../packages/cloudwatch/src';

/**
 * Local configuration overrides for CloudWatch examples.
 *
 * @remarks
 * Create a file at `examples/environments.local.ts` to override default values:
 *
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   pagerDutyLambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:pagerduty-handler',
 * };
 * ```
 */
export type LocalConfig = {
    /** VPC ID for Lambda placement */
    vpcId?: string;

    /** Private subnet IDs for Lambda ENIs */
    privateSubnetIds?: string[];

    /** PagerDuty Lambda ARN for alarm integration */
    pagerDutyLambdaArn?: string;
};

/**
 * Configuration resolver for CloudWatch examples.
 *
 * @remarks
 * Merges base configuration with local overrides from environments.local.ts
 */
export class ConfigResolver {
    private static localConfig: LocalConfig | undefined;
    private static localConfigLoaded = false;

    private static loadLocalConfig(): LocalConfig | undefined {
        if (!this.localConfigLoaded) {
            try {
                const {LOCAL_CONFIG} = require('../../environments.local');
                this.localConfig = LOCAL_CONFIG;
            } catch {
                this.localConfig = undefined;
            }
            this.localConfigLoaded = true;
        }
        return this.localConfig;
    }

    private static resolve<T extends LocalConfig>(baseConfig: T): T {
        const localConfig = this.loadLocalConfig();
        if (localConfig) {
            return {...baseConfig, ...localConfig};
        }
        return baseConfig;
    }

    /**
     * Get CloudWatch alarms dev configuration.
     */
    public static getAlarmsDevConfig(): Partial<CloudWatchAlarmsProps> & LocalConfig {
        const {ALARMS_DEV_CONFIG} = require('./cloudwatch-dev');
        return this.resolve(ALARMS_DEV_CONFIG);
    }

    /**
     * Get CloudWatch alarms with PagerDuty dev configuration.
     */
    public static getAlarmsWithPagerDutyDevConfig(): Partial<CloudWatchAlarmsProps> & LocalConfig {
        const {ALARMS_WITH_PAGERDUTY_DEV_CONFIG} = require('./cloudwatch-dev');
        const resolved = this.resolve(ALARMS_WITH_PAGERDUTY_DEV_CONFIG);

        // Apply pagerDutyLambdaArn from local config if available
        if (resolved.pagerDutyLambdaArn) {
            resolved.pagerDutyLambda = {
                lambdaArn: resolved.pagerDutyLambdaArn,
            };
        }

        return resolved;
    }

    /**
     * Get SNS topics dev configuration.
     */
    public static getSnsTopicsDevConfig(): Partial<SnsTopicsProps> & LocalConfig {
        const {SNS_TOPICS_DEV_CONFIG} = require('./cloudwatch-dev');
        return this.resolve(SNS_TOPICS_DEV_CONFIG);
    }

    /**
     * Get PagerDuty Lambda dev configuration.
     */
    public static getPagerDutyLambdaDevConfig(): Partial<PagerDutyLambdaProps> & LocalConfig {
        const {PAGERDUTY_LAMBDA_DEV_CONFIG} = require('./cloudwatch-dev');
        return this.resolve(PAGERDUTY_LAMBDA_DEV_CONFIG);
    }
}
