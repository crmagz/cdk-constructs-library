# Getting Started with @cdk-constructs/waf

This guide will help you quickly get started with the WAF package.

## Installation

```bash
npm install @cdk-constructs/waf --save-exact
```

## Prerequisites

- Node.js >= 24.x
- AWS CDK 2.225.0
- TypeScript >= 5.x
- AWS CLI configured with appropriate credentials

## Your First WebACL

### Step 1: Create a Basic WebACL

Create a WebACL with default settings (US-only traffic, all AWS managed rules enabled, COUNT mode):

```typescript
import {createWebAcl, WebAclScope} from '@cdk-constructs/waf';
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

export class MyWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const {webAcl, webAclArn} = createWebAcl(this, {
            name: 'my-first-waf',
            scope: WebAclScope.REGIONAL,
        });

        // WebACL is now created with:
        // - US-only geo-blocking
        // - 8 AWS managed rule groups
        // - CloudWatch logging enabled
        // - COUNT mode (allows traffic, logs matches)
    }
}
```

### Step 2: Associate with a Resource

Associate your WebACL with an Application Load Balancer:

```typescript
import {createWebAcl, createWebAclAssociation, WebAclScope} from '@cdk-constructs/waf';
import {ApplicationLoadBalancer} from 'aws-cdk-lib/aws-elasticloadbalancingv2';

// ... in your stack

const alb = new ApplicationLoadBalancer(this, 'MyALB', {
    vpc: myVpc,
    internetFacing: true,
});

const {webAclArn} = createWebAcl(this, {
    name: 'my-waf',
    scope: WebAclScope.REGIONAL,
});

createWebAclAssociation(this, {
    name: 'alb-waf-association',
    webAclArn: webAclArn,
    resourceArn: alb.loadBalancerArn,
});
```

### Step 3: Test in COUNT Mode

By default, the WebACL operates in COUNT mode. This means:

- All traffic is **allowed**
- Rule matches are **logged** to CloudWatch
- You can review metrics without blocking legitimate traffic

Monitor your WebACL for 24-48 hours:

1. Go to CloudWatch Console → Metrics → WAF
2. Review the `BlockedRequests`, `AllowedRequests`, and rule-specific metrics
3. Check CloudWatch Logs for detailed request information

### Step 4: Switch to Production Mode

Once you've confirmed there are no false positives, enable BLOCK mode:

```typescript
import {createWebAcl, WafActionMode, WebAclScope} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    scope: WebAclScope.REGIONAL,
    actionMode: WafActionMode.BLOCK, // Now blocking non-matching traffic
});
```

Deploy the change:

```bash
cdk diff  # Review changes
cdk deploy
```

## Common Next Steps

### Add Custom Path Rules

Block specific endpoints:

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
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
            description: 'Block admin panel',
        },
    ],
});
```

### Add IP Allowlisting

Allow traffic from your office IPs:

```typescript
import {createIpSet, createWebAcl, IpAddressVersion} from '@cdk-constructs/waf';

const {ipSetArn} = createIpSet(this, {
    name: 'office-ips',
    addresses: ['203.0.113.0/24', '198.51.100.42/32'],
    ipAddressVersion: IpAddressVersion.IPV4,
    description: 'Office IP ranges',
});

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    ipSetArn: ipSetArn,
});
```

### Configure Geo-Blocking

Allow traffic from multiple countries:

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    geoBlocking: {
        allowedCountries: ['US', 'CA', 'GB'], // US, Canada, UK
        actionMode: WafActionMode.BLOCK,
    },
});
```

## Understanding Rule Priority

Rules are evaluated in order of priority (lowest to highest):

| Priority | Rule Type         | Description                      |
| -------- | ----------------- | -------------------------------- |
| 0-7      | AWS Managed Rules | 8 AWS-provided rule groups       |
| 8        | Geo-Blocking      | Country-based filtering          |
| 9+       | Custom Path Rules | Your regex-based path rules      |
| 100      | IP Allowlist      | IP Set allowlist (if configured) |

## Next Steps

- [Configuration Reference](configuration-reference.md) - Explore all configuration options
- [Best Practices](best-practices.md) - Learn security and operational best practices
- [Examples](examples.md) - See real-world usage patterns

## Troubleshooting

### WebACL Not Blocking Traffic

1. Verify you're in BLOCK mode, not COUNT mode
2. Check CloudWatch Logs to see which rules are matching
3. Ensure WebACL is associated with the correct resource

### False Positives

1. Switch to COUNT mode temporarily
2. Review CloudWatch Logs for the blocking rule
3. Add custom ALLOW rules for legitimate traffic
4. Consider IP allowlisting for trusted sources

### No Metrics Showing

1. Wait 5-10 minutes for metrics to appear
2. Verify traffic is flowing through the protected resource
3. Check that CloudWatch metrics are enabled (default: true)
