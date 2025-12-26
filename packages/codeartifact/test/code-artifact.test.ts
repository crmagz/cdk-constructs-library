import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {createCodeArtifact, createCdkPublishRole} from '../src';
import {Account} from '@cdk-constructs/aws';

/**
 * Test implementation demonstrating usage of CodeArtifact constructs.
 *
 * This file serves as both a test and an example of how to use
 * the CodeArtifact constructs in CDK stacks.
 */

describe('CodeArtifact Constructs', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack');
    });

    describe('createCodeArtifact', () => {
        it('should create a CodeArtifact domain and repository', () => {
            createCodeArtifact(stack, 'TestCodeArtifact', {
                codeArtifactDomainName: 'test-domain',
                codeArtifactRepositoryName: 'test-repository',
                codeArtifactRepositoryDescription: 'Test repository description',
            });

            const template = Template.fromStack(stack);

            // Verify domain is created
            template.hasResourceProperties('AWS::CodeArtifact::Domain', {
                DomainName: 'test-domain',
            });

            // Verify repository is created
            template.hasResourceProperties('AWS::CodeArtifact::Repository', {
                DomainName: 'test-domain',
                RepositoryName: 'test-repository',
                Description: 'Test repository description',
            });
        });

        it('should create CodeArtifact with account restrictions', () => {
            createCodeArtifact(stack, 'TestCodeArtifact', {
                codeArtifactDomainName: 'test-domain',
                codeArtifactRepositoryName: 'test-repository',
                codeArtifactRepositoryDescription: 'Test repository description',
                allowedAccounts: [Account.PROD, Account.NONPROD],
            });

            const template = Template.fromStack(stack);
            template.hasResourceProperties('AWS::CodeArtifact::Domain', {
                DomainName: 'test-domain',
            });
        });
    });

    describe('createCdkPublishRole', () => {
        it('should create a publish role with correct permissions', () => {
            const role = createCdkPublishRole(stack, 'TestPublishRole', Account.PROD);

            expect(role).toBeDefined();
            expect(role.roleName).toBe('TestPublishRole');

            const template = Template.fromStack(stack);
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'TestPublishRole',
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                AWS: {
                                    'Fn::Join': ['', ['arn:aws:iam::', Account.PROD, ':root']],
                                },
                            },
                        },
                    ],
                },
            });
        });
    });
});
