/**
 * Raw CloudWatch Alarm State Change event detail from EventBridge.
 *
 * @remarks
 * This type represents the `detail` field of a CloudWatch Alarm State Change
 * event received via EventBridge. It contains information about the current
 * and previous alarm states.
 *
 * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-and-eventbridge.html
 */
export type CloudWatchAlarmDetail = {
    /** The name of the alarm */
    alarmName: string;

    /** Current state of the alarm */
    state: {
        /** State value: 'ALARM', 'OK', or 'INSUFFICIENT_DATA' */
        value: string;
        /** Reason for the state change */
        reason: string;
        /** ISO 8601 timestamp of the state change */
        timestamp: string;
    };

    /** Previous state of the alarm */
    previousState: {
        /** State value: 'ALARM', 'OK', or 'INSUFFICIENT_DATA' */
        value: string;
        /** Reason for the previous state */
        reason: string;
        /** ISO 8601 timestamp of the previous state */
        timestamp: string;
    };

    /** Optional alarm configuration details */
    configuration?: {
        /** Alarm description */
        description?: string;
    };
};
