import {App, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {createSnsTopics} from '../src';

describe('createSnsTopics', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates standard topic with minimal configuration', () => {
        const topics = createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'test-alerts',
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.hasResourceProperties('AWS::SNS::Topic', {
            TopicName: 'test-alerts-dev-us-east-1',
        });

        expect(topics).toHaveLength(1);
        expect(topics[0]).toBeDefined();
    });

    test('creates topic with display name', () => {
        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'critical-alerts',
                        displayName: 'Critical Alerts Topic',
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::SNS::Topic', {
            TopicName: 'critical-alerts-dev-us-east-1',
            DisplayName: 'Critical Alerts Topic',
        });
    });

    test('creates FIFO topic with content-based deduplication', () => {
        createSnsTopics(stack, {
            env: {name: 'prod', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'order-events',
                        fifo: true,
                        contentBasedDeduplication: true,
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::SNS::Topic', {
            TopicName: 'order-events-prod-us-east-1.fifo',
            FifoTopic: true,
            ContentBasedDeduplication: true,
        });
    });

    test('creates topic with email subscription', () => {
        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'alerts',
                        subscriptions: [
                            {
                                id: 'admin-email',
                                protocol: 'email',
                                endpoint: 'admin@example.com',
                            },
                        ],
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.resourceCountIs('AWS::SNS::Subscription', 1);
        template.hasResourceProperties('AWS::SNS::Subscription', {
            Protocol: 'email',
            Endpoint: 'admin@example.com',
        });
    });

    test('creates topic with multiple subscriptions', () => {
        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'notifications',
                        subscriptions: [
                            {
                                id: 'email-1',
                                protocol: 'email',
                                endpoint: 'team@example.com',
                            },
                            {
                                id: 'sqs-queue',
                                protocol: 'sqs',
                                endpoint: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
                            },
                        ],
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::SNS::Subscription', 2);
        template.hasResourceProperties('AWS::SNS::Subscription', {
            Protocol: 'email',
            Endpoint: 'team@example.com',
        });
        template.hasResourceProperties('AWS::SNS::Subscription', {
            Protocol: 'sqs',
            Endpoint: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
        });
    });

    test('creates subscription with filter policy', () => {
        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'filtered-alerts',
                        subscriptions: [
                            {
                                id: 'critical-only',
                                protocol: 'email',
                                endpoint: 'oncall@example.com',
                                filterPolicy: {
                                    severity: ['critical', 'high'],
                                },
                            },
                        ],
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::SNS::Subscription', {
            FilterPolicy: {
                severity: Match.arrayWith(['critical', 'high']),
            },
        });
    });

    test('creates subscription with raw message delivery', () => {
        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'raw-events',
                        subscriptions: [
                            {
                                id: 'sqs-raw',
                                protocol: 'sqs',
                                endpoint: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
                                rawMessageDelivery: true,
                            },
                        ],
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::SNS::Subscription', {
            RawMessageDelivery: true,
        });
    });

    test('creates multiple topics', () => {
        const topics = createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [{topicName: 'alerts-critical'}, {topicName: 'alerts-warning'}, {topicName: 'alerts-info'}],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::SNS::Topic', 3);
        expect(topics).toHaveLength(3);
    });

    test('supports all subscription protocols', () => {
        const protocols = ['email', 'sms', 'http', 'https', 'sqs', 'lambda'];

        createSnsTopics(stack, {
            env: {name: 'dev', region: 'us-east-1', account: '123456789012'},
            sns: {
                topics: [
                    {
                        topicName: 'multi-protocol',
                        subscriptions: protocols.map((protocol, i) => ({
                            id: `sub-${protocol}`,
                            protocol: protocol as 'email' | 'sms' | 'http' | 'https' | 'sqs' | 'lambda',
                            endpoint:
                                protocol === 'email'
                                    ? 'test@example.com'
                                    : protocol === 'sms'
                                      ? '+1234567890'
                                      : protocol === 'http' || protocol === 'https'
                                        ? 'https://example.com/webhook'
                                        : `arn:aws:${protocol}:us-east-1:123456789012:resource-${i}`,
                        })),
                    },
                ],
            },
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::SNS::Subscription', protocols.length);
    });
});
