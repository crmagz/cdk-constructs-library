# @cdk-constructs/cloudfront

CloudFront distribution with S3 origin constructs for AWS CDK.

## Overview

This package provides production-ready CDK constructs for creating CloudFront distributions with S3 origins, including automatic setup of:

- S3 buckets with configurable storage classes and lifecycle policies
- CloudFront distributions with Origin Access Control
- Access logging with automatic log bucket creation
- Optional custom domain support with ACM certificates
- Optional Route 53 DNS integration
- SPA-friendly error response handling
- Security headers policy (HSTS, CSP, X-Frame-Options, etc.)
- Origin Shield for improved cache hit ratio
- Cache optimization presets (SPA, API, Streaming, Static)
- CloudFront Functions support for edge computing
- WAF integration examples

## Installation

```bash
npm install @cdk-constructs/cloudfront --save-exact
```

## Requirements

- Node.js >= 24
- AWS CDK >= 2.225.0
- TypeScript >= 5.4

## Usage

### Basic CloudFront + S3 Distribution

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';

const {distribution, contentBucket, logBucket} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
    },
    route53: {
        enableR53Lookup: false,
    },
});
```

### CloudFront with Custom Domain

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
            config: {
                name: 'intelligent-tiering',
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
        domainNames: ['www.example.com'],
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123...',
    },
    route53: {
        enableR53Lookup: true,
        hostedZoneId: 'Z1234567890ABC',
        domainName: 'example.com',
        aRecordAddress: 'www.example.com',
    },
});
```

### CloudFront with Config Bucket for JSON Files

```typescript
import {createCloudFrontS3, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    },
    cloudfront: {
        distributionName: 'my-distribution',
        defaultRootObject: 'index.html',
        logBucketName: 'my-cloudfront-logs',
        // Add config bucket for serving JSON config files
        configBucketName: 'my-config-bucket',
        configBucketPath: '/config',
    },
    route53: {
        enableR53Lookup: false,
    },
});

// Now *.json requests will be served from the config bucket
```

## Security Features

### Security Headers Policy

Add comprehensive security headers to protect against common web vulnerabilities:

```typescript
import {createCloudFrontS3, FrameOptions, ReferrerPolicy} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {
        bucketName: 'my-static-site',
        versioned: true,
    },
    cloudfront: {
        distributionName: 'my-secure-distribution',
        logBucketName: 'my-cloudfront-logs',

        // Security headers - recommended for all production deployments
        responseHeadersPolicy: {
            securityHeaders: {
                strictTransportSecurity: {
                    maxAge: Duration.days(365),
                    includeSubdomains: true,
                    preload: true, // Submit to browser HSTS preload list
                },
                contentTypeOptions: true, // X-Content-Type-Options: nosniff
                frameOptions: FrameOptions.DENY, // Prevent clickjacking
                xssProtection: true, // Enable browser XSS protection
                referrerPolicy: ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
            },
        },
    },
    route53: {
        enableR53Lookup: false,
    },
});
```

**Available Security Headers:**

- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections
- **Content-Type-Options**: Prevents MIME sniffing attacks
- **X-Frame-Options**: Prevents clickjacking (DENY or SAMEORIGIN)
- **X-XSS-Protection**: Enables browser XSS filters (legacy support)
- **Referrer-Policy**: Controls referrer information leakage
- **Content-Security-Policy (CSP)**: Prevents XSS and injection attacks

### WAF Integration

Protect your CloudFront distribution with AWS WAF for bot protection and geo-blocking:

```typescript
import {createCloudFrontS3, CachePreset, FrameOptions, ReferrerPolicy} from '@cdk-constructs/cloudfront';
import {CfnWebACLAssociation} from 'aws-cdk-lib/aws-wafv2';

// Create CloudFront distribution
const {distribution} = createCloudFrontS3(this, {
    s3: {bucketName: 'my-content', versioned: true},
    cloudfront: {
        distributionName: 'my-waf-protected-distribution',
        logBucketName: 'my-cf-logs',

        // Security headers
        responseHeadersPolicy: {
            securityHeaders: {
                strictTransportSecurity: {
                    maxAge: Duration.days(365),
                    includeSubdomains: true,
                },
                contentTypeOptions: true,
                frameOptions: FrameOptions.DENY,
            },
        },

        // Origin Shield for better cache hit ratio (reduces bot impact)
        originShield: {
            enabled: true,
            originShieldRegion: 'us-east-1',
        },
    },
    route53: {enableR53Lookup: false},
});

// Associate with WAF WebACL (must be CLOUDFRONT scope)
new CfnWebACLAssociation(this, 'WafAssociation', {
    resourceArn: distribution.distributionArn,
    webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/my-waf/abc123',
});
```

**Benefits of WAF Integration:**

- ✅ Blocks bots before they hit CloudFront cache (prevents cache misses)
- ✅ Geo-blocking for embargoed countries
- ✅ AWS Managed Rules for comprehensive threat protection
- ✅ Significant cost savings by reducing bandwidth and origin requests
- ✅ IP allowlisting and rate limiting

See `examples/cloudfront/stacks/cloudfront-waf-prod-stack.ts` for a complete example.

## Performance Optimization

### Origin Shield

Origin Shield is an additional caching layer that improves cache hit ratio and reduces origin load:

```typescript
import {createCloudFrontS3} from '@cdk-constructs/cloudfront';

const {distribution} = createCloudFrontS3(this, {
    s3: {bucketName: 'my-content', versioned: true},
    cloudfront: {
        distributionName: 'my-distribution',
        logBucketName: 'my-logs',

        // Enable Origin Shield
        originShield: {
            enabled: true,
            originShieldRegion: 'us-east-1', // Match your origin region
        },
    },
    route53: {enableR53Lookup: false},
});
```

**Origin Shield Benefits:**

- ✅ Improves cache hit ratio from ~85% to ~95%
- ✅ Reduces origin load by consolidating requests
- ✅ Lowers data transfer costs
- ✅ Better performance for viewers worldwide
- ✅ Cost: ~$0.005 per 10,000 requests (worthwhile for cost savings)

**Best Practices:**

- Set `originShieldRegion` to match your origin's region
- Use with high-traffic distributions for maximum benefit
- Combine with WAF to block bots before they reach Origin Shield

### Cache Optimization Presets

Choose from pre-configured cache policies optimized for different content types:

```typescript
import {createCloudFrontS3, CachePreset} from '@cdk-constructs/cloudfront';

const {distribution} = createCloudFrontS3(this, {
    s3: {bucketName: 'my-content', versioned: true},
    cloudfront: {
        distributionName: 'my-distribution',
        logBucketName: 'my-logs',

        // Choose a cache preset
        cachePreset: CachePreset.SPA, // or STATIC_WEBSITE, API, STREAMING, CUSTOM
    },
    route53: {enableR53Lookup: false},
});
```

**Available Cache Presets:**

| Preset           | Best For         | Default TTL  | Max TTL      | Query Strings | Headers               |
| ---------------- | ---------------- | ------------ | ------------ | ------------- | --------------------- |
| `SPA` (default)  | Single Page Apps | 1 hour       | 1 year       | None          | None                  |
| `STATIC_WEBSITE` | Static sites     | 1 day        | 1 year       | None          | None                  |
| `API`            | API responses    | 5 min        | 1 hour       | All           | Authorization, Accept |
| `STREAMING`      | Video/Audio      | 1 day        | 30 days      | None          | Range                 |
| `CUSTOM`         | Custom config    | Configurable | Configurable | Configurable  | Configurable          |

**Custom Cache Policy:**

```typescript
import {createCloudFrontS3, CachePreset} from '@cdk-constructs/cloudfront';
import {Duration} from 'aws-cdk-lib';

const {distribution} = createCloudFrontS3(this, {
    s3: {bucketName: 'my-content', versioned: true},
    cloudfront: {
        distributionName: 'my-distribution',
        logBucketName: 'my-logs',

        // Custom cache configuration
        cachePreset: CachePreset.CUSTOM,
        customCachePolicy: {
            minTtl: Duration.seconds(0),
            defaultTtl: Duration.minutes(30),
            maxTtl: Duration.hours(24),
            enableCompression: true,
            queryStrings: ['version', 'locale'],
            headers: ['Accept-Language'],
            cookies: ['session_id'],
        },
    },
    route53: {enableR53Lookup: false},
});
```

### CloudFront Functions

Add lightweight edge functions for request/response manipulation:

```typescript
import {createCloudFrontS3} from '@cdk-constructs/cloudfront';
import {Function as CloudFrontFunction, FunctionCode} from 'aws-cdk-lib/aws-cloudfront';

// Create CloudFront Functions
const viewerRequestFunction = new CloudFrontFunction(this, 'ViewerRequest', {
    code: FunctionCode.fromInline(`
        function handler(event) {
            var request = event.request;
            // URL rewrite for SPA
            if (!request.uri.includes('.')) {
                request.uri = '/index.html';
            }
            return request;
        }
    `),
});

const viewerResponseFunction = new CloudFrontFunction(this, 'ViewerResponse', {
    code: FunctionCode.fromInline(`
        function handler(event) {
            var response = event.response;
            // Add custom header
            response.headers['x-custom-header'] = { value: 'my-value' };
            return response;
        }
    `),
});

// Use functions with CloudFront
const {distribution} = createCloudFrontS3(this, {
    s3: {bucketName: 'my-content', versioned: true},
    cloudfront: {
        distributionName: 'my-distribution',
        logBucketName: 'my-logs',

        // Attach CloudFront Functions
        cloudfrontFunctions: {
            viewerRequest: viewerRequestFunction,
            viewerResponse: viewerResponseFunction,
        },
    },
    route53: {enableR53Lookup: false},
});
```

**CloudFront Functions Use Cases:**

- URL rewrites and redirects
- Request/response header manipulation
- Simple access control
- A/B testing and feature flags
- Bot detection (simple patterns)

**Limitations:**

- Maximum execution time: 1ms
- Maximum memory: 2MB
- No network or file system access

For more complex use cases, consider Lambda@Edge.

## Storage Class Strategies

### Lifecycle Rules

Manually configure transitions to Infrequent Access and Glacier storage classes:

```typescript
storageClass: {
    strategy: StorageClassStrategy.LIFECYCLE_RULE,
    config: {
        infrequentAccessTransitionAfter: Duration.days(30),
        glacierTransitionAfter: Duration.days(90),
    },
}
```

### Intelligent Tiering (Basic)

Automatically move objects between access tiers based on access patterns:

```typescript
storageClass: {
    strategy: StorageClassStrategy.INTELLIGENT_TIERING_BASIC,
    config: {
        name: 'intelligent-tiering-basic',
    },
}
```

Default tiers:

- Frequent Access: Default
- Infrequent Access: 30 days
- Archive Instant Access: 90 days

### Intelligent Tiering (Archive)

Extends basic intelligent tiering with deep archive options:

```typescript
storageClass: {
    strategy: StorageClassStrategy.INTELLIGENT_TIERING_ARCHIVE,
    config: {
        name: 'intelligent-tiering-archive',
        archiveAccessTierTime: Duration.days(90),
        deepArchiveAccessTierTime: Duration.days(180),
    },
}
```

## S3 Bucket Utility

You can also use the S3 bucket creation utility independently:

```typescript
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/cloudfront';
import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {BucketAccessControl} from 'aws-cdk-lib/aws-s3';

const bucket = createS3Bucket(this, {
    bucketName: 'my-bucket',
    versioned: true,
    accessControl: BucketAccessControl.PRIVATE,
    removalPolicy: RemovalPolicy.DESTROY,
    storageClass: {
        strategy: StorageClassStrategy.LIFECYCLE_RULE,
        config: {
            infrequentAccessTransitionAfter: Duration.days(30),
            glacierTransitionAfter: Duration.days(90),
        },
    },
});
```

## Features

### Security

- ✅ SSL enforcement on all S3 buckets
- ✅ Block all public access by default
- ✅ S3 managed or KMS encryption
- ✅ Origin Access Control for CloudFront to S3
- ✅ HTTPS redirect for all viewer requests
- ✅ Security headers policy (HSTS, CSP, X-Frame-Options, etc.)
- ✅ WAF integration support for bot protection and geo-blocking
- ✅ CloudFront Functions for edge security logic

### Cost Optimization

- ✅ Configurable storage class strategies
- ✅ Automatic lifecycle transitions
- ✅ Intelligent tiering support
- ✅ Price class configuration (defaults to PRICE_CLASS_100)
- ✅ Origin Shield for improved cache hit ratio (85% → 95%)
- ✅ Cache optimization presets for different content types
- ✅ WAF integration reduces bot traffic and bandwidth costs

### Logging & Monitoring

- ✅ CloudFront access logging enabled by default
- ✅ Automatic log bucket creation with lifecycle policies
- ✅ Versioning support for content buckets

### Developer Experience

- ✅ SPA-friendly error responses (404/403 → index.html)
- ✅ TypeScript type safety
- ✅ Comprehensive TSDoc documentation
- ✅ Minimal required configuration

## API Reference

### Types

**Core Types:**

- `CloudFrontS3Props` - Main configuration for CloudFront + S3
- `CloudFrontProps` - CloudFront distribution configuration
- `Route53Props` - Route 53 DNS configuration
- `BucketProps` - S3 bucket configuration
- `CloudFrontS3Resources` - Resources returned by createCloudFrontS3

**Security Types:**

- `ResponseHeadersPolicyConfig` - Security and CORS headers configuration
- `SecurityHeadersConfig` - Security headers (HSTS, CSP, X-Frame-Options, etc.)
- `StrictTransportSecurityConfig` - HSTS configuration

**Performance Types:**

- `OriginShieldConfig` - Origin Shield configuration
- `CloudFrontFunctionsConfig` - CloudFront Functions for edge computing
- `CustomCachePolicyConfig` - Custom cache policy configuration

### Enums

- `StorageClassStrategy` - S3 storage class strategies (LIFECYCLE_RULE, INTELLIGENT_TIERING_BASIC, INTELLIGENT_TIERING_ARCHIVE)
- `CachePreset` - Cache optimization presets (SPA, STATIC_WEBSITE, API, STREAMING, CUSTOM)
- `FrameOptions` - X-Frame-Options values (DENY, SAMEORIGIN)
- `ReferrerPolicy` - Referrer-Policy values (STRICT_ORIGIN_WHEN_CROSS_ORIGIN, NO_REFERRER, etc.)

### Functions

**Construct Functions:**

- `createCloudFrontS3(scope, props)` - Create CloudFront distribution with S3 origin
- `createS3Bucket(scope, props)` - Create S3 bucket with lifecycle policies

**Utility Functions:**

- `createResponseHeadersPolicy(scope, id, config)` - Create security headers policy
- `createCachePolicy(scope, id, preset, customConfig?)` - Create cache policy from preset

## License

Apache-2.0

## Contributing

See the main [repository README](../../README.md) for contribution guidelines.
