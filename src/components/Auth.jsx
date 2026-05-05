import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!username.trim() || password.length < 6) {
      setErrorMsg('ユーザー名、またはパスワード（6文字以上）が正しくありません。')
      return
    }

    setLoading(true)
    const email = `${username.trim()}@badge-app.local`

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // auto-login or success message depends on email confirmation. 
        // We assume Confirm email is OFF.
        setSuccessMsg('登録が完了しました！自動的にログインします。')
      }
    } catch (err) {
      setErrorMsg(err.message === 'Invalid login credentials' ? 'ユーザー名またはパスワードが間違っています。' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🏅</span>
          <h1>バッジかんり</h1>
          <p>{isLogin ? 'ログインして管理を始める' : '新しくアカウントを作成する'}</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="あなたの名前"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード (6文字以上)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? '処理中...' : isLogin ? 'ログイン' : '新規登録'}
          </button>
        </form>

        <div className="auth-toggle">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? 'アカウントを持っていませんか？ 新規登録' : 'すでにアカウントをお持ちですか？ ログイン'}
          </button>
        </div>
      </div>
    </div>
  )
}
