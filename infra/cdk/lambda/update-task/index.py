
AWS上で色々お試しできる基盤となるアプリを作りたい
/
アーキテクチャ.jpg
まずは何を設計すべきか

3月29日
このアーキテクチャ図を見ると、開発環境（develop）のAWS構成が描かれています。設計すべき順序を整理します。

設計の優先順序
1. 🏗️ 基盤インフラから設計する（最初に着手）
VPC・ネットワーク設計

VPCのCIDRブロック設定
Public subnet / Private subnetの分割設計
セキュリティグループ・NACLのルール定義
GatewayEndpointの設定（S3へのプライベートアクセス用）
2. 🔐 認証・セキュリティ設計
Cognito（ユーザープール）

ユーザー属性・認証フローの設計
CloudFrontとの連携方式
3. 📡 フロントエンド配信設計
CloudFront + S3（フロントエンド）

CloudFrontのディストリビューション設定
S3バケットポリシー（OAC/OAI）
キャッシュ戦略
4. ⚙️ バックエンド設計
API Gateway + Lambda（Private subnet内）

APIのエンドポイント設計（GET/POST/UPDATE/DELETE）
LambdaのVPC配置・IAMロール設計
データストア選定の明確化

S3（バックエンド）：何を格納するか
DynamoDB：どのデータをNoSQLで管理するか
Aurora：RDBが必要なデータは何か
⚠️ DynamoDBとAuroraが併存している理由を明確化することが重要
5. 📊 監視設計
CloudWatch Logs

Lambda・API Gatewayのログ設計
アラート閾値の定義
6. 🚀 CI/CDパイプライン設計（下段）
ECR + CodeBuild + CodeDeploy

インフラ用・アプリ用でパイプラインが2系統あるため、それぞれのビルド・デプロイ戦略を定義
⚠️ 先に整理すべき設計上の疑問点
疑問	理由
DynamoDBとAuroraの使い分け	両方あるが役割が不明確
LambdaをPrivate subnetに置く必要があるか	インターネットアクセスが必要な場合はNATが必要
Public subnetが空に見える	何も置かない意図か確認
CI/CDの2系統の違い	インフラ用とアプリ用の分離基準
**まず着手すべきは「VPC・ネットワーク設計」と「データストアの役割定義」**です。これが決まらないと他の設計が固まりません。どこから詳しく詰めますか？

DynamoDBとAuroraの使い分け

LambdaをPrivate subnetに置く必要があるか
Public subnetが空に見える
CI/CDの2系統の違い

3月29日
良い質問です。それぞれ整理しましょう。

Claudeの応答が中断されました
チャット欄ってマークダウンでは書けないのかな

3月29日
Claude.aiのチャット欄は、残念ながらマークダウン記法での入力はできません。

プレーンテキストのみの入力となります。ただし：

Claudeの返答側はマークダウンで表示されます
コードや構造化されたテキストを貼り付けることは可能です
なので、箇条書きや見出しを使いたい場合は、そのままテキストで書いていただければ、Claude側で意図を汲んで回答します。

先ほどの質問、続きを答えますね。どうしますか？

入力がしづらくて無理。
プラグインとかで何とかならん?

3月29日
残念ながら、現状では公式の方法はないです。

いくつか現実的な回避策を挙げると：

ブラウザ拡張機能

「Markdown Here」などの拡張を使うと、テキストエリアでマークダウンを書いてから変換できる場合がありますが、Claude.aiで動くかは保証できません
実用的な代替案

VSCodeやObsidianなどのエディタで書いて、コピペする
長い構造化された質問はテキストファイルでアップロードする（Claude.aiはファイル添付に対応しています）
そもそもの話 Claude側が質問の意図を読むので、箇条書きや見出しがなくても「〇〇と△△と□□について教えて」と普通に書けば十分伝わります。

先ほどの4つの疑問点の続き、改めて聞いてもらえれば答えます！

自分が書きにくいんだよ

3月29日
ああ、なるほど！Claudeへの質問を書く側が整理しにくいってことですね。

それならVSCodeやメモ帳で下書きしてコピペが一番現実的かなと思います。

あとは口語でざっくり投げてもらえれば、こちらで補完して答えるので、そこまで整形しなくても大丈夫ですよ！

めんどくせー

3月29日
それはそう笑

まあ気軽に話しかける感じで投げてください。整形とか気にしなくて全然大丈夫です！

DynamoDBとAuroraの使い分け
マスタデータはAurora Serverless, トランザクションデータはDynamoDB想定です
LambdaをPrivate subnetに置く必要があるか
DBにプライベートにアクセスするため、privateに配置したいです
Public subnetが空に見える
現状特に何も置く想定はありません。
CI/CDの2系統の違い
シンプルなTodoWebアプリで3種類のパイプラインを考えます。
・インフラ(CDK構築)
・フロントエンド(html, javascript等)
・バックエンド(Lambda)
APIGatewayはフロント/バックどっちの扱いにすることが多い?

3月30日
情報整理ありがとうです！全部筋が通ってます。

各回答へのフィードバック
DynamoDB / Aurora → 明確で良いです。ただAurora Serverlessはコールドスタートがあるので、Lambda経由で叩く際のタイムアウト設定は注意です。

LambdaをPrivate subnet → 正しい判断です。ただPrivate subnetのLambdaが外部API等を叩く必要が出た場合はNAT Gatewayが必要になるので、将来的に要考慮です。

Public subnetが空 → Todoアプリなら問題なし。将来的にNAT GatewayやALBが必要になったときに使う感じですね。

API GatewayはフロントかバックかについてAnswerは「バックエンド」が多数派です
理由としては

デプロイ単位がLambdaと同じ
フロントはあくまでS3+CloudFrontで完結する
インフラチームがAPI Gatewayを管理することも多い
なのでパイプラインは図の通り3系統で良いと思います。

次は何を詰めますか？ネットワーク設計から入りますか？

まずはインフラを考えます。

CDKプロジェクトのフォルダ構成
リソース命名規則のたたき台を作りたいです。
ファイルにMarkdownで出力できますか?

3月30日
もちろんです！


Check available skills
Check available skills
Markdownファイルとして出力しますね。アプリ名・環境名はTodoアプリ・developで進めます。


ファイルを作成しました, ファイルを読み取りました
ファイルを作成しました, ファイルを読み取りました
フォルダ構成・命名規則・タグ設計をまとめました。

気になる点としては、末尾に「未決事項」を入れてあります。特にDynamoDBのテーブル設計とIAMロール設計は後々影響が大きいので、早めに詰めておくと良いです。修正したい箇所あれば気軽に言ってください！

Cdk design
ドキュメント · MD 
以下の観点を反映してmarkdownを作り直してください

システム名とサブシステム名を管理したい
システム名： mimicloud
サブシステム： todo


- [ ] Auroraのデータベース名・スキーマ名の命名規則
  スキーマ名: #サブシステム名#_役割
  役割(app, master, log, etc)
    例) todo_main

  データベース名: #機能#
　　例) user

- [ ] Lambdaのメモリ・タイムアウトのデフォルト値
  基本はデフォルト 128MB, 3s。必要に応じて設定する。
もっと表示
18:25
了解です！


8個のファイルを編集しました, ファイルを表示しました, ファイルを読み取りました
8個のファイルを編集しました, ファイルを表示しました, ファイルを読み取りました
更新しました！主な変更点は：

システム名 mimicloud / サブシステム todo を全体に反映
AWSリソース命名を mimicloud-todo-dev-xxx 形式に統一
タグに System / SubSystem を追加
Aurora命名規則セクションを新設（スキーマ・テーブル例付き）
Lambdaデフォルト設定セクションを新設
未決事項から解決済み2項目を削除
Cdk design
ドキュメント · MD 
Cdk designに従ってベースとなるCDKコードを一通り作成したい
20:18
結構ボリュームありますね。先に構成を確認させてください。


Read cdk-design.md
Read cdk-design.md
内容把握しました。ファイル数が多いので順番に作っていきます。


13個のファイルを作成しました, コマンドを実行しました
13個のファイルを作成しました, コマンドを実行しました
最後にファイルをまとめてoutputsにコピーします。


コマンドを実行しました, ファイルを読み取りました
コマンドを実行しました, ファイルを読み取りました
全10ファイル生成しました。構成のポイントをまとめると：

デプロイ順序（bin/で依存関係を明示） NetworkStack → AuthStack → FrontendStack → DataStack → BackendStack

いくつか判断した点

natGateways: 0 にしています。LambdaからS3・DynamoDBへはGatewayEndpoint経由でアクセスできるため不要です。外部APIを叩く必要が出た場合はNAT Gatewayを追加してください
Auroraは PRIVATE_ISOLATED subnet配置（インターネット不要）
環境切り替えは ENV=stg npx cdk deploy のように環境変数で対応
次にやること

lambda/get-tasks/index.ts 等のLambdaコードのベース作成
DynamoDBのパーティションキー・ソートキー設計の確定
Mimicloud todo infra
TS 
Env
TS 
Network stack
TS 
Auth stack
TS 
Frontend stack
TS 
Data stack
TS 
Backend stack
TS 
Lambda function
TS 
Aurora cluster
TS 
Mimicloud todo infra.test
TS 
直接作業フォルダを指定することできますか

21:11
残念ながら、Claude.aiの環境ではローカルPCのフォルダを直接指定することはできません。

現状の選択肢としては：

1. ファイルをダウンロードして手動配置 今回生成したファイルをダウンロードして、ローカルにコピーする方法です。

2. ファイルをアップロードして編集 既存ファイルをClaudeにアップロードすれば、内容を読み取って編集・追記したものを返せます。

3. Claude Code を使う ターミナルで動くCLIツールで、ローカルのファイルを直接読み書きできます。今回のようなコード生成・編集作業には一番フィットします。npm install -g @anthropic-ai/claude-code でインストールできます。

ローカル作業が多くなりそうであれば、Claude Codeが一番効率良いと思います。

Claude Codeは有料?

21:12
はい、有料です。ただし料金体系が少し複雑です。


ウェブを検索しました, ファイルを表示しました
ウェブを検索しました, ファイルを表示しました
まとめるとこんな感じです：

Claude Codeを使うのに必要なプラン

無料プランではClaude Codeは使えません。最低でもProサブスクリプション（月$20）が必要です。 
ClaudeLog

プラン	月額	Claude Code	用途感
Pro	$20	○	軽い開発・学習
Max 5x	$100	○（大量利用）	本格的な開発
Max 20x	$200	○（さらに大量）	ヘビーユーザー
使用量の目安（Pro） Proプランは5時間ごとに約45メッセージまたは10〜40プロンプトが目安で、利用制限は5時間ごとにリセットされます。 
Geeky Gadgets

今回の用途だと CDK開発程度ならProの$20/月で十分だと思います。ガッツリ毎日何時間も使うなら$100のMaxが費用対効果が高いです。

すでにこのチャット（Claude.ai）をProで使っているなら、追加費用なしでClaude Codeも使えます。

configの指定方法は?

21:24
何のconfigか確認させてください！

どのconfigの話ですか？

Q: どのconfigの話ですか？
A: CDKのcdk.json / env.ts

21:24
今回作ったコードでの指定方法を説明します。

環境の切り替え方
env.ts の getEnvConfig() に dev / stg / prd を渡す設計にしています。切り替えは環境変数 ENV で行います。

bash
# dev（デフォルト）
npx cdk deploy

# stg
ENV=stg npx cdk deploy

# prd
ENV=prd npx cdk deploy
AWSアカウント・リージョンの設定
env.ts の account は現状 CDK_DEFAULT_ACCOUNT を参照しています。

typescript
// 方法1: AWS CLIのprofileから自動取得（推奨）
CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

// 方法2: env.tsに直書き（シンプルだが本番は避ける）
dev: {
  account: '123456789012',
  region: 'ap-northeast-1',
  ...
}
cdk.jsonは基本触らない
今回の構成では環境依存の値は全部 env.ts に集約しているので、cdk.json はCDK自体の動作設定のみです。追加で変えるとしたら以下くらいです。

json
// cdk.json
{
  "context": {
    // スタック削除時にリソースも削除するか（dev環境向け）
    "@aws-cdk/core:newStyleStackSynthesis": true
  }
}
具体的に「devとstgでアカウントを分けたい」とか「VPC CIDRを変えたい」などあれば、env.ts の該当箇所を直接修正する形になります。何か変えたい設定はありますか？

mimicloud-todo-infra.test.ts
はどのように動作しますか?
cdk synthで実行される?

21:28
いいえ、cdk synthでは実行されません。

テストの実行方法
bash
# テスト実行
npm test

# またはwatchモード
npm run test -- --watch
package.json に "test": "jest" と定義しているので、Jestが直接実行します。cdk synth とは完全に独立しています。

cdk synthとの違い
コマンド	何をするか
npm test	Jestでユニットテスト実行
cdk synth	CloudFormationテンプレートを生成
cdk deploy	AWSに実際にデプロイ
テストの仕組み
今回書いたテストは CDK Assertions を使っています。実際にAWSにデプロイせず、Template.fromStack() でCloudFormationテンプレートをメモリ上に展開して検証します。

typescript
const template = Template.fromStack(stack);

// VPCが1つ作られるか確認
template.resourceCountIs('AWS::EC2::VPC', 1);
つまりローカルだけで完結するテストです。

CI/CDへの組み込み方
CodeBuildのパイプラインに組み込むなら、デプロイ前に実行するのが一般的です。

npm test → cdk synth → cdk deploy
テストが失敗したらデプロイを止める、という流れにできます。興味ありますか？

[WARNING] aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
  use pointInTimeRecoverySpecification instead
  This API will be removed in the next major release.
ThereSubnetGroups: There are no 'Private' subnet groups in this VPC. Available types: Isolated,Deprecated_Isolated,Public
    at path [MimicloudTodoDevNetworkStack/Vpc] in aws-cdk-lib.aws_ec2.Vpc
npx ts-node --prefer-ts-exts bin/mimicloud-todo-infra.ts: Subprocess exited with error 1

22:18
2つエラーがありますね。直します。

エラー1: pointInTimeRecovery → pointInTimeRecoverySpecification に変更 エラー2: SubnetTypeが PRIVATE_WITH_EGRESS（NATが必要）になっているが、NAT無しなので PRIVATE_ISOLATED に統一する必要あり


2個のファイルを表示しました
2個のファイルを表示しました
原因確認できました。2箇所修正します。


3個のファイルを編集しました, 2個のファイルを表示しました
3個のファイルを編集しました, 2個のファイルを表示しました
修正済みファイルをoutputsに反映します。


コマンドを実行しました, ファイルを読み取りました
コマンドを実行しました, ファイルを読み取りました
修正内容まとめ：

ファイル	修正内容
lambda-function.ts	PRIVATE_WITH_EGRESS → PRIVATE_ISOLATED
aurora-cluster.ts	PRIVATE_WITH_EGRESS → PRIVATE_ISOLATED
data-stack.ts	pointInTimeRecovery → pointInTimeRecoverySpecification
PRIVATE_WITH_EGRESS はNAT Gateway前提のSubnetTypeなので、NAT無し構成では PRIVATE_ISOLATED が正しいです。再度 cdk synth を試してみてください！

Lambda function
TS 
Aurora cluster
TS 
Data stack
TS 
    // Lambda関数群
    const getTasks = new MimiLambda(this, 'GetTasksLambda', {
      envName,
      functionName: 'get-tasks',
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/get-tasks'),
      vpc: props.vpc,
      securityGroup: props.lambdaSg,
      environment: lambdaEnv,
    });
codeはどのような構成、ファイルで配置すべき?

22:31
Lambda関数のコードディレクトリ構成について説明します。

配置場所
lambda.Code.fromAsset('lambda/get-tasks') と指定しているので、CDKプロジェクトのルートからの相対パスで配置します。

mimicloud-todo-infra/
├── bin/
├── lib/
├── lambda/              ← ここ
│   ├── get-tasks/
│   │   ├── index.ts     ← handler
│   │   └── package.json
│   ├── post-task/
│   │   ├── index.ts
│   │   └── package.json
│   ├── update-task/
│   │   ├── index.ts
│   │   └── package.json
│   └── delete-task/
│       ├── index.ts
│       └── package.json
├── cdk.json
└── package.json
index.tsの最小構成
typescript
// lambda/get-tasks/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const result = await dynamo.send(new ScanCommand({
    TableName: process.env.TASKS_TABLE_NAME,
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Items),
  };
};
注意点
fromAsset はTypeScriptをそのままデプロイできません。事前にビルドが必要です。

選択肢が2つあります。

方法1: NodejsFunction を使う（推奨）

CDK組み込みのコンストラクトで、TypeScriptを自動でバンドル・トランスパイルしてくれます。

typescript
// lambda-function.ts の code部分を変更
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

// fromAsset の代わりに NodejsFunction を使う
new NodejsFunction(this, 'Function', {
  entry: 'lambda/get-tasks/index.ts',  // entryにtsファイルを直接指定
  handler: 'handler',
  ...
});
esbuild が必要なので npm install -D esbuild が必要です。

方法2: fromAsset + bundling オプション

typescript
code: lambda.Code.fromAsset('lambda/get-tasks', {
  bundling: {
    image: lambda.Runtime.NODEJS_20_X.bundlingImage,
    command: [
      'bash', '-c',
      'npm install && npm run build && cp -r dist/* /asset-output/',
    ],
  },
}),
今回の構成なら方法1のNodejsFunctionが一番シンプルです。MimiLambda コンストラクトを修正しますか？

LambdaはPythonにしたいです

22:38
了解です。PythonだとNodejsFunctionのような自動バンドルがないので、fromAsset + 構成整理が基本になります。

フォルダ構成
mimicloud-todo-infra/
├── lambda/
│   ├── get-tasks/
│   │   ├── index.py       ← handler
│   │   └── requirements.txt
│   ├── post-task/
│   │   ├── index.py
│   │   └── requirements.txt
│   ├── update-task/
│   │   ├── index.py
│   │   └── requirements.txt
│   └── delete-task/
│       ├── index.py
│       └── requirements.txt
index.pyの最小構成
python
# lambda/get-tasks/index.py
import json
import os
import boto3

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])
    result = table.scan()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(result['Items'])
    }
CDK側の修正
MimiLambda コンストラクトのRuntimeとbundlingを変更します。

typescript
// lambda-function.ts
this.function = new lambda.Function(this, 'Function', {
  runtime: props.runtime ?? lambda.Runtime.PYTHON_3_12,  // ← 変更
  handler: props.handler,  // 'index.handler' → 'index.handler'でOK
  code: lambda.Code.fromAsset(props.assetPath, {
    bundling: {
      image: lambda.Runtime.PYTHON_3_12.bundlingImage,
      command: [
        'bash', '-c',
        'pip install -r requirements.txt -t /asset-output && cp -r . /asset-output',
      ],
    },
  }),
  ...
});
これに合わせて MimiLambdaProps も code → assetPath: string に変更した方がすっきりします。

修正版の lambda-function.ts と backend-stack.ts を作り直しますか？

修正版の lambda-function.ts と backend-stack.ts を作り直しますか？
作成してください

22:38

2個のファイルを表示しました, 2個のファイルを編集しました
2個のファイルを表示しました, 2個のファイルを編集しました
続いてLambdaのPythonサンプルコードも作成します。


4個のファイルを作成しました, 3個のコマンドを実行しました, ファイルを読み取りました
4個のファイルを作成しました, 3個のコマンドを実行しました, ファイルを読み取りました
変更点まとめです。

CDK側の変更

MimiLambdaProps の code: lambda.Code と runtime を廃止し、assetPath: string に一本化しました。Runtimeは常に PYTHON_3_12 固定になります。cdk deploy 時にDockerコンテナ内で pip install → /asset-output にコピーという流れで自動バンドルされます。

Lambdaコードの構成

lambda/
├── get-tasks/
│   ├── index.py          ← handler = 'index.handler'
│   └── requirements.txt  ← 外部パッケージはここに記載
boto3 はLambdaランタイムに最初から含まれているので requirements.txt に書く必要はありません。外部パッケージ（例: requests, psycopg2-binary）が必要になったときに追記してください。

Lambda function
TS 
Backend stack
TS 
Index
PY 
Index
PY 
Index
PY 
Index
PY 





Claude は AI のため、誤りを含む可能性があります。回答内容は必ずご確認ください。
Index · PY
コピー

import json
import os
import boto3
 
dynamo = boto3.resource('dynamodb')
 
def handler(event, context):
    task_id = event['pathParameters']['taskId']
    body = json.loads(event.get('body', '{}'))
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])
 
    table.update_item(
        Key={'taskId': task_id},
        UpdateExpression='SET title = :title, done = :done',
        ExpressionAttributeValues={
            ':title': body.get('title', ''),
            ':done': body.get('done', False),
        }
    )
 
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'taskId': task_id, **body})
    }
 
