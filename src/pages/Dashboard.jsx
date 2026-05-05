import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/appStore'
import { useListenerTitles } from '../hooks/useListenerTitles'
import { useListenerRewards } from '../hooks/useListenerRewards'
import ListenerForm from '../components/listener/ListenerForm'
import ListenerTable from '../components/listener/ListenerTable'
import ListenerDetailModal from '../components/listener/ListenerDetailModal'
import PeriodManager from '../components/period/PeriodManager'

/**
 * ダッシュボード — メインページ
 */
export default function Dashboard() {
  const queryClient = useQueryClient()
  const { listeners, activePeriod, periods, titles, isLoading } = useAppStore()
  
  // React Query でデータを取得（サーバー状態の Single Source of Truth）
  const { data: listenerTitles = [] } = useListenerTitles(activePeriod?.id)
  
  // 特典データの取得
  const { data: listenerRewards = [] } = useListenerRewards(activePeriod?.id)

  const [selectedListenerTitle, setSelectedListenerTitle] = useState(null)
  const [isResetConfirming, setIsResetConfirming] = useState(false)

  // 称号付与後にキャッシュを無効化して再取得
  const handleAssigned = () => {
    queryClient.invalidateQueries({ queryKey: ['listenerTitles', activePeriod?.id || 'cumulative'] })
  }

  return (
    <div className="page-container">

      {/* ページタイトル */}
      <div className="page-header">
        <h1 className="page-title">📊 ダッシュボード</h1>
        {activePeriod && (
          <span className="active-period-badge">
            📅 {activePeriod.label}
          </span>
        )}
      </div>

      {/* 初期読み込み時（データが空かつ読み込み中）のみ全画面ローディングを表示 */}
      {(isLoading && listeners.length === 0 && periods.length === 0) ? (
        <div className="placeholder-message">データを読み込み中...</div>
      ) : (
        <div className="dashboard-grid">
          {/* 左カラム: 期間管理 + リスナー入力 */}
          <div className="dashboard-left">
            {/* 集計期間管理 */}
            <div className="section-card">
              <PeriodManager />
            </div>

            {/* リスナー入力フォーム */}
            <div className="section-card">
              <ListenerForm onAssigned={handleAssigned} />
            </div>
          </div>

          {/* 右カラム: 統計サマリー + 一覧テーブル */}
          <div className="dashboard-right">
            {/* サマリーカード */}
            <div className="summary-row" style={{ position: 'relative' }}>
              {/* 更新中を示す小さなインジケーター（任意） */}
              {isLoading && (
                <div style={{ position: 'absolute', top: '-20px', right: '0', fontSize: '0.7rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                  🔄 更新中...
                </div>
              )}
              <div className="summary-card">
                <span className="summary-icon">👥</span>
                <span className="summary-num">{listeners.length}</span>
                <span className="summary-label">リスナー総数</span>
              </div>
              <div className="summary-card">
                <span className="summary-icon">🏅</span>
                <span className="summary-num">{titles.length}</span>
                <span className="summary-label">称号種類数</span>
              </div>
              <div className="summary-card">
                <span className="summary-icon">🎖️</span>
                <span className="summary-num">{listenerTitles.filter(lt => !lt.is_placeholder).length}</span>
                <span className="summary-label">今期付与数</span>
              </div>
            </div>

            {/* 未完了の特典タスク一覧 */}
            <PendingRewardsBanner
              listenerTitles={listenerTitles}
              listenerRewards={listenerRewards}
              onSelectListener={setSelectedListenerTitle}
            />

            {/* 称号分布バー（今期） */}
            {listenerTitles.length > 0 && (
              <div className="section-card">
                <TitleDistribution listenerTitles={listenerTitles} titles={titles} />
              </div>
            )}

            {/* リスナー一覧テーブル */}
            <div className="section-card">
              <ListenerTable onSelectListener={setSelectedListenerTitle} />
            </div>
          </div>
        </div>
      )}

      {/* リスナー詳細モーダル */}
      {selectedListenerTitle && (
        <ListenerDetailModal 
          listenerTitle={selectedListenerTitle} 
          onClose={() => setSelectedListenerTitle(null)} 
        />
      )}

      {/* ⚠️ 高度な設定（データ管理） */}
      <div className="danger-zone" style={{ marginTop: '60px', padding: '20px', borderTop: '1px dashed var(--glass-border)', opacity: 0.8 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>🛠️ データメンテナンス</p>
        
        {isResetConfirming ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-danger)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
              【警告】全リスナー・履歴データを完全に削除しますか？
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--accent-danger)', flex: 1 }}
                onClick={async () => {
                  const ok = await useAppStore.getState().resetAllData()
                  if (ok) {
                    setIsResetConfirming(false)
                    alert('リセットが完了しました。')
                  }
                }}
              >
                はい、削除します
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsResetConfirming(false)}
              >
                いいえ
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', padding: '8px 16px' }}
            onClick={() => setIsResetConfirming(true)}
          >
            🗑️ 全データ（リスナー・履歴）をリセット
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 未完了の特典タスクをリスト表示するバナーコンポーネント
 */
function PendingRewardsBanner({ listenerTitles, listenerRewards, onSelectListener }) {
  // 未完了のlistener_rewardsを抽出
  const pendingRewards = listenerRewards.filter(lr => !lr.is_done)
  if (pendingRewards.length === 0) return null

  return (
    <div className="pending-rewards-banner">
      <div className="pending-banner-header">
        <span className="pending-banner-icon">⚠️</span>
        <h3 className="pending-banner-title">未渡しの特典 ({pendingRewards.length}件)</h3>
      </div>
      <div className="pending-reward-list">
        {pendingRewards.slice(0, 5).map(lr => {
          const lt = listenerTitles.find(lt => lt.id === lr.listener_title_id)
          if (!lt) return null
          return (
            <div
              key={lr.id}
              className="pending-reward-item"
              onClick={() => onSelectListener && onSelectListener(lt)}
            >
              <span className="pending-listener-name">
                {lt.listeners?.name}
              </span>
              <span className="pending-reward-name">
                🎁 {lr.rewards?.name}
              </span>
              {lr.rewards?.deadline_type === 'monthly' && (
                <span className="pending-deadline-badge">月末まで</span>
              )}
            </div>
          )
        })}
        {pendingRewards.length > 5 && (
          <p className="pending-more">他 {pendingRewards.length - 5} 件の未渡し特典があります</p>
        )}
      </div>
    </div>
  )
}

/**
 * 今期の称号分布を視覚化するミニコンポーネント
 */
function TitleDistribution({ listenerTitles, titles }) {
  // 称号ごとの人数集計
  const counts = {}
  listenerTitles.forEach(lt => {
    const id = lt.title_id
    counts[id] = (counts[id] || 0) + 1
  })
  const total = listenerTitles.length

  return (
    <div className="title-dist">
      <h3 className="section-title">📊 今期の称号分布</h3>
      <div className="dist-bars">
        {titles.map(t => {
          const count = counts[t.id] || 0
          if (count === 0) return null
          const pct = Math.round((count / total) * 100)
          return (
            <div key={t.id} className="dist-row">
              <div className="dist-label">
                <span className="dist-dot" style={{ backgroundColor: t.color_code }} />
                <span className="dist-name">{t.name}</span>
              </div>
              <div className="dist-bar-wrap">
                <div
                  className="dist-bar"
                  style={{ width: `${pct}%`, backgroundColor: t.color_code }}
                />
              </div>
              <span className="dist-count">{count}人</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
