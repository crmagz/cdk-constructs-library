import {InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, IVpcEndpoint, Peer, Port, SecurityGroup, SubnetSelection, Vpc} from 'aws-cdk-lib/aws-ec2';
import {Construct} from 'constructs';
import type {VpcEndpointProps, VpcEndpointResources} from '../types/vpc-endpoint';

/**
 * Creates a VPC endpoint for API Gateway.
 *
 * @remarks
 * Creates an Interface VPC Endpoint for the execute-api service, which is
 * required for private REST APIs to be accessible from within a VPC. Features include:
 * - Interface endpoint for execute-api service
 * - Security group with HTTPS ingress from specified CIDR blocks
 * - Automatic placement in VPC private subnets via VPC lookup
 *
 * The endpoint allows resources within the VPC to invoke private REST APIs
 * without traversing the public internet.
 *
 * @param scope - The construct scope
 * @param props - Configuration properties for the VPC endpoint
 * @returns Object containing the endpoint and security group
 *
 * @example
 * ```typescript
 * import { createApiGatewayVpcEndpoint } from '@cdk-constructs/apigateway';
 *
 * const endpointResources = createApiGatewayVpcEndpoint(this, {
 *   endpointName: 'apigw-endpoint',
 *   vpcId: 'vpc-12345',
 *   allowedCidrBlocks: ['10.0.0.0/16'],
 * });
 *
 * // Use the endpoint ID with private REST API
 * const apiResources = createPrivateRestApi(this, {
 *   apiName: 'internal-api',
 *   vpcEndpointId: endpointResources.endpointId,
 *   // ... other config
 * });
 * ```
 *
 * @see {@link VpcEndpointProps} for configuration options
 * @see {@link VpcEndpointResources} for returned resources
 * @public
 */
export const createApiGatewayVpcEndpoint = (scope: Construct, props: VpcEndpointProps): VpcEndpointResources => {
    // Lookup VPC - this resolves VPC details including private subnets at synth time
    const vpc = Vpc.fromLookup(scope, `${props.endpointName}-vpc`, {
        vpcId: props.vpcId,
    });

    // Create security group for the endpoint
    const securityGroup = new SecurityGroup(scope, `${props.endpointName}-sg`, {
        vpc,
        securityGroupName: `${props.endpointName}-sg`,
        description: `Security group for API Gateway VPC endpoint ${props.endpointName}`,
        allowAllOutbound: true,
    });

    // Add HTTPS ingress rules for allowed CIDR blocks
    props.allowedCidrBlocks.forEach(cidr => {
        securityGroup.addIngressRule(Peer.ipv4(cidr), Port.tcp(443), `Allow HTTPS from ${cidr}`);
    });

    // Determine subnet selection - use private subnets from VPC lookup
    const subnetSelection: SubnetSelection = {
        subnets: vpc.privateSubnets,
    };

    // Create the VPC endpoint
    const endpoint = new InterfaceVpcEndpoint(scope, props.endpointName, {
        vpc,
        service: InterfaceVpcEndpointAwsService.APIGATEWAY,
        subnets: subnetSelection,
        securityGroups: [securityGroup],
        privateDnsEnabled: true,
    });

    // Ensure VPC lookup completes before endpoint creation
    endpoint.node.addDependency(vpc);

    return {
        endpoint,
        securityGroup,
        endpointId: endpoint.vpcEndpointId,
    };
};

/**
 * Looks up an existing VPC endpoint by ID.
 *
 * @remarks
 * Use this when you have an existing VPC endpoint and need to reference it
 * in a private REST API configuration.
 *
 * @param scope - The construct scope
 * @param vpcEndpointId - The VPC endpoint ID to look up
 * @returns The VPC endpoint interface
 *
 * @example
 * ```typescript
 * import { lookupVpcEndpoint } from '@cdk-constructs/apigateway';
 *
 * const endpoint = lookupVpcEndpoint(this, 'vpce-12345');
 * ```
 *
 * @public
 */
export const lookupVpcEndpoint = (scope: Construct, vpcEndpointId: string): IVpcEndpoint => {
    return InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(scope, `${vpcEndpointId}-lookup`, {
        vpcEndpointId,
        port: 443,
    });
};
