import {Account, Region, Environment} from '../src';

/**
 * Test implementation demonstrating usage of AWS enums.
 *
 * This file serves as both a test and an example of how to use
 * the Account, Region, and Environment enums in CDK stacks.
 */

describe('AWS Enums', () => {
    describe('Account Enum', () => {
        it('should have PROD account ID', () => {
            expect(Account.PROD).toBe('260320203318');
        });

        it('should have NONPROD account ID', () => {
            expect(Account.NONPROD).toBe('778359441486');
        });

        it('should be usable in CDK stack context', () => {
            const accountId = Account.PROD;
            expect(typeof accountId).toBe('string');
            expect(accountId.length).toBeGreaterThan(0);
        });
    });

    describe('Region Enum', () => {
        it('should have US_EAST_1 region', () => {
            expect(Region.US_EAST_1).toBe('us-east-1');
        });

        it('should have US_EAST_2 region', () => {
            expect(Region.US_EAST_2).toBe('us-east-2');
        });

        it('should have US_WEST_1 region', () => {
            expect(Region.US_WEST_1).toBe('us-west-1');
        });

        it('should have US_WEST_2 region', () => {
            expect(Region.US_WEST_2).toBe('us-west-2');
        });

        it('should be usable in CDK stack context', () => {
            const region = Region.US_EAST_1;
            expect(typeof region).toBe('string');
            expect(region).toMatch(/^us-[a-z]+-[0-9]+$/);
        });
    });

    describe('Environment Enum', () => {
        it('should have BUILD environment', () => {
            expect(Environment.BUILD).toBe('build');
        });

        it('should have DEV environment', () => {
            expect(Environment.DEV).toBe('dev');
        });

        it('should have STAGING environment', () => {
            expect(Environment.STAGING).toBe('staging');
        });

        it('should have PROD environment', () => {
            expect(Environment.PROD).toBe('prod');
        });

        it('should be usable in CDK stack context', () => {
            const env = Environment.PROD;
            expect(typeof env).toBe('string');
            expect(['build', 'dev', 'staging', 'prod']).toContain(env);
        });
    });

    describe('Integration Example', () => {
        it('should work together in a CDK stack configuration', () => {
            // Example CDK stack configuration
            const stackConfig = {
                account: Account.PROD,
                region: Region.US_EAST_1,
                environment: Environment.PROD,
            };

            expect(stackConfig.account).toBe(Account.PROD);
            expect(stackConfig.region).toBe(Region.US_EAST_1);
            expect(stackConfig.environment).toBe(Environment.PROD);
        });
    });
});
