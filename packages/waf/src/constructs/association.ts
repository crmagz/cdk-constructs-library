import {CfnWebACLAssociation} from 'aws-cdk-lib/aws-wafv2';
import {Construct} from 'constructs';
import {WebAclAssociationProps, WebAclAssociationResources} from '../types';
import {validateRegionalResourceArn} from '../util/validation';

/**
 * Associates a WAF WebACL with a regional resource.
 *
 * @remarks
 * This function creates an association between a WAF WebACL and a regional resource
 * such as an Application Load Balancer, API Gateway, AppSync API, Cognito User Pool,
 * App Runner service, or Verified Access instance.
 *
 * Note: CloudFront distributions do not use associations - they reference the WebACL
 * directly via the `webAclId` property.
 *
 * @param scope - The construct scope
 * @param props - Association configuration properties
 * @returns Association resources
 *
 * @example
 * ```typescript
 * import { createWebAcl, createWebAclAssociation, WebAclScope } from '@cdk-constructs/waf';
 *
 * // Create WebACL
 * const { webAcl, webAclArn } = createWebAcl(this, {
 *   name: 'my-waf',
 *   scope: WebAclScope.REGIONAL,
 * });
 *
 * // Associate with ALB
 * createWebAclAssociation(this, {
 *   name: 'alb-waf-association',
 *   webAclArn: webAclArn,
 *   resourceArn: alb.loadBalancerArn,
 * });
 * ```
 *
 * @see {@link WebAclAssociationProps} for configuration options
 * @see https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-associating-aws-resource.html
 * @public
 */
export const createWebAclAssociation = (scope: Construct, props: WebAclAssociationProps): WebAclAssociationResources => {
    // Validate that the resource ARN is supported by WAF
    validateRegionalResourceArn(props.resourceArn);

    const association = new CfnWebACLAssociation(scope, props.name, {
        resourceArn: props.resourceArn,
        webAclArn: props.webAclArn,
    });

    return {
        association,
    };
};
