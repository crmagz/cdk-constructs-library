/**
 * WebACL scope - determines where the WebACL can be deployed.
 *
 * @public
 */
export enum WebAclScope {
    /** Regional resources (ALB, API Gateway, AppSync, Cognito, etc.) */
    REGIONAL = 'REGIONAL',
    /** CloudFront distributions (must be in us-east-1) */
    CLOUDFRONT = 'CLOUDFRONT',
}

/**
 * WAF action mode for custom rules.
 *
 * @public
 */
export enum WafActionMode {
    /** Count matching requests without blocking */
    COUNT = 'count',
    /** Block matching requests */
    BLOCK = 'block',
    /** Allow matching requests */
    ALLOW = 'allow',
}

/**
 * IP address version for IP Sets.
 *
 * @public
 */
export enum IpAddressVersion {
    IPV4 = 'IPV4',
    IPV6 = 'IPV6',
}

/**
 * Supported AWS managed rule groups.
 *
 * @remarks
 * These are the most commonly used AWS managed rule groups for web application protection.
 *
 * @public
 */
export enum ManagedRuleGroup {
    /** Core rule set for common web vulnerabilities */
    COMMON_RULE_SET = 'AWSManagedRulesCommonRuleSet',
    /** Protection against known bad inputs */
    KNOWN_BAD_INPUTS = 'AWSManagedRulesKnownBadInputsRuleSet',
    /** Amazon IP reputation list */
    IP_REPUTATION = 'AWSManagedRulesAmazonIpReputationList',
    /** Anonymous IP list (VPNs, proxies, Tor) */
    ANONYMOUS_IP = 'AWSManagedRulesAnonymousIpList',
    /** SQL injection protection */
    SQLI = 'AWSManagedRulesSQLiRuleSet',
    /** Linux-specific exploits */
    LINUX = 'AWSManagedRulesLinuxRuleSet',
    /** Unix-specific exploits */
    UNIX = 'AWSManagedRulesUnixRuleSet',
    /** Windows-specific exploits */
    WINDOWS = 'AWSManagedRulesWindowsRuleSet',
}

// Re-export all types
export type * from './web-acl';
export type * from './ip-set';
export type * from './association';
