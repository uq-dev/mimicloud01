import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from '@aws-amplify/core';
import { get, post, put, del } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import type { Todo, TodoLocation, TodoStatus } from './types';
import TodoList from './pages/TodoList';
import TodoForm from './pages/TodoForm';
import TodoDetail from './pages/TodoDetail';

type View = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString?.();
    console.debug('fetchAuthSession result:', { hasSession: !!session, idTokenPresent: !!idToken });
    // API Gateway Cognito Authorizer expects the raw JWT in the Authorization header (no "Bearer " prefix)
    return idToken ? { Authorization: idToken } : {};
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return {};
  }
}

function AppContent({ signOut }: { signOut?: () => void, user?: any }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('LIST');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [locationFilter, setLocationFilter] = useState<TodoLocation | 'すべて'>('すべて');
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'すべて'>('すべて');
  const [debugToken, setDebugToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos(locationFilter, statusFilter);
  }, [locationFilter, statusFilter]);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const t = headers.Authorization ?? null;
        setDebugToken(t ? (t.length > 64 ? `${t.slice(0, 64)}...` : t) : null);
        console.debug('debugToken set:', !!t);
      } catch (e) {
        console.error('failed to set debug token', e);
      }
    })();
  }, []);

  const fetchTodos = async (
    filter: TodoLocation | 'すべて' = 'すべて',
    status: TodoStatus | 'すべて' = 'すべて'
  ) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params: Record<string, string> = {};
      if (filter !== 'すべて') params.location = filter;
      if (status !== 'すべて') params.status = status;
      const queryStringParameters = Object.keys(params).length ? params : undefined;
      const restOperation = get({
        apiName: 'TodoApi',
        path: '/tasks',
        options: {
          headers,
          queryStringParameters,
        } as any,
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
      const headers = await getAuthHeaders();
      const restOperation = put({
        apiName: 'TodoApi',
        path: `/tasks/${id}`,
        options: {
          headers,
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
      const headers = await getAuthHeaders();
      if (view === 'CREATE') {
        const restOperation = post({
          apiName: 'TodoApi',
          path: '/tasks',
          options: {
            headers,
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
            headers,
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
        const headers = await getAuthHeaders();
        const restOperation = del({
          apiName: 'TodoApi',
          path: `/tasks/${id}`,
          options: {
            headers,
          },
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
      {/* Debug panel: shows whether Authorization header is present (dev only) */}
      <div style={{ position: 'fixed', right: 8, bottom: 8, zIndex: 9999, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>Auth Debug</div>
        <div>token: {debugToken ? debugToken : <span style={{ opacity: 0.6 }}>null</span>}</div>
      </div>
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
                  filter={locationFilter}
                  statusFilter={statusFilter}
                  onChangeFilter={(newFilter) => setLocationFilter(newFilter)}
                  onChangeStatus={(newStatus) => setStatusFilter(newStatus)}
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
