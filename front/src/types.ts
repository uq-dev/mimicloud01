export type TodoStatus = 'open' | 'done';
export type TodoLocation = '自宅' | 'オフィス' | 'スーパー' | 'その他';

export interface Todo {
  id: string;
  title: string;
  memo: string;
  dueDate: string;
  status: TodoStatus;
  location: TodoLocation;
  photos: string[];
}
