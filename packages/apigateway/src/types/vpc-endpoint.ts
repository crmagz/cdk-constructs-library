import {IInterfaceVpcEndpoint, ISecurityGroup} from 'aws-cdk-lib/aws-ec2';

/**
 * Properties for creating an API Gateway VPC endpoint.
 *
 * @remarks
 * Creates an Interface VPC Endpoint for the execute-api service,
 * which is required for private REST APIs to be accessible from within a VPC.
 * The VPC is looked up by ID and private subnets are automatically used.
 *
 * @example
 * ```typescript
 * const props: VpcEndpointProps = {
 *   endpointName: 'apigw-endpoint',
 *   vpcId: 'vpc-12345',
 *   allowedCidrBlocks: ['10.0.0.0/16'],
 * };
 * ```
 *
 * @public
 */
export type VpcEndpointProps = {
    /** Endpoint name - used as construct ID */
    endpointName: string;

    /** VPC ID where the endpoint will be created (VPC lookup resolves private subnets) */
    vpcId: string;

    /**
     * CIDR blocks allowed to access the endpoint
     *
     * @remarks
     * Traffic from these CIDR blocks will be allowed to reach the
     * VPC endpoint over HTTPS (port 443).
     */
    allowedCidrBlocks: string[];
};

/**
 * Resources created by VPC endpoint construct.
 *
 * @remarks
 * Contains the VPC endpoint and its security group for use with
 * private REST APIs.
 *
 * @public
 */
export type VpcEndpointResources = {
    /** The Interface VPC Endpoint */
    endpoint: IInterfaceVpcEndpoint;

    /** Security group controlling endpoint access */
    securityGroup: ISecurityGroup;

    /** VPC endpoint ID (for use with private REST APIs) */
    endpointId: string;
};
