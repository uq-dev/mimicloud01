import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { Construct } from 'constructs';
import { EnvName, resourceName } from '../config/env';

/**
 * MimiLambda コンストラクトのプロパティ
 */
export interface MimiLambdaProps {
  /** 環境名 */
  envName: EnvName;
  /** 関数名 (例: 'get-tasks') */
  functionName: string;
  /** ラムダソースコードのパス (例: 'lambda/get-tasks') */
  assetPath: string;
  /** ハンドラー名 (デフォルト: 'index.handler') */
  handler?: string;
  /** 配置先の VPC */
  vpc: ec2.IVpc;
  /** アタッチするセキュリティグループ */
  securityGroup: ec2.ISecurityGroup;
  /** メモリサイズ (デフォルト: 128) */
  memorySize?: number;
  /** タイムアウト時間 (秒) (デフォルト: 3) */
  timeoutSeconds?: number;
  /** 環境変数 */
  environment?: Record<string, string>;
}

/**
 * Python ランタイムを使用する Lambda 関数を構成するカスタムコンストラクトです。
 * CloudWatch Logs グループの作成と VPC 配置を自動的に行います。
 */
export class MimiLambda extends Construct {
  /** Lambda 関数リソース */
  public readonly function: lambda.Function;
  /** CloudWatch Logs グループ */
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
