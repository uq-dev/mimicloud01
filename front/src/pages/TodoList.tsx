import React from 'react';
import type { Todo, TodoLocation } from '../types';

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onSelectTodo: (todo: Todo) => void;
  onCreateTodo: () => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onToggleTodo, onSelectTodo, onCreateTodo }) => {
  const [filter, setFilter] = React.useState<TodoLocation | 'すべて'>('すべて');

  const filteredTodos = filter === 'すべて' 
    ? todos 
    : todos.filter(t => t.location === filter);

  const locations: (TodoLocation | 'すべて')[] = ['すべて', '自宅', 'オフィス', 'スーパー', 'その他'];

  return (
    <>
      <div className="topbar">
        <div className="tb-title">Todo一覧</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge">{filteredTodos.length}件</span>
          <span className="tb-action" onClick={onCreateTodo}>追加</span>
        </div>
      </div>
      <div className="filter-bar">
        {locations.map(loc => (
          <div 
            key={loc} 
            className={`f-btn ${filter === loc ? 'active' : ''}`}
            onClick={() => setFilter(loc)}
          >
            {loc}
          </div>
        ))}
      </div>
      <div className="content">
        {filteredTodos.map(todo => (
          <div key={todo.id} className="todo-item" onClick={() => onSelectTodo(todo)}>
            <div 
              className={`check ${todo.status === 'done' ? 'done' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleTodo(todo.id);
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <div className={`todo-text ${todo.status === 'done' ? 'done' : ''}`}>
                {todo.title}
              </div>
              <div className="todo-meta">
                {todo.dueDate}
                <span className={todo.status === 'done' ? 'chip-status-done' : 'chip-status-open'}>
                  {todo.status === 'done' ? '完了' : '未完了'}
                </span>
                <span className="place-chip-sm">{todo.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TodoList;
