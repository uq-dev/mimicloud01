import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';
import { MimiLambda } from '../constructs/lambda-function';

export interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  lambdaSg: ec2.ISecurityGroup;
  tasksTableName: string;   // ARNではなく名前で受け取る
  tasksTableArn: string;
  backendBucketName: string;
  backendBucketArn: string;
  userPool: cognito.IUserPool;
  auroraSecretArn: string;
}

export class BackendStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, envConfig: EnvConfig, props: BackendStackProps) {
    super(scope, id, props);

    const { envName } = envConfig;

    Object.entries(commonTags(envName, 'backend-stack')).forEach(([k, v]) =>
      cdk.Tags.of(this).add(k, v)
    );

    // Lambda共通の環境変数
    const lambdaEnv = {
      TASKS_TABLE_NAME: props.tasksTableName,
      BACKEND_BUCKET_NAME: props.backendBucketName,
      AURORA_SECRET_ARN: props.auroraSecretArn,
      ENV: envName,
    };

    // Lambda関数群
    const getTasks = new MimiLambda(this, 'GetTasksLambda', {
      envName,
      functionName: 'get-tasks',
      assetPath: 'lambda/get-tasks',
      vpc: props.vpc,
      securityGroup: props.lambdaSg,
      environment: lambdaEnv,
    });

    const postTask = new MimiLambda(this, 'PostTaskLambda', {
      envName,
      functionName: 'post-task',
      assetPath: 'lambda/post-task',
      vpc: props.vpc,
      securityGroup: props.lambdaSg,
      environment: lambdaEnv,
    });

    const updateTask = new MimiLambda(this, 'UpdateTaskLambda', {
      envName,
      functionName: 'update-task',
      assetPath: 'lambda/update-task',
      vpc: props.vpc,
      securityGroup: props.lambdaSg,
      environment: lambdaEnv,
    });

    const deleteTask = new MimiLambda(this, 'DeleteTaskLambda', {
      envName,
      functionName: 'delete-task',
      assetPath: 'lambda/delete-task',
      vpc: props.vpc,
      securityGroup: props.lambdaSg,
      environment: lambdaEnv,
    });

    // DynamoDBアクセス権限（インラインポリシーで付与 → 循環依存を回避）
    const dynamoReadPolicy = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:Query'],
      resources: [props.tasksTableArn],
    });
    const dynamoWritePolicy = new iam.PolicyStatement({
      actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
      resources: [props.tasksTableArn],
    });
    getTasks.function.addToRolePolicy(dynamoReadPolicy);
    postTask.function.addToRolePolicy(dynamoWritePolicy);
    updateTask.function.addToRolePolicy(dynamoWritePolicy);
    deleteTask.function.addToRolePolicy(dynamoWritePolicy);

    // S3アクセス権限（インラインポリシーで付与）
    getTasks.function.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:ListBucket'],
      resources: [props.backendBucketArn, `${props.backendBucketArn}/*`],
    }));
    postTask.function.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${props.backendBucketArn}/*`],
    }));

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: resourceName(envName, 'apigw', 'authorizer'),
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: resourceName(envName, 'apigw'),
      deployOptions: {
        stageName: envName,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    cdk.Tags.of(this.api).add('Name', resourceName(envName, 'apigw'));

    // ルーティング: /tasks
    const tasks = this.api.root.addResource('tasks');
    tasks.addMethod('GET', new apigateway.LambdaIntegration(getTasks.function), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    tasks.addMethod('POST', new apigateway.LambdaIntegration(postTask.function), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ルーティング: /tasks/{taskId}
    const task = tasks.addResource('{taskId}');
    task.addMethod('PUT', new apigateway.LambdaIntegration(updateTask.function), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    task.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTask.function), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', { value: this.api.url });
  }
}