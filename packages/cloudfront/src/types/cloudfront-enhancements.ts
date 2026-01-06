import {Duration} from 'aws-cdk-lib';
import {Function as CloudFrontFunction} from 'aws-cdk-lib/aws-cloudfront';

/**
 * Cache optimization presets for common use cases.
 *
 * @remarks
 * Pre-configured cache policies optimized for different content types:
 * - `STATIC_WEBSITE`: Long TTLs for static assets (HTML, CSS, JS, images)
 * - `SPA`: Optimized for Single Page Applications with versioned assets
 * - `API`: Short TTLs for dynamic API responses
 * - `STREAMING`: Optimized for video/audio streaming content
 * - `CUSTOM`: Use custom cache policy configuration
 *
 * @public
 */
export enum CachePreset {
    STATIC_WEBSITE = 'static-website',
    SPA = 'spa',
    API = 'api',
    STREAMING = 'streaming',
    CUSTOM = 'custom',
}

/**
 * Frame options for X-Frame-Options header.
 *
 * @public
 */
export enum FrameOptions {
    DENY = 'DENY',
    SAMEORIGIN = 'SAMEORIGIN',
}

/**
 * Referrer policy options for Referrer-Policy header.
 *
 * @public
 */
export enum ReferrerPolicy {
    NO_REFERRER = 'no-referrer',
    NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
    ORIGIN = 'origin',
    ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
    SAME_ORIGIN = 'same-origin',
    STRICT_ORIGIN = 'strict-origin',
    STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
    UNSAFE_URL = 'unsafe-url',
}

/**
 * Strict-Transport-Security header configuration.
 *
 * @remarks
 * Configures HSTS (HTTP Strict Transport Security) to force HTTPS connections.
 *
 * @public
 */
export type StrictTransportSecurityConfig = {
    /** Maximum age in seconds for HSTS policy */
    maxAge: Duration;

    /** Include all subdomains in HSTS policy */
    includeSubdomains: boolean;

    /** Include this site in browser HSTS preload lists */
    preload?: boolean;
};

/**
 * Security headers configuration for CloudFront response headers policy.
 *
 * @remarks
 * Configures security headers to protect against common web vulnerabilities:
 * - HSTS: Force HTTPS connections
 * - Content-Type-Options: Prevent MIME sniffing
 * - Frame-Options: Prevent clickjacking
 * - XSS-Protection: Enable browser XSS filters
 * - Referrer-Policy: Control referrer information
 * - Content-Security-Policy: Prevent XSS and injection attacks
 *
 * @public
 */
export type SecurityHeadersConfig = {
    /** Strict-Transport-Security header configuration */
    strictTransportSecurity?: StrictTransportSecurityConfig;

    /** Enable X-Content-Type-Options: nosniff header */
    contentTypeOptions?: boolean;

    /** X-Frame-Options header value */
    frameOptions?: FrameOptions;

    /** Enable X-XSS-Protection header */
    xssProtection?: boolean;

    /** Referrer-Policy header value */
    referrerPolicy?: ReferrerPolicy;

    /** Content-Security-Policy header value */
    contentSecurityPolicy?: string;
};

/**
 * Response headers policy configuration.
 *
 * @remarks
 * Configures HTTP response headers added by CloudFront.
 *
 * @public
 */
export type ResponseHeadersPolicyConfig = {
    /** Security headers configuration */
    securityHeaders?: SecurityHeadersConfig;

    /** Custom headers to add to all responses */
    customHeaders?: Record<string, string>;

    /** CORS headers configuration */
    corsHeaders?: {
        accessControlAllowOrigins: string[];
        accessControlAllowMethods: string[];
        accessControlAllowHeaders?: string[];
        accessControlExposeHeaders?: string[];
        accessControlMaxAge?: Duration;
        accessControlAllowCredentials?: boolean;
    };
};

/**
 * Origin Shield configuration for improved cache hit ratio.
 *
 * @remarks
 * Origin Shield is an additional caching layer that sits between CloudFront edge locations
 * and your origin. It reduces load on your origin and improves cache hit ratio.
 *
 * Benefits:
 * - Reduces origin load by consolidating requests
 * - Improves cache hit ratio (can increase from ~85% to ~95%)
 * - Reduces data transfer costs
 * - Better performance for viewers
 *
 * Cost: ~$0.005 per 10,000 requests (small additional cost for significant benefits)
 *
 * @public
 */
export type OriginShieldConfig = {
    /** Enable Origin Shield */
    enabled: boolean;

    /** AWS region for Origin Shield (should match or be close to origin region) */
    originShieldRegion?: string;
};

/**
 * CloudFront Functions configuration.
 *
 * @remarks
 * CloudFront Functions are lightweight JavaScript functions that run at CloudFront edge locations.
 * They're ideal for:
 * - URL rewrites and redirects
 * - Request/response header manipulation
 * - Access control and authentication
 * - A/B testing and feature flags
 *
 * Limitations:
 * - Maximum execution time: 1ms
 * - Maximum memory: 2MB
 * - No network or file system access
 *
 * For more complex use cases, consider Lambda@Edge instead.
 *
 * @public
 */
export type CloudFrontFunctionsConfig = {
    /** Function to run on viewer request (before cache lookup) */
    viewerRequest?: CloudFrontFunction;

    /** Function to run on viewer response (before returning to viewer) */
    viewerResponse?: CloudFrontFunction;
};

/**
 * Cache policy configuration for custom cache behavior.
 *
 * @remarks
 * Used when `cachePreset` is set to `CUSTOM`.
 *
 * @public
 */
export type CustomCachePolicyConfig = {
    /** Minimum TTL for cached objects */
    minTtl?: Duration;

    /** Maximum TTL for cached objects */
    maxTtl?: Duration;

    /** Default TTL for cached objects */
    defaultTtl?: Duration;

    /** Enable compression for cached objects */
    enableCompression?: boolean;

    /** Query strings to include in cache key */
    queryStrings?: string[];

    /** Headers to include in cache key */
    headers?: string[];

    /** Cookies to include in cache key */
    cookies?: string[];
};
