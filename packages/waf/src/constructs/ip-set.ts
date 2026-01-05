import {CfnIPSet} from 'aws-cdk-lib/aws-wafv2';
import {Construct} from 'constructs';
import {IpAddressVersion, IpSetProps, IpSetResources, WebAclScope} from '../types';

/**
 * Creates an IP Set for use with WAF WebACLs.
 *
 * @remarks
 * IP Sets can be used to create allowlists or blocklists of IP addresses.
 * The IP Set must have the same scope as the WebACL that references it.
 *
 * @param scope - The construct scope
 * @param props - IP Set configuration properties
 * @returns IP Set resources including the IP Set and its ARN/ID
 *
 * @example
 * ```typescript
 * import { createIpSet, IpAddressVersion, WebAclScope } from '@cdk-constructs/waf';
 *
 * const { ipSet, ipSetArn } = createIpSet(this, {
 *   name: 'office-allowlist',
 *   addresses: ['203.0.113.0/24', '198.51.100.0/24'],
 *   ipAddressVersion: IpAddressVersion.IPV4,
 *   scope: WebAclScope.REGIONAL,
 *   description: 'Office IP ranges for allowlisting',
 * });
 * ```
 *
 * @see {@link IpSetProps} for configuration options
 * @see https://docs.aws.amazon.com/waf/latest/developerguide/waf-ip-set-creating.html
 * @public
 */
export const createIpSet = (scope: Construct, props: IpSetProps): IpSetResources => {
    const ipSet = new CfnIPSet(scope, props.name, {
        name: props.name,
        addresses: props.addresses,
        ipAddressVersion: props.ipAddressVersion ?? IpAddressVersion.IPV4,
        scope: props.scope ?? WebAclScope.REGIONAL,
        description: props.description,
    });

    return {
        ipSet,
        ipSetArn: ipSet.attrArn,
        ipSetId: ipSet.attrId,
    };
};
