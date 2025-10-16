import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../firebase';
import { isAdminSync, getAdminEmails } from '../utils/adminUtils';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // ログイン
  async function login(email, password, rememberMe = true) {
    // 永続化設定を適用
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  // ログアウト
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // 管理者リストを事前に取得してキャッシュ
        try {
          await getAdminEmails();
          // キャッシュされた情報で管理者権限を判定
          setIsAdminUser(isAdminSync(user.email));
        } catch (error) {
          console.error('管理者権限の判定エラー:', error);
          // エラーの場合は同期版で判定
          setIsAdminUser(isAdminSync(user.email));
        }
      } else {
        setIsAdminUser(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdminUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 