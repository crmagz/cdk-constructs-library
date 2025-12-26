import {CfnDomain, CfnRepository} from 'aws-cdk-lib/aws-codeartifact';
import {Construct} from 'constructs';
import {Tags} from 'aws-cdk-lib';
import {AccountPrincipal, Effect, PolicyStatement, Role} from 'aws-cdk-lib/aws-iam';
import {CodeArtifactDomainProps, CodeArtifactRepositoryProps, CodeArtifactStackProps} from '../types/code-artifact';

/**
 * Creates a CodeArtifact domain.
 *
 * @param scope - The parent construct
 * @param id - The construct ID
 * @param props - The domain properties
 * @returns The created CodeArtifact domain
 *
 * @public
 */
export const createCodeArtifactDomain = (scope: Construct, id: string, props: CodeArtifactDomainProps): CfnDomain => {
    const allowedAccounts = props.allowedAccounts || [];

    const domainTokenPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow' as const,
                Principal: {
                    AWS: allowedAccounts.length > 0 ? allowedAccounts.map(acc => `arn:aws:iam::${acc}:root`) : ['*'],
                },
                Action: 'codeartifact:GetAuthorizationToken',
                Resource: '*',
            },
        ],
    };

    const domain = new CfnDomain(scope, 'CodeArtifactDomain', {
        domainName: props.domainName,
        permissionsPolicyDocument: domainTokenPolicy,
    });

    Tags.of(domain).add('Name', props.domainName);
    Tags.of(domain).add('Stack', domain.stack.stackName);

    if (props.tags) {
        props.tags.forEach(tag => {
            Tags.of(domain).add(tag.key, tag.value);
        });
    }

    return domain;
};

/**
 * Creates a CodeArtifact repository.
 *
 * @param scope - The parent construct
 * @param domain - The CodeArtifact domain
 * @param props - The repository properties
 * @returns The created CodeArtifact repository
 *
 * @public
 */
export const createCodeArtifactRepository = (scope: Construct, domain: CfnDomain, props: CodeArtifactRepositoryProps): CfnRepository => {
    const allowedAccounts = props.allowedAccounts || [];

    const repositoryTokenPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow' as const,
                Principal: {
                    AWS: allowedAccounts.length > 0 ? allowedAccounts.map(acc => `arn:aws:iam::${acc}:root`) : ['*'],
                },
                Action: [
                    'codeartifact:DescribePackageVersion',
                    'codeartifact:DescribeRepository',
                    'codeartifact:GetPackageVersionReadme',
                    'codeartifact:Get*RepositoryEndpoint',
                    'codeartifact:ListPackageVersionAssets',
                    'codeartifact:ListPackageVersionDependencies',
                    'codeartifact:ListPackageVersions',
                    'codeartifact:ListPackages',
                    'codeartifact:PublishPackageVersion',
                    'codeartifact:PutPackageMetadata',
                    'codeartifact:ReadFromRepository',
                ],
                Resource: '*',
            },
        ],
    };

    const repository = new CfnRepository(scope, 'CodeArtifactRepository', {
        domainName: domain.domainName,
        repositoryName: props.repositoryName,
        description: props.repositoryDescription,
        permissionsPolicyDocument: repositoryTokenPolicy,
    });

    repository.node.addDependency(domain);

    Tags.of(repository).add('Name', props.repositoryName);
    Tags.of(repository).add('Stack', repository.stack.stackName);

    if (props.tags) {
        props.tags.forEach(tag => {
            Tags.of(repository).add(tag.key, tag.value);
        });
    }

    return repository;
};

/**
 * Creates a CDK publish role for GitHub Actions or CI/CD pipelines.
 *
 * @param scope - The parent construct
 * @param roleName - The name of the IAM role
 * @param accountId - The AWS account ID that can assume this role
 * @returns The created IAM role
 *
 * @public
 */
export const createCdkPublishRole = (scope: Construct, roleName: string, accountId: string): Role => {
    const role = new Role(scope, 'CdkPublishRole', {
        roleName: roleName,
        assumedBy: new AccountPrincipal(accountId),
        description: 'Role for GitHub Actions to publish npm package to CodeArtifact',
    });

    role.addToPolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['sts:GetServiceBearerToken'],
            resources: ['*'],
        })
    );

    role.addToPolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'codeartifact:GetAuthorizationToken',
                'codeartifact:GetRepositoryEndpoint',
                'codeartifact:ReadFromRepository',
                'codeartifact:PublishPackageVersion',
            ],
            resources: ['*'],
        })
    );

    Tags.of(role).add('Name', roleName);
    Tags.of(role).add('Stack', role.stack.stackName);

    return role;
};

/**
 * Creates a complete CodeArtifact setup (domain and repository).
 *
 * @param scope - The parent construct
 * @param id - The construct ID
 * @param props - The CodeArtifact properties
 * @returns An object containing the created domain and repository
 *
 * @public
 */
export const createCodeArtifact = (scope: Construct, id: string, props: CodeArtifactStackProps): {domain: CfnDomain; repository: CfnRepository} => {
    const domain = createCodeArtifactDomain(scope, id, {
        domainName: props.codeArtifactDomainName,
        tags: props.codeArtifactTags,
        allowedAccounts: props.allowedAccounts,
    });

    const repository = createCodeArtifactRepository(scope, domain, {
        repositoryName: props.codeArtifactRepositoryName,
        repositoryDescription: props.codeArtifactRepositoryDescription,
        domainName: props.codeArtifactDomainName,
        tags: props.codeArtifactTags,
        allowedAccounts: props.allowedAccounts,
    });

    return {domain, repository};
};
