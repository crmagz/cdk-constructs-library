import {Account, Region, Environment} from '@cdk-constructs/aws';
import {CodeArtifactStackProps} from '@cdk-constructs/codeartifact';

/**
 * Environment configuration for integration testing.
 */
export interface EnvironmentConfig {
    account: Account;
    region: Region;
    environment: Environment;
}

/**
 * Project environment configuration that includes all test stack props.
 */
export interface ProjectEnvironment extends EnvironmentConfig {
    codeArtifact?: CodeArtifactStackProps;
}

/**
 * Development environment configuration.
 */
const devEnv: EnvironmentConfig = {
    account: Account.NONPROD,
    region: Region.US_EAST_1,
    environment: Environment.DEV,
};

/**
 * Production environment configuration.
 */
const prodEnv: EnvironmentConfig = {
    account: Account.PROD,
    region: Region.US_EAST_1,
    environment: Environment.PROD,
};

/**
 * Integration test environments.
 * Add new environments and stack configurations here for testing.
 */
export const integrationEnvironments: ProjectEnvironment[] = [
    {
        ...devEnv,
        codeArtifact: {
            codeArtifactDomainName: 'cdk-constructs',
            codeArtifactRepositoryName: 'cdk-constructs-library',
            codeArtifactRepositoryDescription: 'CDK Constructs Library Repository',
            allowedAccounts: [Account.NONPROD, Account.PROD],
        },
    },
    {
        ...prodEnv,
        codeArtifact: {
            codeArtifactDomainName: 'cdk-constructs',
            codeArtifactRepositoryName: 'cdk-constructs-library',
            codeArtifactRepositoryDescription: 'CDK Constructs Library Repository',
            allowedAccounts: [Account.PROD],
        },
    },
];
