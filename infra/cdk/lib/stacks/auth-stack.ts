import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';

/**
 * 認証基盤 (Cognito) を構成するスタックです。
 */
export class AuthStack extends cdk.Stack {
  /** Cognito ユーザープール */
  public readonly userPool: cognito.UserPool;
  /** フロントエンド向けユーザープールクライアント */
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, envConfig: EnvConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    const { envName } = envConfig;

    Object.entries(commonTags(envName, 'auth-stack')).forEach(([k, v]) =>
      cdk.Tags.of(this).add(k, v)
    );

    // Cognito UserPool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: resourceName(envName, 'userpool'),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: envConfig.removalPolicy,
    });
    cdk.Tags.of(this.userPool).add('Name', resourceName(envName, 'userpool'));

    // UserPool Client（フロントエンド用）
    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: resourceName(envName, 'userpool', 'web-client'),
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}
