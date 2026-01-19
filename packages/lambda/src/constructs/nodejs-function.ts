import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {ISecurityGroup, IVpc, SecurityGroup, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {ManagedPolicy, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Architecture, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction, OutputFormat, SourceMapMode} from 'aws-cdk-lib/aws-lambda-nodejs';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {Construct} from 'constructs';
import {FunctionResources} from '../types/function-base';
import {NodejsFunctionProps} from '../types/nodejs-function';
import {createLambdaLogGroup} from '../util/log-group-helpers';

/**
 * Creates a Node.js Lambda function with standard configurations.
 *
 * @remarks
 * This function creates a fully configured Node.js Lambda with:
 * - ARM64 architecture for cost efficiency
 * - Automatic execution role with CloudWatch Logs permissions
 * - Pre-created CloudWatch log group with configurable retention
 * - VPC attachment by default (creates security group)
 * - esbuild bundling with source maps enabled
 * - AWS SDK v3 excluded from bundle (available in runtime)
 *
 * VPC attachment is enabled by default for security. The function is placed
 * in private subnets and gets a dedicated security group. Set `disableVpc: true`
 * to opt-out for functions that don't require VPC access.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the Node.js function
 * @returns Object containing all created resources
 *
 * @example
 * ```typescript
 * import { createNodejsFunction } from '@cdk-constructs/lambda';
 * import { Duration } from 'aws-cdk-lib';
 *
 * // Basic usage with VPC (default)
 * const resources = createNodejsFunction(this, {
 *   functionName: 'my-api-handler',
 *   entryPath: path.join(__dirname, '../lambda/handler/index.ts'),
 *   vpc: {
 *     vpcId: 'vpc-12345',
 *     privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   },
 *   environment: {
 *     TABLE_NAME: myTable.tableName,
 *   },
 * });
 *
 * // Grant additional permissions
 * myTable.grantReadWriteData(resources.role);
 *
 * // Without VPC for public-only access
 * const publicFunction = createNodejsFunction(this, {
 *   functionName: 'public-api-caller',
 *   entryPath: path.join(__dirname, '../lambda/public/index.ts'),
 *   vpc: { vpcId: '', privateSubnetIds: [] },
 *   disableVpc: true,
 * });
 * ```
 *
 * @see {@link NodejsFunctionProps} for configuration options
 * @see {@link FunctionResources} for returned resources
 * @public
 */
export const createNodejsFunction = (scope: Construct, props: NodejsFunctionProps): FunctionResources => {
    // Create execution role
    const role = new Role(scope, `${props.functionName}-role`, {
        roleName: `${props.functionName}-role`,
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });

    // Add VPC execution policy if VPC is enabled
    if (!props.disableVpc) {
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));
    }

    // Add custom policy statements
    if (props.policyStatements) {
        props.policyStatements.forEach(statement => {
            role.addToPolicy(statement);
        });
    }

    // Create log group (INFREQUENT_ACCESS by default for cost savings)
    const logGroup = createLambdaLogGroup(scope, {
        functionName: props.functionName,
        retention: props.logRetention ?? RetentionDays.ONE_WEEK,
        removalPolicy: props.logRemovalPolicy ?? RemovalPolicy.DESTROY,
        logGroupClass: props.logGroupClass,
    });

    // VPC configuration
    let vpcConfig: {vpc: IVpc; securityGroups: ISecurityGroup[]} | undefined;
    let securityGroup: ISecurityGroup | undefined;

    if (!props.disableVpc && props.vpc.vpcId && props.vpc.privateSubnetIds.length > 0) {
        // Generate dummy AZs matching the number of subnets
        const availabilityZones = props.vpc.privateSubnetIds.map((_, i) => `az-${i + 1}`);

        const vpc = Vpc.fromVpcAttributes(scope, `${props.functionName}-vpc`, {
            vpcId: props.vpc.vpcId,
            availabilityZones,
            privateSubnetIds: props.vpc.privateSubnetIds,
        });

        securityGroup = new SecurityGroup(scope, `${props.functionName}-sg`, {
            vpc,
            securityGroupName: `${props.functionName}-sg`,
            description: `Security group for Lambda function ${props.functionName}`,
            allowAllOutbound: true,
        });

        vpcConfig = {
            vpc,
            securityGroups: [securityGroup],
        };
    }

    // Resolve Lambda layers
    const layers = props.layerArns?.map((arn, index) => LayerVersion.fromLayerVersionArn(scope, `${props.functionName}-layer-${index}`, arn));

    // Create the Lambda function
    const fn = new NodejsFunction(scope, props.functionName, {
        functionName: props.functionName,
        entry: props.entryPath,
        handler: props.handler ?? 'handler',
        runtime: Runtime.NODEJS_22_X,
        architecture: Architecture.ARM_64,
        memorySize: props.memorySize ?? 256,
        timeout: props.timeout ?? Duration.seconds(30),
        role,
        environment: props.environment,
        layers,
        logGroup,
        ...(vpcConfig
            ? {
                  vpc: vpcConfig.vpc,
                  vpcSubnets: {subnetType: SubnetType.PRIVATE_WITH_EGRESS},
                  securityGroups: vpcConfig.securityGroups,
              }
            : {}),
        bundling: {
            minify: true,
            sourceMap: props.sourceMap !== false,
            sourceMapMode: props.sourceMap !== false ? SourceMapMode.INLINE : undefined,
            sourcesContent: false,
            format: OutputFormat.CJS,
            externalModules: props.externalModules ?? ['@aws-sdk/*'],
            target: 'node22',
            forceDockerBundling: false,
        },
    });

    return {
        function: fn,
        role,
        logGroup,
        securityGroup,
    };
};
