export type EnvName = 'dev' | 'stg' | 'prd';

export interface EnvConfig {
  envName: EnvName;
  account: string;
  region: string;
  vpcCidr: string;
}

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

export function getEnvConfig(envName: EnvName): EnvConfig {
  return configs[envName];
}

// リソース名生成ヘルパー
// フォーマット: mimicloud-todo-{env}-{resourceType}-{suffix}
export function resourceName(
  envName: EnvName,
  resourceType: string,
  suffix?: string
): string {
  const base = `mimicloud-todo-${envName}-${resourceType}`;
  return suffix ? `${base}-${suffix}` : base;
}

// 共通タグ
export function commonTags(envName: EnvName, stackName: string) {
  return {
    System: 'mimicloud',
    SubSystem: 'todo',
    Env: envName,
    ManagedBy: 'cdk',
    Stack: stackName,
  };
}
