// Construct functions
export {createCloudFrontS3} from './constructs/cloudfront-s3';

// Utility functions
export {createResponseHeadersPolicy, createCachePolicy} from './util';

// Enums
export {CachePreset, FrameOptions, ReferrerPolicy} from './types';

// Types - organized by category
export type {
    // CloudFront base types
    ErrorResponseProps,
    CloudFrontProps,
    Route53Props,

    // CloudFront + S3 types
    CloudFrontS3Props,
    CloudFrontS3Resources,

    // CloudFront enhancements
    StrictTransportSecurityConfig,
    SecurityHeadersConfig,
    ResponseHeadersPolicyConfig,
    OriginShieldConfig,
    CloudFrontFunctionsConfig,
    CustomCachePolicyConfig,
} from './types';

// Re-export S3 types and utilities for convenience
export type {BucketProps, LifecycleRuleConfig, IntelligentTieringBasicConfig, IntelligentTieringArchiveConfig, StorageClassOverride} from '@cdk-constructs/s3';
export {StorageClassStrategy, createS3Bucket} from '@cdk-constructs/s3';
