import {CfnResponseHeadersPolicy} from 'aws-cdk-lib/aws-cloudfront';
import {Construct} from 'constructs';
import {FrameOptions, ReferrerPolicy, ResponseHeadersPolicyConfig} from '../types/cloudfront-enhancements';

/**
 * Maps our FrameOptions enum to CloudFront frame option string.
 *
 * @internal
 */
const mapFrameOption = (option: FrameOptions): string => {
    return option; // DENY or SAMEORIGIN
};

/**
 * Maps our ReferrerPolicy enum to CloudFront referrer policy string.
 *
 * @internal
 */
const mapReferrerPolicy = (policy: ReferrerPolicy): string => {
    return policy;
};

/**
 * Creates a CloudFront Response Headers Policy with security and CORS headers.
 *
 * @remarks
 * This utility creates a response headers policy that automatically adds security
 * and CORS headers to all CloudFront responses.
 *
 * Security headers protect against common web vulnerabilities:
 * - Strict-Transport-Security: Forces HTTPS connections
 * - X-Content-Type-Options: Prevents MIME sniffing attacks
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-XSS-Protection: Enables browser XSS filters
 * - Referrer-Policy: Controls referrer information leakage
 * - Content-Security-Policy: Prevents XSS and injection attacks
 *
 * @param scope - The CDK construct scope
 * @param id - Construct ID for the policy
 * @param config - Response headers policy configuration
 * @returns The created CfnResponseHeadersPolicy
 *
 * @example
 * ```typescript
 * const policy = createResponseHeadersPolicy(this, 'SecurityHeaders', {
 *   securityHeaders: {
 *     strictTransportSecurity: {
 *       maxAge: Duration.days(365),
 *       includeSubdomains: true,
 *       preload: true,
 *     },
 *     contentTypeOptions: true,
 *     frameOptions: FrameOptions.DENY,
 *     xssProtection: true,
 *     referrerPolicy: ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
 *     contentSecurityPolicy: "default-src 'self'",
 *   },
 * });
 * ```
 *
 * @public
 */
export const createResponseHeadersPolicy = (scope: Construct, id: string, config: ResponseHeadersPolicyConfig): CfnResponseHeadersPolicy => {
    const securityHeaders = config.securityHeaders;
    const customHeaders = config.customHeaders;
    const corsHeaders = config.corsHeaders;

    const responseHeadersPolicyConfig: CfnResponseHeadersPolicy.ResponseHeadersPolicyConfigProperty = {
        name: id,
        securityHeadersConfig: securityHeaders
            ? {
                  strictTransportSecurity: securityHeaders.strictTransportSecurity
                      ? {
                            accessControlMaxAgeSec: securityHeaders.strictTransportSecurity.maxAge.toSeconds(),
                            includeSubdomains: securityHeaders.strictTransportSecurity.includeSubdomains,
                            preload: securityHeaders.strictTransportSecurity.preload,
                            override: true,
                        }
                      : undefined,
                  contentTypeOptions: securityHeaders.contentTypeOptions
                      ? {
                            override: true,
                        }
                      : undefined,
                  frameOptions: securityHeaders.frameOptions
                      ? {
                            frameOption: mapFrameOption(securityHeaders.frameOptions),
                            override: true,
                        }
                      : undefined,
                  xssProtection: securityHeaders.xssProtection
                      ? {
                            protection: true,
                            modeBlock: true,
                            override: true,
                        }
                      : undefined,
                  referrerPolicy: securityHeaders.referrerPolicy
                      ? {
                            referrerPolicy: mapReferrerPolicy(securityHeaders.referrerPolicy),
                            override: true,
                        }
                      : undefined,
                  contentSecurityPolicy: securityHeaders.contentSecurityPolicy
                      ? {
                            contentSecurityPolicy: securityHeaders.contentSecurityPolicy,
                            override: true,
                        }
                      : undefined,
              }
            : undefined,
        customHeadersConfig: customHeaders
            ? {
                  items: Object.entries(customHeaders).map(([header, value]) => ({
                      header,
                      value,
                      override: true,
                  })),
              }
            : undefined,
        corsConfig: corsHeaders
            ? {
                  accessControlAllowOrigins: {
                      items: corsHeaders.accessControlAllowOrigins,
                  },
                  accessControlAllowMethods: {
                      items: corsHeaders.accessControlAllowMethods,
                  },
                  accessControlAllowHeaders: {
                      items: corsHeaders.accessControlAllowHeaders ?? ['*'],
                  },
                  accessControlExposeHeaders: corsHeaders.accessControlExposeHeaders
                      ? {
                            items: corsHeaders.accessControlExposeHeaders,
                        }
                      : undefined,
                  accessControlMaxAgeSec: corsHeaders.accessControlMaxAge?.toSeconds(),
                  accessControlAllowCredentials: corsHeaders.accessControlAllowCredentials ?? false,
                  originOverride: true,
              }
            : undefined,
    };

    return new CfnResponseHeadersPolicy(scope, id, {
        responseHeadersPolicyConfig,
    });
};
