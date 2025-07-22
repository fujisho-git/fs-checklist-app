import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password, rememberMe);
      // ログイン成功時にコールバックを呼び出し
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>作業前点検システム ログイン</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="メールアドレスを入力"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワードを入力"
            />
          </div>
          <div className="form-group remember-group">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-checkbox"
              />
              <span className="remember-text">
                ログイン状態を保存する
              </span>
            </label>
            <p className="remember-hint">
              チェックを外してブラウザを閉じるとログアウトします
            </p>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <div className="auth-note">
          <p>※ アカウントは管理者より提供されます</p>
          <p>ログインできない場合は管理者にお問い合わせください</p>
        </div>
      </div>
    </div>
  );
} 