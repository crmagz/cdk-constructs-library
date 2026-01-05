# Configuration Reference

Complete reference for all configuration options in the WAF package.

## WebAclProps

Main configuration for creating a WebACL.

### Required Properties

#### name

- **Type**: `string`
- **Description**: Name of the WebACL (used as construct ID and resource name)
- **Example**: `'my-application-waf'`

### Optional Properties

#### scope

- **Type**: `WebAclScope`
- **Default**: `WebAclScope.REGIONAL`
- **Values**:
    - `WebAclScope.REGIONAL` - For ALB, API Gateway, AppSync, Cognito, App Runner
    - `WebAclScope.CLOUDFRONT` - For CloudFront distributions (must deploy in us-east-1)
- **Example**:
    ```typescript
    scope: WebAclScope.REGIONAL;
    ```

#### actionMode

- **Type**: `WafActionMode`
- **Default**: `WafActionMode.COUNT`
- **Values**:
    - `WafActionMode.COUNT` - Allow traffic, log rule matches (testing/monitoring)
    - `WafActionMode.BLOCK` - Block non-matching traffic (production)
- **Description**: Controls the WebACL's default action and affects managed rule behavior
- **Example**:
    ```typescript
    actionMode: WafActionMode.BLOCK;
    ```

#### geoBlocking

- **Type**: `GeoBlockingConfig`
- **Default**: `{ allowedCountries: ['US'] }`
- **Description**: Geo-blocking configuration
- **Properties**:
    - `allowedCountries?: string[]` - ISO 3166-1 alpha-2 country codes (default: `['US']`)
    - `actionMode?: WafActionMode` - Action for geo-blocking rule (default: inherited from WebACL)
- **Example**:
    ```typescript
    geoBlocking: {
      allowedCountries: ['US', 'CA', 'GB'],
      actionMode: WafActionMode.BLOCK,
    }
    ```

#### managedRules

- **Type**: `ManagedRuleGroupConfig`
- **Default**: All 8 rule groups enabled
- **Description**: AWS managed rule groups configuration
- **Properties**:
    - `enabledRuleGroups?: ManagedRuleGroup[]` - Which rule groups to enable
    - `overrideAction?: 'count' | 'none'` - Override action (default: inherited from actionMode)
- **Example**:
    ```typescript
    managedRules: {
      enabledRuleGroups: [
        ManagedRuleGroup.COMMON_RULE_SET,
        ManagedRuleGroup.SQLI,
        ManagedRuleGroup.IP_REPUTATION,
      ],
      overrideAction: 'count', // Force COUNT mode for testing
    }
    ```

#### customPathRules

- **Type**: `PathRuleConfig[]`
- **Default**: `[]`
- **Description**: Custom regex-based path rules
- **PathRuleConfig Properties**:
    - `name: string` - Rule name (used for CloudWatch metrics)
    - `pathPattern: string` - Regex pattern to match against URI path
    - `action: WafActionMode` - Action when pattern matches
    - `description?: string` - Optional description
- **Example**:
    ```typescript
    customPathRules: [
        {
            name: 'block-actuator',
            pathPattern: '^/actuator(/.*)?$',
            action: WafActionMode.BLOCK,
            description: 'Block Spring Boot actuator endpoints',
        },
        {
            name: 'allow-api-v1',
            pathPattern: '^/api/v1(/.*)?$',
            action: WafActionMode.ALLOW,
            description: 'Allow API v1 endpoints',
        },
    ];
    ```

#### ipSetArn

- **Type**: `string`
- **Default**: `undefined`
- **Description**: ARN of an IP Set for allowlisting
- **Remarks**: Use `createIpSet()` to create the IP Set first
- **Example**:
    ```typescript
    ipSetArn: 'arn:aws:wafv2:us-east-1:123456789012:regional/ipset/office-ips/a1b2c3d4';
    ```

#### logging

- **Type**: `LoggingConfig`
- **Default**: `{ enabled: true, retentionDays: RetentionDays.THREE_MONTHS }`
- **Description**: CloudWatch logging configuration
- **LoggingConfig Properties**:
    - `enabled?: boolean` - Enable logging (default: `true`)
    - `retentionDays?: RetentionDays` - Log retention period (default: `THREE_MONTHS`)
    - `removalPolicy?: RemovalPolicy` - Log group removal policy (default: `DESTROY`)
- **Example**:
    ```typescript
    logging: {
      enabled: true,
      retentionDays: RetentionDays.SIX_MONTHS,
      removalPolicy: RemovalPolicy.RETAIN,
    }
    ```

#### description

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Optional description for the WebACL
- **Example**:
    ```typescript
    description: 'Production WAF for web application';
    ```

## IpSetProps

Configuration for creating an IP Set.

### Required Properties

#### name

- **Type**: `string`
- **Description**: Name of the IP Set
- **Example**: `'office-allowlist'`

#### addresses

- **Type**: `string[]`
- **Description**: IP addresses or CIDR blocks
- **Format**: IPv4 CIDR (e.g., `'192.0.2.0/24'`) or IPv6 CIDR (e.g., `'2001:db8::/32'`)
- **Example**:
    ```typescript
    addresses: ['203.0.113.0/24', '198.51.100.42/32'];
    ```

### Optional Properties

#### ipAddressVersion

- **Type**: `IpAddressVersion`
- **Default**: `IpAddressVersion.IPV4`
- **Values**:
    - `IpAddressVersion.IPV4`
    - `IpAddressVersion.IPV6`
- **Example**:
    ```typescript
    ipAddressVersion: IpAddressVersion.IPV4;
    ```

#### scope

- **Type**: `WebAclScope`
- **Default**: `WebAclScope.REGIONAL`
- **Description**: Must match the scope of WebACLs that reference it
- **Example**:
    ```typescript
    scope: WebAclScope.REGIONAL;
    ```

#### description

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Optional description
- **Example**:
    ```typescript
    description: 'Office IP ranges for allowlisting';
    ```

## WebAclAssociationProps

Configuration for associating a WebACL with a resource.

### Required Properties

#### name

- **Type**: `string`
- **Description**: Name for the association construct
- **Example**: `'alb-waf-association'`

#### webAclArn

- **Type**: `string`
- **Description**: ARN of the WebACL to associate
- **Example**: `'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/my-waf/a1b2c3d4'`

#### resourceArn

- **Type**: `string`
- **Description**: ARN of the resource to protect
- **Supported Resources**:
    - Application Load Balancer: `arn:aws:elasticloadbalancing:*`
    - API Gateway REST API: `arn:aws:apigateway:*`
    - AppSync GraphQL API: `arn:aws:appsync:*`
    - Cognito User Pool: `arn:aws:cognito-idp:*`
    - App Runner Service: `arn:aws:apprunner:*`
    - Verified Access Instance: `arn:aws:ec2:*:verified-access-instance/*`
- **Example**:
    ```typescript
    resourceArn: alb.loadBalancerArn;
    ```

## Enums

### WebAclScope

```typescript
enum WebAclScope {
    REGIONAL = 'REGIONAL', // Regional resources
    CLOUDFRONT = 'CLOUDFRONT', // CloudFront distributions
}
```

### WafActionMode

```typescript
enum WafActionMode {
    COUNT = 'count', // Count matches without blocking
    BLOCK = 'block', // Block matching requests
    ALLOW = 'allow', // Allow matching requests
}
```

### IpAddressVersion

```typescript
enum IpAddressVersion {
    IPV4 = 'IPV4',
    IPV6 = 'IPV6',
}
```

### ManagedRuleGroup

```typescript
enum ManagedRuleGroup {
    COMMON_RULE_SET = 'AWSManagedRulesCommonRuleSet',
    KNOWN_BAD_INPUTS = 'AWSManagedRulesKnownBadInputsRuleSet',
    IP_REPUTATION = 'AWSManagedRulesAmazonIpReputationList',
    ANONYMOUS_IP = 'AWSManagedRulesAnonymousIpList',
    SQLI = 'AWSManagedRulesSQLiRuleSet',
    LINUX = 'AWSManagedRulesLinuxRuleSet',
    UNIX = 'AWSManagedRulesUnixRuleSet',
    WINDOWS = 'AWSManagedRulesWindowsRuleSet',
}
```

## Return Types

### WebAclResources

```typescript
type WebAclResources = {
    webAcl: CfnWebACL; // The created WebACL
    webAclArn: string; // ARN of the WebACL
    webAclId: string; // ID of the WebACL
    logGroup?: LogGroup; // CloudWatch log group (if logging enabled)
};
```

### IpSetResources

```typescript
type IpSetResources = {
    ipSet: CfnIPSet; // The created IP Set
    ipSetArn: string; // ARN of the IP Set
    ipSetId: string; // ID of the IP Set
};
```

### WebAclAssociationResources

```typescript
type WebAclAssociationResources = {
    association: CfnWebACLAssociation; // The association construct
};
```

## AWS Managed Rule Groups

Default enabled rule groups (priority 0-7):

1. **AWSManagedRulesCommonRuleSet** - Core Rule Set (CRS) for common web vulnerabilities
2. **AWSManagedRulesKnownBadInputsRuleSet** - Known malicious input patterns
3. **AWSManagedRulesAmazonIpReputationList** - Amazon threat intelligence
4. **AWSManagedRulesAnonymousIpList** - VPNs, proxies, Tor exit nodes
5. **AWSManagedRulesSQLiRuleSet** - SQL injection attacks
6. **AWSManagedRulesLinuxRuleSet** - Linux-specific exploits
7. **AWSManagedRulesUnixRuleSet** - Unix-specific vulnerabilities
8. **AWSManagedRulesWindowsRuleSet** - Windows-specific exploits

## Country Codes

Common ISO 3166-1 alpha-2 country codes for geo-blocking:

- `US` - United States
- `CA` - Canada
- `GB` - United Kingdom
- `AU` - Australia
- `DE` - Germany
- `FR` - France
- `JP` - Japan
- `RU` - Russia (commonly blocked)
- `CN` - China (commonly blocked)
- `VN` - Vietnam (commonly blocked)
- `IN` - India (commonly blocked)
- `BR` - Brazil (commonly blocked)
- `IR` - Iran (embargoed)
- `KP` - North Korea (embargoed)
- `SY` - Syria (embargoed)
- `CU` - Cuba (embargoed)

[Full list of country codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
