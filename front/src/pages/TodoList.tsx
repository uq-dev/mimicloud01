import React from 'react';
import type { Todo, TodoLocation, TodoStatus } from '../types';

interface TodoListProps {
  todos: Todo[];
  filter: TodoLocation | 'すべて';
  statusFilter: TodoStatus | 'すべて';
  onChangeFilter: (filter: TodoLocation | 'すべて') => void;
  onChangeStatus: (status: TodoStatus | 'すべて') => void;
  onToggleTodo: (id: string) => void;
  onSelectTodo: (todo: Todo) => void;
  onCreateTodo: () => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, filter, statusFilter, onChangeFilter, onChangeStatus, onToggleTodo, onSelectTodo, onCreateTodo }) => {
  const filteredTodos = todos.filter(t =>
    (filter === 'すべて' || t.location === filter) &&
    (statusFilter === 'すべて' || t.status === statusFilter)
  );

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
            onClick={() => onChangeFilter(loc)}
          >
            {loc}
          </div>
        ))}
      </div>
      <div className="filter-bar" style={{ marginTop: '8px' }}>
        {['すべて', '未完了', '完了'].map(label => {
          const value = label === '未完了' ? 'open' : label === '完了' ? 'done' : 'すべて';
          return (
            <div
              key={label}
              className={`f-btn ${statusFilter === value ? 'active' : ''}`}
              onClick={() => onChangeStatus(value as TodoStatus | 'すべて')}
            >
              {label}
            </div>
          );
        })}
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
