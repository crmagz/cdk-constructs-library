import {RemovalPolicy} from 'aws-cdk-lib';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {WafActionMode, WebAclProps, WebAclScope} from '../../../packages/waf/src';
import {LocalConfig} from './config-resolver';

/**
 * Production environment WAF configuration.
 *
 * @remarks
 * This configuration is appropriate for production environments:
 * - BLOCK mode (enforce security)
 * - Restrictive geo-blocking (US-only by default)
 * - Long log retention for compliance
 * - Custom path blocking for sensitive endpoints
 */
export const PROD_CONFIG: WebAclProps & LocalConfig = {
    name: 'example-waf-prod',
    scope: WebAclScope.REGIONAL,

    // BLOCK mode for production - actively blocks threats
    actionMode: WafActionMode.BLOCK,

    // Restrictive geo-blocking for production
    geoBlocking: {
        allowedCountries: ['US'], // US-only for production
        actionMode: WafActionMode.BLOCK,
    },

    // Production path rules - block sensitive endpoints
    customPathRules: [
        {
            name: 'block-actuator',
            pathPattern: '^/actuator(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block Spring Boot actuator endpoints',
        },
        {
            name: 'block-admin',
            pathPattern: '^/admin(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block admin panel access',
        },
        {
            name: 'block-env-files',
            pathPattern: '^\\.env.*',
            action: WafActionMode.BLOCK,
            description: 'Block .env file access attempts',
        },
    ],

    // Long retention for compliance and incident investigation
    logging: {
        enabled: true,
        retentionDays: RetentionDays.ONE_YEAR,
        removalPolicy: RemovalPolicy.RETAIN,
    },

    description: 'Production environment WAF with comprehensive security rules',

    // Local override placeholder
    resourceArn: undefined, // Override in environments.local.ts
};
