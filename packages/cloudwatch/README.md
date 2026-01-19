# @cdk-constructs/cloudwatch

CloudWatch constructs with alarms, SNS topics, and PagerDuty integration for the CDK Constructs Library.

## Features

- **CloudWatch Alarms** - Create metric-based alarms with configurable thresholds and SNS notifications
- **SNS Topics** - Create SNS topics with subscriptions, filter policies, and FIFO support
- **PagerDuty Integration** - Automatic incident creation/resolution via EventBridge rules

## Installation

```bash
npm install @cdk-constructs/cloudwatch
```

## Usage

### CloudWatch Alarms

Create CloudWatch alarms with SNS notifications:

```typescript
import {createCloudWatchAlarms} from '@cdk-constructs/cloudwatch';
import {ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';
import {Duration} from 'aws-cdk-lib';

const alarms = createCloudWatchAlarms(this, {
    env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
    cloudwatch: {
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
        alarms: [
            {
                alarmName: 'lambda-duration',
                metric: {
                    namespace: 'AWS/Lambda',
                    metricName: 'Duration',
                    statistic: 'Average',
                    period: Duration.minutes(5),
                    dimensionsMap: {FunctionName: 'my-function'},
                },
                threshold: 5000,
                comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluationPeriods: 2,
                description: 'Alert when Lambda duration exceeds 5 seconds',
            },
        ],
    },
});
```

### CloudWatch Alarms with PagerDuty

Create alarms that automatically create PagerDuty incidents:

```typescript
import {createCloudWatchAlarms, createPagerDutyLambda, PagerDutySeverity} from '@cdk-constructs/cloudwatch';
import {ComparisonOperator} from 'aws-cdk-lib/aws-cloudwatch';

// First, create the PagerDuty Lambda handler
const pdResources = createPagerDutyLambda(this, {
    environment: 'prod',
    region: 'us-east-1',
    account: '123456789012',
    secretName: 'my-org/pagerduty-config',
    vpc: {
        vpcId: 'vpc-12345',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
    },
});

// Then create alarms with PagerDuty integration
const alarms = createCloudWatchAlarms(this, {
    env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
    cloudwatch: {
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
        alarms: [
            {
                alarmName: 'api-5xx-errors',
                metric: {
                    namespace: 'AWS/ApiGateway',
                    metricName: '5XXError',
                    statistic: 'Sum',
                    period: Duration.minutes(1),
                    dimensionsMap: {ApiName: 'my-api'},
                },
                threshold: 10,
                comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
                description: 'Critical: API 5XX errors',
                pagerDuty: {
                    optIn: true,
                    serviceKey: 'INFRASTRUCTURE',
                    severity: PagerDutySeverity.CRITICAL,
                    component: 'api-gateway',
                    group: 'production',
                },
            },
        ],
    },
    pagerDutyLambda: {
        lambdaArn: pdResources.function.functionArn,
    },
});
```

### SNS Topics

Create SNS topics with subscriptions:

```typescript
import {createSnsTopics} from '@cdk-constructs/cloudwatch';

const topics = createSnsTopics(this, {
    env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
    sns: {
        topics: [
            {
                topicName: 'critical-alerts',
                displayName: 'Critical Alerts',
                subscriptions: [
                    {
                        id: 'ops-email',
                        protocol: 'email',
                        endpoint: 'ops@example.com',
                    },
                    {
                        id: 'oncall-sms',
                        protocol: 'sms',
                        endpoint: '+1234567890',
                        filterPolicy: {severity: ['critical']},
                    },
                ],
            },
            {
                topicName: 'order-events',
                fifo: true,
                contentBasedDeduplication: true,
            },
        ],
    },
});
```

## PagerDuty Configuration

### Secrets Manager Setup

The PagerDuty Lambda requires a secret in AWS Secrets Manager with the following structure:

```json
{
    "apiToken": "your-pagerduty-api-token",
    "services": {
        "INFRASTRUCTURE": {
            "integrationKey": "your-integration-key",
            "team": "TEAM_ID",
            "service": "SERVICE_ID",
            "escalationPolicy": "ESCALATION_POLICY_ID",
            "defaultPriority": "PRIORITY_ID"
        },
        "APPLICATION": {
            "integrationKey": "another-integration-key",
            "team": "TEAM_ID",
            "service": "SERVICE_ID",
            "escalationPolicy": "ESCALATION_POLICY_ID",
            "defaultPriority": "PRIORITY_ID"
        }
    }
}
```

### Finding PagerDuty IDs

- **Integration Key**: Create a new "Events API v2" integration on your service
- **Team ID**: Settings > Teams > select team > ID in URL
- **Service ID**: Services > select service > ID in URL
- **Escalation Policy ID**: Escalation Policies > select policy > ID in URL
- **Priority ID**: See section below

### Priority IDs (Organization-Specific)

**IMPORTANT:** PagerDuty priority IDs are unique to each organization. You MUST look up your organization's priority IDs using the PagerDuty API.

#### Option 1: Use the PagerDuty API

```bash
curl -X GET 'https://api.pagerduty.com/priorities' \
  -H 'Authorization: Token token=YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

Example response:

```json
{
    "priorities": [
        {"id": "PXYZ123", "name": "P1", "color": "#a8171c"},
        {"id": "PABC456", "name": "P2", "color": "#eb6016"},
        {"id": "PDEF789", "name": "P3", "color": "#f9b406"},
        {"id": "PGHI012", "name": "P4", "color": "#555555"},
        {"id": "PJKL345", "name": "P5", "color": "#555555"}
    ]
}
```

#### Option 2: PagerDuty Web UI

Navigate to: **Settings > Account Settings > Priorities**

#### Creating Your Own Priority Enum

After retrieving your organization's priority IDs, create a custom enum:

```typescript
// my-org-pagerduty.ts
export enum MyOrgPagerDutyPriority {
    P1 = 'PXYZ123', // Your org's P1 ID from API
    P2 = 'PABC456', // Your org's P2 ID from API
    P3 = 'PDEF789', // Your org's P3 ID from API
    P4 = 'PGHI012', // Your org's P4 ID from API
    P5 = 'PJKL345', // Your org's P5 ID from API
}
```

Then use it in your alarm configuration:

```typescript
import { MyOrgPagerDutyPriority } from './my-org-pagerduty';

pagerDuty: {
    optIn: true,
    serviceKey: 'INFRASTRUCTURE',
    severity: PagerDutySeverity.CRITICAL,
    priority: MyOrgPagerDutyPriority.P1,  // Use your org's priority
}
```

### Event Flow

1. CloudWatch alarm transitions to ALARM state
2. EventBridge rule triggers the PagerDuty Lambda
3. Lambda retrieves configuration from Secrets Manager
4. Lambda sends event to PagerDuty Events API v2
5. When alarm returns to OK, incident is automatically resolved

## API Reference

### createCloudWatchAlarms

Creates CloudWatch alarms with SNS notifications and optional PagerDuty integration.

```typescript
function createCloudWatchAlarms(scope: Construct, props: CloudWatchAlarmsProps): Alarm[];
```

### createSnsTopics

Creates SNS topics with subscriptions and templated naming.

```typescript
function createSnsTopics(scope: Construct, props: SnsTopicsProps): Topic[];
```

### createPagerDutyLambda

Creates a Lambda function for processing CloudWatch alarms and sending to PagerDuty.

```typescript
function createPagerDutyLambda(scope: Construct, props: PagerDutyLambdaProps): FunctionResources;
```

## Enums

### PagerDutySeverity

```typescript
enum PagerDutySeverity {
    CRITICAL = 'critical',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
}
```

### PagerDutyPriority

> **Note:** These are placeholder values. You must look up your organization's actual priority IDs
> using the PagerDuty API (`GET https://api.pagerduty.com/priorities`).
> See [Priority IDs (Organization-Specific)](#priority-ids-organization-specific) for details.

```typescript
enum PagerDutyPriority {
    P1 = 'P1', // Replace with your org's P1 priority ID
    P2 = 'P2', // Replace with your org's P2 priority ID
    P3 = 'P3', // Replace with your org's P3 priority ID
    P4 = 'P4', // Replace with your org's P4 priority ID
    P5 = 'P5', // Replace with your org's P5 priority ID
}
```

## Dependencies

- `@cdk-constructs/lambda` - For creating the PagerDuty Lambda function
- `aws-cdk-lib` - AWS CDK core library
- `constructs` - Constructs library

## License

Apache-2.0
