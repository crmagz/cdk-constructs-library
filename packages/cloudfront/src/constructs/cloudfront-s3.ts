import {Duration, RemovalPolicy} from 'aws-cdk-lib';
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager';
import {
    AccessLevel,
    AllowedMethods,
    Distribution,
    DistributionProps,
    PriceClass,
    ViewerProtocolPolicy,
    FunctionEventType,
    ResponseHeadersPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import {S3BucketOrigin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53';
import {CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets';
import {Bucket, BucketAccessControl} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {createS3Bucket, StorageClassStrategy} from '@cdk-constructs/s3';
import {CloudFrontS3Props, CloudFrontS3Resources} from '../types/cloudfront-s3';
import {CachePreset} from '../types/cloudfront-enhancements';
import {createResponseHeadersPolicy} from '../util/response-headers';
import {createCachePolicy} from '../util/cache-policy';

/**
 * Creates a standardized CloudFront distribution with an S3 bucket origin.
 *
 * @remarks
 * This construct provisions a complete CloudFront + S3 setup including:
 * - S3 bucket for hosting static assets with configurable storage class
 * - S3 bucket for CloudFront access logs with automatic lifecycle policies
 * - CloudFront distribution with Origin Access Control for secure S3 access
 * - Optional custom domain configuration with ACM certificate
 * - Optional Route 53 A-record for DNS integration
 * - Optional additional S3 origin for configuration files (*.json paths)
 * - Default error responses for SPA applications (404/403 -> index.html)
 *
 * The distribution is configured with:
 * - HTTPS redirect for all requests
 * - Access logging enabled
 * - Configurable price class (defaults to PRICE_CLASS_100 for cost optimization)
 *
 * @param scope - The CDK construct scope
 * @param props - Configuration properties
 * @returns Resources including the distribution and S3 buckets
 *
 * @example
 * ```typescript
 * import { createCloudFrontS3 } from '@cdk-constructs/cloudfront';
 * import { Duration, RemovalPolicy } from 'aws-cdk-lib';
 * import { StorageClassStrategy } from '@cdk-constructs/cloudfront';
 *
 * const { distribution, contentBucket, logBucket } = createCloudFrontS3(this, {
 *   s3: {
 *     bucketName: 'my-static-site-bucket',
 *     versioned: true,
 *     storageClass: {
 *       strategy: StorageClassStrategy.LIFECYCLE_RULE,
 *       config: {
 *         infrequentAccessTransitionAfter: Duration.days(30),
 *         glacierTransitionAfter: Duration.days(90),
 *       },
 *     },
 *   },
 *   cloudfront: {
 *     distributionName: 'my-cloudfront-distribution',
 *     defaultRootObject: 'index.html',
 *     domainNames: ['example.com'],
 *     certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abcd1234-ef56-7890-gh12-ijklmnopqrst',
 *     logBucketName: 'cloudfront-logs-bucket',
 *   },
 *   route53: {
 *     enableR53Lookup: true,
 *     hostedZoneId: 'Z3ABCDEFGHIJKL',
 *     domainName: 'example.com',
 *     aRecordAddress: 'www.example.com',
 *   },
 * });
 * ```
 *
 * @see {@link CloudFrontS3Props} for configuration options
 * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Welcome.html
 * @public
 */
export const createCloudFrontS3 = (scope: Construct, props: CloudFrontS3Props): CloudFrontS3Resources => {
    const contentBucket = createS3Bucket(scope, props.s3);

    const logBucket = createS3Bucket(scope, {
        bucketName: props.cloudfront.logBucketName,
        versioned: false,
        accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
        storageClass: {
            strategy: StorageClassStrategy.LIFECYCLE_RULE,
            config: {
                infrequentAccessTransitionAfter: Duration.days(30),
                glacierTransitionAfter: Duration.days(90),
            },
        },
    });

    logBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const getCertificate = (certificateArn?: string) => {
        return certificateArn ? Certificate.fromCertificateArn(scope, `${props.cloudfront.distributionName}-certificate`, certificateArn) : undefined;
    };

    const getCustomS3Origin = (configBucketName: string, configBucketPath: string) => {
        // Reference the existing S3 bucket
        const existingS3Bucket = Bucket.fromBucketName(scope, `${props.cloudfront.distributionName}-config-bucket`, configBucketName);

        // Use the existing S3 bucket as an origin
        return S3BucketOrigin.withOriginAccessControl(existingS3Bucket, {
            originAccessLevels: [AccessLevel.READ],
            originPath: configBucketPath,
        });
    };

    // Create response headers policy if configured
    const responseHeadersPolicyCfn = props.cloudfront.responseHeadersPolicy
        ? createResponseHeadersPolicy(scope, `${props.cloudfront.distributionName}-response-headers`, props.cloudfront.responseHeadersPolicy)
        : undefined;

    const responseHeadersPolicy = responseHeadersPolicyCfn
        ? ResponseHeadersPolicy.fromResponseHeadersPolicyId(scope, `${props.cloudfront.distributionName}-rhp-ref`, responseHeadersPolicyCfn.attrId)
        : undefined;

    // Create cache policy based on preset or custom configuration
    const cachePolicy = createCachePolicy(
        scope,
        `${props.cloudfront.distributionName}-cache`,
        props.cloudfront.cachePreset ?? CachePreset.SPA,
        props.cloudfront.customCachePolicy
    );

    // Configure origin with optional Origin Shield
    const originConfig = props.cloudfront.originShield?.enabled
        ? {
              originAccessLevels: [AccessLevel.READ],
              originShieldEnabled: true,
              originShieldRegion: props.cloudfront.originShield.originShieldRegion,
          }
        : {
              originAccessLevels: [AccessLevel.READ],
          };

    // Create S3 origin with Origin Shield if configured
    const s3Origin = S3BucketOrigin.withOriginAccessControl(contentBucket, originConfig);

    const defaultErrorResponses = [
        {
            httpStatus: 404,
            responsePagePath: '/',
            responseHttpStatus: 200,
            ttl: Duration.seconds(300),
        },
        {
            httpStatus: 403,
            responsePagePath: '/',
            responseHttpStatus: 200,
            ttl: Duration.seconds(300),
        },
    ];

    // Build function associations for CloudFront Functions
    const functionAssociations = [];
    if (props.cloudfront.cloudfrontFunctions?.viewerRequest) {
        functionAssociations.push({
            function: props.cloudfront.cloudfrontFunctions.viewerRequest,
            eventType: FunctionEventType.VIEWER_REQUEST,
        });
    }
    if (props.cloudfront.cloudfrontFunctions?.viewerResponse) {
        functionAssociations.push({
            function: props.cloudfront.cloudfrontFunctions.viewerResponse,
            eventType: FunctionEventType.VIEWER_RESPONSE,
        });
    }

    // Construct distributionProps, conditionally including domainNames and certificate
    const distributionProps: DistributionProps = {
        defaultBehavior: {
            origin: s3Origin,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
            cachePolicy,
            responseHeadersPolicy,
            functionAssociations: functionAssociations.length > 0 ? functionAssociations : undefined,
        },
        logBucket,
        defaultRootObject: props.cloudfront.defaultRootObject,
        priceClass: props.cloudfront.priceClass ?? PriceClass.PRICE_CLASS_100,
        comment: props.cloudfront.comment ?? `CloudFront distribution for ${props.cloudfront.distributionName}`,
        enableLogging: true,
        errorResponses: props.cloudfront.errorResponses ?? defaultErrorResponses,
        additionalBehaviors:
            props.cloudfront.configBucketName && props.cloudfront.configBucketPath
                ? {
                      '*.json': {
                          origin: getCustomS3Origin(props.cloudfront.configBucketName, props.cloudfront.configBucketPath),
                          viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
                          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                      },
                  }
                : {},
        ...(props.cloudfront.domainNames && props.cloudfront.certificateArn
            ? {
                  domainNames: props.cloudfront.domainNames,
                  certificate: getCertificate(props.cloudfront.certificateArn),
              }
            : {}),
        ...props.cloudfront,
    };

    const distribution = new Distribution(scope, `${props.cloudfront.distributionName}-distribution`, distributionProps);

    if (props.route53.enableR53Lookup && props.route53.hostedZoneId && props.route53.domainName) {
        const hostedZone = HostedZone.fromHostedZoneAttributes(scope, `${props.cloudfront.distributionName}-hosted-zone`, {
            hostedZoneId: props.route53.hostedZoneId,
            zoneName: props.route53.domainName,
        });
        const record = new ARecord(scope, `${props.cloudfront.distributionName}-a-record`, {
            zone: hostedZone,
            recordName: props.route53.aRecordAddress ?? `${props.cloudfront.distributionName}.${props.route53.domainName}`,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        });
        record.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }

    return {
        distribution,
        contentBucket,
        logBucket,
    };
};
