import {PagerDutySecretConfig, PagerDutyEventRequest, PagerDutyEventResponse} from '../types/pagerduty';

/**
 * Interface for PagerDuty Events API integration.
 *
 * @remarks
 * Defines the contract for sending events to PagerDuty's Events API v2.
 */
export interface PagerDutyService {
    /**
     * Sends an event to PagerDuty Events API v2.
     *
     * @param config - PagerDuty configuration with API token
     * @param eventRequest - The event request payload
     * @returns Promise with the event response
     */
    sendEvent(config: PagerDutySecretConfig, eventRequest: PagerDutyEventRequest): Promise<PagerDutyEventResponse>;
}
