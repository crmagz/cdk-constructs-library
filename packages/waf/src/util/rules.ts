import {CfnWebACL} from 'aws-cdk-lib/aws-wafv2';
import {GeoBlockingConfig, ManagedRuleGroup, ManagedRuleGroupConfig, PathRuleConfig, WafActionMode} from '../types';

/**
 * Creates AWS managed rule group rules.
 *
 * @remarks
 * Generates rules for all enabled AWS managed rule groups with proper priority ordering
 * and CloudWatch metrics configuration.
 *
 * Default enabled groups:
 * 1. Common Rule Set - Priority 0
 * 2. Known Bad Inputs - Priority 1
 * 3. IP Reputation List - Priority 2
 * 4. Anonymous IP List - Priority 3
 * 5. SQL Injection - Priority 4
 * 6. Linux Exploits - Priority 5
 * 7. Unix Exploits - Priority 6
 * 8. Windows Exploits - Priority 7
 *
 * @param config - Managed rule group configuration
 * @param actionMode - WebACL action mode (affects override action)
 * @returns Array of managed rule group rules
 *
 * @internal
 */
export const createManagedRuleGroupRules = (config: ManagedRuleGroupConfig | undefined, actionMode: WafActionMode): CfnWebACL.RuleProperty[] => {
    const enabledGroups = config?.enabledRuleGroups ?? [
        ManagedRuleGroup.COMMON_RULE_SET,
        ManagedRuleGroup.KNOWN_BAD_INPUTS,
        ManagedRuleGroup.IP_REPUTATION,
        ManagedRuleGroup.ANONYMOUS_IP,
        ManagedRuleGroup.SQLI,
        ManagedRuleGroup.LINUX,
        ManagedRuleGroup.UNIX,
        ManagedRuleGroup.WINDOWS,
    ];

    // Determine override action based on config or actionMode
    const overrideAction = config?.overrideAction ?? (actionMode === WafActionMode.COUNT ? 'count' : 'none');

    const rules: CfnWebACL.RuleProperty[] = [];
    let priority = 0;

    for (const ruleGroup of enabledGroups) {
        rules.push({
            name: ruleGroup
                .toLowerCase()
                .replace(/aws|managed|rules/gi, '')
                .trim(),
            priority: priority++,
            overrideAction: overrideAction === 'count' ? {count: {}} : {none: {}},
            statement: {
                managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: ruleGroup,
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: ruleGroup,
            },
        });
    }

    return rules;
};

/**
 * Creates a geo-blocking rule.
 *
 * @remarks
 * By default, blocks all non-US traffic using a NOT statement with geo-match.
 * This protects against bot traffic commonly originating from countries like:
 * - Russia (RU), China (CN), Vietnam (VN), Indonesia (ID)
 * - Brazil (BR), India (IN), Iran (IR), North Korea (KP), Syria (SY), Cuba (CU)
 *
 * @param config - Geo-blocking configuration
 * @param actionMode - WebACL action mode (used if config doesn't specify action)
 * @param priority - Priority for this rule
 * @returns Geo-blocking rule property
 *
 * @internal
 */
export const createGeoBlockingRule = (config: GeoBlockingConfig | undefined, actionMode: WafActionMode, priority: number): CfnWebACL.RuleProperty => {
    const allowedCountries = config?.allowedCountries ?? ['US'];
    const ruleActionMode = config?.actionMode ?? actionMode;

    return {
        name: `geo-blocking-${ruleActionMode}`,
        priority,
        action: ruleActionMode === WafActionMode.COUNT ? {count: {}} : {block: {}},
        statement: {
            notStatement: {
                statement: {
                    geoMatchStatement: {
                        countryCodes: allowedCountries,
                    },
                },
            },
        },
        visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `geo-blocking-${ruleActionMode}`,
        },
    };
};

/**
 * Creates custom path-based rules.
 *
 * @remarks
 * Generates regex-based rules that match against URI paths.
 * Each rule gets a sequential priority starting from basePriority.
 *
 * @param pathRules - Array of path rule configurations
 * @param basePriority - Starting priority (incremented for each rule)
 * @returns Array of custom path rules
 *
 * @internal
 */
export const createCustomPathRules = (pathRules: PathRuleConfig[] | undefined, basePriority: number): CfnWebACL.RuleProperty[] => {
    if (!pathRules || pathRules.length === 0) {
        return [];
    }

    const rules: CfnWebACL.RuleProperty[] = [];
    let priority = basePriority;

    for (const pathRule of pathRules) {
        const action = pathRule.action === WafActionMode.COUNT ? {count: {}} : pathRule.action === WafActionMode.BLOCK ? {block: {}} : {allow: {}};

        rules.push({
            name: pathRule.name,
            priority: priority++,
            action,
            statement: {
                regexMatchStatement: {
                    regexString: pathRule.pathPattern,
                    fieldToMatch: {
                        uriPath: {},
                    },
                    textTransformations: [
                        {
                            priority: 0,
                            type: 'NONE',
                        },
                    ],
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: pathRule.name,
            },
        });
    }

    return rules;
};

/**
 * Creates an IP allowlist rule.
 *
 * @remarks
 * Creates an allow rule that matches against an IP Set.
 * This rule has low priority (100) and is evaluated last.
 *
 * @param ipSetArn - ARN of the IP Set to reference
 * @returns IP allowlist rule property
 *
 * @internal
 */
export const createIpAllowlistRule = (ipSetArn: string): CfnWebACL.RuleProperty => {
    return {
        name: 'ip-allowlist',
        priority: 100,
        action: {allow: {}},
        statement: {
            ipSetReferenceStatement: {
                arn: ipSetArn,
            },
        },
        visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'ip-allowlist',
        },
    };
};
