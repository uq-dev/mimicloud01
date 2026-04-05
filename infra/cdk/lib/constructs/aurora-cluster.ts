import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvName, resourceName } from '../config/env';

export interface MimiAuroraProps {
  envName: EnvName;
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  databaseName: string;  // 例: 'todo'
}

export class MimiAurora extends Construct {
  public readonly cluster: rds.ServerlessCluster;
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
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      credentials: rds.Credentials.fromGeneratedSecret('auroraAdmin', {
        secretName: resourceName(props.envName, 'aurora-secret'),
      }),
    });
    cdk.Tags.of(this.cluster).add('Name', clusterName);

    this.secret = this.cluster.secret!;
  }
}