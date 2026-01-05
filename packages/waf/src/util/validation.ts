/**
 * Validates that a resource ARN is compatible with WAF regional WebACL.
 *
 * @remarks
 * Supported regional resources:
 * - Application Load Balancer (ALB)
 * - API Gateway REST API
 * - AppSync GraphQL API
 * - Cognito User Pool
 * - App Runner Service
 * - Verified Access Instance
 *
 * @param arn - The resource ARN to validate
 * @throws Error if the ARN is not supported by WAF
 *
 * @internal
 */
export const validateRegionalResourceArn = (arn: string): void => {
    const validPrefixes = [
        ':elasticloadbalancing:', // ALB
        ':apigateway:', // API Gateway
        ':appsync:', // AppSync
        ':cognito-idp:', // Cognito
        ':apprunner:', // App Runner
        ':ec2:.*:verified-access-instance/', // Verified Access
    ];

    const isValid = validPrefixes.some(prefix => new RegExp(prefix).test(arn));

    if (!isValid) {
        throw new Error(`Invalid WAF resource ARN: ${arn}. ` + 'Must be ALB, API Gateway, AppSync, Cognito, App Runner, or Verified Access Instance.');
    }
};
