import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { useAssignTitle } from '../../hooks/useAssignTitle'
import { useListenerTitles } from '../../hooks/useListenerTitles'

/**
 * ListenerTable — 現在の期間のリスナー称号一覧テーブル
 */
export default function ListenerTable({ onSelectListener }) {
  const { activePeriod, titles, deleteListener } = useAppStore()
  
  // React Query によるデータ取得
  const { data: listenerTitles = [], isLoading: isLoadingTitles } = useListenerTitles(activePeriod?.id)
  
  // 称号付与のミューテーション
  const { mutate: assignTitle } = useAssignTitle()

  // 検索・絞り込み状態
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTitleId, setFilterTitleId] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null) // 削除確認中のリスナーID
  const [sortKey, setSortKey] = useState('assigned_at_desc') // 'assigned_at_desc' | 'assigned_at_asc' | 'name_asc' | 'title_order'

  const handleTitleChange = async (listenerId, newTitleId, currentLtPeriodId) => {
    if (!newTitleId) return
    // 全期間表示の場合は、対象レコードのperiod_idを使う
    const targetPeriodId = activePeriod ? activePeriod.id : currentLtPeriodId
    if (!targetPeriodId) return

    assignTitle({
      listenerId,
      periodId: targetPeriodId,
      titleId: newTitleId,
      note: ''
    })
  }

  // フィルタリング & 並び替えされたリスト
  const sortedAndFilteredList = useMemo(() => {
    const safeList = listenerTitles || []
    
    // 1. フィルタリング
    let list = safeList.filter(lt => {
      if (!lt) return false
      const nameMatch = (lt.listeners?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      const titleMatch = filterTitleId === 'all' || lt.title_id === filterTitleId
      return nameMatch && titleMatch
    })

    // 2. 並び替え
    return list.sort((a, b) => {
      if (!a || !b) return 0
      switch (sortKey) {
        case 'assigned_at_desc':
          return new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0)
        case 'assigned_at_asc':
          return new Date(a.assigned_at || 0) - new Date(b.assigned_at || 0)
        case 'name_asc':
          return (a.listeners?.name || '').localeCompare(b.listeners?.name || '', 'ja')
        case 'title_order':
          // 称号マスタの sort_order を優先
          const orderA = a.titles?.sort_order ?? 999
          const orderB = b.titles?.sort_order ?? 999
          if (orderA !== orderB) return orderA - orderB
          // 同じ称号なら名前順
          return (a.listeners?.name || '').localeCompare(b.listeners?.name || '', 'ja')
        default:
          return 0
      }
    })
  }, [listenerTitles, searchTerm, filterTitleId, sortKey])

  // CSVエクスポート
  const handleExportCSV = () => {
    if (sortedAndFilteredList.length === 0) return

    const headers = ['期間', 'リスナー名', '称号', '付与日時', 'メモ']
    const rows = sortedAndFilteredList.map(lt => [
      lt.periods?.label || '',
      lt.listeners?.name || '',
      lt.titles?.name || '',
      lt.assigned_at ? new Date(lt.assigned_at).toLocaleString('ja-JP') : '',
      lt.note || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `リスナー称号一覧_${activePeriod?.id ? activePeriod.label : '累計'}_${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoadingTitles && (!listenerTitles || listenerTitles.length === 0)) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p>称号データを読み込み中...</p>
      </div>
    )
  }

  if (!listenerTitles || listenerTitles.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">👥</span>
        <p>{activePeriod?.id ? `「${activePeriod.label}」期間` : '全期間'}にはまだ称号付与がありません。</p>
        <p className="empty-sub">上のフォームからリスナーに称号を付与してください。</p>
      </div>
    )
  }

  return (
    <div className="listener-table-wrap">
      <div className="table-header">
        <h2 className="section-title">📋 称号付与一覧</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="CSVでダウンロード">
            📥 エクスポート
          </button>
          <span className="table-count">{sortedAndFilteredList.length} 件</span>
        </div>
      </div>

      {/* 検索・絞り込み・並び替え UI */}
      <div className="table-filters" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* 名前検索 */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <input
            type="text"
            className="input"
            placeholder="リスナー名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          />
        </div>
        {/* 称号フィルター */}
        <div style={{ width: '130px' }}>
          <select
            className="input"
            value={filterTitleId}
            onChange={(e) => setFilterTitleId(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">称号: 全て</option>
            {titles.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        {/* 並び替え */}
        <div style={{ width: '130px' }}>
          <select
            className="input"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            <option value="assigned_at_desc">🕒 付与新しい順</option>
            <option value="assigned_at_asc">🕒 付与古い順</option>
            <option value="name_asc">🔤 名前順 (A-Z)</option>
            <option value="title_order">🏆 称号ランク順</option>
          </select>
        </div>
      </div>

      <div className="table-scroll desktop-only">
        <table className="listener-table">
          <thead>
            <tr>
              {!activePeriod?.id && <th>期間</th>}
              <th>リスナー名</th>
              <th>称号</th>
              <th>付与日時</th>
              <th>メモ</th>
              <th>詳細</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredList.map(lt => {
              if (!lt) return null
              const isPlaceholder = lt.is_placeholder
              const listenerId = lt.listener_id
              const listenerName = lt.listeners?.name || '不明なリスナー'
              const isConfirming = confirmDeleteId === listenerId
              
              return (
                <tr key={lt.id} className={`table-row ${isPlaceholder ? 'is-placeholder' : ''}`}>
                  {!activePeriod?.id && (
                    <td className="td-period" data-label="期間" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {lt.periods?.label || '—'}
                    </td>
                  )}
                  <td className="td-name" data-label="リスナー名">
                    <span className="listener-avatar" style={isPlaceholder ? { opacity: 0.5, filter: 'grayscale(1)' } : {}}>
                      {lt.listeners?.name?.charAt(0) ?? '?'}
                    </span>
                    <span style={isPlaceholder ? { color: 'var(--text-muted)' } : {}}>
                      {listenerName}
                    </span>
                    {isPlaceholder && <span className="carry-over-badge">引継</span>}
                  </td>
                  <td className="td-title" data-label="称号">
                    <select
                      className="title-badge-select"
                      style={{ 
                        borderColor: lt.titles?.color_code || 'var(--border-subtle)', 
                        color: lt.titles?.color_code || 'var(--text-muted)', 
                        outline: 'none', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '999px', 
                        padding: '6px 12px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                      value={lt.title_id || ''}
                      onChange={(e) => handleTitleChange(listenerId, e.target.value, lt.period_id)}
                      disabled={!activePeriod?.id} // 累計表示時は編集不可にする（誤操作防止）
                    >
                      <option value="" style={{ color: '#888' }}>未付与</option>
                      {titles.map(t => (
                        <option key={t.id} value={t.id} style={{ color: '#fff', background: '#1a1f35' }}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="td-date" data-label="付与日時">
                    {lt.assigned_at
                      ? new Date(lt.assigned_at).toLocaleString('ja-JP', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : <span className="muted">未登録</span>}
                  </td>
                  <td className="td-note" data-label="メモ">{lt.note || <span className="muted">—</span>}</td>
                  <td className="td-action" data-label="操作">
                    <div className="td-action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isConfirming ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginRight: '4px' }}>消す？</span>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', background: 'var(--accent-danger)', fontSize: '0.75rem' }}
                            onClick={async (e) => {
                              e.stopPropagation()
                              await deleteListener(listenerId)
                              setConfirmDeleteId(null)
                            }}
                          >
                            はい
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
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
                          <button
                            className="btn-icon"
                            title="詳細"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onSelectListener?.(lt)
                            }}
                            style={{ padding: '8px 12px', minWidth: '44px', minHeight: '44px', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                          >
                            →
                          </button>
                          <button
                            className="btn-icon text-danger"
                            title="削除"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setConfirmDeleteId(listenerId)
                            }}
                            style={{ padding: '8px 12px', minWidth: '44px', minHeight: '44px', opacity: 1, position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sortedAndFilteredList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            該当するリスナーが見つかりません。
          </div>
        )}
      </div>

      {/* モバイル用カードリスト (Gemini提案) */}
      <div className="mobile-card-list mobile-only">
        {sortedAndFilteredList.map(lt => {
          if (!lt) return null
          const isPlaceholder = lt.is_placeholder
          const listenerName = lt.listeners?.name || '不明なリスナー'
          const titleName = lt.titles?.name || '未付与'
          const titleColor = lt.titles?.color_code || 'var(--text-muted)'
          
          return (
            <div 
              key={lt.id} 
              className={`listener-card ${isPlaceholder ? 'is-placeholder' : ''}`}
              onClick={() => onSelectListener?.(lt)}
            >
              <div className="card-row-main">
                <div className="card-name-wrap">
                  <span className="listener-avatar" style={isPlaceholder ? { opacity: 0.5, filter: 'grayscale(1)', width: '28px', height: '28px', fontSize: '0.8rem' } : { width: '28px', height: '28px', fontSize: '0.8rem' }}>
                    {lt.listeners?.name?.charAt(0) ?? '?'}
                  </span>
                  <span style={isPlaceholder ? { color: 'var(--text-muted)' } : {}}>
                    {listenerName}
                  </span>
                  {isPlaceholder && <span className="carry-over-badge" style={{ fontSize: '0.6rem' }}>引継</span>}
                </div>
                <span className="title-badge" style={{ borderColor: titleColor, color: titleColor, fontSize: '0.75rem', padding: '2px 8px' }}>
                  {titleName}
                </span>
              </div>
              
              <div className="card-meta-row">
                <div className="card-date">
                  {lt.assigned_at
                    ? new Date(lt.assigned_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '未登録'}
                </div>
                {!isPlaceholder && lt.note && (
                  <div className="card-note">{lt.note}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sortedAndFilteredList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          該当するリスナーが見つかりません。
        </div>
      )}
    </div>

  )
}
