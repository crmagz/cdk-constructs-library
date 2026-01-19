import type {BaseRestApiProps} from './rest-api-base';

/**
 * Properties for creating a regional REST API.
 *
 * @remarks
 * Regional REST APIs are accessible from the public internet.
 * They should be protected with WAF and/or API keys for security.
 *
 * For custom domain support, provide the ACM certificate ARN and
 * domain name. The base path mapping will be automatically created.
 *
 * @example
 * ```typescript
 * const props: RegionalRestApiProps = {
 *   apiName: 'public-api',
 *   integration: {
 *     nodejsLambda: {
 *       functionName: 'public-handler',
 *       entryPath: path.join(__dirname, '../lambda/handler.ts'),
 *       vpc: { vpcId: '', privateSubnetIds: [] },
 *       disableVpc: true,
 *     },
 *   },
 *   domainNameArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123',
 *   basePath: 'v1',
 * };
 * ```
 *
 * @public
 */
export type RegionalRestApiProps = BaseRestApiProps & {
    /**
     * Custom domain name ARN for base path mapping
     *
     * @remarks
     * The ARN of an existing API Gateway domain name. When provided,
     * a base path mapping will be created to map the API to this domain.
     */
    domainNameArn?: string;

    /**
     * Base path for domain mapping
     *
     * @remarks
     * The base path for the API when using a custom domain. For example,
     * 'v1' would make the API accessible at `https://api.example.com/v1/`.
     *
     * @example 'v1'
     */
    basePath?: string;
};
