import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * PeriodManager — 集計期間管理コンポーネント
 * ・既存の期間一覧から選択して「アクティブ」に切り替え
 * ・新規期間の作成（月単位 or 任意日程）
 */
export default function PeriodManager() {
  const { periods, activePeriod, setActivePeriod, createPeriod, updatePeriodActive } = useAppStore()

  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState('monthly') // 'monthly' | 'custom'
  const [monthValue, setMonthValue] = useState(() => format(new Date(), 'yyyy-MM'))
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // 月単位で期間を作成
  const handleCreate = async () => {
    setError('')
    let label, start_date, end_date

    if (mode === 'monthly') {
      const [y, m] = monthValue.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      start_date = format(startOfMonth(d), 'yyyy-MM-dd')
      end_date = format(endOfMonth(d), 'yyyy-MM-dd')
      label = format(d, 'yyyy年M月', { locale: ja })
    } else {
      if (!customStart || !customEnd) { setError('開始日と終了日を入力してください'); return }
      if (customStart > customEnd) { setError('終了日は開始日以降にしてください'); return }
      start_date = customStart
      end_date = customEnd
      label = customLabel || `${customStart} 〜 ${customEnd}`
    }

    // 同じラベルの期間が既にないかチェック
    const exists = periods.find(p => p.label === label)
    if (exists) { setError('同じ名前の期間が既に存在します'); return }

    setSaving(true)
    const result = await createPeriod({ label, start_date, end_date, is_monthly: mode === 'monthly', is_active: true })
    setSaving(false)

    if (result) {
      setShowForm(false)
      setCustomLabel('')
      setCustomStart('')
      setCustomEnd('')
    }
  }

  const handleSwitch = async (period) => {
    await updatePeriodActive(period.id)
    setActivePeriod(period)
  }

  return (
    <div className="period-manager">
      <div className="period-header">
        <h2 className="section-title">📅 集計期間</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ キャンセル' : '＋ 新しい期間'}
        </button>
      </div>

      {/* 新規期間作成フォーム */}
      {showForm && (
        <div className="period-form">
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'monthly' ? 'active' : ''}`}
              onClick={() => setMode('monthly')}
            >
              📅 月単位
            </button>
            <button
              className={`mode-tab ${mode === 'custom' ? 'active' : ''}`}
              onClick={() => setMode('custom')}
            >
              🗓️ 任意期間
            </button>
          </div>

          {mode === 'monthly' ? (
            <div className="form-row">
              <label className="form-label">対象月を選択</label>
              <input
                type="month"
                className="input"
                value={monthValue}
                onChange={e => setMonthValue(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-row">
                <label className="form-label">表示名（省略可）</label>
                <input
                  type="text"
                  className="input"
                  placeholder="例: 特別イベント期間A"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                />
              </div>
              <div className="form-row-2col">
                <div className="form-row">
                  <label className="form-label">開始日</label>
                  <input
                    type="date"
                    className="input"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">終了日</label>
                  <input
                    type="date"
                    className="input"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="form-error">⚠️ {error}</p>}

          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? '⏳ 作成中...' : '✅ この期間を作成してアクティブにする'}
          </button>
        </div>
      )}

      {/* 期間一覧 */}
      {periods.length === 0 ? (
        <p className="empty-hint">まだ集計期間がありません。上のボタンから作成してください。</p>
      ) : (
        <div className="period-list">
          {/* 累計表示オプション */}
          <div
            className={`period-item ${(!activePeriod || activePeriod.id === null) ? 'active' : ''}`}
            onClick={() => {
              if (activePeriod && activePeriod.id !== null) {
                handleSwitch({ id: null, label: '累計 (全期間)' })
              }
            }}
            style={{ borderLeftColor: 'var(--accent-primary)' }}
          >
            <div className="period-item-main">
              <span className="period-label">📊 累計 (すべての期間)</span>
              <span className="period-dates">全期間のデータをまとめて表示</span>
            </div>
            {(!activePeriod || activePeriod.id === null) && (
              <div className="period-item-right">
                <span className="period-badge-active">表示中</span>
              </div>
            )}
          </div>

          {periods.map(period => {
            const isActive = activePeriod?.id === period.id
            return (
              <div
                key={period.id}
                className={`period-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!isActive) {
                    handleSwitch(period)
                  }
                }}
              >
                <div className="period-item-main">
                  <span className="period-label">{period.label}</span>
                  <span className="period-dates">
                    {period.start_date} 〜 {period.end_date}
                  </span>
                </div>
                <div className="period-item-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {confirmDeleteId === period.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-danger)' }}>消す？</span>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '2px 8px', background: 'var(--accent-danger)', fontSize: '0.7rem' }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          await useAppStore.getState().deletePeriod(period.id)
                          setConfirmDeleteId(null)
                        }}
                      >
                        はい
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteId(null)
                        }}
                      >
                        いいえ
                      </button>
                    </div>
                  ) : (
                    <>
                      {isActive ? (
                        <span className="period-badge-active">✅ 現在</span>
                      ) : (
                        <button className="btn-text" style={{ fontSize: '0.75rem' }}>切替</button>
                      )}
                      <button
                        className="btn-icon text-danger"
                        style={{ padding: '4px', opacity: 0.5 }}
                        title="期間を削除"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteId(period.id)
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
