import {Stack, StackProps, CfnOutput, Fn} from 'aws-cdk-lib';
import {CfnWebACLAssociation} from 'aws-cdk-lib/aws-wafv2';
import {Construct} from 'constructs';
import {createCloudFrontS3} from '@cdk-constructs/cloudfront';
import {CLOUDFRONT_WAF_PROD_CONFIG} from '../config/cloudfront-waf-prod';

/**
 * Extended configuration for local WAF WebACL ARN.
 *
 * @remarks
 * Add this to your `examples/environments.local.ts`:
 * ```typescript
 * export const LOCAL_CONFIG = {
 *   cloudfront: {
 *     webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/name/id'
 *   }
 * };
 * ```
 */
type CloudFrontWafConfig = typeof CLOUDFRONT_WAF_PROD_CONFIG & {
    waf?: {
        webAclArn?: string;
    };
};

/**
 * Production CloudFront + S3 stack with WAF integration and comprehensive security.
 *
 * @remarks
 * This stack demonstrates a production-ready CloudFront distribution with:
 *
 * **Security Features:**
 * - WAF WebACL association for bot protection and geo-blocking
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - Origin Access Control for secure S3 access
 * - HTTPS-only with custom domain support
 *
 * **Performance Optimizations:**
 * - Origin Shield for improved cache hit ratio (85% -> 95%)
 * - SPA-optimized cache policy
 * - Global price class for worldwide performance
 * - Brotli and Gzip compression enabled
 *
 * **Cost Optimizations:**
 * - S3 Intelligent Tiering with archive access
 * - WAF blocks bots to prevent cache misses and bandwidth waste
 * - Origin Shield reduces origin requests
 * - CloudWatch logging for monitoring and cost analysis
 *
 * **Setup Instructions:**
 *
 * 1. **Deploy WAF Stack First:**
 *    ```bash
 *    npm run cdk deploy WafProdStack
 *    ```
 *    Note the WebACL ARN from the stack outputs.
 *
 * 2. **Configure Local Environment:**
 *    Copy `examples/environments.local.ts.example` to `examples/environments.local.ts`:
 *    ```typescript
 *    export const LOCAL_CONFIG = {
 *      cloudfront: {
 *        webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/your-waf/abc123'
 *      }
 *    };
 *    ```
 *
 * 3. **Deploy CloudFront Stack:**
 *    ```bash
 *    npm run cdk deploy CloudFrontWafProdStack
 *    ```
 *
 * 4. **Monitor WAF Activity:**
 *    - Check CloudWatch for WAF metrics (blocked requests, geo-blocks)
 *    - Review WAF logs for threat analysis
 *    - Monitor CloudFront cache hit ratio improvements
 *
 * **Expected Results:**
 * - Bot traffic blocked at WAF layer (no cache misses)
 * - Cache hit ratio improvement from ~85% to ~95% (Origin Shield)
 * - Significant reduction in origin load and bandwidth costs
 * - Comprehensive security headers on all responses
 * - Protection against common web vulnerabilities (XSS, clickjacking, etc.)
 *
 * **Important Notes:**
 * - WAF must be CLOUDFRONT scope (not REGIONAL)
 * - ACM certificates for CloudFront must be in us-east-1
 * - Origin Shield adds ~$0.005 per 10,000 requests (worth it for cost savings)
 * - WAF rules are evaluated before CloudFront caching (optimal for bot blocking)
 */
export class CloudFrontWafProdStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Load configuration (merge with local config if available)
        const config: CloudFrontWafConfig = this.loadConfig();

        // Create CloudFront distribution with S3 origin
        const {distribution, contentBucket, logBucket} = createCloudFrontS3(this, {
            s3: config.s3,
            cloudfront: config.cloudfront,
            route53: config.route53,
        });

        // Associate WAF WebACL if provided
        if (config.waf?.webAclArn) {
            new CfnWebACLAssociation(this, 'WafAssociation', {
                resourceArn: distribution.distributionArn,
                webAclArn: config.waf.webAclArn,
            });

            new CfnOutput(this, 'WafWebAclArn', {
                value: config.waf.webAclArn,
                description: 'WAF WebACL ARN protecting this distribution',
            });
        } else {
            // eslint-disable-next-line no-console
            console.warn('⚠️  WAF WebACL ARN not configured. Add webAclArn to environments.local.ts for WAF protection.');
        }

        // Outputs
        new CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront distribution ID',
            exportName: `${id}-DistributionId`,
        });

        new CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront distribution domain name (use this for DNS)',
            exportName: `${id}-DomainName`,
        });

        new CfnOutput(this, 'DistributionArn', {
            value: distribution.distributionArn,
            description: 'CloudFront distribution ARN (for WAF association)',
        });

        new CfnOutput(this, 'ContentBucketName', {
            value: contentBucket.bucketName,
            description: 'S3 bucket for static content (deploy your site here)',
        });

        new CfnOutput(this, 'LogBucketName', {
            value: logBucket.bucketName,
            description: 'S3 bucket for CloudFront access logs',
        });

        new CfnOutput(this, 'DeployCommand', {
            value: `aws s3 sync ./dist s3://${contentBucket.bucketName}/ --delete`,
            description: 'Command to deploy static content to S3',
        });
    }

    /**
     * Loads configuration with local overrides.
     *
     * @remarks
     * Attempts to load local configuration from `examples/environments.local.ts`.
     * Falls back to default configuration if local config doesn't exist.
     */
    private loadConfig(): CloudFrontWafConfig {
        try {
            // Try to load local configuration
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const localConfig = require('../../environments.local');
            return {
                ...CLOUDFRONT_WAF_PROD_CONFIG,
                waf: {
                    webAclArn: localConfig.LOCAL_CONFIG?.cloudfront?.webAclArn,
                },
            };
        } catch (error) {
            // Local config doesn't exist, use default
            return CLOUDFRONT_WAF_PROD_CONFIG;
        }
    }
}
