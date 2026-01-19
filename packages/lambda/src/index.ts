// Construct functions
export {createNodejsFunction} from './constructs/nodejs-function';
export {createPythonFunction} from './constructs/python-function';

// Utility functions
export {createLambdaLogGroup, getLambdaLogGroupName} from './util';

// Types - Base
export type {BaseFunctionProps, VpcConfig, FunctionResources} from './types';

// Types - Node.js
export type {NodejsFunctionProps} from './types';

// Types - Python
export type {PythonFunctionProps} from './types';

// Re-export LogGroupClass for convenience (to opt-in to STANDARD)
export {LogGroupClass} from 'aws-cdk-lib/aws-logs';
