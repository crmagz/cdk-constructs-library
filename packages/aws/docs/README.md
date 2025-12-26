# AWS Package Documentation

## Overview

The `@cdk-constructs/aws` package provides standardized enumerations for AWS accounts, regions, and environments. These enums ensure type safety and consistency across CDK deployments.

## Enums

### Account

The `Account` enum provides AWS account IDs for different account types.

**Values:**

- `PROD` - Production account ID: `260320203318`
- `NONPROD` - Non-production account ID: `778359441486`

**Usage:**

```typescript
import {Account} from '@cdk-constructs/aws';

const stack = new Stack(app, 'MyStack', {
    env: {
        account: Account.PROD,
        region: 'us-east-1',
    },
});
```

### Region

The `Region` enum provides AWS region identifiers.

**Values:**

- `US_EAST_1` - US East (N. Virginia): `us-east-1`
- `US_EAST_2` - US East (Ohio): `us-east-2`
- `US_WEST_1` - US West (N. California): `us-west-1`
- `US_WEST_2` - US West (Oregon): `us-west-2`

**Usage:**

```typescript
import {Region} from '@cdk-constructs/aws';

const stack = new Stack(app, 'MyStack', {
    env: {
        account: '123456789012',
        region: Region.US_EAST_1,
    },
});
```

### Environment

The `Environment` enum provides deployment environment identifiers.

**Values:**

- `BUILD` - Build/CI environment: `build`
- `DEV` - Development environment: `dev`
- `STAGING` - Staging environment: `staging`
- `PROD` - Production environment: `prod`

**Usage:**

```typescript
import {Environment} from '@cdk-constructs/aws';

function createStack(env: Environment) {
    if (env === Environment.PROD) {
        // Production-specific configuration
    }
}
```

## Best Practices

1. **Always use enums instead of string literals** - This provides type safety and prevents typos
2. **Use environment enums for conditional logic** - Makes code more readable and maintainable
3. **Combine enums for stack configuration** - Use Account, Region, and Environment together for complete stack configuration

## Examples

See the `test/` directory for complete examples of using these enums in CDK stacks.
