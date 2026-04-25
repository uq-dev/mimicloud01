import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="container">
          <h1>Hello {user?.username}</h1>
          <p>Base application built with Vite, TypeScript, and Vanilla CSS.</p>
          <button onClick={signOut} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Sign Out
          </button>
        </div>
      )}
    </Authenticator>
  )
}

export default App
