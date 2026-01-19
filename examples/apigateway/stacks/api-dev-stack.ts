import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createRegionalRestApi} from '../../../packages/apigateway/src';
import {ConfigResolver} from '../config/config-resolver';
import {LAMBDA_CONFIG} from '../config/api-dev';

/**
 * Development environment API Gateway stack.
 *
 * @remarks
 * This stack creates a Regional REST API with Lambda integration:
 * - Public regional endpoint
 * - API key required for all requests
 * - Node.js Lambda created automatically
 *
 * To configure VPC for Lambda, create `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 * };
 * ```
 *
 * If no VPC config is provided, Lambda runs without VPC attachment.
 */
export class ApiDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const config = ConfigResolver.getDevConfig();
        const {vpcId, privateSubnetIds, vpcEndpointId, ...apiProps} = config;

        // Determine if VPC should be used for Lambda
        const hasVpcConfig = vpcId && privateSubnetIds && privateSubnetIds.length > 0;

        // Create Regional REST API with Lambda integration
        const resources = createRegionalRestApi(this, {
            apiName: apiProps.apiName ?? 'example-api-dev',
            description: apiProps.description,
            requireApiKey: apiProps.requireApiKey ?? true,
            stageName: apiProps.stageName ?? 'dev',
            integration: {
                nodejsLambda: {
                    ...LAMBDA_CONFIG,
                    vpc: {
                        vpcId: vpcId ?? '',
                        privateSubnetIds: privateSubnetIds ?? [],
                    },
                    disableVpc: !hasVpcConfig,
                },
            },
        });

        // Outputs
        new CfnOutput(this, 'ApiUrl', {
            value: resources.api.url,
            description: 'API Gateway URL',
            exportName: 'ApiDevUrl',
        });

        new CfnOutput(this, 'ApiId', {
            value: resources.api.restApiId,
            description: 'API Gateway REST API ID',
            exportName: 'ApiDevId',
        });

        if (resources.apiKey) {
            new CfnOutput(this, 'ApiKeyId', {
                value: resources.apiKey.keyId,
                description: 'API Key ID (use AWS CLI to get value)',
            });
        }

        new CfnOutput(this, 'LambdaFunctionName', {
            value: resources.lambdaFunction.functionName,
            description: 'Lambda function name',
        });

        new CfnOutput(this, 'LambdaFunctionArn', {
            value: resources.lambdaFunction.functionArn,
            description: 'Lambda function ARN',
        });

        if (resources.lambdaResources?.securityGroup) {
            new CfnOutput(this, 'LambdaSecurityGroupId', {
                value: resources.lambdaResources.securityGroup.securityGroupId,
                description: 'Lambda security group ID',
            });
        }

        new CfnOutput(this, 'VpcEnabled', {
            value: hasVpcConfig ? 'true' : 'false',
            description: 'Whether Lambda is VPC-attached',
        });
    }
}
