# Examples

Real-world usage patterns and deployment scenarios for the WAF package.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Application Load Balancer Protection](#application-load-balancer-protection)
- [API Gateway Protection](#api-gateway-protection)
- [CloudFront Distribution Protection](#cloudfront-distribution-protection)
- [Multi-Environment Setup](#multi-environment-setup)
- [Advanced Configurations](#advanced-configurations)

## Basic Examples

### Minimal Configuration

Simplest possible WAF setup with all defaults:

```typescript
import {createWebAcl} from '@cdk-constructs/waf';
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

export class BasicWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const {webAcl} = createWebAcl(this, {
            name: 'basic-waf',
        });

        // Defaults applied:
        // - REGIONAL scope
        // - COUNT action mode
        // - US-only geo-blocking
        // - All 8 AWS managed rules enabled
        // - CloudWatch logging enabled
    }
}
```

### Production-Ready Configuration

Comprehensive production setup:

```typescript
import {createWebAcl, WafActionMode, WebAclScope} from '@cdk-constructs/waf';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {RemovalPolicy} from 'aws-cdk-lib';

const {webAcl, logGroup} = createWebAcl(this, {
    name: 'production-waf',
    scope: WebAclScope.REGIONAL,
    actionMode: WafActionMode.BLOCK,
    description: 'Production WAF for web application',

    geoBlocking: {
        allowedCountries: ['US', 'CA'],
    },

    customPathRules: [
        {
            name: 'block-actuator',
            pathPattern: '^/actuator(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block Spring Boot actuator endpoints',
        },
        {
            name: 'block-admin',
            pathPattern: '^/admin(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block admin panel access',
        },
    ],

    logging: {
        enabled: true,
        retentionDays: RetentionDays.ONE_YEAR,
        removalPolicy: RemovalPolicy.RETAIN,
    },
});
```

## Application Load Balancer Protection

### Basic ALB Protection

```typescript
import {createWebAcl, createWebAclAssociation, WebAclScope} from '@cdk-constructs/waf';
import {ApplicationLoadBalancer} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {Vpc} from 'aws-cdk-lib/aws-ec2';

export class AlbWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromLookup(this, 'Vpc', {vpcId: 'vpc-xxx'});

        const alb = new ApplicationLoadBalancer(this, 'MyALB', {
            vpc,
            internetFacing: true,
        });

        const {webAclArn} = createWebAcl(this, {
            name: 'alb-waf',
            scope: WebAclScope.REGIONAL,
        });

        createWebAclAssociation(this, {
            name: 'alb-waf-association',
            webAclArn: webAclArn,
            resourceArn: alb.loadBalancerArn,
        });
    }
}
```

### ALB with IP Allowlisting

```typescript
import {createIpSet, createWebAcl, createWebAclAssociation, IpAddressVersion} from '@cdk-constructs/waf';

export class AlbWafWithAllowlistStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create IP Set for office IPs
        const {ipSetArn} = createIpSet(this, {
            name: 'office-ips',
            addresses: [
                '203.0.113.0/24', // Office network
                '198.51.100.42/32', // VPN exit IP
            ],
            ipAddressVersion: IpAddressVersion.IPV4,
            description: 'Office IP ranges',
        });

        // Create WebACL with IP allowlist
        const {webAclArn} = createWebAcl(this, {
            name: 'alb-waf',
            ipSetArn: ipSetArn,
            customPathRules: [
                {
                    name: 'block-admin',
                    pathPattern: '^/admin(/.*)?$',
                    action: WafActionMode.BLOCK,
                    description: 'Block admin (office IPs still allowed via IP Set)',
                },
            ],
        });

        // Associate with ALB
        const alb = ApplicationLoadBalancer.fromLookup(this, 'ALB', {
            loadBalancerArn: 'arn:aws:elasticloadbalancing:...',
        });

        createWebAclAssociation(this, {
            name: 'alb-waf-association',
            webAclArn: webAclArn,
            resourceArn: alb.loadBalancerArn,
        });
    }
}
```

## API Gateway Protection

### REST API Protection

```typescript
import {createWebAcl, createWebAclAssociation} from '@cdk-constructs/waf';
import {RestApi} from 'aws-cdk-lib/aws-apigateway';

export class ApiGatewayWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const api = new RestApi(this, 'MyApi', {
            restApiName: 'my-api',
        });

        const {webAclArn} = createWebAcl(this, {
            name: 'api-waf',
            customPathRules: [
                {
                    name: 'rate-limit-api',
                    pathPattern: '^/api(/.*)?$',
                    action: WafActionMode.COUNT, // Monitor API traffic
                },
            ],
        });

        // Associate with API Gateway stage
        createWebAclAssociation(this, {
            name: 'api-waf-association',
            webAclArn: webAclArn,
            resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
        });
    }
}
```

## CloudFront Distribution Protection

### CloudFront with WAF

```typescript
import {createWebAcl, WebAclScope} from '@cdk-constructs/waf';
import {Distribution, OriginAccessIdentity} from 'aws-cdk-lib/aws-cloudfront';
import {S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {Bucket} from 'aws-cdk-lib/aws-s3';

// Stack MUST be in us-east-1 for CloudFront WAF
export class CloudFrontWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            env: {
                ...props?.env,
                region: 'us-east-1', // Required for CloudFront
            },
        });

        const {webAclId} = createWebAcl(this, {
            name: 'cloudfront-waf',
            scope: WebAclScope.CLOUDFRONT,
            actionMode: WafActionMode.BLOCK,
        });

        const bucket = new Bucket(this, 'ContentBucket');

        const distribution = new Distribution(this, 'MyDistribution', {
            defaultBehavior: {
                origin: new S3Origin(bucket),
            },
            webAclId: webAclId, // Reference WAF by ID
        });
    }
}
```

## Multi-Environment Setup

### Separate WAFs per Environment

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';

export class MultiEnvWafStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & {environment: 'dev' | 'staging' | 'prod'}) {
        super(scope, id, props);

        const isProd = props.environment === 'prod';

        const {webAcl} = createWebAcl(this, {
            name: `app-${props.environment}-waf`,

            // COUNT mode for non-prod, BLOCK for prod
            actionMode: isProd ? WafActionMode.BLOCK : WafActionMode.COUNT,

            // More permissive geo-blocking for dev/staging
            geoBlocking: {
                allowedCountries: isProd ? ['US'] : ['US', 'CA', 'GB', 'AU'],
            },

            // Block sensitive endpoints only in prod
            customPathRules: isProd
                ? [
                      {
                          name: 'block-actuator',
                          pathPattern: '^/actuator(/.*)?$',
                          action: WafActionMode.BLOCK,
                      },
                  ]
                : [],

            // Longer retention for prod
            logging: {
                enabled: true,
                retentionDays: isProd ? RetentionDays.ONE_YEAR : RetentionDays.ONE_MONTH,
            },

            description: `${props.environment} environment WAF`,
        });
    }
}
```

## Advanced Configurations

### Progressive API Endpoint Protection

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'api-waf',
    customPathRules: [
        // Block known attack vectors
        {
            name: 'block-sql-injection-attempts',
            pathPattern: '.*(union|select|insert|drop|delete|update).*',
            action: WafActionMode.BLOCK,
            description: 'Block SQL injection keywords in URLs',
        },

        // Block sensitive files
        {
            name: 'block-env-files',
            pathPattern: '^\\.env.*',
            action: WafActionMode.BLOCK,
            description: 'Block .env file access',
        },

        // Allow specific API versions
        {
            name: 'allow-api-v1',
            pathPattern: '^/api/v1(/.*)?$',
            action: WafActionMode.ALLOW,
            description: 'Allow API v1',
        },
        {
            name: 'allow-api-v2',
            pathPattern: '^/api/v2(/.*)?$',
            action: WafActionMode.ALLOW,
            description: 'Allow API v2',
        },

        // Block everything else under /api
        {
            name: 'block-unknown-api-versions',
            pathPattern: '^/api(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block unknown API versions',
        },
    ],
});
```

### Regional Distribution with Shared WAF Configuration

```typescript
import {createWebAcl, WebAclProps} from '@cdk-constructs/waf';

// Shared configuration
const baseWafConfig: Partial<WebAclProps> = {
    actionMode: WafActionMode.BLOCK,
    geoBlocking: {
        allowedCountries: ['US', 'CA'],
    },
    customPathRules: [
        {
            name: 'block-admin',
            pathPattern: '^/admin(/.*)?$',
            action: WafActionMode.BLOCK,
        },
    ],
};

// US East WAF
export class UsEastWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            env: {region: 'us-east-1'},
        });

        const {webAcl} = createWebAcl(this, {
            ...baseWafConfig,
            name: 'app-us-east-waf',
        });
    }
}

// US West WAF
export class UsWestWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            env: {region: 'us-west-2'},
        });

        const {webAcl} = createWebAcl(this, {
            ...baseWafConfig,
            name: 'app-us-west-waf',
        });
    }
}
```

### Testing Mode with Detailed Monitoring

```typescript
import {createWebAcl, WafActionMode, ManagedRuleGroup} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'test-waf',

    // COUNT mode for testing
    actionMode: WafActionMode.COUNT,

    // Test with limited rule groups first
    managedRules: {
        enabledRuleGroups: [ManagedRuleGroup.COMMON_RULE_SET, ManagedRuleGroup.SQLI],
        overrideAction: 'count', // Force COUNT even if actionMode changes
    },

    // Detailed logging
    logging: {
        enabled: true,
        retentionDays: RetentionDays.ONE_WEEK, // Short retention for testing
    },

    description: 'Testing WAF configuration before production rollout',
});
```

### Compliance-Ready Configuration

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {RemovalPolicy} from 'aws-cdk-lib';

const {webAcl, logGroup} = createWebAcl(this, {
    name: 'compliance-waf',
    actionMode: WafActionMode.BLOCK,

    // Restrictive geo-blocking
    geoBlocking: {
        allowedCountries: ['US'], // US-only for compliance
    },

    // All managed rules enabled (default)

    // Long-term log retention
    logging: {
        enabled: true,
        retentionDays: RetentionDays.ONE_YEAR, // Compliance requirement
        removalPolicy: RemovalPolicy.RETAIN, // Never delete logs
    },

    description: 'PCI DSS / HIPAA compliant WAF configuration',
});

// Export for compliance documentation
new CfnOutput(this, 'WafLogGroupArn', {
    value: logGroup?.logGroupArn ?? 'N/A',
    description: 'WAF CloudWatch Log Group ARN for audit trail',
});
```

## Testing Patterns

### Load Testing with WAF

```typescript
// Temporary configuration for load testing
const {webAcl} = createWebAcl(this, {
    name: 'load-test-waf',
    actionMode: WafActionMode.COUNT, // Don't block during load test

    // Disable geo-blocking for load test traffic
    geoBlocking: {
        allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
    },

    logging: {
        enabled: true,
        retentionDays: RetentionDays.THREE_DAYS, // Short retention for test data
    },
});

// Monitor metrics during test, then switch to BLOCK mode
```

### Gradual Rule Enablement

```typescript
// Phase 1: Start with minimal rules
const phase1Waf = createWebAcl(this, {
    name: 'gradual-waf',
    managedRules: {
        enabledRuleGroups: [ManagedRuleGroup.COMMON_RULE_SET],
    },
});

// Phase 2: Add more rules after testing
const phase2Waf = createWebAcl(this, {
    name: 'gradual-waf',
    managedRules: {
        enabledRuleGroups: [ManagedRuleGroup.COMMON_RULE_SET, ManagedRuleGroup.SQLI, ManagedRuleGroup.IP_REPUTATION],
    },
});

// Phase 3: Enable all rules (production)
const finalWaf = createWebAcl(this, {
    name: 'gradual-waf',
    // All rules enabled by default
});
```
