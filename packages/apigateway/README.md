# @cdk-constructs/apigateway

REST API Gateway constructs with Lambda integration for AWS CDK.

## Installation

```bash
npm install @cdk-constructs/apigateway @cdk-constructs/lambda
```

## Features

- **Private REST APIs**: VPC-isolated APIs accessible only through VPC endpoints
- **Regional REST APIs**: Public APIs with regional endpoint type
- **Lambda Integration**: Automatic Node.js or Python Lambda creation and attachment
- **API Keys**: Built-in API key and usage plan management
- **CORS Support**: Pre-configured CORS preflight options
- **VPC Endpoints**: Easy creation of API Gateway VPC endpoints

## Quick Start

### Private REST API

For internal APIs that should only be accessible from within a VPC:

```typescript
import {createPrivateRestApi, createApiGatewayVpcEndpoint} from '@cdk-constructs/apigateway';
import * as path from 'path';

// Create VPC endpoint first
const endpointResources = createApiGatewayVpcEndpoint(this, {
    endpointName: 'apigw-endpoint',
    vpcId: 'vpc-12345',
    subnetIds: ['subnet-1', 'subnet-2'],
    allowedCidrBlocks: ['10.0.0.0/16'],
});

// Create private REST API
const resources = createPrivateRestApi(this, {
    apiName: 'internal-api',
    vpcEndpointId: endpointResources.endpointId,
    integration: {
        nodejsLambda: {
            functionName: 'internal-handler',
            entryPath: path.join(__dirname, '../lambda/handler.ts'),
            vpc: {
                vpcId: 'vpc-12345',
                privateSubnetIds: ['subnet-1', 'subnet-2'],
            },
        },
    },
    requireApiKey: true,
    apiKeyParameterPath: '/api/internal/key',
});
```

### Regional REST API

For public APIs accessible from the internet:

```typescript
import {createRegionalRestApi} from '@cdk-constructs/apigateway';
import * as path from 'path';

const resources = createRegionalRestApi(this, {
    apiName: 'public-api',
    integration: {
        nodejsLambda: {
            functionName: 'public-handler',
            entryPath: path.join(__dirname, '../lambda/handler.ts'),
            vpc: {vpcId: '', privateSubnetIds: []},
            disableVpc: true,
        },
    },
    requireApiKey: true,
});

// Access API URL
console.log('API URL:', resources.api.url);
```

### Using Existing Lambda Function

```typescript
import {createRegionalRestApi} from '@cdk-constructs/apigateway';

const resources = createRegionalRestApi(this, {
    apiName: 'api-with-existing-lambda',
    integration: {
        existingFunction: myExistingLambda,
    },
});
```

### With Custom Domain

```typescript
import {createRegionalRestApi} from '@cdk-constructs/apigateway';

const resources = createRegionalRestApi(this, {
    apiName: 'api-v2',
    integration: {
        nodejsLambda: {
            functionName: 'v2-handler',
            entryPath: path.join(__dirname, '../lambda/handler.ts'),
            vpc: {vpcId: '', privateSubnetIds: []},
            disableVpc: true,
        },
    },
    domainNameArn: 'arn:aws:apigateway:us-east-1::/domainnames/api.example.com',
    basePath: 'v2',
});
```

## Configuration Options

### Base REST API Properties

| Property              | Type                      | Default  | Description                     |
| --------------------- | ------------------------- | -------- | ------------------------------- |
| `apiName`             | `string`                  | Required | API name (used as construct ID) |
| `description`         | `string`                  | -        | API description                 |
| `integration`         | `LambdaIntegrationConfig` | Required | Lambda integration config       |
| `requireApiKey`       | `boolean`                 | `true`   | Require API key for requests    |
| `apiKeyParameterPath` | `string`                  | -        | SSM path for API key storage    |
| `stageName`           | `string`                  | `'prod'` | Deployment stage name           |

### Private REST API Properties

| Property        | Type     | Default  | Description                        |
| --------------- | -------- | -------- | ---------------------------------- |
| `vpcEndpointId` | `string` | Required | VPC endpoint ID for private access |

### Regional REST API Properties

| Property        | Type     | Default | Description                               |
| --------------- | -------- | ------- | ----------------------------------------- |
| `domainNameArn` | `string` | -       | Custom domain ARN for base path mapping   |
| `basePath`      | `string` | -       | Base path for domain mapping (e.g., 'v1') |

### Lambda Integration Config

Exactly one of these must be provided:

| Property           | Type                  | Description           |
| ------------------ | --------------------- | --------------------- |
| `nodejsLambda`     | `NodejsFunctionProps` | Create Node.js Lambda |
| `pythonLambda`     | `PythonFunctionProps` | Create Python Lambda  |
| `existingFunction` | `IFunction`           | Use existing Lambda   |

Additional options:

| Property             | Type       | Default | Description                             |
| -------------------- | ---------- | ------- | --------------------------------------- |
| `integrationTimeout` | `Duration` | `29s`   | Integration timeout (max 29s for APIGW) |

### VPC Endpoint Properties

| Property            | Type       | Default  | Description                       |
| ------------------- | ---------- | -------- | --------------------------------- |
| `endpointName`      | `string`   | Required | Endpoint name (construct ID)      |
| `vpcId`             | `string`   | Required | VPC ID                            |
| `subnetIds`         | `string[]` | Required | Subnet IDs for endpoint placement |
| `allowedCidrBlocks` | `string[]` | Required | CIDR blocks allowed HTTPS access  |

## Returned Resources

### RestApiResources

```typescript
type RestApiResources = {
    api: RestApi; // REST API construct
    apiKey?: ApiKey; // API key (when requireApiKey is true)
    usagePlan?: UsagePlan; // Usage plan (when requireApiKey is true)
    lambdaFunction: IFunction; // Integrated Lambda function
    lambdaResources?: FunctionResources; // Created Lambda resources
};
```

### VpcEndpointResources

```typescript
type VpcEndpointResources = {
    endpoint: IInterfaceVpcEndpoint; // VPC endpoint
    securityGroup: ISecurityGroup; // Endpoint security group
    endpointId: string; // Endpoint ID for private APIs
};
```

## Accessing Your APIs

### Private REST API Access

Private APIs are only accessible from within your VPC through a VPC endpoint. They cannot be reached from the public internet.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                           Your VPC                               │
│  ┌──────────────┐      ┌─────────────────┐      ┌─────────────┐ │
│  │ EC2/ECS/EKS  │─────▶│  VPC Endpoint   │─────▶│ API Gateway │ │
│  │   Client     │      │ (vpce-xxxxxxxx) │      │  (Private)  │ │
│  └──────────────┘      └─────────────────┘      └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Invoke URL Format

Private APIs use a special URL format that includes the VPC endpoint ID:

```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
```

**Note:** This URL only resolves when called from within the VPC through the VPC endpoint.

#### Calling from Within VPC

From an EC2 instance, ECS task, or Lambda within the VPC:

```bash
# Using curl with API key
curl -H "x-api-key: YOUR_API_KEY" \
  https://abc123def.execute-api.us-east-1.amazonaws.com/prod/

# Using the VPC endpoint DNS (alternative)
curl -H "x-api-key: YOUR_API_KEY" \
  -H "Host: abc123def.execute-api.us-east-1.amazonaws.com" \
  https://vpce-0123456789abcdef0-abcd1234.execute-api.us-east-1.vpce.amazonaws.com/prod/
```

#### TypeScript/Node.js Client Example

```typescript
import https from 'https';

const apiId = 'abc123def';
const region = 'us-east-1';
const stage = 'prod';
const apiKey = process.env.API_KEY;

const options = {
    hostname: `${apiId}.execute-api.${region}.amazonaws.com`,
    path: `/${stage}/`,
    method: 'GET',
    headers: {
        'x-api-key': apiKey,
    },
};

const req = https.request(options, res => {
    // Handle response
});
```

#### Retrieving the API Key

If you stored the API key in SSM Parameter Store:

```bash
# AWS CLI
aws ssm get-parameter --name "/api/internal/key" --with-decryption --query "Parameter.Value" --output text

# In your application (Node.js)
import {SSMClient, GetParameterCommand} from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});
const response = await ssm.send(
    new GetParameterCommand({
        Name: '/api/internal/key',
        WithDecryption: true,
    })
);
const apiKey = response.Parameter?.Value;
```

---

### Regional REST API Access

Regional APIs are publicly accessible from the internet. They can be accessed directly via the API Gateway URL or through a custom domain.

#### How It Works

```
┌──────────────┐                              ┌─────────────┐
│   Internet   │────────────────────────────▶│ API Gateway │
│    Client    │                              │  (Regional) │
└──────────────┘                              └─────────────┘

         OR (with custom domain)

┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Internet   │─────▶│   Route 53   │─────▶│ API Gateway │
│    Client    │      │ Custom Domain│      │  (Regional) │
└──────────────┘      └──────────────┘      └─────────────┘
```

#### Default Invoke URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
```

Example:

```bash
# Using curl with API key
curl -H "x-api-key: YOUR_API_KEY" \
  https://xyz789abc.execute-api.us-east-1.amazonaws.com/prod/

# POST request with JSON body
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}' \
  https://xyz789abc.execute-api.us-east-1.amazonaws.com/prod/items
```

#### With Custom Domain

When you configure a custom domain with base path mapping, your API is accessible at:

```
https://api.example.com/{basePath}
```

Example with `basePath: 'v2'`:

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  https://api.example.com/v2/

# Multiple API versions on the same domain
curl https://api.example.com/v1/  # Version 1
curl https://api.example.com/v2/  # Version 2
```

#### Setting Up Custom Domain (Prerequisites)

1. **ACM Certificate**: Create/import an SSL certificate in ACM
2. **Route 53 Hosted Zone**: Domain must be managed in Route 53 (or configure external DNS)
3. **API Gateway Domain Name**: Create via console or CDK

```typescript
import {DomainName, EndpointType} from 'aws-cdk-lib/aws-apigateway';
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager';

// Create custom domain
const domainName = new DomainName(this, 'CustomDomain', {
    domainName: 'api.example.com',
    certificate: Certificate.fromCertificateArn(this, 'Cert', 'arn:aws:acm:...'),
    endpointType: EndpointType.REGIONAL,
});

// Use with createRegionalRestApi
const resources = createRegionalRestApi(this, {
    apiName: 'my-api',
    integration: {...},
    domainNameArn: domainName.domainNameArn,
    basePath: 'v1',
});

// Create Route 53 alias record
new ARecord(this, 'ApiAliasRecord', {
    zone: hostedZone,
    recordName: 'api',
    target: RecordTarget.fromAlias(new ApiGatewayDomain(domainName)),
});
```

#### TypeScript/Node.js Client Example

```typescript
// Using fetch (Node.js 18+)
const response = await fetch('https://api.example.com/v1/items', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY!,
    },
    body: JSON.stringify({name: 'item1'}),
});

const data = await response.json();
```

---

### Comparison: Private vs Regional

| Aspect             | Private REST API                     | Regional REST API               |
| ------------------ | ------------------------------------ | ------------------------------- |
| **Accessibility**  | VPC only (via VPC endpoint)          | Public internet                 |
| **URL Format**     | `{api-id}.execute-api.{region}...`   | Same, or custom domain          |
| **Security**       | Network isolation + API key          | WAF + API key + authorizers     |
| **Use Cases**      | Internal microservices, backend APIs | Public APIs, mobile/web clients |
| **Custom Domain**  | Not supported                        | Supported                       |
| **DNS Resolution** | Requires VPC endpoint                | Public DNS                      |

---

## Security Considerations

### Private APIs

- Only accessible from within the VPC through the VPC endpoint
- Resource policy restricts access to the specified VPC endpoint
- Use for internal microservices communication
- No exposure to public internet attack surface

### Regional APIs

- Accessible from the public internet
- Protect with WAF (use `@cdk-constructs/waf`)
- Always enable API keys for production
- Consider adding custom authorizers (Cognito, Lambda)
- Use custom domains with HTTPS certificates
- Implement rate limiting via usage plans

## License

Apache-2.0
