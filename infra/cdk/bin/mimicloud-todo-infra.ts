#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getEnvConfig, EnvName } from '../lib/config/env';
import { NetworkStack } from '../lib/stacks/network-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { DataStack } from '../lib/stacks/data-stack';
import { BackendStack } from '../lib/stacks/backend-stack';

const app = new cdk.App();

// 環境名は環境変数 ENV で切り替え（デフォルト: dev）
const envName = (process.env.ENV ?? 'dev') as EnvName;
const envConfig = getEnvConfig(envName);

const env = {
  account: envConfig.account,
  region: envConfig.region,
};

// スタック名プレフィックス
const prefix = `MimicloudTodo${envName.charAt(0).toUpperCase() + envName.slice(1)}`;

// 1. ネットワーク（最初にデプロイ）
const networkStack = new NetworkStack(app, `${prefix}NetworkStack`, envConfig, { env });

// 2. 認証
const authStack = new AuthStack(app, `${prefix}AuthStack`, envConfig, { env });

// 3. フロントエンド
const frontendStack = new FrontendStack(app, `${prefix}FrontendStack`, envConfig, { env });

// 4. データ（NetworkStackに依存）
const dataStack = new DataStack(app, `${prefix}DataStack`, envConfig, {
  env,
  vpc: networkStack.vpc,
  auroraSg: networkStack.auroraSg,
});
dataStack.addDependency(networkStack);

// 5. バックエンド（全スタックに依存）
const backendStack = new BackendStack(app, `${prefix}BackendStack`, envConfig, {
  env,
  vpc: networkStack.vpc,
  lambdaSg: networkStack.lambdaSg,
  tasksTableName: dataStack.tasksTable.tableName,
  tasksTableArn: dataStack.tasksTable.tableArn,
  backendBucketName: dataStack.backendBucket.bucketName,
  backendBucketArn: dataStack.backendBucket.bucketArn,
  userPool: authStack.userPool,
  auroraSecretArn: dataStack.aurora.secret.secretArn,
});
backendStack.addDependency(networkStack);
backendStack.addDependency(authStack);
backendStack.addDependency(dataStack);