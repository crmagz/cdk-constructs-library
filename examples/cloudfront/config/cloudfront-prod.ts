import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {PriceClass} from 'aws-cdk-lib/aws-cloudfront';
import {CloudFrontS3Props, StorageClassStrategy, CachePreset, FrameOptions, ReferrerPolicy} from '@cdk-constructs/cloudfront';

/**
 * Production environment configuration for CloudFront + S3.
 *
 * @remarks
 * This configuration creates a production CloudFront distribution with:
 * - S3 bucket with intelligent tiering for automatic cost optimization
 * - S3 bucket for CloudFront access logs
 * - Global price class for best performance worldwide
 * - Retain removal policy to prevent accidental deletion
 * - Default error responses for SPA applications
 * - Security headers for protection against common vulnerabilities
 * - SPA-optimized cache policy
 *
 * Replace the domain and certificate values with your actual production values.
 *
 * For WAF integration, see cloudfront-waf-prod.ts example.
 */
export const CLOUDFRONT_PROD_CONFIG: CloudFrontS3Props = {
    s3: {
        bucketName: 'cdk-constructs-cloudfront-content-prod-20260103',
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
        distributionName: 'cdk-constructs-cf-prod',
        logBucketName: 'cdk-constructs-cloudfront-logs-prod-20260103',
        defaultRootObject: 'index.html',
        comment: 'Production CloudFront distribution for CDK constructs example',
        priceClass: PriceClass.PRICE_CLASS_ALL,

        // Security headers - recommended for all production deployments
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
            },
        },

        // SPA cache preset - optimized for Single Page Applications
        cachePreset: CachePreset.SPA,

        // Uncomment to use a custom domain (requires ACM certificate in us-east-1)
        // domainNames: ['www.example.com', 'example.com'],
        // certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id',
    },
    route53: {
        enableR53Lookup: false,
        // Uncomment to create Route 53 A-record
        // hostedZoneId: 'Z1234567890ABC',
        // domainName: 'example.com',
        // aRecordAddress: 'www.example.com',
    },
};
