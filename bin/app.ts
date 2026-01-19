import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {CodeArtifactStack} from '../lib/stacks/code-artifact-stack';
import {AuroraMySqlDevStack} from '../examples/aurora/stacks/aurora-mysql-dev-stack';
import {AuroraMySqlProdStack} from '../examples/aurora/stacks/aurora-mysql-prod-stack';
import {AuroraPostgresDevStack} from '../examples/aurora/stacks/aurora-postgres-dev-stack';
import {AuroraPostgresProdStack} from '../examples/aurora/stacks/aurora-postgres-prod-stack';
import {S3DevStack} from '../examples/s3/stacks/s3-dev-stack';
import {S3ProdStack} from '../examples/s3/stacks/s3-prod-stack';
import {CloudFrontDevStack} from '../examples/cloudfront/stacks/cloudfront-dev-stack';
import {CloudFrontProdStack} from '../examples/cloudfront/stacks/cloudfront-prod-stack';
import {Route53DevStack} from '../examples/route53/stacks/route53-dev-stack';
import {Route53ProdStack} from '../examples/route53/stacks/route53-prod-stack';
import {LambdaDevStack} from '../examples/lambda/stacks/lambda-dev-stack';
import {ApiDevStack} from '../examples/apigateway/stacks/api-dev-stack';
import {integrationEnvironments} from './environment';

const app = new App();

// Create CodeArtifact stacks for each integration environment
integrationEnvironments.forEach(env => {
    if (env.codeArtifact) {
        new CodeArtifactStack(app, `code-artifact-${env.name}`, {
            account: env.account,
            region: env.region,
            name: env.name,
            owner: env.owner,
            ...env.codeArtifact,
        });
    }

    // Create Aurora MySQL stack if configured
    if (env.auroraMySql) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev') {
            new AuroraMySqlDevStack(app, `aurora-mysql-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new AuroraMySqlProdStack(app, `aurora-mysql-${env.name}`, envProps);
        }
    }

    // Create Aurora PostgreSQL stack if configured
    if (env.auroraPostgres) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new AuroraPostgresDevStack(app, `aurora-postgres-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new AuroraPostgresProdStack(app, `aurora-postgres-${env.name}`, envProps);
        }
    }

    // Create S3 stack if configured
    if (env.s3) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new S3DevStack(app, `s3-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new S3ProdStack(app, `s3-${env.name}`, envProps);
        }
    }

    // Create CloudFront stack if configured
    if (env.cloudfront) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new CloudFrontDevStack(app, `cloudfront-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new CloudFrontProdStack(app, `cloudfront-${env.name}`, envProps);
        }
    }

    // Create Route53 stack if configured
    if (env.route53) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new Route53DevStack(app, `route53-${env.name}`, envProps);
        } else if (env.name === 'prod') {
            new Route53ProdStack(app, `route53-${env.name}`, envProps);
        }
    }

    // Create Lambda stack if configured
    if (env.lambda) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new LambdaDevStack(app, `lambda-${env.name}`, envProps);
        }
    }

    // Create API Gateway stack if configured
    if (env.apigateway) {
        const envProps = {
            env: {
                account: env.account,
                region: env.region,
            },
        };

        // Choose stack based on environment
        if (env.name === 'dev' || env.name === 'staging') {
            new ApiDevStack(app, `apigateway-${env.name}`, envProps);
        }
    }
});

app.synth();
