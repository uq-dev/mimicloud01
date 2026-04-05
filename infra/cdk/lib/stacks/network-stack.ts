import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSg: ec2.SecurityGroup;
  public readonly auroraSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, envConfig: EnvConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    const { envName, vpcCidr } = envConfig;

    // タグ付与
    Object.entries(commonTags(envName, 'network-stack')).forEach(([k, v]) =>
      cdk.Tags.of(this).add(k, v)
    );

    // VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: resourceName(envName, 'vpc'),
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      natGateways: 0,  // 現時点ではNAT不要（Lambda→外部API不要なため）
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: resourceName(envName, 'subnet-pub'),
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: resourceName(envName, 'subnet-prv'),
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 GatewayEndpoint（Private subnetからS3にアクセスするため）
    this.vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // DynamoDB GatewayEndpoint
    this.vpc.addGatewayEndpoint('DynamoDbGatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Lambda用セキュリティグループ
    this.lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
      securityGroupName: resourceName(envName, 'sg', 'lambda'),
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });
    cdk.Tags.of(this.lambdaSg).add('Name', resourceName(envName, 'sg', 'lambda'));

    // Aurora用セキュリティグループ
    this.auroraSg = new ec2.SecurityGroup(this, 'AuroraSg', {
      securityGroupName: resourceName(envName, 'sg', 'aurora'),
      vpc: this.vpc,
      description: 'Security group for Aurora Serverless',
      allowAllOutbound: false,
    });
    cdk.Tags.of(this.auroraSg).add('Name', resourceName(envName, 'sg', 'aurora'));

    // LambdaからAuroraへのアクセスを許可（PostgreSQLポート: 5432）
    this.auroraSg.addIngressRule(
      this.lambdaSg,
      ec2.Port.tcp(5432),
      'Allow Lambda to access Aurora'
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
