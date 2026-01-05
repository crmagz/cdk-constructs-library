import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {WafActionMode, WebAclProps, WebAclScope} from '../../../packages/waf/src';
import {LocalConfig} from './config-resolver';

/**
 * Development environment WAF configuration.
 *
 * @remarks
 * This configuration is appropriate for dev/test environments:
 * - COUNT mode (monitor, don't block)
 * - Permissive geo-blocking (multiple countries allowed)
 * - Short log retention for cost savings
 * - No custom path blocking rules
 */
export const DEV_CONFIG: WebAclProps & LocalConfig = {
    name: 'example-waf-dev',
    scope: WebAclScope.REGIONAL,

    // COUNT mode for dev - allows all traffic, logs matches
    actionMode: WafActionMode.COUNT,

    // More permissive for dev/testing
    geoBlocking: {
        allowedCountries: ['US', 'CA', 'GB', 'AU'],
    },

    // Minimal path rules for dev
    customPathRules: [
        {
            name: 'monitor-admin',
            pathPattern: '^/admin(/.*)?$',
            action: WafActionMode.COUNT,
            description: 'Monitor admin panel access',
        },
    ],

    // Short retention for cost savings
    logging: {
        enabled: true,
        retentionDays: RetentionDays.ONE_WEEK,
    },

    description: 'Development environment WAF for testing and validation',

    // Local override placeholder
    resourceArn: undefined, // Override in environments.local.ts
};
