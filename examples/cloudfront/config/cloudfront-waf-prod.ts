import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {PriceClass} from 'aws-cdk-lib/aws-cloudfront';
import {CloudFrontS3Props, StorageClassStrategy, CachePreset, FrameOptions, ReferrerPolicy} from '@cdk-constructs/cloudfront';

/**
 * Production CloudFront + S3 configuration with comprehensive security features.
 *
 * @remarks
 * This configuration demonstrates the complete set of CloudFront security and optimization features:
 *
 * **Security Headers:**
 * - Strict-Transport-Security (HSTS) with 1-year max-age and subdomain inclusion
 * - X-Content-Type-Options: nosniff (prevents MIME sniffing)
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-XSS-Protection: enabled (legacy XSS protection)
 * - Referrer-Policy: strict-origin-when-cross-origin (privacy protection)
 * - Content-Security-Policy: Strict CSP to prevent XSS attacks
 *
 * **Origin Shield:**
 * - Enabled in us-east-1 for improved cache hit ratio (85% -> 95%)
 * - Reduces origin load and data transfer costs
 * - Best performance when shield region matches origin region
 *
 * **Cache Optimization:**
 * - SPA preset: Optimized for Single Page Applications
 * - Supports versioned assets with long TTLs
 * - Allows cache revalidation for non-versioned content
 *
 * **Storage Optimization:**
 * - Intelligent Tiering with archive access for cost savings
 * - Automatic transition to archive tiers after 90/180 days
 *
 * **WAF Integration:**
 * - Associate with WAF WebACL (configure webAclArn via local config)
 * - Blocks bots, prevents cache misses, reduces bandwidth costs
 * - Geo-blocking for embargoed countries
 * - AWS Managed Rules for comprehensive threat protection
 *
 * To use with WAF:
 * 1. Deploy WAF stack first to get WebACL ARN
 * 2. Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`
 * 3. Add webAclArn to local config
 * 4. Deploy CloudFront stack - WAF association will be automatic
 */
export const CLOUDFRONT_WAF_PROD_CONFIG: CloudFrontS3Props = {
    s3: {
        bucketName: 'cdk-constructs-cf-waf-content-prod-20260105',
        versioned: true,
        removalPolicy: RemovalPolicy.RETAIN,
        storageClass: {
            strategy: StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE,
            config: {
                name: 'intelligent-tiering-archive',
                archiveAccessTierTime: Duration.days(90),
                deepArchiveAccessTierTime: Duration.days(180),
            },
        },
    },
    cloudfront: {
        distributionName: 'cdk-constructs-cf-waf-prod',
        logBucketName: 'cdk-constructs-cf-waf-logs-prod-20260105',
        defaultRootObject: 'index.html',
        comment: 'Production CloudFront with WAF, security headers, and Origin Shield',
        priceClass: PriceClass.PRICE_CLASS_ALL,

        // Security headers policy - automatically added to all responses
        responseHeadersPolicy: {
            securityHeaders: {
                strictTransportSecurity: {
                    maxAge: Duration.days(365),
                    includeSubdomains: true,
                    preload: true,
                },
                contentTypeOptions: true,
                frameOptions: FrameOptions.DENY,
                xssProtection: true,
                referrerPolicy: ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                contentSecurityPolicy:
                    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
            },
            // Optional CORS headers (uncomment if needed for API access)
            // corsHeaders: {
            //     accessControlAllowOrigins: ['https://example.com'],
            //     accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
            //     accessControlAllowHeaders: ['Authorization', 'Content-Type'],
            //     accessControlMaxAge: Duration.hours(1),
            // },
        },

        // Origin Shield - improves cache hit ratio from ~85% to ~95%
        originShield: {
            enabled: true,
            originShieldRegion: 'us-east-1', // Match your origin region for best performance
        },

        // Cache preset optimized for Single Page Applications
        cachePreset: CachePreset.SPA,

        // Uncomment for custom domain (requires ACM certificate in us-east-1)
        // domainNames: ['www.example.com', 'example.com'],
        // certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id',

        // CloudFront Functions (optional - uncomment to use)
        // cloudfrontFunctions: {
        //     viewerRequest: myViewerRequestFunction,  // URL rewrites, redirects
        //     viewerResponse: myViewerResponseFunction, // Additional header manipulation
        // },
    },
    route53: {
        enableR53Lookup: false,
        // Uncomment for Route 53 DNS integration
        // hostedZoneId: 'Z1234567890ABC',
        // domainName: 'example.com',
        // aRecordAddress: 'www.example.com',
    },
};
