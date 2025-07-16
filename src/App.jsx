import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Checklist from './components/Checklist';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      {currentUser ? <Checklist /> : <Auth />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
