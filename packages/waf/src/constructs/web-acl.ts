import {RemovalPolicy} from 'aws-cdk-lib';
import {LogGroup, LogGroupClass, RetentionDays} from 'aws-cdk-lib/aws-logs';
import {CfnLoggingConfiguration, CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {Construct} from 'constructs';
import {WafActionMode, WebAclProps, WebAclResources, WebAclScope} from '../types';
import {createCustomPathRules, createGeoBlockingRule, createIpAllowlistRule, createManagedRuleGroupRules} from '../util/rules';

/**
 * Creates a production-ready WAF WebACL with AWS managed rules, geo-blocking, and optional custom rules.
 *
 * @remarks
 * This function creates a comprehensive WAF WebACL that includes:
 * - 8 AWS managed rule groups for baseline protection against common attacks
 * - Geo-blocking (default: US-only traffic)
 * - Optional custom path-based rules
 * - Optional IP allowlisting
 * - CloudWatch logging and metrics
 *
 * The WebACL can operate in two modes:
 * - COUNT mode: Allows all traffic but logs rule matches (for testing/monitoring)
 * - BLOCK mode: Blocks traffic that doesn't match allow rules (production)
 *
 * Rule Priority Order:
 * - 0-7: AWS managed rule groups
 * - 8: Geo-blocking rule
 * - 9+: Custom path rules (if configured)
 * - 100: IP allowlist rule (if configured)
 *
 * @param scope - The construct scope
 * @param props - WebACL configuration properties
 * @returns WebACL resources including the WebACL, ARN, ID, and optional log group
 *
 * @example
 * Basic usage with defaults (US-only, COUNT mode):
 * ```typescript
 * import { createWebAcl, WebAclScope } from '@cdk-constructs/waf';
 *
 * const { webAcl, webAclArn } = createWebAcl(this, {
 *   name: 'my-waf',
 *   scope: WebAclScope.REGIONAL,
 * });
 * ```
 *
 * @example
 * Production configuration with custom path rules:
 * ```typescript
 * import { createWebAcl, WebAclScope, WafActionMode } from '@cdk-constructs/waf';
 *
 * const { webAcl, webAclArn, logGroup } = createWebAcl(this, {
 *   name: 'production-waf',
 *   scope: WebAclScope.REGIONAL,
 *   actionMode: WafActionMode.BLOCK,
 *   customPathRules: [
 *     {
 *       name: 'block-actuator',
 *       pathPattern: '^/actuator(/.*)?$',
 *       action: WafActionMode.BLOCK,
 *       description: 'Block Spring Boot actuator endpoints',
 *     },
 *     {
 *       name: 'allow-api-v1',
 *       pathPattern: '^/api/v1(/.*)?$',
 *       action: WafActionMode.ALLOW,
 *       description: 'Allow API v1 endpoints',
 *     },
 *   ],
 *   logging: {
 *     enabled: true,
 *     retentionDays: RetentionDays.SIX_MONTHS,
 *   },
 * });
 * ```
 *
 * @example
 * With IP allowlisting:
 * ```typescript
 * import { createIpSet, createWebAcl, IpAddressVersion } from '@cdk-constructs/waf';
 *
 * const { ipSetArn } = createIpSet(this, {
 *   name: 'office-ips',
 *   addresses: ['203.0.113.0/24'],
 *   ipAddressVersion: IpAddressVersion.IPV4,
 * });
 *
 * const { webAcl } = createWebAcl(this, {
 *   name: 'my-waf',
 *   ipSetArn: ipSetArn,
 * });
 * ```
 *
 * @see {@link WebAclProps} for all configuration options
 * @see https://docs.aws.amazon.com/waf/latest/developerguide/web-acl.html
 * @public
 */
export const createWebAcl = (scope: Construct, props: WebAclProps): WebAclResources => {
    // Set defaults
    const wafScope = props.scope ?? WebAclScope.REGIONAL;
    const actionMode = props.actionMode ?? WafActionMode.COUNT;
    const loggingEnabled = props.logging?.enabled ?? true;

    // Determine default action based on action mode
    // COUNT mode: allow all (we're just counting rule matches)
    // BLOCK mode: block all (we're blocking non-matching traffic)
    const defaultAction = actionMode === WafActionMode.COUNT ? {allow: {}} : {block: {}};

    // Build rules array
    const rules: CfnWebACL.RuleProperty[] = [];

    // 1. Add AWS managed rule groups (priorities 0-7)
    rules.push(...createManagedRuleGroupRules(props.managedRules, actionMode));

    // 2. Add geo-blocking rule (priority 8)
    rules.push(createGeoBlockingRule(props.geoBlocking, actionMode, 8));

    // 3. Add custom path rules (priorities 9+)
    if (props.customPathRules && props.customPathRules.length > 0) {
        rules.push(...createCustomPathRules(props.customPathRules, 9));
    }

    // 4. Add IP allowlist rule (priority 100) if configured
    if (props.ipSetArn) {
        rules.push(createIpAllowlistRule(props.ipSetArn));
    }

    // Create the WebACL
    const webAcl = new CfnWebACL(scope, props.name, {
        name: props.name,
        scope: wafScope,
        defaultAction,
        description: props.description,
        rules,
        visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${props.name}-webacl`,
        },
    });

    let logGroup: LogGroup | undefined;

    // Create CloudWatch logging if enabled
    if (loggingEnabled) {
        logGroup = new LogGroup(scope, `${props.name}-logs`, {
            logGroupName: `aws-waf-logs-${props.name}`,
            retention: props.logging?.retentionDays ?? RetentionDays.THREE_MONTHS,
            logGroupClass: LogGroupClass.INFREQUENT_ACCESS,
            removalPolicy: props.logging?.removalPolicy ?? RemovalPolicy.DESTROY,
        });

        new CfnLoggingConfiguration(scope, `${props.name}-logging`, {
            resourceArn: webAcl.attrArn,
            logDestinationConfigs: [logGroup.logGroupArn],
        });
    }

    return {
        webAcl,
        webAclArn: webAcl.attrArn,
        webAclId: webAcl.attrId,
        logGroup,
    };
};
