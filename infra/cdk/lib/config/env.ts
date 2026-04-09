/**
 * 環境名の型定義
 */
export type EnvName = 'dev' | 'stg' | 'prd';

/**
 * 環境固有の設定インターフェース
 */
export interface EnvConfig {
  /** 環境名 ('dev', 'stg', 'prd') */
  envName: EnvName;
  /** AWS アカウント ID */
  account: string;
  /** デプロイ先のリージョン */
  region: string;
  /** VPC の CIDR ブロック */
  vpcCidr: string;
}

/**
 * 各環境の設定値
 */
const configs: Record<EnvName, EnvConfig> = {
  dev: {
    envName: 'dev',
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: 'ap-northeast-1',
    vpcCidr: '10.0.0.0/16',
  },
  stg: {
    envName: 'stg',
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: 'ap-northeast-1',
    vpcCidr: '10.1.0.0/16',
  },
  prd: {
    envName: 'prd',
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: 'ap-northeast-1',
    vpcCidr: '10.2.0.0/16',
  },
};

/**
 * 指定された環境名に対応する設定を取得します。
 * 
 * @param envName - 環境名
 * @returns 環境固有の設定オブジェクト
 */
export function getEnvConfig(envName: EnvName): EnvConfig {
  return configs[envName];
}

/**
 * リソース名を生成するヘルパー関数です。
 * フォーマット: mimicloud-todo-{env}-{resourceType}-{suffix}
 * 
 * @param envName - 環境名
 * @param resourceType - リソースの種類 (例: vpc, lambda)
 * @param suffix - オプションの接尾辞
 * @returns 生成されたリソース名
 */
export function resourceName(
  envName: EnvName,
  resourceType: string,
  suffix?: string
): string {
  const base = `mimicloud-todo-${envName}-${resourceType}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * 共通のタグセットを生成します。
 * 
 * @param envName - 環境名
 * @param stackName - スタック名
 * @returns タグのキー・バリューペア
 */
export function commonTags(envName: EnvName, stackName: string) {
  return {
    System: 'mimicloud',
    SubSystem: 'todo',
    Env: envName,
    ManagedBy: 'cdk',
    Stack: stackName,
  };
}
