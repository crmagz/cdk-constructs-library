import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {createIpSet, createWebAcl, createWebAclAssociation, IpAddressVersion, WafActionMode, WebAclScope} from '../src';

describe('WAF Constructs', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    describe('createWebAcl', () => {
        test('creates WebACL with default configuration', () => {
            const {webAcl} = createWebAcl(stack, {
                name: 'test-waf',
            });

            const template = Template.fromStack(stack);

            // Verify WebACL created
            template.resourceCountIs('AWS::WAFv2::WebACL', 1);

            // Verify scope is REGIONAL
            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Scope: 'REGIONAL',
            });

            // Verify default action is allow (COUNT mode)
            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                DefaultAction: {Allow: {}},
            });

            expect(webAcl).toBeDefined();
        });

        test('creates WebACL in BLOCK mode', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                actionMode: WafActionMode.BLOCK,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                DefaultAction: {Block: {}},
            });
        });

        test('creates WebACL with CLOUDFRONT scope', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                scope: WebAclScope.CLOUDFRONT,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Scope: 'CLOUDFRONT',
            });
        });

        test('includes all 8 AWS managed rules by default', () => {
            createWebAcl(stack, {
                name: 'test-waf',
            });

            const template = Template.fromStack(stack);

            // Should have 8 managed rule groups + 1 geo-blocking rule = 9 total
            const webAcl = template.findResources('AWS::WAFv2::WebACL');
            const rules = Object.values(webAcl)[0].Properties.Rules;

            expect(rules.length).toBe(9);

            // Verify some managed rule groups are present
            const ruleNames = rules.map((rule: any) => rule.Statement);
            const managedRules = ruleNames.filter((stmt: any) => stmt.ManagedRuleGroupStatement);

            expect(managedRules.length).toBe(8);
        });

        test('includes geo-blocking rule for US-only', () => {
            createWebAcl(stack, {
                name: 'test-waf',
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        Name: expect.stringMatching(/geo-blocking/),
                        Statement: {
                            NotStatement: {
                                Statement: {
                                    GeoMatchStatement: {
                                        CountryCodes: ['US'],
                                    },
                                },
                            },
                        },
                    }),
                ]),
            });
        });

        test('supports custom allowed countries', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                geoBlocking: {
                    allowedCountries: ['US', 'CA', 'GB'],
                },
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        Statement: {
                            NotStatement: {
                                Statement: {
                                    GeoMatchStatement: {
                                        CountryCodes: ['US', 'CA', 'GB'],
                                    },
                                },
                            },
                        },
                    }),
                ]),
            });
        });

        test('adds custom path rules', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                customPathRules: [
                    {
                        name: 'block-admin',
                        pathPattern: '^/admin(/.*)?$',
                        action: WafActionMode.BLOCK,
                    },
                ],
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        Name: 'block-admin',
                        Statement: {
                            RegexMatchStatement: {
                                RegexString: '^/admin(/.*)?$',
                                FieldToMatch: {
                                    UriPath: {},
                                },
                                TextTransformations: [
                                    {
                                        Priority: 0,
                                        Type: 'NONE',
                                    },
                                ],
                            },
                        },
                        Action: {
                            Block: {},
                        },
                    }),
                ]),
            });
        });

        test('creates CloudWatch log group when logging enabled', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                logging: {enabled: true},
            });

            const template = Template.fromStack(stack);

            template.resourceCountIs('AWS::Logs::LogGroup', 1);
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                LogGroupName: 'aws-waf-logs-test-waf',
            });

            template.resourceCountIs('AWS::WAFv2::LoggingConfiguration', 1);
        });

        test('does not create log group when logging disabled', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                logging: {enabled: false},
            });

            const template = Template.fromStack(stack);

            template.resourceCountIs('AWS::Logs::LogGroup', 0);
            template.resourceCountIs('AWS::WAFv2::LoggingConfiguration', 0);
        });

        test('includes IP allowlist rule when ipSetArn provided', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                ipSetArn: 'arn:aws:wafv2:us-east-1:123456789012:regional/ipset/test/a1b2c3d4',
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        Name: 'ip-allowlist',
                        Priority: 100,
                        Action: {
                            Allow: {},
                        },
                        Statement: {
                            IPSetReferenceStatement: {
                                Arn: 'arn:aws:wafv2:us-east-1:123456789012:regional/ipset/test/a1b2c3d4',
                            },
                        },
                    }),
                ]),
            });
        });

        test('returns webAclArn and webAclId', () => {
            const {webAclArn, webAclId} = createWebAcl(stack, {
                name: 'test-waf',
            });

            expect(webAclArn).toBeDefined();
            expect(webAclId).toBeDefined();
        });
    });

    describe('createIpSet', () => {
        test('creates IP Set with IPv4', () => {
            const {ipSet} = createIpSet(stack, {
                name: 'test-ipset',
                addresses: ['192.0.2.0/24'],
            });

            const template = Template.fromStack(stack);

            template.resourceCountIs('AWS::WAFv2::IPSet', 1);
            template.hasResourceProperties('AWS::WAFv2::IPSet', {
                Addresses: ['192.0.2.0/24'],
                IPAddressVersion: 'IPV4',
                Scope: 'REGIONAL',
            });

            expect(ipSet).toBeDefined();
        });

        test('creates IP Set with IPv6', () => {
            createIpSet(stack, {
                name: 'test-ipset',
                addresses: ['2001:db8::/32'],
                ipAddressVersion: IpAddressVersion.IPV6,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::IPSet', {
                Addresses: ['2001:db8::/32'],
                IPAddressVersion: 'IPV6',
            });
        });

        test('creates IP Set with CLOUDFRONT scope', () => {
            createIpSet(stack, {
                name: 'test-ipset',
                addresses: ['192.0.2.0/24'],
                scope: WebAclScope.CLOUDFRONT,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::IPSet', {
                Scope: 'CLOUDFRONT',
            });
        });

        test('returns ipSetArn and ipSetId', () => {
            const {ipSetArn, ipSetId} = createIpSet(stack, {
                name: 'test-ipset',
                addresses: ['192.0.2.0/24'],
            });

            expect(ipSetArn).toBeDefined();
            expect(ipSetId).toBeDefined();
        });
    });

    describe('createWebAclAssociation', () => {
        test('creates association with ALB', () => {
            const webAclArn = 'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/test/a1b2c3d4';
            const albArn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test/1234567890abcdef';

            createWebAclAssociation(stack, {
                name: 'test-association',
                webAclArn,
                resourceArn: albArn,
            });

            const template = Template.fromStack(stack);

            template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
            template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
                ResourceArn: albArn,
                WebACLArn: webAclArn,
            });
        });

        test('creates association with API Gateway', () => {
            const webAclArn = 'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/test/a1b2c3d4';
            const apiArn = 'arn:aws:apigateway:us-east-1::/restapis/abc123/stages/prod';

            createWebAclAssociation(stack, {
                name: 'test-association',
                webAclArn,
                resourceArn: apiArn,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
                ResourceArn: apiArn,
            });
        });

        test('throws error for invalid resource ARN', () => {
            const webAclArn = 'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/test/a1b2c3d4';
            const invalidArn = 'arn:aws:s3:::my-bucket';

            expect(() => {
                createWebAclAssociation(stack, {
                    name: 'test-association',
                    webAclArn,
                    resourceArn: invalidArn,
                });
            }).toThrow(/Invalid WAF resource ARN/);
        });
    });

    describe('Action mode logic', () => {
        test('COUNT mode uses allow default action and count override', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                actionMode: WafActionMode.COUNT,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                DefaultAction: {Allow: {}},
            });

            // Check that managed rules have count override
            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        OverrideAction: {Count: {}},
                        Statement: {
                            ManagedRuleGroupStatement: expect.any(Object),
                        },
                    }),
                ]),
            });
        });

        test('BLOCK mode uses block default action and none override', () => {
            createWebAcl(stack, {
                name: 'test-waf',
                actionMode: WafActionMode.BLOCK,
            });

            const template = Template.fromStack(stack);

            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                DefaultAction: {Block: {}},
            });

            // Check that managed rules have none override
            template.hasResourceProperties('AWS::WAFv2::WebACL', {
                Rules: expect.arrayContaining([
                    expect.objectContaining({
                        OverrideAction: {None: {}},
                        Statement: {
                            ManagedRuleGroupStatement: expect.any(Object),
                        },
                    }),
                ]),
            });
        });
    });
});
