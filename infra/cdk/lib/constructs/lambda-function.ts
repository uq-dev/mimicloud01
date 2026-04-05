import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { Construct } from 'constructs';
import { EnvName, resourceName } from '../config/env';

export interface MimiLambdaProps {
  envName: EnvName;
  functionName: string;       // 例: 'get-tasks'
  assetPath: string;          // 例: 'lambda/get-tasks'
  handler?: string;           // デフォルト: 'index.handler'
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  // オプション（デフォルトあり）
  memorySize?: number;        // デフォルト: 128
  timeoutSeconds?: number;    // デフォルト: 3
  environment?: Record<string, string>;
}

export class MimiLambda extends Construct {
  public readonly function: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MimiLambdaProps) {
    super(scope, id);

    const name = resourceName(props.envName, 'lambda', props.functionName);
    const logGroupName = resourceName(props.envName, 'logs', props.functionName);

    // CloudWatch Logs グループ
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${name}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(this.logGroup).add('Name', logGroupName);

    // Pythonコードをデプロイ
    // 外部パッケージが必要な場合は事前に pip install -r requirements.txt -t . を実行しておく
    // boto3はLambdaランタイムに含まれるため不要
    const code = lambda.Code.fromAsset(path.join(props.assetPath));

    // Lambda 関数
    this.function = new lambda.Function(this, 'Function', {
      functionName: name,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: props.handler ?? 'index.handler',
      code,
      memorySize: props.memorySize ?? 128,
      timeout: cdk.Duration.seconds(props.timeoutSeconds ?? 3),
      environment: props.environment ?? {},
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.securityGroup],
      logGroup: this.logGroup,
    });
    cdk.Tags.of(this.function).add('Name', name);
  }
}