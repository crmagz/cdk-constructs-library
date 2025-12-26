/**
 * Environment enumeration.
 *
 * This enum provides a standardized way to reference deployment environments
 * across different AWS accounts and regions.
 *
 * @example
 * ```typescript
 * import { Environment } from '@cdk-constructs/aws';
 *
 * const env = Environment.PROD;
 * ```
 *
 * @public
 */
export enum Environment {
    /**
     * Build environment.
     *
     * @remarks
     * Used for CI/CD pipelines and build processes.
     * Typically has minimal resources and is used for compilation and testing.
     */
    BUILD = 'build',

    /**
     * Development environment.
     *
     * @remarks
     * Used by developers for active development and testing.
     * May have relaxed security controls and is typically reset frequently.
     */
    DEV = 'dev',

    /**
     * Staging environment.
     *
     * @remarks
     * Used for pre-production testing and validation.
     * Should closely mirror production configuration for accurate testing.
     */
    STAGING = 'staging',

    /**
     * Production environment.
     *
     * @remarks
     * Used for live production workloads serving end users.
     * Requires strict security, monitoring, and compliance controls.
     */
    PROD = 'prod',
}
