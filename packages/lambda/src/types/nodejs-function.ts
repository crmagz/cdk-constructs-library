import {BaseFunctionProps} from './function-base';

/**
 * Properties for creating a Node.js Lambda function.
 *
 * @remarks
 * Extends base function properties with Node.js-specific options for
 * esbuild bundling and source map configuration.
 *
 * @example
 * ```typescript
 * const props: NodejsFunctionProps = {
 *   functionName: 'my-api-handler',
 *   entryPath: '/absolute/path/to/handler.ts',
 *   vpc: {
 *     vpcId: 'vpc-12345',
 *     privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   },
 *   memorySize: 512,
 *   environment: {
 *     TABLE_NAME: 'my-table',
 *   },
 * };
 * ```
 *
 * @public
 */
export type NodejsFunctionProps = BaseFunctionProps & {
    /**
     * External modules to exclude from bundling
     *
     * @remarks
     * Modules listed here will not be bundled and must be available at runtime.
     * The AWS SDK v3 is excluded by default as it's available in the Lambda runtime.
     *
     * @default ['@aws-sdk/*']
     */
    externalModules?: string[];

    /**
     * Handler export name
     *
     * @remarks
     * The name of the exported function in your entry file that Lambda invokes.
     *
     * @default 'handler'
     */
    handler?: string;

    /**
     * Enable source maps for debugging
     *
     * @remarks
     * When enabled, stack traces will reference TypeScript source locations
     * instead of compiled JavaScript. Adds ~10-20% to bundle size.
     *
     * @default true
     */
    sourceMap?: boolean;
};
