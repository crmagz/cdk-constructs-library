import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {Logger} from 'loglevel';
import {SecretService} from '../interfaces/secret';
import {PagerDutySecretConfig} from '../types/pagerduty';

/**
 * Creates a secret service for retrieving secrets from AWS Secrets Manager.
 *
 * @remarks
 * This service retrieves and validates PagerDuty configuration from Secrets Manager.
 * It performs validation to ensure all required fields are present.
 *
 * @param smClient - AWS Secrets Manager client
 * @param log - Logger instance for debugging and error reporting
 * @returns SecretService instance
 *
 * @example
 * ```typescript
 * const smClient = new SecretsManagerClient({ region: 'us-east-1' });
 * const secretService = getSecretService(smClient, logger);
 * const config = await secretService.getPagerDutySecret('my-secret-name');
 * ```
 */
export const getSecretService = (smClient: SecretsManagerClient, log: Logger): SecretService => {
    const getPagerDutySecret = async (secretName: string): Promise<PagerDutySecretConfig> => {
        try {
            const secret = await smClient.send(new GetSecretValueCommand({SecretId: secretName}));

            if (!secret.SecretString) {
                throw new Error('Secret is empty');
            }

            const pagerDutySecret = JSON.parse(secret.SecretString) as PagerDutySecretConfig;

            // Validate required fields
            if (!pagerDutySecret.apiToken) {
                throw new Error('apiToken is missing, not a valid PagerDutySecretConfig');
            }

            if (!pagerDutySecret.services) {
                throw new Error('services is missing, not a valid PagerDutySecretConfig');
            }

            if (typeof pagerDutySecret.services !== 'object') {
                throw new Error('services must be an object');
            }

            // Validate each service configuration
            Object.entries(pagerDutySecret.services).forEach(([serviceKey, serviceConfig]) => {
                if (!serviceConfig.integrationKey) {
                    throw new Error(`integrationKey is missing for service ${serviceKey}`);
                }
                if (!serviceConfig.team) {
                    throw new Error(`team is missing for service ${serviceKey}`);
                }
                if (!serviceConfig.service) {
                    throw new Error(`service is missing for service ${serviceKey}`);
                }
                if (!serviceConfig.escalationPolicy) {
                    throw new Error(`escalationPolicy is missing for service ${serviceKey}`);
                }
                if (!serviceConfig.defaultPriority) {
                    throw new Error(`defaultPriority is missing for service ${serviceKey}`);
                }
            });

            log.info('PagerDuty secret retrieved successfully');
            log.info(`Loaded ${Object.keys(pagerDutySecret.services).length} service configurations`);

            return pagerDutySecret;
        } catch (error) {
            throw new Error(`Failed to get PagerDuty secret: ${error}`);
        }
    };

    return {
        getPagerDutySecret,
    };
};
