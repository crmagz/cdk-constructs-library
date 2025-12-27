import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {CodeArtifactStack} from '../lib/stacks/code-artifact-stack';
import {integrationEnvironments} from './environment';

const app = new App();

// Create CodeArtifact stacks for each integration environment
integrationEnvironments.forEach(env => {
    if (env.codeArtifact) {
        new CodeArtifactStack(app, `CodeArtifactStack-${env.environment}`, {
            account: env.account,
            region: env.region,
            ...env.codeArtifact,
        });
    }
});

app.synth();
