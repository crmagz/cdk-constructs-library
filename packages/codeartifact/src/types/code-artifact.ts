import {CfnTag} from 'aws-cdk-lib';

/**
 * Properties for creating a CodeArtifact domain.
 *
 * @public
 */
export interface CodeArtifactDomainProps {
    /**
     * The name of the CodeArtifact domain.
     */
    domainName: string;

    /**
     * Optional tags to apply to the domain.
     */
    tags?: CfnTag[];

    /**
     * Optional list of AWS account IDs that are allowed to get authorization tokens.
     *
     * @default - No account restrictions (all accounts in the organization)
     */
    allowedAccounts?: string[];
}

/**
 * Properties for creating a CodeArtifact repository.
 *
 * @public
 */
export interface CodeArtifactRepositoryProps {
    /**
     * The name of the CodeArtifact repository.
     */
    repositoryName: string;

    /**
     * The description of the CodeArtifact repository.
     */
    repositoryDescription: string;

    /**
     * The name of the CodeArtifact domain this repository belongs to.
     */
    domainName: string;

    /**
     * Optional tags to apply to the repository.
     */
    tags?: CfnTag[];

    /**
     * Optional list of AWS account IDs that are allowed to access the repository.
     *
     * @default - No account restrictions (all accounts in the organization)
     */
    allowedAccounts?: string[];
}

/**
 * Properties for creating a CodeArtifact stack.
 *
 * @public
 */
export interface CodeArtifactStackProps {
    /**
     * The CodeArtifact domain name.
     */
    codeArtifactDomainName: string;

    /**
     * The CodeArtifact repository name.
     */
    codeArtifactRepositoryName: string;

    /**
     * The CodeArtifact repository description.
     */
    codeArtifactRepositoryDescription: string;

    /**
     * Optional tags to apply to CodeArtifact resources.
     */
    codeArtifactTags?: CfnTag[];

    /**
     * Optional list of AWS account IDs that are allowed to access CodeArtifact resources.
     *
     * @default - No account restrictions (all accounts in the organization)
     */
    allowedAccounts?: string[];
}
