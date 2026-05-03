import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';
import { MimiAurora } from '../constructs/aurora-cluster';

/**
 * DataStack のプロパティ
 */
export interface DataStackProps extends cdk.StackProps {
  /** デプロイ先の VPC */
  vpc: ec2.IVpc;
}

/**
 * データストア (S3, DynamoDB) を構成するスタックです。
 */
export class DataStack extends cdk.Stack {
  /** バックエンド用 S3 バケット */
  public readonly backendBucket: s3.Bucket;
  /** タスク管理用 DynamoDB テーブル */
  public readonly tasksTable: dynamodb.Table;

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
      removalPolicy: envConfig.removalPolicy,
      autoDeleteObjects: envConfig.removalPolicy === cdk.RemovalPolicy.DESTROY,
      versioned: true,
    });
    cdk.Tags.of(this.backendBucket).add('Name', resourceName(envName, 's3-back'));

    // DynamoDB: tasksテーブル（トランザクションデータ）
    this.tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: resourceName(envName, 'dynamo', 'tasks'),
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: envConfig.removalPolicy,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false }, // dev環境はオフ
    });

    // GSI1: 状態別・期限順検索 (userId + status_dueDate)
    this.tasksTable.addGlobalSecondaryIndex({
      indexName: 'GSI_StatusDueDate',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status_dueDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: 期限順検索 (userId + dueDate)
    this.tasksTable.addGlobalSecondaryIndex({
      indexName: 'GSI_DueDate',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(this.tasksTable).add('Name', resourceName(envName, 'dynamo', 'tasks'));

    // Outputs
    new cdk.CfnOutput(this, 'BackendBucketName', { value: this.backendBucket.bucketName });
    new cdk.CfnOutput(this, 'TasksTableName', { value: this.tasksTable.tableName });
  }
}
