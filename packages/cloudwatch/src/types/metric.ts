import {Duration} from 'aws-cdk-lib';

/**
 * Configuration for a CloudWatch metric.
 *
 * @remarks
 * Defines the metric to monitor for a CloudWatch alarm. The metric is identified
 * by its namespace, name, and optional dimensions.
 *
 * @example
 * ```typescript
 * const metricConfig: CloudWatchMetricConfig = {
 *     namespace: 'AWS/Lambda',
 *     metricName: 'Duration',
 *     statistic: 'Average',
 *     period: Duration.minutes(5),
 *     dimensionsMap: { FunctionName: 'my-function' }
 * };
 * ```
 */
export type CloudWatchMetricConfig = {
    /**
     * The namespace for the CloudWatch metric.
     *
     * @example 'AWS/Lambda', 'AWS/ApiGateway', 'Custom/MyApp'
     */
    namespace: string;

    /**
     * The name of the metric.
     *
     * @example 'Duration', 'Errors', '5XXError'
     */
    metricName: string;

    /**
     * The statistic to apply to the metric.
     *
     * @example 'Average', 'Sum', 'Minimum', 'Maximum', 'p99'
     */
    statistic: string;

    /**
     * The period over which the statistic is calculated.
     *
     * @default Duration.minutes(5)
     */
    period?: Duration;

    /**
     * Dimensions for the metric to filter the data.
     *
     * @example { FunctionName: 'my-lambda-function', Resource: 'my-resource' }
     */
    dimensionsMap?: Record<string, string>;
};
