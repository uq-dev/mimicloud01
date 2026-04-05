import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/stacks/network-stack';
import { getEnvConfig } from '../lib/config/env';

describe('NetworkStack', () => {
  const envConfig = getEnvConfig('dev');
  const app = new cdk.App();
  const stack = new NetworkStack(app, 'TestNetworkStack', envConfig);
  const template = Template.fromStack(stack);

  test('VPCが作成される', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('S3 GatewayEndpointが作成される', () => {
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
    });
  });

  test('SecurityGroupが2つ作成される（Lambda用・Aurora用）', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  });
});
