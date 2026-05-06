import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // パスワードの表示/非表示（目玉アイコン）用ステート
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const dummyEmail = `${username}@badge-app.local`;

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password });
      if (error) setErrorMsg('ユーザー名かパスワードが間違っています。');
    } else {
      const { error } = await supabase.auth.signUp({ email: dummyEmail, password });
      if (error) setErrorMsg('登録に失敗しました。別のユーザー名にするか、パスワードを6文字以上にしてください。');
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '25px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        {isLoginMode ? 'ログイン' : '新規登録'}
      </h2>

      {/* 🚨 案Bの要：新規登録時のみ、強い警告を表示する */}
      {!isLoginMode && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', borderLeft: '4px solid #ffeeba' }}>
          <strong>⚠️ パスワードに関する重要なお願い</strong><br /><br />
          当アプリはメールアドレスを使用しないため、<b>パスワードを忘れるとアカウントの復旧が一切できません。</b><br /><br />
          必ずメモを取るか、スマートフォン・ブラウザの<b>パスワード保存機能</b>をご利用ください。
        </div>
      )}

      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>ユーザー名</label><br />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>パスワード (6文字以上)</label><br />
          <div style={{ position: 'relative', marginTop: '5px' }}>
            <input
              // 目玉アイコンが押されたら text（丸見え）に切り替える
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', paddingRight: '45px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            {/* 目玉アイコンボタン */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px'
              }}
              title={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {errorMsg && <p style={{ color: '#d9534f', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>{errorMsg}</p>}

        <button type="submit" style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s' }}>
          {isLoginMode ? 'ログインする' : '登録して始める'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <button
          onClick={() => { 
            setIsLoginMode(!isLoginMode); 
            setErrorMsg(''); 
            setShowPassword(false); // モード切替時にパスワード表示をリセット
          }}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          {isLoginMode ? '新しくアカウントを作成する' : 'すでにアカウントをお持ちの方はこちら'}
        </button>
      </div>
    </div>
  );
}
