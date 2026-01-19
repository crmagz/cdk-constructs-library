import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {BaseFunctionProps} from './function-base';

/**
 * Properties for creating a Python Lambda function.
 *
 * @remarks
 * Extends base function properties with Python-specific options for
 * runtime version and handler configuration.
 *
 * The function uses Docker bundling to install dependencies from
 * requirements.txt if present in the entry path directory.
 *
 * @example
 * ```typescript
 * const props: PythonFunctionProps = {
 *   functionName: 'my-python-processor',
 *   entryPath: '/absolute/path/to/lambda',
 *   vpc: {
 *     vpcId: 'vpc-12345',
 *     privateSubnetIds: ['subnet-1', 'subnet-2'],
 *   },
 *   handler: 'app.handler',
 *   runtime: Runtime.PYTHON_3_12,
 * };
 * ```
 *
 * @public
 */
export type PythonFunctionProps = BaseFunctionProps & {
    /**
     * Handler path in format 'module.function'
     *
     * @remarks
     * The handler specifies the Python module and function that Lambda invokes.
     * For example, 'lambda_function.lambda_handler' invokes the lambda_handler
     * function in the lambda_function.py file.
     *
     * @default 'lambda_function.lambda_handler'
     */
    handler?: string;

    /**
     * Python runtime version
     *
     * @remarks
     * Specifies which Python version to use. Use the latest supported
     * version unless you have specific compatibility requirements.
     *
     * @default Runtime.PYTHON_3_13
     */
    runtime?: Runtime;
};
