/**
 * SNS subscription protocol types.
 *
 * @remarks
 * Supported protocols for SNS topic subscriptions.
 */
export type SnsSubscriptionProtocol = 'email' | 'sms' | 'http' | 'https' | 'sqs' | 'lambda' | 'application' | 'firehose';

/**
 * Configuration for an SNS topic subscription.
 *
 * @remarks
 * Defines how messages from an SNS topic are delivered to a subscriber.
 *
 * @example
 * ```typescript
 * const subscription: SnsSubscriptionConfig = {
 *     id: 'admin-email',
 *     protocol: 'email',
 *     endpoint: 'admin@example.com',
 *     filterPolicy: { severity: ['critical', 'high'] }
 * };
 * ```
 */
export type SnsSubscriptionConfig = {
    /**
     * Unique identifier for the subscription.
     *
     * @example 'admin-email', 'ops-sqs-queue'
     */
    id: string;

    /**
     * The subscription protocol.
     *
     * @example 'email', 'sqs', 'lambda'
     */
    protocol: SnsSubscriptionProtocol;

    /**
     * The subscription endpoint.
     *
     * @remarks
     * The format depends on the protocol:
     * - email: email address
     * - sms: phone number
     * - http/https: URL
     * - sqs: SQS queue ARN
     * - lambda: Lambda function ARN
     *
     * @example 'admin@example.com', 'arn:aws:sqs:us-east-1:123456789012:my-queue'
     */
    endpoint: string;

    /**
     * Filter policy for the subscription.
     *
     * @remarks
     * Messages that don't match the filter policy are not delivered to this subscription.
     *
     * @example { eventType: ['error', 'warning'], severity: ['high'] }
     */
    filterPolicy?: Record<string, string | string[] | number | boolean>;

    /**
     * Whether to enable raw message delivery.
     *
     * @remarks
     * When true, the message is delivered as-is without JSON formatting.
     * Only applicable for SQS, HTTP/S, and Firehose subscriptions.
     *
     * @default false
     */
    rawMessageDelivery?: boolean;
};

/**
 * Configuration for an SNS topic.
 *
 * @remarks
 * Defines an SNS topic with optional subscriptions and encryption.
 *
 * @example
 * ```typescript
 * const topic: SnsTopicConfig = {
 *     topicName: 'critical-alerts',
 *     displayName: 'Critical Alerts',
 *     subscriptions: [
 *         { id: 'admin', protocol: 'email', endpoint: 'admin@example.com' }
 *     ]
 * };
 * ```
 */
export type SnsTopicConfig = {
    /**
     * The name of the SNS topic.
     *
     * @remarks
     * The final topic name will be templated with environment and region.
     *
     * @example 'critical-alerts', 'order-notifications'
     */
    topicName: string;

    /**
     * Display name for the topic.
     *
     * @remarks
     * Used as the "from" name for SMS messages.
     */
    displayName?: string;

    /**
     * Whether this is a FIFO topic.
     *
     * @remarks
     * FIFO topics guarantee message ordering and exactly-once delivery.
     *
     * @default false
     */
    fifo?: boolean;

    /**
     * Enable content-based deduplication for FIFO topics.
     *
     * @remarks
     * Only applicable when fifo is true. Uses message content to generate
     * deduplication ID instead of requiring explicit IDs.
     *
     * @default false
     */
    contentBasedDeduplication?: boolean;

    /**
     * KMS key ID or alias for server-side encryption.
     *
     * @example 'alias/aws/sns', '1234abcd-12ab-34cd-56ef-1234567890ab'
     */
    kmsMasterKeyId?: string;

    /**
     * Subscriptions for this topic.
     */
    subscriptions?: SnsSubscriptionConfig[];

    /**
     * Tags for the topic.
     */
    tags?: Record<string, string>;
};

/**
 * Configuration for multiple SNS topics.
 */
export type SnsTopicsConfig = {
    /** Array of SNS topic configurations */
    topics: SnsTopicConfig[];
};

/**
 * Environment configuration for constructs.
 *
 * @remarks
 * Provides environment context for resource naming and configuration.
 */
export type EnvironmentConfig = {
    env: {
        /** Environment name (e.g., 'dev', 'staging', 'prod') */
        name: string;
        /** AWS region (e.g., 'us-east-1') */
        region: string;
        /** AWS account ID */
        account: string;
    };
};

/**
 * Props for creating SNS topics.
 *
 * @remarks
 * Combines environment configuration with SNS topics configuration.
 */
export type SnsTopicsProps = EnvironmentConfig & {
    /** SNS topics configuration */
    sns: SnsTopicsConfig;
};
