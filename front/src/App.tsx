import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import type { Todo } from './types';
import { MOCK_TODOS } from './mockData';
import TodoList from './pages/TodoList';
import TodoForm from './pages/TodoForm';
import TodoDetail from './pages/TodoDetail';

type View = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL';

function AppContent({ signOut }: { signOut?: () => void, user?: any }) {
  const [todos, setTodos] = useState<Todo[]>(MOCK_TODOS);
  const [view, setView] = useState<View>('LIST');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'done' ? 'open' : 'done' } : t
    ));
    if (selectedTodo && selectedTodo.id === id) {
      setSelectedTodo(prev => prev ? { ...prev, status: prev.status === 'done' ? 'open' : 'done' } : null);
    }
  };

  const handleSelectTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setView('DETAIL');
  };

  const handleSaveTodo = (todoData: Partial<Todo>) => {
    if (view === 'CREATE') {
      const newTodo: Todo = {
        ...todoData,
        id: Math.random().toString(36).substr(2, 9),
      } as Todo;
      setTodos(prev => [newTodo, ...prev]);
    } else if (view === 'EDIT' && selectedTodo) {
      setTodos(prev => prev.map(t => 
        t.id === selectedTodo.id ? { ...t, ...todoData } : t
      ));
    }
    setView('LIST');
    setSelectedTodo(null);
  };

  const handleDeleteTodo = (id: string) => {
    if (window.confirm('このTodoを削除しますか？')) {
      setTodos(prev => prev.filter(t => t.id !== id));
      setView('LIST');
      setSelectedTodo(null);
    }
  };

  return (
    <div className="container">
      <div className="phone">
        <div className="frame">
          <div className="sb">
            <span onClick={signOut} style={{ cursor: 'pointer', marginRight: 'auto' }}>ログアウト</span>
            <span>9:41</span>
          </div>
          
          {view === 'LIST' && (
            <TodoList 
              todos={todos} 
              onToggleTodo={handleToggleTodo} 
              onSelectTodo={handleSelectTodo}
              onCreateTodo={() => setView('CREATE')}
            />
          )}

          {(view === 'CREATE' || view === 'EDIT') && (
            <TodoForm 
              todo={view === 'EDIT' ? selectedTodo || undefined : undefined}
              onSave={handleSaveTodo}
              onCancel={() => setView(selectedTodo ? 'DETAIL' : 'LIST')}
            />
          )}

          {view === 'DETAIL' && selectedTodo && (
            <TodoDetail 
              todo={selectedTodo}
              onBack={() => setView('LIST')}
              onEdit={() => setView('EDIT')}
              onDelete={handleDeleteTodo}
              onToggleTodo={handleToggleTodo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AppContent signOut={signOut} user={user} />
      )}
    </Authenticator>
  )
}

export default App;
