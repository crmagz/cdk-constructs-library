# CDK Constructs Library

A comprehensive AWS Cloud Development Kit (CDK) library providing infrastructure-as-code constructs and utilities for AWS applications.

## Overview

This is a **monorepo managed with npm workspaces** that provides a collection of reusable AWS CDK constructs, utilities, and configuration patterns. The project simplifies the creation, deployment, and management of AWS infrastructure across multiple environments.

### Architecture Strategy

**Go-Forward Strategy:** We are actively migrating constructs from the root package into dedicated subpackages for better modularity, maintainability, and versioning control. This allows teams to adopt and update individual components independently.

## Packages

This monorepo contains the following packages:

### Core Package

| Package                  | Version | Description                                                           |
| ------------------------ | ------- | --------------------------------------------------------------------- |
| [@cdk-constructs/cdk](.) | 0.1.0   | Root package with core utilities, types, enums, and legacy constructs |

### Subpackages

| Package                                             | Version | Description                                              | Documentation |
| --------------------------------------------------- | ------- | -------------------------------------------------------- | ------------- |
| [@cdk-constructs/api-gateway](packages/api-gateway) | TBD     | Private and Regional API Gateway with Lambda integration | TBD           |
| [@cdk-constructs/aurora](packages/aurora)           | TBD     | Aurora PostgreSQL and MySQL cluster constructs           | TBD           |
| [@cdk-constructs/cloudwatch](packages/cloudwatch)   | TBD     | CloudWatch log groups and monitoring                     | TBD           |
| [@cdk-constructs/eks](packages/eks)                 | TBD     | EKS cluster utilities and VPC constants                  | TBD           |
| [@cdk-constructs/waf](packages/waf)                 | TBD     | Web Application Firewall configurations                  | TBD           |

## Dependency Resolution

Each subpackage has a peer dependency on the root package:

```
@cdk-constructs/cdk (root)
├── @cdk-constructs/api-gateway (depends on: cdk@*)
├── @cdk-constructs/aurora (depends on: cdk@*)
├── @cdk-constructs/cloudwatch (depends on: cdk@*, api-gateway@*)
├── @cdk-constructs/eks (depends on: cdk@*)
└── @cdk-constructs/waf (depends on: cdk@*)
```

**Note:** `@cdk-constructs/cloudwatch` has dependencies on both `cdk` and `api-gateway` for PagerDuty and ServiceDesk Plus Lambda integrations.

### Root Package Constructs

The following constructs remain in the root package and will be migrated to subpackages in future releases:

- **Database Migration**: DMS replication instances and tasks
- **Search & Analytics**: OpenSearch domain creation
- **Caching**: Redis ElastiCache cluster creation
- **Content Delivery**: CloudFront + S3 distributions
- **Streaming**: Kinesis data streams

## Installation

### Prerequisites

- Node.js >= 24.x
- npm >= 10.x
- AWS CDK 2.225.0

### Installing Packages

```bash
# Install root package
npm install @cdk-constructs/cdk --save-exact

# Install subpackages as needed
npm install @cdk-constructs/api-gateway --save-exact
npm install @cdk-constructs/aurora --save-exact
npm install @cdk-constructs/cloudwatch --save-exact
npm install @cdk-constructs/eks --save-exact
npm install @cdk-constructs/waf --save-exact
```

## Development

### Workspace Setup

```bash
# Clone the repository
git clone <repository-url>
cd cdk-constructs-library

# Install dependencies (workspace symlinks created automatically)
npm install

# Build all packages
npm run build
```

### Workspace Structure

```
cdk-constructs-library/
├── package.json              # Root package with workspace configuration
├── packages/
│   ├── api-gateway/         # API Gateway & Lambda constructs
│   ├── aurora/              # Aurora database constructs
│   ├── cloudwatch/          # CloudWatch monitoring
│   ├── eks/                 # EKS utilities
│   └── waf/                 # WAF configurations
├── src/                     # Root package source
├── docs/                    # Documentation
└── scripts/                 # Build and test scripts
```

## Key Features

- **Monorepo Architecture**: Organized workspace structure with npm workspaces
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Modular Design**: Independent subpackages with clear dependency boundaries
- **Reusable Constructs**: Battle-tested constructs for common AWS services
- **Independent Versioning**: Subpackages can be versioned and published independently
- **No Circular Dependencies**: Carefully structured to prevent dependency loops

## Requirements

- **Node.js**: >= 24.x
- **AWS CDK**: 2.225.0
- **TypeScript**: >= 5.x
- **AWS CLI**: Configured with appropriate credentials

## Project Plan

For detailed information about the project structure, migration strategy, and architecture, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

## License

[Add your license here]
