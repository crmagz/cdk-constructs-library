import {PagerDutySecretConfig} from '../types/pagerduty';

/**
 * Interface for retrieving secrets from AWS Secrets Manager.
 *
 * @remarks
 * Defines the contract for accessing PagerDuty configuration stored in Secrets Manager.
 */
export interface SecretService {
    /**
     * Retrieves PagerDuty configuration from Secrets Manager.
     *
     * @param secretName - The name or ARN of the secret
     * @returns Promise with the parsed PagerDuty configuration
     * @throws Error if the secret is missing or invalid
     */
    getPagerDutySecret(secretName: string): Promise<PagerDutySecretConfig>;
}
