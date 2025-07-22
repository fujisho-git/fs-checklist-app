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
  const [previousView, setPreviousView] = useState(null);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  // ログイン画面を表示するケース（履歴や管理者画面にアクセス時のみ）
  if (!currentUser && (currentView === 'history' || currentView === 'admin' || currentView === 'detail')) {
    return <Auth onLoginSuccess={() => {
      // ログイン成功後は元の画面に戻る
      if (currentView === 'detail') {
        // 詳細画面の場合は前の画面に応じて戻る
        if (previousView === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('history');
        }
      }
      // 他の場合はそのまま
    }} />;
  }

  const handleViewHistory = () => {
    if (!currentUser) {
      setCurrentView('history'); // ログイン画面を表示するためにhistoryに設定
      return;
    }
    setCurrentView('history');
    setSelectedChecklist(null);
  };

  const handleViewAdminHistory = () => {
    if (!currentUser) {
      setCurrentView('admin'); // ログイン画面を表示するためにadminに設定
      return;
    }
    setCurrentView('admin');
    setSelectedChecklist(null);
  };

  const handleBackToNew = () => {
    setCurrentView('new');
    setSelectedChecklist(null);
    setPreviousView(null);
  };

  const handleSelectChecklist = (checklist) => {
    if (!currentUser) {
      setCurrentView('detail'); // ログイン画面を表示するためにdetailに設定
      return;
    }
    setSelectedChecklist(checklist);
    setPreviousView(currentView);
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

  const handleLoginRequest = () => {
    setCurrentView('auth');
  };

  // ログイン画面を明示的に表示する場合
  if (currentView === 'auth') {
    return <Auth onLoginSuccess={() => setCurrentView('new')} />;
  }

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
          onLoginRequest={handleLoginRequest}
          currentUser={currentUser}
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
