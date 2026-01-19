import {NodejsFunctionProps, PythonFunctionProps} from '../../../packages/lambda/src';

/**
 * Local configuration overrides for Lambda examples.
 *
 * @remarks
 * Create a file at `examples/environments.local.ts` to override default values:
 *
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 * };
 * ```
 */
export type LocalConfig = {
    /** VPC ID for Lambda placement */
    vpcId?: string;

    /** Private subnet IDs for Lambda ENIs */
    privateSubnetIds?: string[];
};

/**
 * Configuration resolver for Lambda examples.
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

    public static getNodejsDevConfig(): Partial<NodejsFunctionProps> & LocalConfig {
        const {NODEJS_DEV_CONFIG} = require('./lambda-dev');
        return this.resolve(NODEJS_DEV_CONFIG);
    }

    public static getPythonDevConfig(): Partial<PythonFunctionProps> & LocalConfig {
        const {PYTHON_DEV_CONFIG} = require('./lambda-dev');
        return this.resolve(PYTHON_DEV_CONFIG);
    }

    /** @deprecated Use getNodejsDevConfig instead */
    public static getDevConfig(): Partial<NodejsFunctionProps> & LocalConfig {
        return this.getNodejsDevConfig();
    }
}
