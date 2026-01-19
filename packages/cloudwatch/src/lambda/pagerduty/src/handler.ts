import {Context} from 'aws-lambda';
import {SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {Logger} from 'loglevel';
import {getLogger} from '../../../util/logger';
import {getSecretService} from '../../../services/secret';
import {getPagerDutyService} from '../../../services/pagerduty';
import {PagerDutyService} from '../../../interfaces/pagerduty';
import {PagerDutySecretConfig, PagerDutyEventRequest, PagerDutyLambdaEvent} from '../../../types/pagerduty';
import {DEFAULT_PAGERDUTY_SECRET_NAME, PAGERDUTY_SECRET_NAME_ENV_VAR} from '../../../constant/secret';

/**
 * Initializer for PagerDuty Lambda.
 */
type Initializer = {
    log: Logger;
    pagerDutyConfig: PagerDutySecretConfig;
    pdService: PagerDutyService;
};

/**
 * Gets the PagerDuty secret name from environment variable or default.
 */
const getSecretName = (): string => {
    return process.env[PAGERDUTY_SECRET_NAME_ENV_VAR] || DEFAULT_PAGERDUTY_SECRET_NAME;
};

/**
 * Initializes the Lambda with required dependencies.
 */
const getInitializer = async (): Promise<Initializer> => {
    try {
        const region = process.env.AWS_REGION || 'us-east-1';
        const log = getLogger('pagerduty-cloudwatch-handler');
        log.setLevel('info');

        const smClient = new SecretsManagerClient({region});
        const secretService = getSecretService(smClient, log);
        const secretName = getSecretName();

        log.info(`Loading PagerDuty configuration from secret: ${secretName}`);
        const pagerDutyConfig = await secretService.getPagerDutySecret(secretName);

        const pdService = getPagerDutyService(log);

        return {log, pagerDutyConfig, pdService};
    } catch (error) {
        throw new Error(`Failed to initialize the pagerduty-cloudwatch-handler: ${error}`);
    }
};

/**
 * Validates that all required fields are present in the Lambda input.
 *
 * @throws Error if required fields are missing or invalid
 */
const validateLambdaInput = (input: PagerDutyLambdaEvent): void => {
    // Validate CloudWatch event fields at top level
    if (!input.detail) {
        throw new Error('Missing detail in event');
    }

    const detail = input.detail;

    if (!detail.state || !detail.state.value) {
        throw new Error('Missing state.value in CloudWatch alarm detail');
    }

    if (!detail.previousState || !detail.previousState.value) {
        throw new Error('Missing previousState.value in CloudWatch alarm detail');
    }

    // Validate state values
    const validStates = ['ALARM', 'OK', 'INSUFFICIENT_DATA'];
    if (!validStates.includes(detail.state.value)) {
        throw new Error(`Invalid state: ${detail.state.value}. Expected one of: ${validStates.join(', ')}`);
    }

    // Validate PagerDuty config
    if (!input.pdConfig) {
        throw new Error('Missing pdConfig in input');
    }

    const pdRequiredFields: Array<keyof typeof input.pdConfig> = ['alarmName', 'alarmArn', 'region', 'account', 'severity', 'serviceKey'];

    const missingPdFields = pdRequiredFields.filter(field => !input.pdConfig[field]);

    if (missingPdFields.length > 0) {
        throw new Error(`Missing required PagerDuty fields: ${missingPdFields.join(', ')}`);
    }
};

/**
 * Maps CloudWatch alarm event to PagerDuty EventRequest.
 */
const mapAlarmToEventRequest = (input: PagerDutyLambdaEvent, config: PagerDutySecretConfig, log: Logger): PagerDutyEventRequest => {
    const {detail, pdConfig, time} = input;

    // Look up service configuration from secret
    const serviceConfig = config.services[pdConfig.serviceKey];
    if (!serviceConfig) {
        throw new Error(`Service configuration not found for key: ${pdConfig.serviceKey}`);
    }

    log.info(`Using service configuration for ${pdConfig.serviceKey}:`, {
        team: serviceConfig.team,
        service: serviceConfig.service,
        escalationPolicy: serviceConfig.escalationPolicy,
    });

    // Determine event action based on alarm state
    let eventAction: 'trigger' | 'acknowledge' | 'resolve';
    if (detail.state.value === 'ALARM') {
        eventAction = 'trigger';
    } else if (detail.state.value === 'OK') {
        eventAction = 'resolve';
    } else {
        // INSUFFICIENT_DATA - acknowledge
        eventAction = 'acknowledge';
    }

    const summary = `CloudWatch Alarm: ${pdConfig.alarmName} - ${detail.state.value}`;

    // Use priority from alarm config if provided, otherwise use service default
    const priority = pdConfig.priority || serviceConfig.defaultPriority;

    const eventRequest: PagerDutyEventRequest = {
        routing_key: serviceConfig.integrationKey,
        event_action: eventAction,
        dedup_key: pdConfig.alarmArn, // Use alarm ARN as dedup key for correlation
        payload: {
            summary: summary,
            severity: pdConfig.severity,
            source: `${pdConfig.region}/${pdConfig.account}`,
            timestamp: time,
            component: pdConfig.component,
            group: pdConfig.group,
            class: 'CloudWatch Alarm',
            custom_details: {
                alarm_name: pdConfig.alarmName,
                alarm_arn: pdConfig.alarmArn,
                alarm_description: pdConfig.alarmDescription,
                metric_namespace: pdConfig.metricNamespace,
                metric_name: pdConfig.metricName,
                threshold: pdConfig.threshold,
                current_state: detail.state.value,
                previous_state: detail.previousState.value,
                state_reason: detail.state.reason,
                state_timestamp: detail.state.timestamp,
                account: pdConfig.account,
                region: pdConfig.region,
                priority: priority,
                team: serviceConfig.team,
                service: serviceConfig.service,
                escalation_policy: serviceConfig.escalationPolicy,
            },
        },
        links: [
            {
                href: `https://console.aws.amazon.com/cloudwatch/home?region=${pdConfig.region}#alarmsV2:alarm/${encodeURIComponent(pdConfig.alarmName)}`,
                text: 'View Alarm in AWS Console',
            },
        ],
        client: 'AWS CloudWatch',
        client_url: `https://console.aws.amazon.com/cloudwatch/home?region=${pdConfig.region}`,
    };

    return eventRequest;
};

/**
 * Lambda handler for processing CloudWatch alarm events and sending to PagerDuty.
 *
 * @remarks
 * This handler receives CloudWatch alarm state change events from EventBridge
 * and creates/resolves incidents in PagerDuty accordingly.
 *
 * - ALARM state triggers a new incident
 * - OK state resolves the incident
 * - INSUFFICIENT_DATA acknowledges the incident
 *
 * The alarm ARN is used as the deduplication key to correlate events.
 *
 * @param event - PagerDuty Lambda event containing CloudWatch alarm detail and config
 * @param context - Lambda context
 * @returns Response with status and PagerDuty event details
 */
export const handler = async (event: PagerDutyLambdaEvent, context: Context) => {
    const initializer = await getInitializer();
    const {log, pagerDutyConfig, pdService} = initializer;
    log.debug('Context', context);

    log.info('Initializer loaded successfully');
    log.debug('PagerDuty config services:', Object.keys(pagerDutyConfig.services));

    // Log raw event for debugging
    log.info('Raw Lambda Input Event', JSON.stringify(event, null, 2));

    try {
        // Validate event structure
        validateLambdaInput(event);

        const {detail, pdConfig} = event;

        log.info('CloudWatch Alarm Detail', detail);
        log.info('PagerDuty Config', pdConfig);

        log.info(`Processing alarm: ${pdConfig.alarmName} - State: ${detail.state.value}`);

        // Map alarm data to PagerDuty EventRequest format
        const eventRequest = mapAlarmToEventRequest(event, pagerDutyConfig, log);
        log.info('PagerDuty Event Request', JSON.stringify(eventRequest, null, 2));

        // Send event to PagerDuty
        log.info('Sending PagerDuty event for alarm');
        const eventResponse = await pdService.sendEvent(pagerDutyConfig, eventRequest);

        log.info(`PagerDuty event sent successfully: ${eventResponse.status}`);
        log.info(`Deduplication key: ${eventResponse.dedup_key}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Alarm processed successfully',
                pagerDuty: {
                    status: eventResponse.status,
                    message: eventResponse.message,
                    dedup_key: eventResponse.dedup_key,
                    alarmName: pdConfig.alarmName,
                },
            }),
        };
    } catch (e) {
        log.error('Error processing alarm event', e);
        throw new Error(`Error processing alarm event: ${e}`);
    }
};
