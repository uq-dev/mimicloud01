import type { Todo } from './types';

export const MOCK_TODOS: Todo[] = [
  {
    id: '1',
    title: '買い物リストを作る',
    memo: 'スーパーで買うもの：牛乳、卵...',
    dueDate: '2026/04/25',
    status: 'open',
    location: 'スーパー',
    photos: []
  },
  {
    id: '2',
    title: '資料を送付する',
    memo: 'プロジェクトAの進捗報告書',
    dueDate: '2026/04/24',
    status: 'done',
    location: 'オフィス',
    photos: []
  },
  {
    id: '3',
    title: 'ミーティング準備',
    memo: '月曜日の定例ミーティング用アジェンダ作成',
    dueDate: '2026/04/26',
    status: 'open',
    location: 'オフィス',
    photos: []
  }
];
