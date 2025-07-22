import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Checklist from './components/Checklist';
import ChecklistHistory from './components/ChecklistHistory';
import ChecklistDetail from './components/ChecklistDetail';
import AdminHistory from './components/AdminHistory';
import './App.css';

function AppContent() {
  const { currentUser, isAdminUser } = useAuth();
  const [currentView, setCurrentView] = useState('new');
  const [previousView, setPreviousView] = useState(null); // 追加: 前の画面を追跡
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  if (!currentUser) {
    return <Auth />;
  }

  const handleViewHistory = () => {
    setCurrentView('history');
    setSelectedChecklist(null);
  };

  const handleViewAdminHistory = () => {
    setCurrentView('admin');
    setSelectedChecklist(null);
  };

  const handleBackToNew = () => {
    setCurrentView('new');
    setSelectedChecklist(null);
    setPreviousView(null);
  };

  const handleSelectChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    setPreviousView(currentView); // 現在のビューを保存
    setCurrentView('detail');
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
    setSelectedChecklist(null);
    setPreviousView(null);
  };

  const handleBackToAdminHistory = () => {
    setCurrentView('admin');
    setSelectedChecklist(null);
    setPreviousView(null);
  };

  switch (currentView) {
    case 'admin':
      return (
        <AdminHistory 
          onSelectChecklist={handleSelectChecklist}
          onBackToNew={handleBackToNew}
        />
      );
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
          onBackToHistory={previousView === 'admin' ? handleBackToAdminHistory : handleBackToHistory}
          isFromAdmin={previousView === 'admin'}
        />
      );
    case 'new':
    default:
      return (
        <Checklist 
          onViewHistory={handleViewHistory}
          onViewAdminHistory={isAdminUser ? handleViewAdminHistory : null}
        />
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
