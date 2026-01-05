import {CfnWebACLAssociation} from 'aws-cdk-lib/aws-wafv2';

/**
 * Properties for associating a WebACL with a resource.
 *
 * @example
 * ```typescript
 * import { createWebAclAssociation } from '@cdk-constructs/waf';
 *
 * createWebAclAssociation(this, {
 *   name: 'alb-waf-association',
 *   webAclArn: webAcl.webAclArn,
 *   resourceArn: alb.loadBalancerArn,
 * });
 * ```
 *
 * @public
 */
export type WebAclAssociationProps = {
    /** Name for the association construct */
    name: string;

    /** ARN of the WebACL to associate */
    webAclArn: string;

    /**
     * ARN of the resource to protect.
     *
     * @remarks
     * Supported regional resources:
     * - Application Load Balancer: arn:aws:elasticloadbalancing:*
     * - API Gateway REST API: arn:aws:apigateway:*
     * - AppSync GraphQL API: arn:aws:appsync:*
     * - Cognito User Pool: arn:aws:cognito-idp:*
     * - App Runner Service: arn:aws:apprunner:*
     * - Verified Access Instance: arn:aws:ec2:*:verified-access-instance/*
     */
    resourceArn: string;
};

/**
 * Resources created by createWebAclAssociation.
 *
 * @public
 */
export type WebAclAssociationResources = {
    /** The association construct */
    association: CfnWebACLAssociation;
};
