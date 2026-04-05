import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';
import { MimiAurora } from '../constructs/aurora-cluster';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  auroraSg: ec2.ISecurityGroup;
}

export class DataStack extends cdk.Stack {
  public readonly backendBucket: s3.Bucket;
  public readonly tasksTable: dynamodb.Table;
  public readonly aurora: MimiAurora;

  constructor(scope: Construct, id: string, envConfig: EnvConfig, props: DataStackProps) {
    super(scope, id, props);

    const { envName } = envConfig;

    Object.entries(commonTags(envName, 'data-stack')).forEach(([k, v]) =>
      cdk.Tags.of(this).add(k, v)
    );

    // S3 バケット（バックエンド: ファイルアップロード等）
    this.backendBucket = new s3.Bucket(this, 'BackendBucket', {
      bucketName: resourceName(envName, 's3-back'),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });
    cdk.Tags.of(this.backendBucket).add('Name', resourceName(envName, 's3-back'));

    // DynamoDB: tasksテーブル（トランザクションデータ）
    // ※ パーティションキー・ソートキーは要検討（現時点はtaskIdのみ）
    this.tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: resourceName(envName, 'dynamo', 'tasks'),
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },  // dev環境はオフ
    });
    cdk.Tags.of(this.tasksTable).add('Name', resourceName(envName, 'dynamo', 'tasks'));

    // Aurora Serverless（マスタデータ）
    this.aurora = new MimiAurora(this, 'Aurora', {
      envName,
      vpc: props.vpc,
      securityGroup: props.auroraSg,
      databaseName: 'todo',
    });

    // Outputs
    new cdk.CfnOutput(this, 'BackendBucketName', { value: this.backendBucket.bucketName });
    new cdk.CfnOutput(this, 'TasksTableName', { value: this.tasksTable.tableName });
    new cdk.CfnOutput(this, 'AuroraClusterArn', { value: this.aurora.cluster.clusterArn });
    new cdk.CfnOutput(this, 'AuroraSecretArn', { value: this.aurora.secret.secretArn });
  }
}