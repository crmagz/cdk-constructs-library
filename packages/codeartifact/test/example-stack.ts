import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createCodeArtifact, createCdkPublishRole, CodeArtifactStackProps} from '../src';
import {Account} from '@cdk-constructs/aws';

/**
 * Example CDK stack demonstrating usage of CodeArtifact constructs.
 *
 * This is a reference implementation showing how to use the
 * CodeArtifact constructs in an actual CDK stack.
 */
export interface ExampleCodeArtifactStackProps extends StackProps {
    /**
     * CodeArtifact configuration properties.
     */
    codeArtifact: CodeArtifactStackProps;

    /**
     * The AWS account ID that can assume the publish role.
     */
    publishRoleAccountId: string;
}

export class ExampleCodeArtifactStack extends Stack {
    constructor(scope: Construct, id: string, props: ExampleCodeArtifactStackProps) {
        super(scope, id, props);

        // Create CodeArtifact domain and repository
        const {domain, repository} = createCodeArtifact(this, 'MyCodeArtifact', {
            codeArtifactDomainName: props.codeArtifact.codeArtifactDomainName,
            codeArtifactRepositoryName: props.codeArtifact.codeArtifactRepositoryName,
            codeArtifactRepositoryDescription: props.codeArtifact.codeArtifactRepositoryDescription,
            codeArtifactTags: props.codeArtifact.codeArtifactTags,
            allowedAccounts: props.codeArtifact.allowedAccounts,
        });

        // Create a publish role for CI/CD pipelines
        const publishRole = createCdkPublishRole(this, 'GitHubActionsPublishRole', props.publishRoleAccountId);

        // Export outputs
        this.exportValue(domain.domainName, {
            name: 'CodeArtifactDomainName',
        });

        this.exportValue(repository.repositoryName, {
            name: 'CodeArtifactRepositoryName',
        });

        this.exportValue(publishRole.roleArn, {
            name: 'PublishRoleArn',
        });
    }
}

// Example usage:
// const app = new App();
// new ExampleCodeArtifactStack(app, 'ExampleStack', {
//   codeArtifact: {
//     codeArtifactDomainName: 'my-domain',
//     codeArtifactRepositoryName: 'my-repository',
//     codeArtifactRepositoryDescription: 'My npm package repository',
//     allowedAccounts: [Account.PROD, Account.NONPROD],
//   },
//   publishRoleAccountId: Account.PROD,
// });
