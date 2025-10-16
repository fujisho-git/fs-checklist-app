import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { clearAdminCache } from '../utils/adminUtils';

export default function AdminManagement({ onBackToNew }) {
  const { currentUser, isAdminUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 管理者リストを取得
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log('管理者リストを取得中...');
      const q = query(collection(db, 'admins'), orderBy('email'));
      const querySnapshot = await getDocs(q);
      const adminList = [];
      querySnapshot.forEach((doc) => {
        adminList.push({ id: doc.id, ...doc.data() });
      });
      console.log('取得した管理者リスト:', adminList);
      setAdmins(adminList);
    } catch (error) {
      console.error('管理者リスト取得エラー:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      if (error.code === 'permission-denied') {
        setError('管理者リストの取得に失敗しました：アクセス権限がありません。Firestoreのセキュリティルールを確認してください。');
      } else if (error.code === 'failed-precondition') {
        setError('管理者リストの取得に失敗しました：Firestoreのインデックスが必要です。Firebase Consoleでインデックスを作成してください。');
      } else {
        setError(`管理者リストの取得に失敗しました：${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && isAdminUser) {
      fetchAdmins();
    }
  }, [currentUser, isAdminUser]);

  // 管理者を追加
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    // 既に存在するかチェック
    if (admins.some(admin => admin.email.toLowerCase() === newAdminEmail.toLowerCase())) {
      setError('このメールアドレスは既に管理者として登録されています。');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      console.log('管理者を追加中:', newAdminEmail.toLowerCase());
      await addDoc(collection(db, 'admins'), {
        email: newAdminEmail.toLowerCase(),
        addedBy: currentUser.email,
        addedAt: new Date()
      });

      setSuccess('管理者を追加しました。');
      setNewAdminEmail('');
      clearAdminCache(); // キャッシュをクリア
      await fetchAdmins(); // リストを再取得
      
      // 成功メッセージを3秒後に消去
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('管理者追加エラー:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      if (error.code === 'permission-denied') {
        setError('管理者の追加に失敗しました：アクセス権限がありません。Firestoreのセキュリティルールを確認してください。');
      } else {
        setError(`管理者の追加に失敗しました：${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 管理者を削除
  const handleDeleteAdmin = async (adminId, adminEmail) => {
    // 自分自身は削除できない
    if (adminEmail === currentUser.email) {
      setError('自分自身を管理者から削除することはできません。');
      return;
    }

    if (!confirm(`${adminEmail} を管理者から削除しますか？`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      setSuccess('管理者を削除しました。');
      clearAdminCache(); // キャッシュをクリア
      await fetchAdmins(); // リストを再取得
      
      // 成功メッセージを3秒後に消去
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('管理者削除エラー:', error);
      setError('管理者の削除に失敗しました。');
    }
  };

  // 管理者権限がない場合
  if (!currentUser || !isAdminUser) {
    return (
      <div className="admin-management-container">
        <div className="access-denied">
          <h2>アクセス拒否</h2>
          <p>この機能は管理者のみ利用できます。</p>
          <button onClick={onBackToNew} className="back-button">
            チェックリスト作成に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-container">
      <div className="admin-management-header">
        <h1>管理者管理</h1>
        <button onClick={onBackToNew} className="back-button">
          チェックリスト作成に戻る
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* 管理者追加フォーム */}
      <div className="add-admin-section">
        <h2>管理者を追加</h2>
        <form onSubmit={handleAddAdmin} className="add-admin-form">
          <div className="form-group">
            <label htmlFor="adminEmail">メールアドレス</label>
            <input
              id="adminEmail"
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="新しい管理者のメールアドレス"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="add-admin-button"
          >
            {submitting ? '追加中...' : '管理者を追加'}
          </button>
        </form>
      </div>

      {/* 管理者リスト */}
      <div className="admin-list-section">
        <h2>現在の管理者</h2>
        {loading ? (
          <div className="loading">管理者リストを読み込み中...</div>
        ) : (
          <div className="admin-list">
            {admins.length === 0 ? (
              <div className="no-admins">管理者が登録されていません。</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>メールアドレス</th>
                    <th>追加日時</th>
                    <th>追加者</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.email}</td>
                      <td>
                        {admin.addedAt ? 
                          new Date(admin.addedAt.toDate()).toLocaleString('ja-JP') : 
                          '不明'
                        }
                      </td>
                      <td>{admin.addedBy || '不明'}</td>
                      <td>
                        {admin.email === currentUser.email ? (
                          <span className="current-user-badge">現在のユーザー</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="delete-admin-button"
                          >
                            削除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="admin-management-note">
        <h3>注意事項</h3>
        <ul>
          <li>管理者は全てのチェックリストの閲覧・管理が可能です</li>
          <li>管理者の追加・削除は既存の管理者のみが実行できます</li>
          <li>自分自身を管理者から削除することはできません</li>
          <li>追加された管理者は即座に管理者権限が有効になります</li>
        </ul>
      </div>
    </div>
  );
}
