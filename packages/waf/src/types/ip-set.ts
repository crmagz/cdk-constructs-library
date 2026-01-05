import {CfnIPSet} from 'aws-cdk-lib/aws-wafv2';
import {IpAddressVersion, WebAclScope} from './index';

/**
 * Properties for creating an IP Set.
 *
 * @example
 * ```typescript
 * import { createIpSet, IpAddressVersion } from '@cdk-constructs/waf';
 *
 * const { ipSet } = createIpSet(this, {
 *   name: 'office-ips',
 *   addresses: ['192.0.2.0/24', '198.51.100.42/32'],
 *   ipAddressVersion: IpAddressVersion.IPV4,
 *   description: 'Office IP ranges',
 * });
 * ```
 *
 * @public
 */
export type IpSetProps = {
    /** Name of the IP Set */
    name: string;

    /**
     * IP addresses or CIDR blocks to include.
     *
     * @example ['192.0.2.0/24', '198.51.100.42/32']
     */
    addresses: string[];

    /**
     * IP address version.
     *
     * @defaultValue IpAddressVersion.IPV4
     */
    ipAddressVersion?: IpAddressVersion;

    /**
     * Scope of the IP Set.
     *
     * @remarks
     * Must match the scope of WebACLs that reference it.
     *
     * @defaultValue WebAclScope.REGIONAL
     */
    scope?: WebAclScope;

    /** Optional description */
    description?: string;
};

/**
 * Resources created by createIpSet.
 *
 * @public
 */
export type IpSetResources = {
    /** The created IP Set */
    ipSet: CfnIPSet;

    /** ARN of the IP Set */
    ipSetArn: string;

    /** ID of the IP Set */
    ipSetId: string;
};
