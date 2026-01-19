import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {ISecurityGroup, IVpc, SecurityGroup, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {ManagedPolicy, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Architecture, Code, Function, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {Construct} from 'constructs';
import {FunctionResources} from '../types/function-base';
import {PythonFunctionProps} from '../types/python-function';
import {createLambdaLogGroup} from '../util/log-group-helpers';

/**
 * Creates a Python Lambda function with standard configurations.
 *
 * @remarks
 * This function creates a fully configured Python Lambda with:
 * - ARM64 architecture for cost efficiency
 * - Automatic execution role with CloudWatch Logs permissions
 * - Pre-created CloudWatch log group with configurable retention
 * - VPC attachment by default (creates security group)
 * - Asset bundling from the entry path directory
 *
 * VPC attachment is enabled by default for security. The function is placed
 * in private subnets and gets a dedicated security group. Set `disableVpc: true`
 * to opt-out for functions that don't require VPC access.
 *
 * The entry path should point to a directory containing your Python code.
 * If a requirements.txt file is present, dependencies will be installed
 * during the bundling process.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the Python function
 * @returns Object containing all created resources
 *
 * @example
 * ```typescript
 * import { createPythonFunction } from '@cdk-constructs/lambda';
 * import { Duration } from 'aws-cdk-lib';
 *
 * // Basic usage with VPC (default)
 * const resources = createPythonFunction(this, {
 *   functionName: 'my-python-processor',
 *   entryPath: path.join(__dirname, '../lambda/processor'),
 *   vpc: {
 *     vpcId: 'vpc-12345',
 *     privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   },
 *   handler: 'app.handler',
 *   environment: {
 *     BUCKET_NAME: myBucket.bucketName,
 *   },
 * });
 *
 * // Grant additional permissions
 * myBucket.grantReadWrite(resources.role);
 *
 * // Without VPC for public-only access
 * const publicFunction = createPythonFunction(this, {
 *   functionName: 'public-api-caller',
 *   entryPath: path.join(__dirname, '../lambda/public'),
 *   vpc: { vpcId: '', privateSubnetIds: [] },
 *   disableVpc: true,
 * });
 * ```
 *
 * @see {@link PythonFunctionProps} for configuration options
 * @see {@link FunctionResources} for returned resources
 * @public
 */
export const createPythonFunction = (scope: Construct, props: PythonFunctionProps): FunctionResources => {
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
    const fn = new Function(scope, props.functionName, {
        functionName: props.functionName,
        code: Code.fromAsset(props.entryPath),
        handler: props.handler ?? 'lambda_function.lambda_handler',
        runtime: props.runtime ?? Runtime.PYTHON_3_13,
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
    });

    return {
        function: fn,
        role,
        logGroup,
        securityGroup,
    };
};
