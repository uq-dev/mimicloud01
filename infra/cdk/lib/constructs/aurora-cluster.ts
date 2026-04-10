import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvName, resourceName } from '../config/env';

/**
 * MimiAurora コンストラクトのプロパティ
 */
export interface MimiAuroraProps {
  /** 環境名 */
  envName: EnvName;
  /** デプロイ先の VPC */
  vpc: ec2.IVpc;
  /** アタッチするセキュリティグループ */
  securityGroup: ec2.ISecurityGroup;
  /** データベース名 (例: 'todo') */
  databaseName: string;
  /** リソースの削除ポリシー */
  removalPolicy: cdk.RemovalPolicy;
}

/**
 * Aurora Serverless v1 (PostgreSQL) を構成するカスタムコンストラクトです。
 */
export class MimiAurora extends Construct {
  /** Aurora クラスター */
  public readonly cluster: rds.ServerlessCluster;
  /** 管理者情報のシークレット */
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: MimiAuroraProps) {
    super(scope, id);

    const clusterName = resourceName(props.envName, 'aurora');

    this.cluster = new rds.ServerlessCluster(this, 'Cluster', {
      clusterIdentifier: clusterName,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_12,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.securityGroup],
      defaultDatabaseName: props.databaseName,
      scaling: {
        autoPause: cdk.Duration.minutes(10),  // dev環境: 10分でスリープ
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_8,
      },
      removalPolicy: props.removalPolicy,
      credentials: rds.Credentials.fromGeneratedSecret('auroraAdmin', {
        secretName: resourceName(props.envName, 'aurora-secret'),
      }),
    });
    cdk.Tags.of(this.cluster).add('Name', clusterName);

    this.secret = this.cluster.secret!;
  }
}
