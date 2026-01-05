# Best Practices

Guidelines for secure, cost-effective, and maintainable WAF deployments.

## Security Best Practices

### 1. Start with COUNT Mode

**Always test in COUNT mode before enabling BLOCK mode.**

```typescript
// Phase 1: Deploy in COUNT mode
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    actionMode: WafActionMode.COUNT, // Test first
});
```

**Why**: This allows you to:

- Identify false positives before blocking legitimate traffic
- Review actual traffic patterns
- Fine-tune rules based on real data
- Build confidence in your WAF configuration

**Recommended testing period**: 24-48 hours minimum

### 2. Enable CloudWatch Logging

**Always enable CloudWatch logging for visibility and troubleshooting.**

```typescript
const {webAcl, logGroup} = createWebAcl(this, {
    name: 'my-waf',
    logging: {
        enabled: true, // Always true for production
        retentionDays: RetentionDays.SIX_MONTHS, // Longer for compliance
    },
});
```

**Why**: Logs are essential for:

- Investigating security incidents
- Identifying attack patterns
- Troubleshooting false positives
- Compliance and audit requirements

### 3. Use IP Allowlisting for Administrative Access

**Protect administrative endpoints with IP allowlisting.**

```typescript
const {ipSetArn} = createIpSet(this, {
    name: 'admin-ips',
    addresses: [
        '203.0.113.0/24', // Office network
        '198.51.100.42/32', // VPN exit IP
    ],
    description: 'Administrative access IPs',
});

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    ipSetArn: ipSetArn,
    customPathRules: [
        {
            name: 'block-admin-except-allowlist',
            pathPattern: '^/admin(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block admin panel (allowlist takes precedence)',
        },
    ],
});
```

**Why**: Reduces attack surface for sensitive endpoints.

### 4. Protect Sensitive Endpoints

**Block or restrict access to diagnostic and administrative endpoints.**

```typescript
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    customPathRules: [
        {
            name: 'block-actuator',
            pathPattern: '^/actuator(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block Spring Boot actuator',
        },
        {
            name: 'block-dotenv',
            pathPattern: '^\\.env$',
            action: WafActionMode.BLOCK,
            description: 'Block .env file access',
        },
        {
            name: 'block-git',
            pathPattern: '^\\.git(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block .git directory access',
        },
    ],
});
```

**Common endpoints to protect**:

- `/actuator` - Spring Boot actuator
- `/admin` - Admin panels
- `/.env` - Environment files
- `/.git` - Git repositories
- `/wp-admin` - WordPress admin (if applicable)

### 5. Review and Update Geo-Blocking

**Regularly review geo-blocking configuration based on your user base.**

```typescript
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    geoBlocking: {
        allowedCountries: ['US', 'CA', 'GB'], // Add countries as needed
    },
});
```

**Considerations**:

- Where are your legitimate users located?
- Do you have international customers or partners?
- Are you blocking countries unnecessarily?
- Review CloudWatch metrics for blocked countries

### 6. Use All AWS Managed Rules

**Enable all relevant AWS managed rule groups for comprehensive protection.**

The default configuration enables all 8 common rule groups. Only disable specific groups if they cause confirmed issues.

```typescript
// Default (recommended) - all 8 groups enabled
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
});

// Custom (only if needed)
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    managedRules: {
        enabledRuleGroups: [
            ManagedRuleGroup.COMMON_RULE_SET,
            ManagedRuleGroup.SQLI,
            ManagedRuleGroup.IP_REPUTATION,
            // ... only enable what you need
        ],
    },
});
```

## Monitoring Best Practices

### 1. Set Up CloudWatch Alarms

Create alarms for suspicious activity:

```typescript
import {Alarm, ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';

const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
});

// Alarm for high block rate
new Alarm(this, 'HighBlockRate', {
    metric: webAcl.metricBlockedRequests(),
    threshold: 100,
    evaluationPeriods: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarmDescription: 'High number of blocked requests',
});
```

### 2. Review Metrics Regularly

**Key metrics to monitor**:

- `BlockedRequests` - Number of blocked requests
- `AllowedRequests` - Number of allowed requests
- `CountedRequests` - Number of counted requests (COUNT mode)
- Per-rule metrics - Individual rule performance

**Access metrics**: CloudWatch Console → Metrics → WAF

### 3. Analyze Logs for Patterns

**Regularly review CloudWatch Logs for**:

- Attack patterns and trends
- False positive candidates
- Rule effectiveness
- Geographic distribution of blocked traffic

### 4. Set Up Log Insights Queries

Save common queries for quick analysis:

```sql
-- Top blocked IPs
fields @timestamp, httpRequest.clientIp, terminatingRuleId
| filter action = "BLOCK"
| stats count() by httpRequest.clientIp
| sort count desc
| limit 20

-- Blocked requests by country
fields @timestamp, httpRequest.country, terminatingRuleId
| filter action = "BLOCK"
| stats count() by httpRequest.country
| sort count desc

-- Requests blocked by specific rule
fields @timestamp, httpRequest.clientIp, httpRequest.uri
| filter terminatingRuleId = "geo-blocking-block"
| limit 100
```

## Cost Optimization

### 1. Right-Size Log Retention

**Balance compliance needs with cost**:

```typescript
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    logging: {
        enabled: true,
        retentionDays: RetentionDays.THREE_MONTHS, // Default
        // For compliance: RetentionDays.ONE_YEAR
        // For cost savings: RetentionDays.ONE_MONTH
    },
});
```

**Considerations**:

- Compliance requirements (PCI DSS, HIPAA, etc.)
- Incident investigation needs
- Log volume and storage costs

### 2. Use Log Group Class INFREQUENT_ACCESS

The package automatically uses `LogGroupClass.INFREQUENT_ACCESS` for cost optimization on less-frequently accessed logs.

### 3. Clean Up Unused Resources

**Remove WebACLs and IP Sets that are no longer in use.**

### 4. Optimize Custom Rules

**Avoid redundant or overlapping custom rules**:

```typescript
// ❌ Bad - redundant rules
customPathRules: [
    {name: 'block-admin', pathPattern: '^/admin(/.*)?$', action: WafActionMode.BLOCK},
    {name: 'block-admin-login', pathPattern: '^/admin/login$', action: WafActionMode.BLOCK}, // Redundant!
];

// ✅ Good - single comprehensive rule
customPathRules: [{name: 'block-admin', pathPattern: '^/admin(/.*)?$', action: WafActionMode.BLOCK}];
```

## Operational Best Practices

### 1. Use Infrastructure as Code

**Always manage WAF through CDK/CloudFormation, never through the console.**

**Why**:

- Version control and audit trail
- Reproducible deployments
- Easier rollbacks
- Documentation as code

### 2. Progressive Rollout

**Deploy WAF changes progressively**:

1. Deploy in COUNT mode to dev environment
2. Monitor for 24-48 hours
3. Deploy to staging in COUNT mode
4. Deploy to production in COUNT mode
5. Monitor production for 48 hours
6. Switch production to BLOCK mode

### 3. Document Your Rules

**Use descriptions for all custom rules**:

```typescript
customPathRules: [
    {
        name: 'block-actuator',
        pathPattern: '^/actuator(/.*)?$',
        action: WafActionMode.BLOCK,
        description: 'Block Spring Boot actuator - contains sensitive JVM info', // Helpful!
    },
];
```

### 4. Separate WAFs for Different Applications

**Use separate WebACLs for different applications or environments**:

```typescript
// Production WAF
const prodWaf = createWebAcl(this, {
    name: 'app-prod-waf',
    actionMode: WafActionMode.BLOCK,
});

// Staging WAF (more permissive for testing)
const stagingWaf = createWebAcl(this, {
    name: 'app-staging-waf',
    actionMode: WafActionMode.COUNT,
});
```

**Why**:

- Different security requirements per environment
- Easier to test changes in staging
- Isolated blast radius for mistakes

### 5. Version Control Your Configuration

**Keep WAF configuration in version control with meaningful commit messages**:

```bash
git commit -m "WAF: Add blocking for /admin endpoint in production"
git commit -m "WAF: Switch to BLOCK mode after 48h testing"
```

## CloudFront-Specific Practices

### 1. Deploy in us-east-1

**CloudFront WebACLs MUST be created in us-east-1**:

```typescript
// Create a separate stack in us-east-1 for CloudFront WAF
export class CloudFrontWafStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            env: {
                ...props?.env,
                region: 'us-east-1', // Required for CloudFront
            },
        });

        const {webAcl} = createWebAcl(this, {
            name: 'cloudfront-waf',
            scope: WebAclScope.CLOUDFRONT,
        });
    }
}
```

### 2. Cross-Stack References

**Reference the WebACL ID in your CloudFront distribution**:

```typescript
// In CloudFront stack
const distribution = new Distribution(this, 'MyDistribution', {
    webAclId: Fn.importValue('CloudFrontWafId'),
    // ... other config
});
```

## Compliance Considerations

### 1. PCI DSS

For PCI DSS compliance:

- Enable all AWS managed rule groups
- Use BLOCK mode in production
- Retain logs for at least 1 year
- Monitor and review logs quarterly

### 2. HIPAA

For HIPAA compliance:

- Enable CloudWatch logging
- Encrypt log data at rest (default with CloudWatch)
- Implement IP allowlisting for ePHI access
- Regular security reviews and updates

### 3. SOC 2

For SOC 2 compliance:

- Document WAF configuration and changes
- Implement monitoring and alerting
- Regular review of blocked/allowed traffic
- Incident response procedures for security events

## Troubleshooting Common Issues

### False Positives

**Symptom**: Legitimate requests being blocked

**Solution**:

1. Identify the blocking rule in CloudWatch Logs
2. Add a custom ALLOW rule for the specific pattern
3. Or use IP allowlisting for trusted sources

### Performance Impact

**Symptom**: Increased latency

**WAF impact is typically minimal (<1ms), but if concerned**:

- Review rule count (more rules = slightly more latency)
- Ensure managed rules are necessary for your use case
- Monitor CloudWatch metrics for processing time

### Cross-Region Deployments

**Symptom**: WebACL association fails

**Solution**: Ensure WebACL and resource are in the same region (except CloudFront, which uses global distribution)

## Security Incident Response

### When a Security Event Occurs

1. **Investigate** - Review CloudWatch Logs for the incident
2. **Identify** - Determine attack vector and source
3. **Block** - Add temporary rules to block the attack
4. **Monitor** - Watch for attack pattern changes
5. **Document** - Record incident details and response
6. **Update** - Refine WAF rules based on learnings

### Emergency Rule Addition

```typescript
// Add temporary blocking rule during incident
const {webAcl} = createWebAcl(this, {
    name: 'my-waf',
    customPathRules: [
        {
            name: 'emergency-block-attack-pattern',
            pathPattern: '^/vulnerable-endpoint(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'TEMPORARY: Block attack on /vulnerable-endpoint - INCIDENT-2024-001',
        },
    ],
});
```

Deploy immediately:

```bash
cdk deploy --require-approval never
```
