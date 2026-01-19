import {Construct} from 'constructs';
import {Topic, Subscription, SubscriptionProtocol, SubscriptionFilter} from 'aws-cdk-lib/aws-sns';
import {IKey, Key} from 'aws-cdk-lib/aws-kms';
import {SnsTopicsProps, SnsTopicConfig, SnsSubscriptionConfig} from '../types/sns';

/**
 * Maps string protocol to CDK SubscriptionProtocol enum.
 */
const getSubscriptionProtocol = (protocol: string): SubscriptionProtocol => {
    switch (protocol.toLowerCase()) {
        case 'email':
            return SubscriptionProtocol.EMAIL;
        case 'sms':
            return SubscriptionProtocol.SMS;
        case 'http':
            return SubscriptionProtocol.HTTP;
        case 'https':
            return SubscriptionProtocol.HTTPS;
        case 'sqs':
            return SubscriptionProtocol.SQS;
        case 'lambda':
            return SubscriptionProtocol.LAMBDA;
        case 'application':
            return SubscriptionProtocol.APPLICATION;
        case 'firehose':
            return SubscriptionProtocol.FIREHOSE;
        default:
            throw new Error(`Unsupported SNS subscription protocol: ${protocol}`);
    }
};

/**
 * Creates SNS topics with subscriptions and templated naming.
 *
 * @remarks
 * This construct creates SNS topics based on the provided configuration array.
 * Each topic can have multiple subscriptions with different protocols.
 * Topic names are templated with environment name and region to avoid conflicts.
 *
 * Features:
 * - Standard and FIFO topic support
 * - Content-based deduplication for FIFO topics
 * - KMS encryption support
 * - Multiple subscription protocols (email, SMS, HTTP/S, SQS, Lambda, etc.)
 * - Subscription filter policies
 * - Raw message delivery option
 *
 * @param scope - The construct scope
 * @param props - Configuration properties
 * @returns Array of created Topic constructs
 *
 * @example
 * ```typescript
 * import {createSnsTopics} from '@cdk-constructs/cloudwatch';
 *
 * const topics = createSnsTopics(this, {
 *     env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
 *     sns: {
 *         topics: [
 *             {
 *                 topicName: 'critical-alerts',
 *                 displayName: 'Critical Alerts',
 *                 subscriptions: [
 *                     {
 *                         id: 'admin-email',
 *                         protocol: 'email',
 *                         endpoint: 'admin@example.com',
 *                         filterPolicy: {severity: ['critical', 'high']}
 *                     }
 *                 ]
 *             }
 *         ]
 *     }
 * });
 * ```
 *
 * @see {@link SnsTopicsProps} for configuration options
 * @see https://docs.aws.amazon.com/sns/latest/dg/welcome.html
 * @public
 */
export const createSnsTopics = (scope: Construct, props: SnsTopicsProps): Topic[] => {
    const createdTopics: Topic[] = [];

    props.sns.topics.forEach((topicConfig: SnsTopicConfig, index: number) => {
        const topicId = `${topicConfig.topicName}-${props.env.name}-${props.env.region}-${index}`;

        // Determine topic name with FIFO suffix if needed
        const topicName = topicConfig.fifo
            ? `${topicConfig.topicName}-${props.env.name}-${props.env.region}.fifo`
            : `${topicConfig.topicName}-${props.env.name}-${props.env.region}`;

        // Get KMS key if specified
        let masterKey: IKey | undefined;
        if (topicConfig.kmsMasterKeyId) {
            if (topicConfig.kmsMasterKeyId.startsWith('alias/')) {
                masterKey = Key.fromLookup(scope, `${topicId}-kms`, {
                    aliasName: topicConfig.kmsMasterKeyId,
                });
            } else {
                // For key IDs, use alias lookup with constructed alias name
                masterKey = Key.fromLookup(scope, `${topicId}-kms`, {
                    aliasName: `alias/${topicConfig.kmsMasterKeyId}`,
                });
            }
        }

        // Create the SNS topic with templated naming
        const topic = new Topic(scope, topicId, {
            topicName,
            displayName: topicConfig.displayName ?? `${topicConfig.topicName} in ${props.env.name}`,
            fifo: topicConfig.fifo ?? false,
            // contentBasedDeduplication is only valid for FIFO topics
            ...(topicConfig.fifo && {contentBasedDeduplication: topicConfig.contentBasedDeduplication ?? false}),
            masterKey,
        });

        // Add tags if provided
        if (topicConfig.tags) {
            Object.entries(topicConfig.tags).forEach(([key, value]) => {
                topic.node.addMetadata(`tag:${key}`, value);
            });
        }

        // Create subscriptions if configured
        if (topicConfig.subscriptions && topicConfig.subscriptions.length > 0) {
            topicConfig.subscriptions.forEach((subscriptionConfig: SnsSubscriptionConfig) => {
                const subscriptionId = `${topicId}-${subscriptionConfig.id}`;

                // Map string protocol to CDK enum
                const protocol = getSubscriptionProtocol(subscriptionConfig.protocol);

                const filterPolicy: Record<string, SubscriptionFilter> | undefined = subscriptionConfig.filterPolicy
                    ? Object.fromEntries(
                          Object.entries(subscriptionConfig.filterPolicy).map(([key, value]) => [
                              key,
                              SubscriptionFilter.stringFilter({
                                  allowlist: Array.isArray(value) ? value.map(String) : [String(value)],
                              }),
                          ])
                      )
                    : undefined;

                // rawMessageDelivery is only supported for HTTP/S, SQS, and Firehose protocols
                const supportsRawDelivery = ['http', 'https', 'sqs', 'firehose'].includes(subscriptionConfig.protocol);
                const rawMessageDelivery = supportsRawDelivery ? subscriptionConfig.rawMessageDelivery : undefined;

                new Subscription(scope, subscriptionId, {
                    topic,
                    protocol,
                    endpoint: subscriptionConfig.endpoint,
                    filterPolicy,
                    rawMessageDelivery,
                });
            });
        }

        createdTopics.push(topic);
    });

    return createdTopics;
};
