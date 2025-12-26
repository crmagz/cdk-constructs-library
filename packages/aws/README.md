# @cdk-constructs/aws

AWS account, region, and environment enumerations for CDK Constructs Library.

## Overview

This package provides standardized enums for AWS accounts, regions, and environments, making it easier to manage multi-account and multi-region deployments with consistent naming and type safety.

## Installation

```bash
npm install @cdk-constructs/aws --save-exact
```

## Usage

### Account Enum

```typescript
import {Account} from '@cdk-constructs/aws';

// Use in CDK stack
const accountId = Account.PROD;
```

### Region Enum

```typescript
import {Region} from '@cdk-constructs/aws';

// Use in CDK stack
const region = Region.US_EAST_1;
```

### Environment Enum

```typescript
import {Environment} from '@cdk-constructs/aws';

// Use in CDK stack
const env = Environment.PROD;
```

## Enums

### Account

- `PROD` - Production account ID
- `NONPROD` - Non-production account ID

### Region

- `US_EAST_1` - US East (N. Virginia)
- `US_EAST_2` - US East (Ohio)
- `US_WEST_1` - US West (N. California)
- `US_WEST_2` - US West (Oregon)

### Environment

- `BUILD` - Build/CI environment
- `DEV` - Development environment
- `STAGING` - Staging environment
- `PROD` - Production environment

## Requirements

- Node.js >= 24.x
- AWS CDK >= 2.225.0

## License

[Add your license here]
