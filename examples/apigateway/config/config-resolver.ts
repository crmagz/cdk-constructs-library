import {RegionalRestApiProps} from '../../../packages/apigateway/src';

/**
 * Local configuration overrides for API Gateway examples.
 *
 * @remarks
 * Create a file at `examples/environments.local.ts` to override default values:
 *
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   vpcEndpointId: 'vpce-12345', // for private APIs
 * };
 * ```
 */
export type LocalConfig = {
    /** VPC ID for Lambda placement */
    vpcId?: string;

    /** Private subnet IDs for Lambda ENIs */
    privateSubnetIds?: string[];

    /** VPC endpoint ID for private APIs */
    vpcEndpointId?: string;
};

/**
 * Configuration resolver for API Gateway examples.
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

    public static getDevConfig(): Partial<RegionalRestApiProps> & LocalConfig {
        const {DEV_CONFIG} = require('./api-dev');
        return this.resolve(DEV_CONFIG);
    }
}
