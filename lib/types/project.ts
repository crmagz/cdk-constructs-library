import {EnvironmentConfig} from '@cdk-constructs/aws';
import {CodeArtifactStackProps} from '@cdk-constructs/codeartifact';
import {AuroraMySqlClusterProps, AuroraPostgresClusterProps} from '@cdk-constructs/aurora';
import {BucketProps} from '@cdk-constructs/s3';
import {CloudFrontS3Props} from '@cdk-constructs/cloudfront';
import {PublicHostedZoneProps, PrivateHostedZoneProps} from '@cdk-constructs/route53';
import {NodejsFunctionProps, PythonFunctionProps} from '@cdk-constructs/lambda';
import {RegionalRestApiProps, PrivateRestApiProps} from '@cdk-constructs/apigateway';
import {CloudWatchAlarmsProps, SnsTopicsProps, PagerDutyLambdaProps} from '@cdk-constructs/cloudwatch';

/**
 * Project environment configuration that includes all stack props.
 *
 * @example
 * ```typescript
 * const env: ProjectEnvironment = {
 *   account: Account.PROD,
 *   region: Region.US_EAST_1,
 *   name: Environment.PROD,
 *   owner: 'platform-team',
 *   codeArtifact: {
 *     codeArtifactDomainName: 'my-domain',
 *     codeArtifactRepositoryName: 'my-repo',
 *     codeArtifactRepositoryDescription: 'Production artifacts',
 *   },
 *   // Aurora MySQL cluster configuration
 *   auroraMySql: {
 *     clusterName: 'my-mysql-cluster',
 *     // ... other AuroraMySqlClusterProps
 *   },
 *   // Aurora PostgreSQL cluster configuration
 *   auroraPostgres: {
 *     clusterName: 'my-postgres-cluster',
 *     // ... other AuroraPostgresClusterProps
 *   },
 * };
 * ```
 *
 * @see {@link EnvironmentConfig} for base environment properties
 * @public
 */
export type ProjectEnvironment = EnvironmentConfig & {
    /** Optional CodeArtifact stack configuration. */
    codeArtifact?: CodeArtifactStackProps;

    /**
     * Optional Aurora MySQL cluster configuration.
     * If provided, an Aurora MySQL stack will be created for this environment.
     */
    auroraMySql?: Partial<AuroraMySqlClusterProps>;

    /**
     * Optional Aurora PostgreSQL cluster configuration.
     * If provided, an Aurora PostgreSQL stack will be created for this environment.
     */
    auroraPostgres?: Partial<AuroraPostgresClusterProps>;

    /**
     * Optional S3 bucket configuration.
     * If provided, an S3 bucket stack will be created for this environment.
     */
    s3?: Partial<BucketProps>;

    /**
     * Optional CloudFront + S3 distribution configuration.
     * If provided, a CloudFront distribution stack will be created for this environment.
     */
    cloudfront?: Partial<CloudFrontS3Props>;

    /**
     * Optional Route53 configuration.
     * If provided, a Route53 stack will be created for this environment.
     */
    route53?: {
        /**
         * Public hosted zone configuration.
         */
        publicZone?: Partial<PublicHostedZoneProps>;

        /**
         * Private hosted zone configuration.
         */
        privateZone?: Partial<PrivateHostedZoneProps>;
    };

    /**
     * Optional Lambda function configuration.
     * If provided, a Lambda stack will be created for this environment.
     */
    lambda?: {
        /**
         * Node.js function configuration.
         */
        nodejsFunction?: Partial<NodejsFunctionProps>;

        /**
         * Python function configuration.
         */
        pythonFunction?: Partial<PythonFunctionProps>;
    };

    /**
     * Optional API Gateway configuration.
     * If provided, an API Gateway stack will be created for this environment.
     */
    apigateway?: {
        /**
         * Regional REST API configuration.
         */
        regionalApi?: Partial<RegionalRestApiProps>;

        /**
         * Private REST API configuration.
         */
        privateApi?: Partial<PrivateRestApiProps>;
    };

    /**
     * Optional CloudWatch configuration.
     * If provided, CloudWatch stacks will be created for this environment.
     */
    cloudwatch?: {
        /**
         * CloudWatch alarms configuration (SNS only).
         */
        alarms?: Partial<CloudWatchAlarmsProps>;

        /**
         * CloudWatch alarms with PagerDuty integration.
         */
        alarmsWithPagerDuty?: Partial<CloudWatchAlarmsProps>;

        /**
         * SNS topics configuration.
         */
        snsTopics?: Partial<SnsTopicsProps>;

        /**
         * PagerDuty Lambda configuration.
         */
        pagerDutyLambda?: Partial<PagerDutyLambdaProps>;
    };
};
