# CodeArtifact Package Documentation

## Overview

The `@cdk-constructs/codeartifact` package provides CDK constructs for creating and managing AWS CodeArtifact domains and repositories. CodeArtifact is a fully managed artifact repository service that makes it easy for organizations to securely store, publish, and share software packages.

## Key Features

- **Domain Management**: Create and configure CodeArtifact domains
- **Repository Management**: Create and configure CodeArtifact repositories
- **Access Control**: Configure account-based access restrictions
- **IAM Roles**: Create IAM roles for CI/CD pipeline publishing
- **Tagging**: Support for resource tagging

## Constructs

### createCodeArtifact

Creates a complete CodeArtifact setup including both domain and repository.

**Parameters:**

- `scope` - The parent construct
- `id` - A unique identifier for the construct
- `props` - CodeArtifact configuration properties

**Example:**

```typescript
import {createCodeArtifact} from '@cdk-constructs/codeartifact';

createCodeArtifact(this, 'MyCodeArtifact', {
    codeArtifactDomainName: 'my-domain',
    codeArtifactRepositoryName: 'my-repository',
    codeArtifactRepositoryDescription: 'My npm package repository',
    allowedAccounts: [Account.PROD, Account.NONPROD],
});
```

### createCodeArtifactDomain

Creates a CodeArtifact domain.

**Parameters:**

- `scope` - The parent construct
- `id` - A unique identifier for the construct
- `props` - Domain configuration properties

### createCodeArtifactRepository

Creates a CodeArtifact repository within a domain.

**Parameters:**

- `scope` - The parent construct
- `domain` - The CodeArtifact domain
- `props` - Repository configuration properties

### createCdkPublishRole

Creates an IAM role for publishing packages to CodeArtifact from CI/CD pipelines.

**Parameters:**

- `scope` - The parent construct
- `roleName` - The name of the IAM role
- `accountId` - The AWS account ID that can assume this role

**Example:**

```typescript
import {createCdkPublishRole} from '@cdk-constructs/codeartifact';
import {Account} from '@cdk-constructs/aws';

const publishRole = createCdkPublishRole(this, 'GitHubActionsPublishRole', Account.PROD);
```

## Types

### CodeArtifactStackProps

Properties for creating CodeArtifact resources.

```typescript
interface CodeArtifactStackProps {
    codeArtifactDomainName: string;
    codeArtifactRepositoryName: string;
    codeArtifactRepositoryDescription: string;
    codeArtifactTags?: CfnTag[];
    allowedAccounts?: string[];
}
```

### CodeArtifactDomainProps

Properties for creating a CodeArtifact domain.

```typescript
interface CodeArtifactDomainProps {
    domainName: string;
    tags?: CfnTag[];
    allowedAccounts?: string[];
}
```

### CodeArtifactRepositoryProps

Properties for creating a CodeArtifact repository.

```typescript
interface CodeArtifactRepositoryProps {
    repositoryName: string;
    repositoryDescription: string;
    domainName: string;
    tags?: CfnTag[];
    allowedAccounts?: string[];
}
```

## Best Practices

1. **Use Account Enums**: Use `@cdk-constructs/aws` Account enum for account IDs
2. **Restrict Access**: Always specify `allowedAccounts` for production environments
3. **Tag Resources**: Use tags for resource organization and cost tracking
4. **Separate Domains**: Use separate domains for different teams or projects
5. **Publish Roles**: Create dedicated IAM roles for CI/CD pipelines

## Examples

See the `test/` directory for complete examples of using CodeArtifact constructs in CDK stacks.

## Integration with AWS Package

This package integrates with `@cdk-constructs/aws` for account management:

```typescript
import {Account} from '@cdk-constructs/aws';
import {createCodeArtifact} from '@cdk-constructs/codeartifact';

createCodeArtifact(this, 'MyCodeArtifact', {
    codeArtifactDomainName: 'my-domain',
    codeArtifactRepositoryName: 'my-repository',
    codeArtifactRepositoryDescription: 'My npm package repository',
    allowedAccounts: [Account.PROD, Account.NONPROD],
});
```
