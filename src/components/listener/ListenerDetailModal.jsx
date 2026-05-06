import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { useListenerRewards } from '../../hooks/useListenerRewards'
import { useToggleReward } from '../../hooks/useToggleReward'
import { useAssignTitle } from '../../hooks/useAssignTitle'

/**
 * ListenerDetailModal — リスナー詳細と連続取得状況の表示
 */
export default function ListenerDetailModal({ listenerTitle, onClose }) {
  const { calcConsecutiveCount, fetchListenerHistory, titles, activePeriod } = useAppStore()
  
  // React Query で特典データを取得
  const { data: listenerRewards = [] } = useListenerRewards({ listenerTitleId: listenerTitle?.id })
  const { mutate: toggleReward } = useToggleReward(listenerTitle?.id)
  const { mutate: assignTitle } = useAssignTitle()
  
  const [history, setHistory] = useState([])
  const [consecutiveData, setConsecutiveData] = useState(null)
  const [loading, setLoading] = useState(true)

  const listener = listenerTitle?.listeners
  const currentTitle = listenerTitle?.titles

  useEffect(() => {
    if (!listener) return

    const loadData = async () => {
      setLoading(true)
      try {
        // 1. 全履歴を取得
        const hist = await fetchListenerHistory(listener.id)
        setHistory(hist)

        // 2. 任意の称号での連続取得回数とランクごとの集計を取得
        const consec = await calcConsecutiveCount(listener.id)
        setConsecutiveData(consec)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [listener, currentTitle, listenerTitle])

  // 対象リスナーの特典リスト
  const currentRewards = listenerRewards

  const handleToggleReward = async (rewardId, currentStatus) => {
    if (listenerTitle.is_placeholder) return // 称号未付与時は操作不可
    toggleReward({ rewardId, isDone: !currentStatus })
  }

  if (!listener) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="listener-avatar-lg">
              {listener.name.charAt(0)}
            </span>
            {listener.name} さんの詳細
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body loading-center">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="modal-body">
            
            {/* 現在の称号と連続取得情報 */}
            <div className="detail-highlight-card">
              <div className="highlight-header">今期の称号</div>
              <div className="highlight-main">
                <select
                  value={currentTitle?.id || ''}
                  onChange={(e) => {
                    const newTitleId = e.target.value;
                    if (!newTitleId || !listener?.id) return;
                    assignTitle({
                      listenerId: listener.id,
                      periodId: activePeriod?.id || listenerTitle?.period_id,
                      titleId: newTitleId,
                      note: listenerTitle?.note || ''
                    });
                  }}
                  disabled={!activePeriod?.id && !listenerTitle?.period_id}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--glass-bg)',
                    color: currentTitle?.color_code || 'var(--text-color)',
                    border: `2px solid ${currentTitle?.color_code || 'var(--border-subtle)'}`,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'center',
                    appearance: 'none'
                  }}
                >
                  <option value="" disabled>未付与（タップして選択）</option>
                  {titles.map(t => (
                    <option key={t.id} value={t.id} style={{ color: '#fff', background: '#1a1f35' }}>
                      {t.name}
                    </option>
                  ))}
                </select>
                
                {consecutiveData && (
                  <div className="consecutive-stats">
                    <div className="stat-item">
                      <span className="stat-value">{consecutiveData.total}</span>
                      <span className="stat-label">累計取得回数</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item highlight-stat">
                      <span className="stat-value">{consecutiveData.consecutive}</span>
                      <span className="stat-label">連続取得（月）</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ランク別取得回数 */}
            {consecutiveData && consecutiveData.rankCounts.length > 0 && (
              <div className="rank-counts-section">
                <h3 className="section-title-sm">🏅 ランク別取得回数</h3>
                <div className="rank-counts-grid">
                  {consecutiveData.rankCounts.map(rc => (
                    <div key={rc.id} className="rank-count-item">
                      <span className="title-badge" style={{ borderColor: rc.color_code, color: rc.color_code }}>
                        <span className="badge-dot" style={{ backgroundColor: rc.color_code }} />
                        {rc.name}
                      </span>
                      <span className="rank-count-val">{rc.count} 回</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 今期の特典タスク */}
            <div className="rewards-section">
              <h3 className="section-title-sm">🎁 今期の特典・タスク</h3>
              {currentRewards.length === 0 ? (
                <p className="empty-hint-sm">現在設定されている特典はありません。</p>
              ) : (
                <div className="reward-task-list">
                  {currentRewards.map(lr => (
                    <div key={lr.id} className={`reward-task-item ${lr.is_done ? 'is-done' : ''}`}>
                      <label className="checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={lr.is_done}
                          onChange={() => handleToggleReward(lr.reward_id, lr.is_done)}
                          className="reward-checkbox"
                        />
                        <div className="reward-task-content">
                          <span className="rt-name">{lr.rewards?.name}</span>
                          <div className="rt-meta">
                            {lr.rewards?.deadline_type !== 'none' && (
                              <span className="rt-badge">
                                {lr.rewards?.deadline_type === 'monthly' ? '月末まで' : 
                                 lr.rewards?.deadline_type === 'fixed' ? `期限: ${lr.rewards?.fixed_deadline}` : 
                                 '永続'}
                              </span>
                            )}
                            {lr.is_done && lr.done_at && (
                              <span className="rt-done-date">
                                ✅ {new Date(lr.done_at).toLocaleDateString()} 完了
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 過去の称号履歴 */}
            <div className="history-section">
              <h3 className="section-title-sm">🕒 取得履歴</h3>
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id} className="history-item">
                    <div className="history-period">
                      {h.periods?.label}
                    </div>
                    <div className="history-title">
                      <span className="title-badge" style={{ borderColor: h.titles?.color_code, color: h.titles?.color_code }}>
                        <span className="badge-dot" style={{ backgroundColor: h.titles?.color_code }} />
                        {h.titles?.name}
                      </span>
                    </div>
                    {h.note && <div className="history-note">{h.note}</div>}
                    <div className="history-date">
                      {new Date(h.assigned_at).toLocaleDateString('ja-JP')} 付与
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
