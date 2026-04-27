import React from 'react';
import type { Todo, TodoLocation } from '../types';

interface TodoFormProps {
  todo?: Todo;
  onSave: (todo: Partial<Todo>) => void;
  onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ todo, onSave, onCancel }) => {
  const [title, setTitle] = React.useState(todo?.title || '');
  const [memo, setMemo] = React.useState(todo?.memo || '');
  const [dueDate, setDueDate] = React.useState(todo?.dueDate || '');
  const [location, setLocation] = React.useState<TodoLocation>(todo?.location || '自宅');

  const locations: TodoLocation[] = ['自宅', 'オフィス', 'スーパー', 'その他'];

  const handleSubmit = () => {
    onSave({
      title,
      memo,
      dueDate,
      location,
      status: todo?.status || 'open',
      photos: todo?.photos || []
    });
  };

  return (
    <>
      <div className="topbar">
        <div className="tb-action" onClick={onCancel}>キャンセル</div>
        <div className="tb-title">{todo ? '編集' : '新規Todo'}</div>
        <div className="tb-action" onClick={handleSubmit}>保存</div>
      </div>
      <div className="content">
        <div>
          <div className="sl">タイトル</div>
          <input 
            className="inp filled" 
            style={{ marginTop: '3px' }} 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
          />
        </div>
        <div>
          <div className="sl">メモ</div>
          <textarea 
            className="ta" 
            style={{ marginTop: '3px' }}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモを入力"
          />
        </div>
        <div>
          <div className="sl">期日</div>
          <input 
            className="inp filled" 
            style={{ marginTop: '3px' }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="2026/04/30"
          />
        </div>
        <div>
          <div className="sl">場所</div>
          <div className="place-list" style={{ marginTop: '3px' }}>
            {locations.map(loc => (
              <div 
                key={loc} 
                className={`place-opt ${location === loc ? 'selected' : ''}`}
                onClick={() => setLocation(loc)}
              >
                <div className={`radio ${location === loc ? 'on' : ''}`}></div>
                {loc}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="sl">写真添付</div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '3px' }}>
            <div className="photo-ph" style={{ width: '50px', height: '50px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="var(--color-text-tertiary)" strokeWidth="1"/>
                <circle cx="8" cy="8" r="2.5" stroke="var(--color-text-tertiary)" strokeWidth="1"/>
                <path d="M5 3l1-2h4l1 2" stroke="var(--color-text-tertiary)" strokeWidth="1"/>
              </svg>
            </div>
            <div className="photo-ph" style={{ width: '50px', height: '50px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 4v8M4 8h8" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TodoForm;
