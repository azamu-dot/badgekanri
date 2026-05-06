import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { supabase, testConnection } from './lib/supabase'
import Auth from './components/Auth'
import GuideModal from './components/guide/GuideModal'

// ページコンポーネント
import Dashboard from './pages/Dashboard'
import MyActivities from './pages/MyActivities'
import TitleMaster from './pages/TitleMaster'
import RewardMaster from './pages/RewardMaster'

// モバイル下部ナビゲーション
function MobileBottomNav() {
  const location = useLocation()
  const navItems = [
    { to: '/', label: 'ホーム', icon: '📊', end: true },
    { to: '/titles', label: '称号', icon: '🏅' },
    { to: '/rewards', label: '特典', icon: '🎁' },
    { to: '/my-activities', label: '活動', icon: '📝' },
  ]

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(item => {
        const isActive = item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function AppShell() {
  const { initializeApp, isLoading, error, clearError } = useAppStore()
  const [connectionStatus, setConnectionStatus] = useState(null) // null | 'ok' | 'error'
  const [session, setSession] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const init = async () => {
      // まず接続テスト
      const result = await testConnection()
      setConnectionStatus(result.ok ? 'ok' : 'error')
      if (result.ok) {
        await initializeApp()
      }
    }
    init()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      useAppStore.getState().setCurrentUser(session?.user || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      useAppStore.getState().setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* ヘッダー (デスクトップ) */}
        <header className="app-header">
          <div className="header-inner">
            <div className="header-brand">
              <span className="brand-icon">🏅</span>
              <span className="brand-name">バッジかんり</span>
            </div>
            <nav className="header-nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                ダッシュボード
              </NavLink>
              <NavLink to="/titles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                称号管理
              </NavLink>
              <NavLink to="/rewards" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                特典管理
              </NavLink>
              <NavLink to="/my-activities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                マイアクティビティ
              </NavLink>
            </nav>
            {/* ユーザー情報とログアウト */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button 
                onClick={() => setShowGuide(true)}
                style={{ backgroundColor: '#2b2b40', color: '#fff', border: '1px solid #4da6ff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                📖 使い方
              </button>
              {session?.user?.email && (
                <span className="user-name desktop-only">
                  {session.user.email.replace('@badge-app.local', '')} さん
                </span>
              )}
              <button 
                onClick={() => supabase.auth.signOut()}
                className="logout-btn"
                style={{ fontSize: '0.8rem', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ログアウト
              </button>
            </div>
            {/* 接続ステータスバッジ */}
            <div className={`connection-badge ${connectionStatus === 'ok' ? 'connected' : connectionStatus === 'error' ? 'disconnected' : 'checking'}`} style={{ marginLeft: '10px' }}>
              <span className="conn-dot" />
              <span className="conn-label">
                {connectionStatus === 'ok' ? 'DB接続中' : connectionStatus === 'error' ? '未接続' : '確認中...'}
              </span>
            </div>
          </div>
        </header>

        {/* グローバルエラー表示 */}
        {error && (
          <div className="global-error">
            <span>⚠️ {error}</span>
            <button onClick={clearError} className="error-close">✕</button>
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="global-loading">
            <div className="loading-spinner" />
            <span>データを読み込み中...</span>
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/titles" element={<TitleMaster />} />
            <Route path="/rewards" element={<RewardMaster />} />
            <Route path="/my-activities" element={<MyActivities />} />
          </Routes>
        </main>

        {/* モバイル下部ナビゲーション */}
        <MobileBottomNav />

        {/* フッター (デスクトップのみ) */}
        <footer className="app-footer">
          <span>バッジかんり — リスナー称号・特典管理アプリ</span>
        </footer>

        {/* 💡 ガイドモーダルの表示 (グローバル) */}
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return <AppShell />
}
