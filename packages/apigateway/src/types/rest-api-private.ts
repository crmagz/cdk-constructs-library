import type {BaseRestApiProps} from './rest-api-base';

/**
 * Properties for creating a private REST API.
 *
 * @remarks
 * Private REST APIs are only accessible from within a VPC through a
 * VPC endpoint. This provides network-level isolation for internal APIs.
 *
 * Use `createApiGatewayVpcEndpoint` to create the required VPC endpoint
 * before creating the private REST API.
 *
 * @example
 * ```typescript
 * const props: PrivateRestApiProps = {
 *   apiName: 'internal-api',
 *   vpcEndpointId: 'vpce-12345',
 *   integration: {
 *     nodejsLambda: {
 *       functionName: 'internal-handler',
 *       entryPath: path.join(__dirname, '../lambda/handler.ts'),
 *       vpc: { vpcId: 'vpc-12345', privateSubnetIds: ['subnet-1'] },
 *     },
 *   },
 * };
 * ```
 *
 * @public
 */
export type PrivateRestApiProps = BaseRestApiProps & {
    /**
     * VPC endpoint ID (required for private APIs)
     *
     * @remarks
     * The VPC endpoint must be an Interface endpoint for the
     * execute-api service. Use `createApiGatewayVpcEndpoint` to
     * create one, or provide an existing endpoint ID.
     */
    vpcEndpointId: string;
};
