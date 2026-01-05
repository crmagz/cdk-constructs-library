import {WebAclProps} from '../../../packages/waf/src';

/**
 * Local configuration overrides for WAF examples.
 *
 * @remarks
 * Create a file at `examples/environments.local.ts` to override default values:
 *
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   resourceArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-alb/...',
 * };
 * ```
 */
export type LocalConfig = {
    /**
     * Optional ALB ARN to associate with the WAF.
     * If not provided, WAF will be created but not associated.
     */
    resourceArn?: string;
};

/**
 * Configuration resolver for WAF examples.
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

    public static getDevConfig(): WebAclProps & LocalConfig {
        const {DEV_CONFIG} = require('./waf-dev');
        return this.resolve(DEV_CONFIG);
    }

    public static getProdConfig(): WebAclProps & LocalConfig {
        const {PROD_CONFIG} = require('./waf-prod');
        return this.resolve(PROD_CONFIG);
    }
}
