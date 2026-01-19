import {Logger} from 'loglevel';
import axios from 'axios';
import {PagerDutyService} from '../interfaces/pagerduty';
import {PagerDutySecretConfig, PagerDutyEventRequest, PagerDutyEventResponse} from '../types/pagerduty';
import {PAGER_DUTY_EVENTS_URL} from '../constant/pagerduty';

/**
 * Creates a PagerDuty service for sending events to the PagerDuty Events API v2.
 *
 * @remarks
 * This service handles sending trigger, acknowledge, and resolve events to PagerDuty.
 * It uses the Events API v2 endpoint and requires a valid integration key.
 *
 * @param log - Logger instance for debugging and error reporting
 * @returns PagerDutyService instance
 *
 * @example
 * ```typescript
 * const pdService = getPagerDutyService(logger);
 * const response = await pdService.sendEvent(config, eventRequest);
 * ```
 */
export const getPagerDutyService = (log: Logger): PagerDutyService => {
    const sendEvent = async (config: PagerDutySecretConfig, eventRequest: PagerDutyEventRequest): Promise<PagerDutyEventResponse> => {
        log.debug('Sending PagerDuty event with payload:', JSON.stringify(eventRequest, null, 2));

        try {
            const response = await axios.post(PAGER_DUTY_EVENTS_URL, eventRequest, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.pagerduty+json;version=2',
                    Authorization: `Token token=${config.apiToken}`,
                },
            });

            if (!response.data.status) {
                throw new Error('Status not found in PagerDuty response');
            }

            log.info(`PagerDuty event sent successfully with status ${response.status}`);

            return {
                status: response.data.status,
                message: response.data.message || 'Event processed',
                dedup_key: response.data.dedup_key,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorDetails = JSON.stringify(error.response?.data, null, 2) || error.message;
                log.error('Error sending PagerDuty event:', errorDetails);
                throw new Error(`Failed to send PagerDuty event: ${errorDetails}`);
            } else {
                log.error('Error sending PagerDuty event:', error);
                throw new Error(`Failed to send PagerDuty event: ${error}`);
            }
        }
    };

    return {
        sendEvent,
    };
};
