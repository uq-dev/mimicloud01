import React from 'react';
import type { Todo } from '../types';

interface TodoDetailProps {
  todo: Todo;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onToggleTodo: (id: string) => void;
}

const TodoDetail: React.FC<TodoDetailProps> = ({ todo, onBack, onEdit, onDelete, onToggleTodo }) => {
  return (
    <>
      <div className="topbar">
        <div className="tb-action" onClick={onBack}>← 戻る</div>
        <div className="tb-title">詳細</div>
        <div style={{ width: '32px' }}></div>
      </div>
      <div className="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div 
            className={`check ${todo.status === 'done' ? 'done' : ''}`}
            onClick={() => onToggleTodo(todo.id)}
          ></div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {todo.title}
          </div>
        </div>
        <div className="divider"></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="dl">メモ</div>
          <div className="dv">{todo.memo || '(なし)'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="dl">期日</div>
          <div className="dv">{todo.dueDate || '(なし)'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="dl">ステータス</div>
          <div>
            <span className={todo.status === 'done' ? 'chip-status-done' : 'chip-status-open'}>
              {todo.status === 'done' ? '完了' : '未完了'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="dl">場所</div>
          <div><span className="place-chip">{todo.location}</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="dl">添付写真</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <div className="photo-ph" style={{ width: '55px', height: '55px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="var(--color-text-tertiary)" strokeWidth="1"/>
                <circle cx="8" cy="8" r="2.5" stroke="var(--color-text-tertiary)" strokeWidth="1"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn-s" onClick={onEdit}>編集</button>
          <button className="btn-d" onClick={() => onDelete(todo.id)}>削除</button>
        </div>
      </div>
    </>
  );
};

export default TodoDetail;
