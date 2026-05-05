import { useState } from 'react'
import { useAppStore } from '../store/appStore'

/**
 * RewardMaster — 特典・報酬マスタ管理ページ
 * 称号ごとに特典（ボイス、壁紙など）を定義し、期限タイプを設定する。
 */
export default function RewardMaster() {
  const { titles, rewards, createReward, updateReward, deleteReward } = useAppStore()

  const [editingId, setEditingId] = useState(null)
  const [titleId, setTitleId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadlineType, setDeadlineType] = useState('none') // 'monthly' | 'fixed' | 'permanent' | 'none'
  const [fixedDeadline, setFixedDeadline] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isResetConfirming, setIsResetConfirming] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setDeadlineType('none')
    setFixedDeadline('')
    setError('')
  }

  const handleEdit = (reward) => {
    setEditingId(reward.id)
    setTitleId(reward.title_id)
    setName(reward.name)
    setDescription(reward.description || '')
    setDeadlineType(reward.deadline_type || 'none')
    setFixedDeadline(reward.fixed_deadline || '')
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!titleId) { setError('対象の称号を選択してください'); return }
    if (!name.trim()) { setError('特典名を入力してください'); return }
    if (deadlineType === 'fixed' && !fixedDeadline) { setError('固定期限の日付を入力してください'); return }

    setSaving(true)
    const payload = {
      title_id: titleId,
      name: name.trim(),
      description: description.trim() || null,
      deadline_type: deadlineType,
      fixed_deadline: deadlineType === 'fixed' ? fixedDeadline : null
    }

    let success = false
    if (editingId) {
      const res = await updateReward(editingId, payload)
      if (res) success = true
    } else {
      const res = await createReward(payload)
      if (res) success = true
    }

    setSaving(false)
    if (success) resetForm()
    else setError('保存に失敗しました。')
  }

  const handleDelete = async (id, rewardName) => {
    if (!window.confirm(`特典「${rewardName}」を削除しますか？\n※既に進行中のタスクにも影響が出る可能性があります。`)) {
      return
    }
    const res = await deleteReward(id)
    if (!res) alert('削除に失敗しました。')
    else if (editingId === id) resetForm()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🎁 特典・報酬マスタ管理</h1>
        <p className="page-description">称号ごとに付与する特典（限定ボイスや画像など）と、その期限を設定します。</p>
      </div>

      <div className="dashboard-grid">
        {/* 左側: 入力フォーム */}
        <div className="dashboard-left">
          <div className="section-card">
            <h2 className="section-title">
              {editingId ? '✍️ 特典を編集' : '➕ 新規特典の追加'}
            </h2>
            
            {titles.length === 0 ? (
              <p className="form-hint" style={{ color: '#ff8a80' }}>先に称号マスタで称号を作成してください。</p>
            ) : (
              <form onSubmit={handleSave} className="listener-form">
                
                <div className="form-field">
                  <label className="form-label">対象の称号</label>
                  <select
                    className="input"
                    value={titleId}
                    onChange={e => setTitleId(e.target.value)}
                  >
                    <option value="">-- 称号を選択 --</option>
                    {titles.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">特典名</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="例: 限定ボイス、チェキプレゼント"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">期限タイプ</label>
                  <select
                    className="input"
                    value={deadlineType}
                    onChange={e => setDeadlineType(e.target.value)}
                  >
                    <option value="none">期限なし（タスク管理のみ）</option>
                    <option value="monthly">月末まで（月ごとの特典）</option>
                    <option value="fixed">指定日（イベント等の期日）</option>
                    <option value="permanent">永続（1回きりの特典）</option>
                  </select>
                  {deadlineType === 'monthly' && <p className="form-hint">付与された月の月末が自動的に期限になります。</p>}
                  {deadlineType === 'permanent' && <p className="form-hint">連続付与されても1度渡せば完了となる特典です。</p>}
                </div>

                {deadlineType === 'fixed' && (
                  <div className="form-field">
                    <label className="form-label">固定期限日</label>
                    <input
                      type="date"
                      className="input"
                      value={fixedDeadline}
                      onChange={e => setFixedDeadline(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">説明 <span className="label-optional">（任意）</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="例: ギガファイル便で送信"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {error && <p className="form-error">⚠️ {error}</p>}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '⏳ 保存中...' : (editingId ? '✅ 更新する' : '➕ 追加する')}
                  </button>
                  {editingId && (
                    <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                      キャンセル
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 右側: 登録済み特典一覧 */}
        <div className="dashboard-right">
          <div className="section-card">
            <h2 className="section-title">📋 登録済みの特典</h2>
            {rewards.length === 0 ? (
              <p className="empty-hint">まだ特典が登録されていません。</p>
            ) : (
              <div className="reward-master-list">
                {/* 称号ごとにグループ化して表示 */}
                {titles.map(t => {
                  const titleRewards = rewards.filter(r => r.title_id === t.id)
                  if (titleRewards.length === 0) return null
                  
                  return (
                    <div key={t.id} className="reward-group">
                      <div className="reward-group-header">
                        <span className="title-badge" style={{ borderColor: t.color_code, color: t.color_code }}>
                          <span className="badge-dot" style={{ backgroundColor: t.color_code }} />
                          {t.name}
                        </span>
                      </div>
                      <div className="reward-items">
                        {titleRewards.map(r => (
                          <div key={r.id} className="reward-item">
                            <div className="rm-left">
                              <span className="rm-name">{r.name}</span>
                              <div className="rm-meta">
                                <span className="rm-badge">
                                  {r.deadline_type === 'monthly' ? '月末まで' : 
                                   r.deadline_type === 'fixed' ? `期限: ${r.fixed_deadline}` : 
                                   r.deadline_type === 'permanent' ? '永続・1回のみ' : '期限なし'}
                                </span>
                                {r.description && <span className="rm-desc">{r.description}</span>}
                              </div>
                            </div>
                            <div className="rm-actions">
                              <button className="btn-icon" onClick={() => handleEdit(r)}>✏️</button>
                              <button className="btn-icon text-danger" onClick={() => handleDelete(r.id, r.name)}>🗑️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⚠️ 危険な操作 */}
      <div className="danger-zone" style={{ marginTop: '40px', padding: '20px', borderTop: '1px dashed var(--glass-border)', opacity: 0.8 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>🛠️ データメンテナンス</p>
        {isResetConfirming ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-danger)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>特典マスタをすべて消去しますか？</span>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--accent-danger)' }}
              onClick={async () => {
                await useAppStore.getState().resetRewardsData()
                setIsResetConfirming(false)
                alert('リセット完了しました。')
              }}
            >
              はい
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsResetConfirming(false)}
            >
              いいえ
            </button>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-danger)' }}
            onClick={() => setIsResetConfirming(true)}
          >
            🗑️ 特典マスタをすべてリセット
          </button>
        )}
      </div>
    </div>
  )
}
