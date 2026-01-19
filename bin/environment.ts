/**
 * Environment configuration re-exports.
 *
 * @remarks
 * This file re-exports environment configurations and types from their
 * organized locations for backwards compatibility.
 *
 * - Types are defined in lib/types/
 * - Configurations are defined in lib/config/
 */

import {ProjectEnvironment} from '../lib/types/project';
import {buildEnv, devEnv, prodEnv, stagingEnv} from '../lib/config/environments';
import {ResolvedAccounts} from '../lib/config/account-resolver';

export type {ProjectEnvironment} from '../lib/types/project';

/**
 * Integration test environments.
 *
 * @remarks
 * Add new environments and stack configurations here for testing.
 * Each environment can include optional stack-specific props.
 */
export const integrationEnvironments: ProjectEnvironment[] = [
    {
        ...buildEnv,
        codeArtifact: {
            codeArtifactDomainName: 'cdk-constructs',
            codeArtifactRepositoryName: 'cdk-constructs-library',
            codeArtifactRepositoryDescription: 'CDK Constructs Library Build Repository',
            allowedAccounts: [ResolvedAccounts.DEV, ResolvedAccounts.STAGING, ResolvedAccounts.PROD],
        },
    },
    {
        ...devEnv,
        // Aurora MySQL dev configuration
        auroraMySql: {
            clusterName: `aurora-mysql-${devEnv.name}`,
        },
        // Aurora PostgreSQL dev configuration
        auroraPostgres: {
            clusterName: `aurora-postgres-${devEnv.name}`,
        },
        // S3 bucket dev configuration (flag to enable the stack)
        s3: {},
        // CloudFront distribution dev configuration (flag to enable the stack)
        cloudfront: {},
        // Route53 DNS dev configuration (flag to enable the stack)
        route53: {},
        // Lambda function dev configuration (flag to enable the stack)
        lambda: {},
        // API Gateway dev configuration (flag to enable the stack)
        apigateway: {},
        // CloudWatch dev configuration (flag to enable the stack)
        cloudwatch: {},
    },
    {
        ...stagingEnv,
        // Aurora MySQL staging configuration
        auroraMySql: {
            clusterName: `aurora-mysql-${stagingEnv.name}`,
        },
        // Aurora PostgreSQL staging configuration
        auroraPostgres: {
            clusterName: `aurora-postgres-${stagingEnv.name}`,
        },
        // S3 bucket staging configuration (flag to enable the stack)
        s3: {},
        // CloudFront distribution staging configuration (flag to enable the stack)
        cloudfront: {},
        // Route53 DNS staging configuration (flag to enable the stack)
        route53: {},
    },
    {
        ...prodEnv,
        // Aurora MySQL prod configuration
        auroraMySql: {
            clusterName: `aurora-mysql-${prodEnv.name}`,
        },
        // Aurora PostgreSQL prod configuration
        auroraPostgres: {
            clusterName: `aurora-postgres-${prodEnv.name}`,
        },
        // S3 bucket prod configuration (flag to enable the stack)
        s3: {},
        // CloudFront distribution prod configuration (flag to enable the stack)
        cloudfront: {},
        // Route53 DNS prod configuration (flag to enable the stack)
        route53: {},
    },
];
