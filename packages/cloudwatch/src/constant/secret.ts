/**
 * Default secret name for PagerDuty configuration in AWS Secrets Manager.
 *
 * @remarks
 * This secret should contain a JSON object conforming to PagerDutySecretConfig:
 * ```json
 * {
 *     "apiToken": "your-pagerduty-api-token",
 *     "services": {
 *         "SERVICE_KEY": {
 *             "integrationKey": "routing-key",
 *             "team": "team-id",
 *             "service": "service-id",
 *             "escalationPolicy": "escalation-policy-id",
 *             "defaultPriority": "priority-id"
 *         }
 *     }
 * }
 * ```
 *
 * The secret name can be overridden via the PAGERDUTY_SECRET_NAME environment variable.
 */
export const DEFAULT_PAGERDUTY_SECRET_NAME = 'pagerduty-cloudwatch-integration';

/**
 * Environment variable name for overriding the PagerDuty secret name.
 */
export const PAGERDUTY_SECRET_NAME_ENV_VAR = 'PAGERDUTY_SECRET_NAME';
