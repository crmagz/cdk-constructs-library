/**
 * PagerDuty severity levels.
 *
 * @remarks
 * Severity levels indicate the impact of an incident on the system.
 * These map directly to PagerDuty Events API v2 severity values and are
 * standardized across all PagerDuty accounts.
 *
 * @see https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-send-an-event-to-pagerduty
 */
export enum PagerDutySeverity {
    /**
     * Critical - System is completely down or unusable.
     * Requires immediate attention.
     */
    CRITICAL = 'critical',

    /**
     * Error - Major functionality is severely impaired.
     * Requires urgent attention.
     */
    ERROR = 'error',

    /**
     * Warning - Minor functionality is impaired.
     * Should be addressed soon.
     */
    WARNING = 'warning',

    /**
     * Info - Informational event.
     * No immediate action required.
     */
    INFO = 'info',
}

/**
 * PagerDuty priority levels.
 *
 * @remarks
 * **IMPORTANT:** Priority IDs are organization-specific in PagerDuty.
 * The values in this enum are placeholders. You MUST look up your
 * organization's actual priority IDs using the PagerDuty API.
 *
 * ## How to find your organization's priority IDs:
 *
 * ### Option 1: Use the PagerDuty API
 * ```bash
 * curl -X GET 'https://api.pagerduty.com/priorities' \
 *   -H 'Authorization: Token token=YOUR_API_TOKEN' \
 *   -H 'Content-Type: application/json'
 * ```
 *
 * ### Option 2: PagerDuty Web UI
 * Navigate to: Settings > Account Settings > Priorities
 *
 * ## Example API Response:
 * ```json
 * {
 *   "priorities": [
 *     { "id": "PXYZ123", "name": "P1", "color": "#a8171c" },
 *     { "id": "PABC456", "name": "P2", "color": "#eb6016" },
 *     { "id": "PDEF789", "name": "P3", "color": "#f9b406" },
 *     { "id": "PGHI012", "name": "P4", "color": "#555555" },
 *     { "id": "PJKL345", "name": "P5", "color": "#555555" }
 *   ]
 * }
 * ```
 *
 * ## Creating your own priority enum:
 * After looking up your priority IDs, create your own enum:
 *
 * ```typescript
 * // my-org-pagerduty.ts
 * export enum MyOrgPagerDutyPriority {
 *     P1 = 'PXYZ123',  // Your org's P1 ID
 *     P2 = 'PABC456',  // Your org's P2 ID
 *     P3 = 'PDEF789',  // Your org's P3 ID
 *     P4 = 'PGHI012',  // Your org's P4 ID
 *     P5 = 'PJKL345',  // Your org's P5 ID
 * }
 * ```
 *
 * @see https://api.pagerduty.com/priorities - PagerDuty Priorities API
 * @see https://developer.pagerduty.com/api-reference/c2NoOjI3NDgxMjA-list-priorities
 */
export enum PagerDutyPriority {
    /**
     * P1 - Highest priority, critical business impact.
     * @remarks Replace with your organization's P1 priority ID from the API.
     */
    P1 = 'P1',

    /**
     * P2 - High priority, significant business impact.
     * @remarks Replace with your organization's P2 priority ID from the API.
     */
    P2 = 'P2',

    /**
     * P3 - Medium priority, moderate business impact.
     * @remarks Replace with your organization's P3 priority ID from the API.
     */
    P3 = 'P3',

    /**
     * P4 - Low priority, minimal business impact.
     * @remarks Replace with your organization's P4 priority ID from the API.
     */
    P4 = 'P4',

    /**
     * P5 - Lowest priority, negligible business impact.
     * @remarks Replace with your organization's P5 priority ID from the API.
     */
    P5 = 'P5',
}
