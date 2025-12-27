import {Construct} from 'constructs';
import {Stack, StackProps} from 'aws-cdk-lib';
import {createCodeArtifact, CodeArtifactStackProps} from '@cdk-constructs/codeartifact';
import {Account, Region} from '@cdk-constructs/aws';

/**
 * Environment configuration for the stack.
 */
export interface EnvironmentConfig {
    account: Account;
    region: Region;
}

/**
 * CodeArtifact stack for integration testing.
 */
export class CodeArtifactStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & CodeArtifactStackProps & EnvironmentConfig) {
        super(scope, id, {
            ...props,
            env: {
                account: props.account,
                region: props.region,
            },
        });

        createCodeArtifact(this, 'cdk-constructs-codeartifact', {
            codeArtifactDomainName: props.codeArtifactDomainName,
            codeArtifactRepositoryName: props.codeArtifactRepositoryName,
            codeArtifactRepositoryDescription: props.codeArtifactRepositoryDescription,
            codeArtifactTags: props.codeArtifactTags,
            allowedAccounts: props.allowedAccounts,
        });
    }
}
