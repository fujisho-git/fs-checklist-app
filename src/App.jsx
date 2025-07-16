import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Checklist from './components/Checklist';
import ChecklistHistory from './components/ChecklistHistory';
import ChecklistDetail from './components/ChecklistDetail';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('new'); // 'new', 'history', 'detail'
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  if (!currentUser) {
    return <Auth />;
  }

  const handleViewHistory = () => {
    setCurrentView('history');
    setSelectedChecklist(null);
  };

  const handleBackToNew = () => {
    setCurrentView('new');
    setSelectedChecklist(null);
  };

  const handleSelectChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    setCurrentView('detail');
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
    setSelectedChecklist(null);
  };

  switch (currentView) {
    case 'history':
      return (
        <ChecklistHistory 
          onSelectChecklist={handleSelectChecklist}
          onBackToNew={handleBackToNew}
        />
      );
    case 'detail':
      return (
        <ChecklistDetail 
          checklist={selectedChecklist}
          onBackToHistory={handleBackToHistory}
        />
      );
    case 'new':
    default:
      return (
        <Checklist onViewHistory={handleViewHistory} />
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
