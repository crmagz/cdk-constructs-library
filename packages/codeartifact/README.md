# @cdk-constructs/codeartifact

CodeArtifact domain and repository constructs for CDK Constructs Library.

## Overview

This package provides CDK constructs for creating and managing AWS CodeArtifact domains and repositories. CodeArtifact is a fully managed artifact repository service that makes it easy for organizations to securely store, publish, and share software packages.

## Installation

```bash
npm install @cdk-constructs/codeartifact --save-exact
```

## Usage

### Basic Usage

```typescript
import {Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createCodeArtifact} from '@cdk-constructs/codeartifact';

export class MyStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        createCodeArtifact(this, 'MyCodeArtifact', {
            codeArtifactDomainName: 'my-domain',
            codeArtifactRepositoryName: 'my-repository',
            codeArtifactRepositoryDescription: 'My npm package repository',
        });
    }
}
```

### With Account Restrictions

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

### Creating a Publish Role

```typescript
import {createCdkPublishRole} from '@cdk-constructs/codeartifact';
import {Account} from '@cdk-constructs/aws';

const publishRole = createCdkPublishRole(this, 'GitHubActionsPublishRole', Account.PROD);
```

## API Reference

### Functions

- `createCodeArtifact` - Creates a CodeArtifact domain and repository
- `createCodeArtifactDomain` - Creates a CodeArtifact domain
- `createCodeArtifactRepository` - Creates a CodeArtifact repository
- `createCdkPublishRole` - Creates an IAM role for publishing packages

### Types

- `CodeArtifactStackProps` - Properties for creating CodeArtifact resources
- `CodeArtifactDomainProps` - Properties for creating a domain
- `CodeArtifactRepositoryProps` - Properties for creating a repository

## Requirements

- Node.js >= 24.x
- AWS CDK >= 2.225.0

## License

[Add your license here]
