---
name: testing
description: Testing requirements, test structure, and integration testing guidelines. Use when creating tests or setting up test infrastructure.
---

# Testing Requirements

## Test Structure

All packages should have:

- `test/` folder with test files
- `docs/` folder with package documentation

## Test Files

Test files should include:

- Unit tests for constructs
- Example stack implementations
- Integration test examples

### Example Test Structure

```
packages/{package}/test/
├── {package}.test.ts        # Unit tests
└── example-stack.ts          # Example CDK stack implementation
```

## Test Stack Example

```typescript
// packages/{package}/test/example-stack.ts
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createMyResource} from '../src';
import {MyResourceProps} from '../src/types';

export interface ExampleStackProps extends StackProps {
    myResource: MyResourceProps;
}

export class ExampleStack extends Stack {
    constructor(scope: Construct, id: string, props: ExampleStackProps) {
        super(scope, id, props);

        createMyResource(this, props.myResource);
    }
}
```

## Integration Testing

Integration test stacks are located in `bin/app.ts` and `lib/stacks/`. These stacks are used for:

- Long-term testing of constructs
- Validating multi-environment deployments
- Testing real AWS deployments

### Adding Integration Test Stack

1. Create stack class in `lib/stacks/`
2. Add stack configuration to `bin/environment.ts`
3. Import and instantiate in `bin/app.ts`

## Running Tests

```bash
# Run package tests
cd packages/{package}
npm test

# Build and test locally
npm run build:workspaces
npm run synth
```

## Test Requirements

- All constructs must have test coverage
- Example stacks should demonstrate usage
- Tests should validate both success and error cases
- Integration tests should be environment-aware
