import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Account, Region, Environment} from '../src';

/**
 * Example CDK stack demonstrating usage of AWS enums.
 *
 * This is a reference implementation showing how to use the
 * Account, Region, and Environment enums in an actual CDK stack.
 */
export interface ExampleStackProps extends StackProps {
    /**
     * The AWS account ID to deploy to.
     */
    accountId: Account;

    /**
     * The AWS region to deploy to.
     */
    region: Region;

    /**
     * The deployment environment.
     */
    environment: Environment;
}

export class ExampleStack extends Stack {
    constructor(scope: Construct, id: string, props: ExampleStackProps) {
        super(scope, id, {
            ...props,
            env: {
                account: props.accountId,
                region: props.region,
            },
        });

        // Example: Use environment enum for conditional logic
        if (props.environment === Environment.PROD) {
            // Production-specific configuration
            console.log('Deploying to production environment');
        } else if (props.environment === Environment.DEV) {
            // Development-specific configuration
            console.log('Deploying to development environment');
        }

        // Example: Use account enum for resource naming
        const resourceName = `my-resource-${props.accountId}`;

        // Example: Use region enum for region-specific resources
        if (props.region === Region.US_EAST_1) {
            // US East 1 specific resources
            console.log('Deploying US East 1 specific resources');
        }

        // Your CDK constructs would go here
        // For example:
        // new s3.Bucket(this, 'MyBucket', { ... });
    }
}
