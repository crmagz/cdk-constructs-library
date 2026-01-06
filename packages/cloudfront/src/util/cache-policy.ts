import {Duration} from 'aws-cdk-lib';
import {CachePolicy, CacheHeaderBehavior, CacheQueryStringBehavior, CacheCookieBehavior} from 'aws-cdk-lib/aws-cloudfront';
import {Construct} from 'constructs';
import {CachePreset, CustomCachePolicyConfig} from '../types/cloudfront-enhancements';

/**
 * Creates a cache policy for static website content.
 *
 * @remarks
 * Optimized for static assets with long TTLs:
 * - Min TTL: 1 second
 * - Default TTL: 1 day
 * - Max TTL: 1 year
 * - Compression enabled
 * - No query strings, headers, or cookies in cache key
 *
 * @internal
 */
const createStaticWebsiteCachePolicy = (scope: Construct, id: string): CachePolicy => {
    return new CachePolicy(scope, `${id}-static-website`, {
        cachePolicyName: `${id}-static-website`,
        comment: 'Cache policy for static website content',
        minTtl: Duration.seconds(1),
        defaultTtl: Duration.days(1),
        maxTtl: Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        headerBehavior: CacheHeaderBehavior.none(),
        queryStringBehavior: CacheQueryStringBehavior.none(),
        cookieBehavior: CacheCookieBehavior.none(),
    });
};

/**
 * Creates a cache policy for Single Page Applications.
 *
 * @remarks
 * Optimized for SPAs with versioned assets:
 * - Min TTL: 0 seconds (allows revalidation)
 * - Default TTL: 1 hour (for non-versioned assets)
 * - Max TTL: 1 year (for versioned assets)
 * - Compression enabled
 * - No cache key parameters (assumes versioned assets via URL)
 *
 * @internal
 */
const createSpaCachePolicy = (scope: Construct, id: string): CachePolicy => {
    return new CachePolicy(scope, `${id}-spa`, {
        cachePolicyName: `${id}-spa`,
        comment: 'Cache policy for Single Page Applications',
        minTtl: Duration.seconds(0),
        defaultTtl: Duration.hours(1),
        maxTtl: Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        headerBehavior: CacheHeaderBehavior.none(),
        queryStringBehavior: CacheQueryStringBehavior.none(),
        cookieBehavior: CacheCookieBehavior.none(),
    });
};

/**
 * Creates a cache policy for API responses.
 *
 * @remarks
 * Optimized for dynamic API content with short TTLs:
 * - Min TTL: 0 seconds
 * - Default TTL: 5 minutes
 * - Max TTL: 1 hour
 * - Compression enabled
 * - All query strings, headers (Authorization, Accept), and cookies included in cache key
 *
 * @internal
 */
const createApiCachePolicy = (scope: Construct, id: string): CachePolicy => {
    return new CachePolicy(scope, `${id}-api`, {
        cachePolicyName: `${id}-api`,
        comment: 'Cache policy for API responses',
        minTtl: Duration.seconds(0),
        defaultTtl: Duration.minutes(5),
        maxTtl: Duration.hours(1),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        headerBehavior: CacheHeaderBehavior.allowList('Authorization', 'Accept', 'Content-Type'),
        queryStringBehavior: CacheQueryStringBehavior.all(),
        cookieBehavior: CacheCookieBehavior.all(),
    });
};

/**
 * Creates a cache policy for streaming content.
 *
 * @remarks
 * Optimized for video/audio streaming:
 * - Min TTL: 1 second
 * - Default TTL: 1 day
 * - Max TTL: 30 days
 * - Compression disabled (already compressed)
 * - Range header included for partial content requests
 *
 * @internal
 */
const createStreamingCachePolicy = (scope: Construct, id: string): CachePolicy => {
    return new CachePolicy(scope, `${id}-streaming`, {
        cachePolicyName: `${id}-streaming`,
        comment: 'Cache policy for streaming content',
        minTtl: Duration.seconds(1),
        defaultTtl: Duration.days(1),
        maxTtl: Duration.days(30),
        enableAcceptEncodingGzip: false,
        enableAcceptEncodingBrotli: false,
        headerBehavior: CacheHeaderBehavior.allowList('Range'),
        queryStringBehavior: CacheQueryStringBehavior.none(),
        cookieBehavior: CacheCookieBehavior.none(),
    });
};

/**
 * Creates a custom cache policy based on user configuration.
 *
 * @internal
 */
const createCustomCachePolicy = (scope: Construct, id: string, config: CustomCachePolicyConfig): CachePolicy => {
    return new CachePolicy(scope, `${id}-custom`, {
        cachePolicyName: `${id}-custom`,
        comment: 'Custom cache policy',
        minTtl: config.minTtl ?? Duration.seconds(0),
        defaultTtl: config.defaultTtl ?? Duration.hours(1),
        maxTtl: config.maxTtl ?? Duration.days(365),
        enableAcceptEncodingGzip: config.enableCompression ?? true,
        enableAcceptEncodingBrotli: config.enableCompression ?? true,
        headerBehavior: config.headers ? CacheHeaderBehavior.allowList(...config.headers) : CacheHeaderBehavior.none(),
        queryStringBehavior: config.queryStrings ? CacheQueryStringBehavior.allowList(...config.queryStrings) : CacheQueryStringBehavior.none(),
        cookieBehavior: config.cookies ? CacheCookieBehavior.allowList(...config.cookies) : CacheCookieBehavior.none(),
    });
};

/**
 * Creates a cache policy based on the selected preset or custom configuration.
 *
 * @remarks
 * Provides pre-configured cache policies optimized for common use cases:
 *
 * - `STATIC_WEBSITE`: Long TTLs for static assets (HTML, CSS, JS, images)
 *   - Default TTL: 1 day, Max TTL: 1 year
 *   - Compression enabled, no cache key parameters
 *
 * - `SPA`: Optimized for Single Page Applications with versioned assets
 *   - Default TTL: 1 hour, Max TTL: 1 year
 *   - Allows revalidation (min TTL: 0)
 *   - Compression enabled
 *
 * - `API`: Short TTLs for dynamic API responses
 *   - Default TTL: 5 minutes, Max TTL: 1 hour
 *   - Includes Authorization and Accept headers in cache key
 *   - All query strings and cookies included
 *
 * - `STREAMING`: Optimized for video/audio streaming
 *   - Default TTL: 1 day, Max TTL: 30 days
 *   - Compression disabled (content already compressed)
 *   - Range header support for partial content
 *
 * - `CUSTOM`: User-defined cache behavior
 *   - Requires `customCacheConfig` parameter
 *   - Full control over TTLs and cache key parameters
 *
 * @param scope - The CDK construct scope
 * @param id - Construct ID for the policy
 * @param preset - Cache preset to use
 * @param customCacheConfig - Custom configuration (required when preset is CUSTOM)
 * @returns The created CachePolicy
 *
 * @example
 * ```typescript
 * // Using a preset
 * const policy = createCachePolicy(this, 'MyCache', CachePreset.SPA);
 *
 * // Using custom configuration
 * const customPolicy = createCachePolicy(this, 'MyCache', CachePreset.CUSTOM, {
 *   minTtl: Duration.seconds(0),
 *   defaultTtl: Duration.minutes(30),
 *   maxTtl: Duration.hours(24),
 *   queryStrings: ['version', 'locale'],
 *   headers: ['Accept-Language'],
 * });
 * ```
 *
 * @public
 */
export const createCachePolicy = (
    scope: Construct,
    id: string,
    preset: CachePreset = CachePreset.SPA,
    customCacheConfig?: CustomCachePolicyConfig
): CachePolicy => {
    switch (preset) {
        case CachePreset.STATIC_WEBSITE:
            return createStaticWebsiteCachePolicy(scope, id);
        case CachePreset.SPA:
            return createSpaCachePolicy(scope, id);
        case CachePreset.API:
            return createApiCachePolicy(scope, id);
        case CachePreset.STREAMING:
            return createStreamingCachePolicy(scope, id);
        case CachePreset.CUSTOM:
            if (!customCacheConfig) {
                throw new Error('customCacheConfig is required when cachePreset is CUSTOM');
            }
            return createCustomCachePolicy(scope, id, customCacheConfig);
    }
};
