/**
 * AWS Region enumeration.
 *
 * This enum provides a centralized way to reference AWS regions
 * used across different environments and services.
 *
 * @example
 * ```typescript
 * import { Region } from '@cdk-constructs/aws';
 *
 * const region = Region.US_EAST_1;
 * ```
 *
 * @public
 */
export enum Region {
    /**
     * US East (N. Virginia) region.
     *
     * @remarks
     * Region code: us-east-1
     * This is one of the most commonly used AWS regions and typically
     * has the lowest latency for US-based applications.
     */
    US_EAST_1 = 'us-east-1',

    /**
     * US East (Ohio) region.
     *
     * @remarks
     * Region code: us-east-2
     * Secondary US East region providing geographic redundancy.
     */
    US_EAST_2 = 'us-east-2',

    /**
     * US West (N. California) region.
     *
     * @remarks
     * Region code: us-west-1
     * West coast region for lower latency to Pacific coast users.
     */
    US_WEST_1 = 'us-west-1',

    /**
     * US West (Oregon) region.
     *
     * @remarks
     * Region code: us-west-2
     * Commonly used west coast region with good service availability.
     */
    US_WEST_2 = 'us-west-2',
}
