/**
 * AWS Account ID enumeration.
 *
 * This enum provides a centralized way to reference AWS account IDs
 * used across different environments and regions.
 *
 * @example
 * ```typescript
 * import { Account } from '@cdk-constructs/aws';
 *
 * const accountId = Account.PROD;
 * ```
 *
 * @public
 */
export enum Account {
    /**
     * Production account ID.
     *
     * @remarks
     * This account is used for production workloads and should have
     * strict security and compliance controls.
     */
    PROD = '260320203318',

    /**
     * Non-production account ID.
     *
     * @remarks
     * This account is used for development, staging, and testing environments.
     * It may have relaxed security controls compared to production.
     */
    NONPROD = '778359441486',
}
