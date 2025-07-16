import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password.length < 6) {
      return setError('パスワードは6文字以上である必要があります');
    }

    try {
      setError('');
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error) {
      setError(isLogin ? 'ログインに失敗しました' : 'アカウント作成に失敗しました');
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'ログイン' : 'アカウント作成'}</h2>
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
            />
            <p className="password-hint">パスワードは6文字以上で入力してください。</p>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? '処理中...' : (isLogin ? 'ログイン' : 'アカウント作成')}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="link-button"
          >
            {isLogin ? 'アカウント作成' : 'ログイン'}
          </button>
        </p>
      </div>
    </div>
  );
} 