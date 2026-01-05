# @cdk-constructs/waf

Production-ready AWS WAF WebACL constructs for AWS CDK.

## Overview

Create production-grade WAF WebACLs with security best practices built-in, including geo-blocking, AWS managed rules, and custom path-based rules.

### Key Features

- **US-Only Geo-Blocking** - Block traffic from common bot source countries by default
- **AWS Managed Rules** - 8 pre-configured rule groups for comprehensive protection
- **Custom Path Rules** - Flexible regex-based URL blocking/allowing
- **IP Allowlisting** - Optional IP Set integration
- **CloudWatch Logging** - Built-in monitoring and metrics
- **Dual Scope Support** - REGIONAL and CLOUDFRONT WebACLs
- **Type-Safe** - Full TypeScript support with comprehensive type definitions

### Bot Protection

By default, this package blocks traffic from all countries except the US, providing protection against bot traffic commonly originating from:

- Russia (RU)
- China (CN)
- Vietnam (VN)
- Indonesia (ID)
- Brazil (BR)
- India (IN)
- Iran (IR)
- North Korea (KP)
- Syria (SY)
- Cuba (CU)

## Quick Start

### Installation

This package is part of the `@cdk-constructs` monorepo. Install it as a workspace dependency:

```bash
npm install
```

### Basic Usage

Create a WebACL with default settings (US-only, all managed rules, COUNT mode):

```typescript
import {createWebAcl, WebAclScope} from '@cdk-constructs/waf';

const {webAcl, webAclArn} = createWebAcl(this, {
    name: 'my-waf',
    scope: WebAclScope.REGIONAL,
});
```

Associate the WebACL with an Application Load Balancer:

```typescript
import {createWebAclAssociation} from '@cdk-constructs/waf';

createWebAclAssociation(this, {
    name: 'alb-waf-association',
    webAclArn: webAclArn,
    resourceArn: alb.loadBalancerArn,
});
```

## Examples

### Production Configuration

Create a WebACL in BLOCK mode with custom path rules:

```typescript
import {createWebAcl, WebAclScope, WafActionMode} from '@cdk-constructs/waf';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';

const {webAcl, webAclArn, logGroup} = createWebAcl(this, {
    name: 'production-waf',
    scope: WebAclScope.REGIONAL,
    actionMode: WafActionMode.BLOCK,
    description: 'Production WAF for web application',
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
        retentionDays: RetentionDays.SIX_MONTHS,
    },
});
```

### IP Allowlisting

Create an IP Set and reference it in your WebACL:

```typescript
import {createIpSet, createWebAcl, IpAddressVersion, WebAclScope} from '@cdk-constructs/waf';

// Create IP Set for office IPs
const {ipSetArn} = createIpSet(this, {
    name: 'office-allowlist',
    addresses: ['203.0.113.0/24', '198.51.100.0/24'],
    ipAddressVersion: IpAddressVersion.IPV4,
    scope: WebAclScope.REGIONAL,
    description: 'Office IP ranges',
});

// Reference in WebACL
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    ipSetArn: ipSetArn,
});
```

### Testing with COUNT Mode

Test your WAF configuration before blocking traffic:

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';

// Create WebACL in COUNT mode for testing
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    actionMode: WafActionMode.COUNT, // Monitor without blocking
});

// Review CloudWatch metrics and logs
// When confident, update to BLOCK mode:
// actionMode: WafActionMode.BLOCK
```

### Custom Geo-Blocking

Override the default US-only geo-blocking:

```typescript
import {createWebAcl, WafActionMode} from '@cdk-constructs/waf';

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    geoBlocking: {
        allowedCountries: ['US', 'CA', 'GB'], // Allow US, Canada, UK
        actionMode: WafActionMode.BLOCK,
    },
});
```

### CloudFront WebACL

Create a WebACL for CloudFront distributions:

```typescript
import {createWebAcl, WebAclScope} from '@cdk-constructs/waf';
import {Distribution} from 'aws-cdk-lib/aws-cloudfront';

// Must be created in us-east-1
const {webAcl, webAclId} = createWebAcl(this, {
    name: 'cloudfront-waf',
    scope: WebAclScope.CLOUDFRONT,
});

// Reference in CloudFront distribution
const distribution = new Distribution(this, 'MyDistribution', {
    webAclId: webAclId,
    // ... other distribution config
});
```

## Configuration Options

### WebAclProps

| Property        | Type                   | Default           | Description                        |
| --------------- | ---------------------- | ----------------- | ---------------------------------- |
| name            | string                 | Required          | Name of the WebACL                 |
| scope           | WebAclScope            | REGIONAL          | REGIONAL or CLOUDFRONT             |
| actionMode      | WafActionMode          | COUNT             | COUNT (monitor) or BLOCK (enforce) |
| geoBlocking     | GeoBlockingConfig      | US-only           | Geo-blocking configuration         |
| managedRules    | ManagedRuleGroupConfig | All enabled       | AWS managed rule groups            |
| customPathRules | PathRuleConfig[]       | []                | Custom regex-based path rules      |
| ipSetArn        | string                 | undefined         | IP Set ARN for allowlisting        |
| logging         | LoggingConfig          | Enabled, 3 months | CloudWatch logging configuration   |
| description     | string                 | undefined         | Optional description               |

### IpSetProps

| Property         | Type             | Default   | Description                 |
| ---------------- | ---------------- | --------- | --------------------------- |
| name             | string           | Required  | Name of the IP Set          |
| addresses        | string[]         | Required  | IP addresses or CIDR blocks |
| ipAddressVersion | IpAddressVersion | IPV4      | IPV4 or IPV6                |
| scope            | WebAclScope      | REGIONAL  | REGIONAL or CLOUDFRONT      |
| description      | string           | undefined | Optional description        |

### WebAclAssociationProps

| Property    | Type   | Description                            |
| ----------- | ------ | -------------------------------------- |
| name        | string | Name for the association               |
| webAclArn   | string | ARN of the WebACL                      |
| resourceArn | string | ARN of resource to protect (ALB, etc.) |

## AWS Managed Rules

This package enables the following AWS managed rule groups by default:

1. **AWSManagedRulesCommonRuleSet** (Priority 0)
    - Core Rule Set (CRS) for common web vulnerabilities
    - Protection against OWASP Top 10 threats

2. **AWSManagedRulesKnownBadInputsRuleSet** (Priority 1)
    - Protection against known malicious input patterns
    - Detects invalid or malformed requests

3. **AWSManagedRulesAmazonIpReputationList** (Priority 2)
    - Amazon threat intelligence
    - Blocks IPs with poor reputation

4. **AWSManagedRulesAnonymousIpList** (Priority 3)
    - Blocks requests from VPNs, proxies, Tor exit nodes
    - Prevents anonymized bot traffic

5. **AWSManagedRulesSQLiRuleSet** (Priority 4)
    - SQL injection attack detection
    - Protects database-backed applications

6. **AWSManagedRulesLinuxRuleSet** (Priority 5)
    - Protection against Linux-specific exploits
    - LFI, RFI, command injection

7. **AWSManagedRulesUnixRuleSet** (Priority 6)
    - Protection against Unix-specific vulnerabilities
    - Shell injection, path traversal

8. **AWSManagedRulesWindowsRuleSet** (Priority 7)
    - Protection against Windows-specific exploits
    - PowerShell, command injection

## Scope Support

### REGIONAL

For regional AWS resources:

- Application Load Balancer (ALB)
- API Gateway REST API
- AppSync GraphQL API
- Cognito User Pool
- App Runner Service
- Verified Access Instance

Can be deployed in any AWS region. Requires association via `createWebAclAssociation()`.

### CLOUDFRONT

For CloudFront distributions only.

**Important:** Must be deployed in us-east-1 region.

Does not require association - reference the WebACL ID in the CloudFront distribution configuration.

## Monitoring

### CloudWatch Metrics

All rules emit CloudWatch metrics for monitoring and alerting. Access metrics via:

```
CloudWatch Console > Metrics > WAF
```

Key metrics:

- `AllowedRequests` - Requests allowed by the WebACL
- `BlockedRequests` - Requests blocked by the WebACL
- `CountedRequests` - Requests counted (when in COUNT mode)
- `{RuleName}` - Per-rule metrics

### CloudWatch Logs

Log data is stored in CloudWatch Logs group: `aws-waf-logs-{webAclName}`

Default retention: 3 months (configurable)

Log entries include:

- Request details (timestamp, client IP, HTTP method, URI)
- Rule evaluations
- Action taken (allow, block, count)
- Terminating rule

## Rule Priority Architecture

Rules are evaluated in priority order (lowest to highest):

| Priority | Rule Type         | Description                               |
| -------- | ----------------- | ----------------------------------------- |
| 0-7      | AWS Managed Rules | 8 managed rule groups                     |
| 8        | Geo-Blocking      | Country-based filtering                   |
| 9+       | Custom Path Rules | User-defined regex path rules             |
| 100      | IP Allowlist      | Optional IP Set allowlist (if configured) |

## Action Modes

### COUNT Mode

- **Default action**: Allow all traffic
- **Rule behavior**: Count matches without blocking
- **Use case**: Testing, monitoring, validating configuration
- **Recommendation**: Start here before moving to BLOCK mode

### BLOCK Mode

- **Default action**: Block all traffic
- **Rule behavior**: Block matching requests
- **Use case**: Production enforcement
- **Recommendation**: Only use after testing with COUNT mode

## Best Practices

1. **Start with COUNT mode** - Test your WAF configuration before blocking traffic
2. **Review CloudWatch metrics** - Monitor rule matches and false positives
3. **Use IP allowlisting** - Protect administrative access with IP Sets
4. **Custom path rules** - Block sensitive endpoints (actuator, admin, etc.)
5. **Regular reviews** - Periodically review logs and metrics
6. **Geo-blocking** - Consider your user base when configuring allowed countries
7. **CloudFront in us-east-1** - Remember regional requirement for CloudFront WebACLs

## Troubleshooting

### False Positives

If legitimate requests are being blocked:

1. Switch to COUNT mode temporarily
2. Review CloudWatch Logs to identify the blocking rule
3. Add custom ALLOW rules for specific paths
4. Use IP allowlisting for trusted sources
5. Consider disabling specific managed rule groups if they cause issues

### No Metrics Showing

Ensure:

1. WebACL is properly associated with a resource
2. Traffic is flowing through the protected resource
3. CloudWatch metrics are enabled (default: true)
4. Sufficient time has passed for metrics to appear (5-10 minutes)

### Association Errors

Common issues:

1. **Scope mismatch** - WebACL scope must match resource region
2. **Invalid resource** - Only specific resource types are supported
3. **CloudFront** - CloudFront distributions don't use associations

## License

See [LICENSE](../../LICENSE) for details.

## Additional Resources

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/)
- [AWS Managed Rules Documentation](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Best Practices](https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html)
