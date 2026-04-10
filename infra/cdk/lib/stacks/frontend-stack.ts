import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { EnvConfig, resourceName, commonTags } from '../config/env';

/**
 * 静的コンテンツ配信 (S3 + CloudFront) を構成するスタックです。
 */
export class FrontendStack extends cdk.Stack {
  /** フロントエンド静的ファイル公開用 S3 バケット */
  public readonly bucket: s3.Bucket;
  /** CloudFront ディストリビューション */
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, envConfig: EnvConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    const { envName } = envConfig;

    Object.entries(commonTags(envName, 'frontend-stack')).forEach(([k, v]) =>
      cdk.Tags.of(this).add(k, v)
    );

    // S3 バケット（フロントエンド静的ファイル）
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: resourceName(envName, 's3-front'),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: envConfig.removalPolicy,
      autoDeleteObjects: envConfig.removalPolicy === cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(this.bucket).add('Name', resourceName(envName, 's3-front'));

    // CloudFront OAC
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: `OAC for ${resourceName(envName, 'cf')}`,
    });

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: resourceName(envName, 'cf'),
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // SPA用: 404 → index.html にリダイレクト
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });
    cdk.Tags.of(this.distribution).add('Name', resourceName(envName, 'cf'));

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: this.bucket.bucketName });
    new cdk.CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId });
  }
}
