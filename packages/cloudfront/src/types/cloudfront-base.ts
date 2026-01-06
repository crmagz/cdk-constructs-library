import {Duration} from 'aws-cdk-lib';
import {DistributionProps} from 'aws-cdk-lib/aws-cloudfront';
import {CachePreset, CloudFrontFunctionsConfig, CustomCachePolicyConfig, OriginShieldConfig, ResponseHeadersPolicyConfig} from './cloudfront-enhancements';

/**
 * Error response configuration for CloudFront distributions.
 *
 * @remarks
 * Configures how CloudFront handles HTTP error responses from the origin.
 *
 * @public
 */
export type ErrorResponseProps = {
    /** HTTP status code to match */
    httpStatus: number;

    /** Path to the custom error page */
    responsePagePath: string;

    /** HTTP status code to return to the viewer */
    responseHttpStatus: number;

    /** TTL for caching the error response */
    ttl: Duration;
};

/**
 * CloudFront distribution configuration properties.
 *
 * @remarks
 * Extends standard CDK DistributionProps with additional configuration options
 * specific to S3-backed distributions.
 *
 * @public
 */
export type CloudFrontProps = Omit<DistributionProps, 'defaultBehavior'> & {
    /** Name of the S3 bucket for CloudFront logs */
    logBucketName: string;

    /** Logical name for the CloudFront distribution */
    distributionName: string;

    /** Optional ACM certificate ARN for HTTPS */
    certificateArn?: string;

    /** Optional S3 bucket name for additional config files */
    configBucketName?: string;

    /** Optional path within the config bucket */
    configBucketPath?: string;

    /** Optional custom error responses */
    errorResponses?: ErrorResponseProps[];

    /**
     * Response headers policy configuration for security and CORS headers.
     *
     * @remarks
     * Automatically adds security headers to all responses to protect against
     * common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.)
     */
    responseHeadersPolicy?: ResponseHeadersPolicyConfig;

    /**
     * Origin Shield configuration for improved cache hit ratio.
     *
     * @remarks
     * Reduces origin load and improves performance by adding an additional
     * caching layer between edge locations and your origin.
     */
    originShield?: OriginShieldConfig;

    /**
     * CloudFront Functions for request/response manipulation.
     *
     * @remarks
     * Lightweight functions that run at edge locations for URL rewrites,
     * header manipulation, and simple access control.
     */
    cloudfrontFunctions?: CloudFrontFunctionsConfig;

    /**
     * Cache optimization preset for common use cases.
     *
     * @remarks
     * Pre-configured cache policies optimized for different content types.
     * Use `CUSTOM` with `customCachePolicy` for fine-grained control.
     *
     * @defaultValue CachePreset.SPA
     */
    cachePreset?: CachePreset;

    /**
     * Custom cache policy configuration.
     *
     * @remarks
     * Only used when `cachePreset` is set to `CUSTOM`.
     */
    customCachePolicy?: CustomCachePolicyConfig;
};

/**
 * Route 53 integration properties for CloudFront distributions.
 *
 * @remarks
 * Configures automatic DNS record creation for custom domains.
 *
 * @public
 */
export type Route53Props = {
    /** Enable Route 53 A-record creation */
    enableR53Lookup: boolean;

    /** Optional custom A-record address (subdomain) */
    aRecordAddress?: string;

    /** Optional Route 53 hosted zone ID */
    hostedZoneId?: string;

    /** Optional domain name for the hosted zone */
    domainName?: string;
};
