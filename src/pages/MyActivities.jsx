import { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'

export default function MyActivities() {
  const { myActivities, titles, createMyActivity, deleteMyActivity } = useAppStore()

  // フォーム状態
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0])
  const [streamerName, setStreamerName] = useState('')
  const [selectedTitle, setSelectedTitle] = useState(titles[0]?.name || '')
  const [saving, setSaving] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)

  // フィルター状態
  const [filterMonth, setFilterMonth] = useState('all') // 'all' or 'YYYY-MM'

  // 利用可能な月リストを生成
  const availableMonths = useMemo(() => {
    const months = new Set()
    myActivities.forEach(act => {
      const ym = act.activity_date.substring(0, 7) // 'YYYY-MM'
      months.add(ym)
    })
    return Array.from(months).sort().reverse()
  }, [myActivities])

  const filteredActivities = useMemo(() => {
    if (filterMonth === 'all') return myActivities
    return myActivities.filter(act => act.activity_date.startsWith(filterMonth))
  }, [myActivities, filterMonth])

  // ランクごとにグループ化（マスタの表示順を優先）
  const groupedActivities = useMemo(() => {
    const grouped = {}
    // マスタにある称号を初期化
    titles.forEach(t => {
      grouped[t.name] = { color: t.color_code, items: [] }
    })
    
    filteredActivities.forEach(act => {
      if (!grouped[act.title_name]) {
        grouped[act.title_name] = { color: '#888', items: [] }
      }
      grouped[act.title_name].items.push(act)
    })
    return grouped
  }, [filteredActivities, titles])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!streamerName.trim()) return alert('配信者名を入力してください')
    if (!selectedTitle) return alert('称号を選択してください')

    setSaving(true)
    const payload = {
      activity_date: activityDate,
      streamer_name: streamerName.trim(),
      title_name: selectedTitle,
      note: null
    }

    const res = await createMyActivity(payload)
    setSaving(false)
    if (res) {
      setStreamerName('')
      // setActivityDate はそのまま（連続入力しやすいように）
    } else {
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('この記録を削除しますか？')) {
      await deleteMyActivity(id)
    }
  }

  // フィルター表示用のラベル
  const getMonthLabel = (ym) => {
    if (ym === 'all') return '累計 (すべて)'
    const [y, m] = ym.split('-')
    return `${y}年${parseInt(m, 10)}月`
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📝 獲得称号メモ</h1>
        <p className="page-description">他の枠で獲得した称号を簡易記録します。</p>
      </div>

      <div className="dashboard-grid">
        {/* 左側: シンプル入力フォーム */}
        <div className="dashboard-left">
          <div className="section-card">
            <h2 className="section-title">➕ 新しく記録</h2>
            <form onSubmit={handleSave} className="listener-form">
              <div className="form-field">
                <label className="form-label">獲得日</label>
                <input
                  type="date"
                  className="input"
                  value={activityDate}
                  onChange={e => setActivityDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">配信者名 (誰の枠か)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="例: あざむ"
                  value={streamerName}
                  onChange={e => setStreamerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">獲得したランク</label>
                <select
                  className="input"
                  value={selectedTitle}
                  onChange={e => setSelectedTitle(e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {titles.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ 保存中...' : '追加する'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 右側: 月別/累計 と ランク別リスト */}
        <div className="dashboard-right">
          <div className="section-card">
            <div className="table-header" style={{ marginBottom: '16px' }}>
              <h2 className="section-title">📊 獲得実績</h2>
              <select
                className="input"
                style={{ width: '150px', padding: '4px 8px', fontSize: '0.9rem' }}
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
              >
                <option value="all">累計 (すべて)</option>
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{getMonthLabel(ym)}</option>
                ))}
              </select>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              表示期間: <strong style={{ color: 'var(--text-primary)' }}>{getMonthLabel(filterMonth)}</strong>
              （計 {filteredActivities.length} 件）
            </p>

            <div className="rank-groups">
              {Object.entries(groupedActivities).map(([rankName, group]) => {
                if (group.items.length === 0) return null
                return (
                  <div key={rankName} className="rank-group" style={{ marginBottom: '24px' }}>
                    <div className="rank-group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: `1px solid ${group.color}40`, paddingBottom: '8px' }}>
                      <span className="title-badge" style={{ borderColor: group.color, color: group.color }}>
                        <span className="badge-dot" style={{ backgroundColor: group.color }} />
                        {rankName}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {group.items.length} 枠
                      </span>
                    </div>
                    
                    <div className="rank-items-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                      {group.items.sort((a,b)=>new Date(b.activity_date)-new Date(a.activity_date)).map(act => (
                        <div key={act.id} className="rank-item-card" style={{ background: 'var(--bg-base)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(act.activity_date).getMonth() + 1}/{new Date(act.activity_date).getDate()}
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.streamer_name}
                          </span>
                          <button 
                            onClick={() => handleDelete(act.id)}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', color: 'var(--text-danger)', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {filteredActivities.length === 0 && (
                <div className="empty-state">
                  <p>この期間の記録はありません。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ 危険な操作 */}
      <div className="danger-zone" style={{ marginTop: '40px', padding: '20px', borderTop: '1px dashed var(--glass-border)', opacity: 0.8 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>🛠️ データメンテナンス</p>
        {isResetConfirming ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-danger)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>活動記録をすべて消去しますか？</span>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--accent-danger)' }}
              onClick={async () => {
                await useAppStore.getState().resetActivitiesData()
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
            🗑️ 活動記録をすべてリセット
          </button>
        )}
      </div>
    </div>
  )
}
