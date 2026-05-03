# DynamoDB 設計書 (Todo 管理)

本文書では、Todo 管理アプリケーションにおける DynamoDB のテーブル設計について記述します。

## 1. テーブル概要

マルチユーザー環境を想定し、ユーザーごとにデータを分離する設計とします。

- **テーブル名**: `mimicloud-todo-{env}-dynamo-tasks`
- **パーティションキー (PK)**: `userId` (String)
    - **内容**: Cognito ユーザー의 UUID (`sub` 属性)
- **ソートキー (SK)**: `taskId` (String)

## 2. 属性定義

フロントエンドの `Todo` インターフェースに基づき、以下の属性を保持します。

| 属性名 | 型 | 説明 | 備考 |
| :--- | :--- | :--- | :--- |
| `userId` | String | ユーザーID | パーティションキー (Cognito UUID) |
| `taskId` | String | タスクID (UUID等) | ソートキー |
| `title` | String | タスクのタイトル | |
| `memo` | String | タスクの詳細メモ | |
| `dueDate` | String | 期限日 (YYYY-MM-DD) | インデックス用 |
| `status` | String | 状態 (`open` \| `done`) | |
| `location` | String | 場所 (`自宅` \| `オフィス` 等) | 以前のマスタID方式から直接保持に変更 |
| `photos` | List (String) | 写真のS3パス一覧 | |
| `status_dueDate`| String | `status#dueDate` の結合値 | GSI1 用 (例: `open#2026-05-02`) |
| `createdAt` | String | 作成日時 (ISO8601) | |
| `updatedAt` | String | 更新日時 (ISO8601) | |

## 3. グローバルセカンダリインデックス (GSI)

効率的なクエリを実現するため、以下の GSI を定義します。

### GSI1: 状態別・期限順検索
- **インデックス名**: `GSI_StatusDueDate`
- **パーティションキー**: `userId`
- **ソートキー**: `status_dueDate`
- **用途**: 「未完了のタスクを期限が近い順に取得する」といったクエリに使用します。

### GSI2: 期限順検索
- **インデックス名**: `GSI_DueDate`
- **パーティションキー**: `userId`
- **ソートキー**: `dueDate`
- **用途**: ステータスに関わらず、ユーザーの全タスクを期限順に表示する場合に使用します。

## 4. 主要なアクセスパターン

| パターン | 方法 | 詳細 |
| :--- | :--- | :--- |
| ユーザーの全タスク取得 | Query (Table) | PK=`userId` |
| 特定タスクの詳細取得 | GetItem (Table) | PK=`userId`, SK=`taskId` |
| 未完了タスクを期限順に取得 | Query (GSI1) | PK=`userId`, SK begins_with(`open#`) |
| 期限順に全タスク取得 | Query (GSI2) | PK=`userId`, ScanIndexForward=true |

## 5. データサンプル

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "todo_abc123",
  "title": "買い物リストを作る",
  "memo": "スーパーで買うもの：牛乳、卵...",
  "dueDate": "2026-04-25",
  "status": "open",
  "location": "スーパー",
  "photos": ["photos/todo_abc123/img1.jpg"],
  "status_dueDate": "open#2026-04-25",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

## 6. 実装上の注意点

1. **location の扱い**: 現時点では Aurora マスタを使用せず、`location` 属性に直接場所名（文字列）を保持します。
2. **status_dueDate の更新**: `status` または `dueDate` が更新された場合、アプリケーション側（Lambda）で `status_dueDate` 属性も同期して更新する必要があります。
3. **削除ポリシー**: 開発環境 (`dev`) では `RemovalPolicy.DESTROY` とし、本番環境では `RETAIN` を推奨します。
