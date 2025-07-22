import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
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
  const [loading, setLoading] = useState(false);

  // URLハッシュの変更を監視してブラウザナビゲーションに対応
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.slice(1);
      
      if (hash === 'auth') {
        setCurrentView('auth');
      } else if (hash === 'history') {
        if (currentUser) {
          setCurrentView('history');
          setSelectedChecklist(null);
        } else {
          setCurrentView('history'); // ログイン要求画面表示
        }
      } else if (hash === 'admin') {
        if (currentUser && isAdminUser) {
          setCurrentView('admin');
          setSelectedChecklist(null);
        } else {
          setCurrentView('admin'); // ログイン要求画面表示
        }
      } else if (hash.startsWith('detail-')) {
        // 詳細画面：チェックリストIDからデータを取得
        const checklistId = hash.replace('detail-', '');
        if (currentUser && checklistId) {
          setLoading(true);
          try {
            const docRef = doc(db, 'checklists', checklistId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const checklistData = { id: docSnap.id, ...docSnap.data() };
              setSelectedChecklist(checklistData);
              setCurrentView('detail');
              
              // 前の画面を推測（管理者か一般ユーザーかで判断）
              if (isAdminUser && checklistData.createdBy !== currentUser.email) {
                setPreviousView('admin');
              } else {
                setPreviousView('history');
              }
            } else {
              console.error('チェックリストが見つかりません');
              window.location.hash = currentUser && isAdminUser ? 'admin' : 'history';
            }
          } catch (error) {
            console.error('チェックリスト取得エラー:', error);
            window.location.hash = currentUser && isAdminUser ? 'admin' : 'history';
          }
          setLoading(false);
        } else {
          setCurrentView('detail'); // ログイン要求画面表示
        }
      } else {
        // デフォルトは新規作成画面
        setCurrentView('new');
        setSelectedChecklist(null);
        setPreviousView(null);
      }
    };

    // 初期化時にハッシュをチェック
    handleHashChange();

    // ハッシュ変更イベントを監視
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, isAdminUser]);

  // ログイン状態の変化を監視
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'loginSuccess') {
        // 別タブでログインが成功した場合
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleViewHistory = () => {
    window.location.hash = 'history';
  };

  const handleViewAdminHistory = () => {
    window.location.hash = 'admin';
  };

  const handleBackToNew = () => {
    window.location.hash = '';
  };

  const handleSelectChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    setPreviousView(currentView);
    setCurrentView('detail');
    // 詳細画面用のハッシュを設定（ブラウザバックで戻れるように）
    window.location.hash = `detail-${checklist.id}`;
  };

  const handleBackToHistory = () => {
    window.location.hash = 'history';
  };

  const handleBackToAdminHistory = () => {
    window.location.hash = 'admin';
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">チェックリストを読み込み中...</div>
      </div>
    );
  }

  // ログイン画面を表示する場合
  if (currentView === 'auth') {
    return <Auth 
      onLoginSuccess={() => {
        // ログイン成功時に他のタブに通知
        localStorage.setItem('loginSuccess', Date.now().toString());
        localStorage.removeItem('loginSuccess');
        window.close(); // 別タブを閉じる
      }}
    />;
  }

  // ログインが必要な画面にアクセスしようとした場合
  if (!currentUser && (currentView === 'history' || currentView === 'admin' || currentView === 'detail')) {
    return (
      <div className="auth-required-container">
        <div className="auth-required-message">
          <h2>ログインが必要です</h2>
          <p>履歴の確認や管理機能を使用するにはログインしてください。</p>
          <button 
            onClick={() => window.open('#auth', '_blank')} 
            className="login-button"
          >
            ログイン画面を開く
          </button>
          <button 
            onClick={handleBackToNew} 
            className="back-to-new-button"
          >
            チェックリスト作成に戻る
          </button>
        </div>
      </div>
    );
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
