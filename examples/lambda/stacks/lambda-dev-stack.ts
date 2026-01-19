import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createNodejsFunction, createPythonFunction} from '../../../packages/lambda/src';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Development environment Lambda stack.
 *
 * @remarks
 * This stack creates both Node.js and Python Lambda functions for development:
 * - Node.js Lambda with esbuild bundling
 * - Python Lambda with pip dependencies
 * - VPC attachment (if VPC config provided)
 * - Short log retention for cost savings
 *
 * To configure VPC, create `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   vpcId: 'vpc-12345',
 *   privateSubnetIds: ['subnet-1', 'subnet-2'],
 * };
 * ```
 *
 * Or set `disableVpc: true` in lambda-dev.ts to run without VPC.
 */
export class LambdaDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create Node.js Lambda
        const nodejsResources = this.createNodejsLambda();

        // Create Python Lambda
        const pythonResources = this.createPythonLambda();

        // Node.js Lambda Outputs
        new CfnOutput(this, 'NodejsFunctionName', {
            value: nodejsResources.function.functionName,
            description: 'Node.js Lambda function name',
        });

        new CfnOutput(this, 'NodejsFunctionArn', {
            value: nodejsResources.function.functionArn,
            description: 'Node.js Lambda function ARN',
        });

        new CfnOutput(this, 'NodejsLogGroupName', {
            value: nodejsResources.logGroup.logGroupName,
            description: 'CloudWatch Log Group for Node.js Lambda',
        });

        // Python Lambda Outputs
        new CfnOutput(this, 'PythonFunctionName', {
            value: pythonResources.function.functionName,
            description: 'Python Lambda function name',
        });

        new CfnOutput(this, 'PythonFunctionArn', {
            value: pythonResources.function.functionArn,
            description: 'Python Lambda function ARN',
        });

        new CfnOutput(this, 'PythonLogGroupName', {
            value: pythonResources.logGroup.logGroupName,
            description: 'CloudWatch Log Group for Python Lambda',
        });
    }

    private createNodejsLambda() {
        const config = ConfigResolver.getNodejsDevConfig();
        const {vpcId, privateSubnetIds, ...lambdaProps} = config;
        const hasVpcConfig = vpcId && privateSubnetIds && privateSubnetIds.length > 0;

        return createNodejsFunction(this, {
            ...lambdaProps,
            functionName: lambdaProps.functionName ?? 'example-nodejs-lambda-dev',
            entryPath: lambdaProps.entryPath!,
            vpc: {
                vpcId: vpcId ?? '',
                privateSubnetIds: privateSubnetIds ?? [],
            },
            disableVpc: !hasVpcConfig,
        });
    }

    private createPythonLambda() {
        const config = ConfigResolver.getPythonDevConfig();
        const {vpcId, privateSubnetIds, ...lambdaProps} = config;
        const hasVpcConfig = vpcId && privateSubnetIds && privateSubnetIds.length > 0;

        return createPythonFunction(this, {
            ...lambdaProps,
            functionName: lambdaProps.functionName ?? 'example-python-lambda-dev',
            entryPath: lambdaProps.entryPath!,
            vpc: {
                vpcId: vpcId ?? '',
                privateSubnetIds: privateSubnetIds ?? [],
            },
            disableVpc: !hasVpcConfig,
        });
    }
}
