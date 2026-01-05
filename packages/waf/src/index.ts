/**
 * @cdk-constructs/waf
 *
 * Production-ready AWS WAF WebACL constructs for AWS CDK.
 *
 * @remarks
 * This package provides type-safe, production-ready constructs for creating AWS WAF WebACLs
 * with security best practices built-in, including:
 *
 * - **Geo-blocking**: Block traffic from specific countries (default: US-only)
 * - **AWS Managed Rules**: 8 pre-configured rule groups for comprehensive protection
 * - **Custom Path Rules**: Flexible regex-based URL blocking/allowing
 * - **IP Allowlisting**: Optional IP Set integration
 * - **CloudWatch Logging**: Built-in monitoring and metrics
 * - **Dual Scope Support**: REGIONAL and CLOUDFRONT WebACLs
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { createWebAcl, WebAclScope, WafActionMode } from '@cdk-constructs/waf';
 *
 * const { webAcl, webAclArn } = createWebAcl(this, {
 *   name: 'my-waf',
 *   scope: WebAclScope.REGIONAL,
 *   actionMode: WafActionMode.BLOCK,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Export constructs
export * from './constructs/web-acl';
export * from './constructs/ip-set';
export * from './constructs/association';

// Export enums
export {WebAclScope, WafActionMode, IpAddressVersion, ManagedRuleGroup} from './types';

// Export types
export type * from './types/web-acl';
export type * from './types/ip-set';
export type * from './types/association';
