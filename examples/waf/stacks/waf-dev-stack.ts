import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {createWebAcl, createWebAclAssociation} from '../../../packages/waf/src';
import {ConfigResolver} from '../config/config-resolver';

/**
 * Development environment WAF stack.
 *
 * @remarks
 * This stack creates a WAF WebACL configured for development/testing:
 * - Operates in COUNT mode (monitors, doesn't block)
 * - More permissive geo-blocking
 * - Shorter log retention
 *
 * To associate with an ALB, create `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   resourceArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/...'
 * };
 * ```
 */
export class WafDevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const config = ConfigResolver.getDevConfig();
        const {resourceArn, ...wafProps} = config;

        // Create WebACL
        const {webAcl, webAclArn, webAclId, logGroup} = createWebAcl(this, wafProps);

        // Optionally associate with resource if ARN provided
        if (resourceArn) {
            createWebAclAssociation(this, {
                name: 'dev-waf-association',
                webAclArn: webAclArn,
                resourceArn: resourceArn,
            });

            new CfnOutput(this, 'AssociatedResource', {
                value: resourceArn,
                description: 'Resource protected by WAF',
            });
        }

        // Outputs
        new CfnOutput(this, 'WebAclArn', {
            value: webAclArn,
            description: 'WAF WebACL ARN',
            exportName: 'WafDevWebAclArn',
        });

        new CfnOutput(this, 'WebAclId', {
            value: webAclId,
            description: 'WAF WebACL ID',
            exportName: 'WafDevWebAclId',
        });

        if (logGroup) {
            new CfnOutput(this, 'LogGroupName', {
                value: logGroup.logGroupName,
                description: 'CloudWatch Log Group for WAF logs',
            });
        }

        new CfnOutput(this, 'ActionMode', {
            value: config.actionMode || 'COUNT',
            description: 'WAF action mode (COUNT or BLOCK)',
        });
    }
}
