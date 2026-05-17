import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { get, post, put, del } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import type { Todo } from './types';
import TodoList from './pages/TodoList';
import TodoForm from './pages/TodoForm';
import TodoDetail from './pages/TodoDetail';

type View = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL';

function AppContent({ signOut }: { signOut?: () => void, user?: any }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('LIST');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const restOperation = get({
        apiName: 'TodoApi',
        path: '/tasks'
      });
      const { body } = await restOperation.response;
      const data = (await body.json()) as unknown as Todo[];
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newStatus = todo.status === 'done' ? 'open' : 'done';
    
    try {
      const restOperation = put({
        apiName: 'TodoApi',
        path: `/tasks/${id}`,
        options: {
          body: { ...todo, status: newStatus }
        }
      });
      await restOperation.response;
      
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ));
      if (selectedTodo && selectedTodo.id === id) {
        setSelectedTodo(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleSelectTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setView('DETAIL');
  };

  const handleSaveTodo = async (todoData: Partial<Todo>) => {
    try {
      if (view === 'CREATE') {
        const restOperation = post({
          apiName: 'TodoApi',
          path: '/tasks',
          options: {
            body: todoData
          }
        });
        const { body } = await restOperation.response;
        const newTodo = (await body.json()) as unknown as Todo;
        setTodos(prev => [newTodo, ...prev]);
      } else if (view === 'EDIT' && selectedTodo) {
        const restOperation = put({
          apiName: 'TodoApi',
          path: `/tasks/${selectedTodo.id}`,
          options: {
            body: { ...selectedTodo, ...todoData }
          }
        });
        await restOperation.response;
        setTodos(prev => prev.map(t => 
          t.id === selectedTodo.id ? { ...t, ...todoData } : t
        ));
      }
      setView('LIST');
      setSelectedTodo(null);
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (window.confirm('このTodoを削除しますか？')) {
      try {
        const restOperation = del({
          apiName: 'TodoApi',
          path: `/tasks/${id}`
        });
        await restOperation.response;
        setTodos(prev => prev.filter(t => t.id !== id));
        setView('LIST');
        setSelectedTodo(null);
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
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
          
          {loading ? (
            <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              読み込み中...
            </div>
          ) : (
            <>
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
            </>
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
