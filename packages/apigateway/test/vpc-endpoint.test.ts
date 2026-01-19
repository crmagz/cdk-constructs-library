import {App, Stack} from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {createApiGatewayVpcEndpoint, lookupVpcEndpoint} from '../src';

describe('createApiGatewayVpcEndpoint', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('creates Interface VPC Endpoint for API Gateway', () => {
        // Note: Vpc.fromLookup requires context during synth
        // In tests, CDK uses a dummy VPC with 2 public and 2 private subnets
        createApiGatewayVpcEndpoint(stack, {
            endpointName: 'test-endpoint',
            vpcId: 'vpc-12345',
            allowedCidrBlocks: ['10.0.0.0/16'],
        });

        const template = Template.fromStack(stack);

        // Verify VPC endpoint created
        template.resourceCountIs('AWS::EC2::VPCEndpoint', 1);
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
            VpcEndpointType: 'Interface',
            ServiceName: Match.stringLikeRegexp('execute-api'),
            PrivateDnsEnabled: true,
        });
    });

    test('configures security group with HTTPS ingress', () => {
        createApiGatewayVpcEndpoint(stack, {
            endpointName: 'sg-test-endpoint',
            vpcId: 'vpc-12345',
            allowedCidrBlocks: ['10.0.0.0/16', '192.168.0.0/16'],
        });

        const template = Template.fromStack(stack);

        // Verify security group created
        template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

        // Verify HTTPS ingress rules
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            SecurityGroupIngress: Match.arrayWith([
                Match.objectLike({
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443,
                    CidrIp: '10.0.0.0/16',
                }),
                Match.objectLike({
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443,
                    CidrIp: '192.168.0.0/16',
                }),
            ]),
        });
    });

    test('uses private subnets from VPC lookup', () => {
        createApiGatewayVpcEndpoint(stack, {
            endpointName: 'subnet-test-endpoint',
            vpcId: 'vpc-12345',
            allowedCidrBlocks: ['10.0.0.0/8'],
        });

        const template = Template.fromStack(stack);

        // Verify endpoint has subnet IDs (from dummy VPC in test context)
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
            SubnetIds: Match.anyValue(),
        });
    });

    test('returns endpoint ID for use with private APIs', () => {
        const resources = createApiGatewayVpcEndpoint(stack, {
            endpointName: 'id-test-endpoint',
            vpcId: 'vpc-12345',
            allowedCidrBlocks: ['10.0.0.0/16'],
        });

        expect(resources).toHaveProperty('endpoint');
        expect(resources).toHaveProperty('securityGroup');
        expect(resources).toHaveProperty('endpointId');
        expect(resources.endpointId).toBeDefined();
    });

    test('sets security group name and description', () => {
        createApiGatewayVpcEndpoint(stack, {
            endpointName: 'named-endpoint',
            vpcId: 'vpc-12345',
            allowedCidrBlocks: ['10.0.0.0/16'],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupName: 'named-endpoint-sg',
            GroupDescription: 'Security group for API Gateway VPC endpoint named-endpoint',
        });
    });
});

describe('lookupVpcEndpoint', () => {
    let app: App;
    let stack: Stack;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack', {
            env: {region: 'us-east-1', account: '123456789012'},
        });
    });

    test('returns VPC endpoint from ID', () => {
        const endpoint = lookupVpcEndpoint(stack, 'vpce-12345678');

        expect(endpoint).toBeDefined();
        expect(endpoint.vpcEndpointId).toBe('vpce-12345678');
    });

    test('has IVpcEndpoint interface properties', () => {
        const endpoint = lookupVpcEndpoint(stack, 'vpce-abcdef12');

        // Verify it has IVpcEndpoint properties
        expect(endpoint.vpcEndpointId).toBe('vpce-abcdef12');
        expect(endpoint.stack).toBe(stack);
    });
});
