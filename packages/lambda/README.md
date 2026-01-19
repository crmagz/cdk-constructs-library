# @cdk-constructs/lambda

Lambda function constructs with Node.js and Python support for AWS CDK.

## Installation

```bash
npm install @cdk-constructs/lambda
```

## Features

- **Node.js Functions**: TypeScript/JavaScript Lambda functions with esbuild bundling
- **Python Functions**: Python Lambda functions with asset bundling
- **ARM64 Architecture**: Cost-efficient Graviton2 processors by default
- **VPC Support**: VPC attachment enabled by default for security
- **Auto Log Groups**: Pre-created CloudWatch log groups with configurable retention
- **IAM Roles**: Automatic execution role creation with appropriate permissions

## Quick Start

### Node.js Function

```typescript
import {createNodejsFunction} from '@cdk-constructs/lambda';
import {Duration} from 'aws-cdk-lib';
import * as path from 'path';

const resources = createNodejsFunction(this, {
    functionName: 'my-api-handler',
    entryPath: path.join(__dirname, '../lambda/handler/index.ts'),
    vpc: {
        vpcId: 'vpc-12345',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
    },
    memorySize: 512,
    timeout: Duration.seconds(30),
    environment: {
        TABLE_NAME: myTable.tableName,
    },
});

// Grant additional permissions
myTable.grantReadWriteData(resources.role);
```

### Python Function

```typescript
import {createPythonFunction} from '@cdk-constructs/lambda';
import {Duration} from 'aws-cdk-lib';
import * as path from 'path';

const resources = createPythonFunction(this, {
    functionName: 'my-python-processor',
    entryPath: path.join(__dirname, '../lambda/processor'),
    vpc: {
        vpcId: 'vpc-12345',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
    },
    handler: 'app.handler',
    environment: {
        BUCKET_NAME: myBucket.bucketName,
    },
});

// Grant additional permissions
myBucket.grantReadWrite(resources.role);
```

### Without VPC

For functions that only access public APIs or AWS services via public endpoints:

```typescript
const resources = createNodejsFunction(this, {
    functionName: 'public-api-caller',
    entryPath: path.join(__dirname, '../lambda/public/index.ts'),
    vpc: {vpcId: '', privateSubnetIds: []},
    disableVpc: true,
});
```

## Configuration Options

### Base Properties (All Functions)

| Property           | Type                     | Default    | Description                          |
| ------------------ | ------------------------ | ---------- | ------------------------------------ |
| `functionName`     | `string`                 | Required   | Function name (used as construct ID) |
| `entryPath`        | `string`                 | Required   | Absolute path to Lambda entry file   |
| `vpc`              | `VpcConfig`              | Required   | VPC configuration                    |
| `disableVpc`       | `boolean`                | `false`    | Disable VPC attachment               |
| `memorySize`       | `number`                 | `256`      | Memory size in MB                    |
| `timeout`          | `Duration`               | `30s`      | Execution timeout                    |
| `environment`      | `Record<string, string>` | -          | Environment variables                |
| `policyStatements` | `PolicyStatement[]`      | -          | Additional IAM permissions           |
| `layerArns`        | `string[]`               | -          | Lambda layer ARNs                    |
| `logRetention`     | `RetentionDays`          | `ONE_WEEK` | Log retention period                 |
| `logRemovalPolicy` | `RemovalPolicy`          | `DESTROY`  | Log group removal policy             |

### Node.js Properties

| Property          | Type       | Default          | Description                    |
| ----------------- | ---------- | ---------------- | ------------------------------ |
| `externalModules` | `string[]` | `['@aws-sdk/*']` | Modules excluded from bundling |
| `handler`         | `string`   | `'handler'`      | Handler export name            |
| `sourceMap`       | `boolean`  | `true`           | Enable source maps             |

### Python Properties

| Property  | Type      | Default                            | Description            |
| --------- | --------- | ---------------------------------- | ---------------------- |
| `handler` | `string`  | `'lambda_function.lambda_handler'` | Handler path           |
| `runtime` | `Runtime` | `PYTHON_3_13`                      | Python runtime version |

## Returned Resources

Both construct functions return a `FunctionResources` object:

```typescript
type FunctionResources = {
    function: IFunction; // Lambda function
    role: IRole; // Execution role
    logGroup: ILogGroup; // CloudWatch log group
    securityGroup?: ISecurityGroup; // VPC security group (when VPC enabled)
};
```

## VPC Considerations

VPC attachment is enabled by default for security. When enabled:

- Lambda uses Elastic Network Interfaces (ENIs) with 10-30 second cold start overhead
- A dedicated security group is created with all outbound traffic allowed
- Functions can access VPC resources (RDS, ElastiCache, etc.)

Set `disableVpc: true` for functions that:

- Only call public APIs
- Use AWS services via public endpoints
- Don't require VPC resource access

## License

Apache-2.0
