import {RemovalPolicy} from 'aws-cdk-lib';
import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import {CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {ManagedRuleGroup, WafActionMode, WebAclScope} from './index';

/**
 * Path-based custom rule configuration.
 *
 * @remarks
 * Use this to block or allow specific URL paths using regex patterns.
 *
 * @example
 * ```typescript
 * const rule: PathRuleConfig = {
 *   name: 'block-actuator',
 *   pathPattern: '^/actuator(/.*)?$',
 *   action: WafActionMode.BLOCK,
 *   description: 'Block Spring Boot actuator endpoints',
 * };
 * ```
 *
 * @public
 */
export type PathRuleConfig = {
    /** Name of the rule (used for CloudWatch metrics) */
    name: string;

    /** Regex pattern to match against the URI path */
    pathPattern: string;

    /** Action to take when pattern matches */
    action: WafActionMode;

    /** Optional description for documentation */
    description?: string;
};

/**
 * Geo-blocking configuration.
 *
 * @remarks
 * Default behavior: Allow US traffic ONLY (block all non-US).
 * This protects against bot traffic commonly originating from countries like:
 * - Russia (RU)
 * - China (CN)
 * - Vietnam (VN)
 * - Indonesia (ID)
 * - Brazil (BR)
 * - India (IN)
 * - Iran (IR)
 * - North Korea (KP)
 * - Syria (SY)
 * - Cuba (CU)
 *
 * @public
 */
export type GeoBlockingConfig = {
    /**
     * Country codes to allow (ISO 3166-1 alpha-2).
     *
     * @defaultValue ['US'] - US-only traffic
     */
    allowedCountries?: string[];

    /**
     * Action mode for geo-blocking rule.
     *
     * @defaultValue Uses the WebACL's default action mode
     */
    actionMode?: WafActionMode;
};

/**
 * Configuration for AWS managed rule groups.
 *
 * @public
 */
export type ManagedRuleGroupConfig = {
    /**
     * Which managed rule groups to enable.
     *
     * @defaultValue All rule groups enabled
     */
    enabledRuleGroups?: ManagedRuleGroup[];

    /**
     * Action override mode for managed rules.
     *
     * @remarks
     * - COUNT: Monitor rule matches without blocking (recommended for testing)
     * - BLOCK: Block matching requests (production mode)
     *
     * @defaultValue Inherited from WebACL's actionMode
     */
    overrideAction?: 'count' | 'none';
};

/**
 * CloudWatch logging configuration for WebACL.
 *
 * @public
 */
export type LoggingConfig = {
    /**
     * Enable CloudWatch logging.
     *
     * @defaultValue true
     */
    enabled?: boolean;

    /**
     * Log retention period.
     *
     * @defaultValue RetentionDays.THREE_MONTHS
     */
    retentionDays?: RetentionDays;

    /**
     * Removal policy for log group.
     *
     * @defaultValue RemovalPolicy.DESTROY
     */
    removalPolicy?: RemovalPolicy;
};

/**
 * Properties for creating a WebACL.
 *
 * @example
 * ```typescript
 * import { createWebAcl, WebAclScope, WafActionMode } from '@cdk-constructs/waf';
 *
 * const { webAcl } = createWebAcl(this, {
 *   name: 'my-waf',
 *   scope: WebAclScope.REGIONAL,
 *   actionMode: WafActionMode.BLOCK,
 *   customPathRules: [
 *     {
 *       name: 'block-admin',
 *       pathPattern: '^/admin(/.*)?$',
 *       action: WafActionMode.BLOCK,
 *     },
 *   ],
 * });
 * ```
 *
 * @public
 */
export type WebAclProps = {
    /**
     * Name of the WebACL.
     * Used as construct ID and resource name.
     */
    name: string;

    /**
     * Scope of the WebACL.
     *
     * @remarks
     * - REGIONAL: For ALB, API Gateway, AppSync, Cognito, App Runner
     * - CLOUDFRONT: For CloudFront distributions (must deploy in us-east-1)
     *
     * @defaultValue WebAclScope.REGIONAL
     */
    scope?: WebAclScope;

    /**
     * Default action mode for the WebACL.
     *
     * @remarks
     * - COUNT: Allow traffic but count matches (for testing/monitoring)
     * - BLOCK: Block non-matching traffic (production mode)
     *
     * This affects:
     * - The WebACL's default action (count = allow, block = block)
     * - Custom rule actions
     * - Managed rule override actions
     *
     * @defaultValue WafActionMode.COUNT
     */
    actionMode?: WafActionMode;

    /**
     * Geo-blocking configuration.
     *
     * @remarks
     * By default, allows US traffic only and blocks all other countries.
     *
     * @defaultValue { allowedCountries: ['US'], actionMode: inherited }
     */
    geoBlocking?: GeoBlockingConfig;

    /**
     * AWS managed rule groups configuration.
     *
     * @defaultValue All common rule groups enabled
     */
    managedRules?: ManagedRuleGroupConfig;

    /**
     * Custom path-based rules.
     *
     * @remarks
     * Use this to block/allow specific URL patterns.
     * Common use cases:
     * - Block actuator endpoints: '^/actuator(/.*)?$'
     * - Block admin paths: '^/admin(/.*)?$'
     * - Allow specific API versions: '^/api/v[0-9]+(/.*)?$'
     *
     * @defaultValue []
     */
    customPathRules?: PathRuleConfig[];

    /**
     * Optional IP Set ARN for allowlisting.
     *
     * @remarks
     * If provided, creates an allow rule for IPs in this set.
     * Use createIpSet() to create the IP Set first.
     */
    ipSetArn?: string;

    /**
     * CloudWatch logging configuration.
     *
     * @defaultValue { enabled: true, retentionDays: THREE_MONTHS }
     */
    logging?: LoggingConfig;

    /**
     * Optional description for the WebACL.
     */
    description?: string;
};

/**
 * Resources created by createWebAcl.
 *
 * @public
 */
export type WebAclResources = {
    /** The created WebACL */
    webAcl: CfnWebACL;

    /** ARN of the WebACL */
    webAclArn: string;

    /** ID of the WebACL */
    webAclId: string;

    /** CloudWatch log group (if logging enabled) */
    logGroup?: LogGroup;
};
