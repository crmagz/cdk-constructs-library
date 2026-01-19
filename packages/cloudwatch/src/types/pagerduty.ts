import {PagerDutySeverity, PagerDutyPriority} from '../enum/pagerduty';
import {CloudWatchAlarmDetail} from './cloudwatch-event';

/**
 * Service-specific integration configuration from Secrets Manager.
 *
 * @remarks
 * Each PagerDuty service has its own integration key, team, and escalation policy.
 * This configuration is stored in Secrets Manager and retrieved at runtime.
 */
export type ServiceIntegrationConfig = {
    /** PagerDuty integration key (routing key) for this service */
    integrationKey: string;

    /** Team ID for this service */
    team: string;

    /** Service ID */
    service: string;

    /** Escalation policy ID */
    escalationPolicy: string;

    /** Default priority ID for incidents (PagerDuty priority ID) */
    defaultPriority: string;
};

/**
 * PagerDuty configuration from Secrets Manager.
 *
 * @remarks
 * This configuration is stored in AWS Secrets Manager and contains
 * the API token and service-specific integration settings.
 *
 * @example
 * ```json
 * {
 *     "apiToken": "your-pagerduty-api-token",
 *     "services": {
 *         "INFRASTRUCTURE": {
 *             "integrationKey": "integration-key-here",
 *             "team": "team-id",
 *             "service": "service-id",
 *             "escalationPolicy": "escalation-policy-id",
 *             "defaultPriority": "priority-id"
 *         }
 *     }
 * }
 * ```
 */
export type PagerDutySecretConfig = {
    /** PagerDuty API token (Events API v2) */
    apiToken: string;

    /**
     * Service integrations mapped by service key.
     *
     * @remarks
     * The key is a logical service identifier used in alarm configuration.
     * The value contains the PagerDuty-specific IDs for that service.
     */
    services: Record<string, ServiceIntegrationConfig>;
};

/**
 * PagerDuty Events API v2 event request.
 *
 * @remarks
 * This is the payload sent to PagerDuty's Events API to trigger, acknowledge,
 * or resolve an incident.
 *
 * @see https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-send-an-event-to-pagerduty
 */
export type PagerDutyEventRequest = {
    /** The integration key (routing key) for the service */
    routing_key: string;

    /** The type of event action */
    event_action: 'trigger' | 'acknowledge' | 'resolve';

    /** Deduplication key for correlating triggers and resolves */
    dedup_key?: string;

    /** The event payload */
    payload: {
        /** Brief text summary of the event */
        summary: string;

        /** Perceived severity of the event */
        severity: PagerDutySeverity;

        /** Unique location of the affected system */
        source: string;

        /** ISO 8601 timestamp when the event occurred */
        timestamp?: string;

        /** Component of the source machine responsible for the event */
        component?: string;

        /** Logical grouping of components */
        group?: string;

        /** Class/type of the event */
        class?: string;

        /** Additional details about the event */
        custom_details?: Record<string, unknown>;
    };

    /** Images to include in the incident */
    images?: Array<{
        src: string;
        href?: string;
        alt?: string;
    }>;

    /** Links to include in the incident */
    links?: Array<{
        href: string;
        text?: string;
    }>;

    /** Client name for tracking event source */
    client?: string;

    /** Client URL for tracking event source */
    client_url?: string;
};

/**
 * PagerDuty Events API v2 response.
 */
export type PagerDutyEventResponse = {
    /** Status of the event submission */
    status: string;

    /** Message from PagerDuty API */
    message: string;

    /** Deduplication key for the event */
    dedup_key?: string;
};

/**
 * PagerDuty alarm configuration metadata for the Lambda handler.
 *
 * @remarks
 * This configuration is passed from EventBridge to the PagerDuty Lambda handler.
 * It contains alarm-specific information and PagerDuty routing details.
 */
export type PagerDutyLambdaConfig = {
    /** Name of the CloudWatch alarm */
    alarmName: string;

    /** ARN of the CloudWatch alarm */
    alarmArn: string;

    /** Description of the alarm */
    alarmDescription: string;

    /** AWS region where the alarm is defined */
    region: string;

    /** AWS account ID where the alarm is defined */
    account: string;

    /** Alarm threshold value */
    threshold: number;

    /** CloudWatch metric namespace */
    metricNamespace: string;

    /** CloudWatch metric name */
    metricName: string;

    /**
     * Service key to look up configuration in Secrets Manager.
     *
     * @remarks
     * This key is used to find the service-specific integration config
     * (integration key, team, escalation policy) from the secret.
     */
    serviceKey: string;

    /** Event severity level */
    severity: PagerDutySeverity;

    /** Optional priority level (overrides service default) */
    priority?: PagerDutyPriority;

    /** Optional component name */
    component?: string;

    /** Optional group name */
    group?: string;
};

/**
 * Lambda input event for PagerDuty handler.
 *
 * @remarks
 * This is the event structure received by the PagerDuty Lambda from EventBridge.
 * It contains CloudWatch alarm event fields plus PagerDuty-specific configuration.
 */
export type PagerDutyLambdaEvent = {
    /** Event source (always 'aws.cloudwatch') */
    source: string;

    /** Event type (always 'CloudWatch Alarm State Change') */
    'detail-type': string;

    /** ISO 8601 timestamp of the event */
    time: string;

    /** AWS region */
    region: string;

    /** AWS account ID */
    account: string;

    /** CloudWatch alarm state change detail */
    detail: CloudWatchAlarmDetail;

    /** PagerDuty configuration for this alarm */
    pdConfig: PagerDutyLambdaConfig;
};
