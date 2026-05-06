import { useState } from 'react'
import { useAppStore } from '../store/appStore'

/**
 * TitleMaster — 称号マスタ管理ページ（インライン編集版）
 */
export default function TitleMaster() {
  const { titles, createTitle, updateTitle, deleteTitle, normalizeTitleSortOrders } = useAppStore()

  // 編集状態の管理
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#888888')
  const [editOrder, setEditOrder] = useState(0)

  // 新規追加状態
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#7c6cf7')
  const [newOrder, setNewOrder] = useState(titles.length > 0 ? titles.length + 1 : 1)
  const [adding, setAdding] = useState(false)

  // 危険操作の確認状態
  const [isResetConfirming, setIsResetConfirming] = useState(false)

  // 編集開始
  const startEdit = (title) => {
    setEditingId(title.id)
    setEditName(title.name)
    setEditColor(title.color_code)
    setEditOrder(title.sort_order)
  }

  // 編集保存
  const saveEdit = async (id) => {
    if (!editName.trim()) return
    await updateTitle(id, {
      name: editName.trim(),
      color_code: editColor,
      sort_order: parseInt(editOrder, 10) || 0
    })
    setEditingId(null)
  }

  // 新規追加
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    
    await createTitle({
      name: newName.trim(),
      color_code: newColor,
      sort_order: parseInt(newOrder, 10) || (titles.length + 1)
    })
    
    setNewName('')
    setNewOrder(titles.length + 2) // 次の追加のために+1
    setAdding(false)
  }

  // 並び替え（上へ/下へ）
  const moveTitle = async (title, direction) => {
    const currentIndex = titles.findIndex(t => t.id === title.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= titles.length) return

    const targetTitle = titles[targetIndex]
    
    // 入れ替え
    const currentOrder = title.sort_order
    const targetOrder = targetTitle.sort_order

    // 同時に更新
    await Promise.all([
      updateTitle(title.id, { sort_order: targetOrder }),
      updateTitle(targetTitle.id, { sort_order: currentOrder })
    ])
    
    // 再正規化して順番を確実にする
    await normalizeTitleSortOrders()
  }

  const handleDelete = async (id, titleName) => {
    // 削除も念のためインラインにしたいが、まずは標準のconfirmで動作確認
    // ※今回は全データリセットを中心に修正
    if (!window.confirm(`称号「${titleName}」を削除しますか？\n(既にこの称号を持っているリスナーのデータは削除できません)`)) {
      return
    }
    const res = await deleteTitle(id)
    if (!res) {
      alert('削除に失敗しました。この称号は既に使用されている可能性があります。')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🏅 称号マスタ管理</h1>
        <p className="page-description">称号の種類や順番、色を直感的に管理できます。</p>
      </div>

      <div className="section-card">
        <h2 className="section-title">✨ 新しい称号を追加</h2>
        <form onSubmit={handleAdd} className="inline-add-form" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
            />
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: newColor, border: '2px solid rgba(255,255,255,0.2)' }} />
          </div>
          
          <input 
            type="number" 
            value={newOrder} 
            onChange={(e) => setNewOrder(e.target.value)} 
            placeholder="順番"
            min="1"
            className="input"
            style={{ width: '60px', padding: '8px', textAlign: 'center' }}
            title="称号の順番（ランク）"
          />

          <input
            type="text"
            className="input"
            placeholder="新しい称号名（例: ゴールド）"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ flex: 1, minWidth: '150px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={adding || !newName.trim()} style={{ whiteSpace: 'nowrap' }}>
            {adding ? '...' : '＋ 追加'}
          </button>
        </form>
      </div>

      <div className="section-card">
        <h2 className="section-title">📋 称号一覧・並び替え</h2>
        <div className="title-master-table-wrap">
          <table className="listener-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>順番</th>
                <th>称号名と色</th>
                <th style={{ width: '160px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t, index) => (
                <tr key={t.id} className={editingId === t.id ? 'table-row editing' : 'table-row'}>
                  {/* 順番コントロール */}
                  <td>
                    <div className="order-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        className="input sm"
                        value={editingId === t.id ? editOrder : t.sort_order}
                        onChange={e => {
                          const val = e.target.value
                          if (editingId === t.id) setEditOrder(val)
                          else {
                            // 直接書き換え時は即時更新
                            updateTitle(t.id, { sort_order: parseInt(val, 10) || 0 })
                          }
                        }}
                        style={{ width: '50px', padding: '4px', textAlign: 'center', fontWeight: 700 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button 
                          className="btn-icon sm" 
                          disabled={index === 0}
                          onClick={() => moveTitle(t, 'up')}
                          style={{ padding: 0, height: '14px', fontSize: '10px', minWidth: '24px' }}
                        >▲</button>
                        <button 
                          className="btn-icon sm" 
                          disabled={index === titles.length - 1}
                          onClick={() => moveTitle(t, 'down')}
                          style={{ padding: 0, height: '14px', fontSize: '10px', minWidth: '24px' }}
                        >▼</button>
                      </div>
                    </div>
                  </td>

                  {/* 名前と色 */}
                  <td>
                    {editingId === t.id ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={editColor}
                          onChange={e => setEditColor(e.target.value)}
                          style={{ width: '30px', height: '30px', border: 'none', padding: 0, background: 'none' }}
                        />
                        <input
                          type="text"
                          className="input sm"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    ) : (
                      <span className="title-badge" style={{ borderColor: t.color_code, color: t.color_code }}>
                        <span className="badge-dot" style={{ backgroundColor: t.color_code }} />
                        {t.name}
                      </span>
                    )}
                  </td>

                  {/* アクション */}
                  <td style={{ textAlign: 'right' }}>
                    {editingId === t.id ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveEdit(t.id)}>保存</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>×</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className="btn-icon" title="編集" onClick={() => startEdit(t)}>✏️</button>
                        <button className="btn-icon text-danger" title="削除" onClick={() => handleDelete(t.id, t.name)}>🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⚠️ 危険な操作 */}
      <div className="danger-zone" style={{ marginTop: '40px', padding: '20px', borderTop: '1px dashed var(--glass-border)', opacity: 0.8 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>🛠️ データメンテナンス</p>
        {isResetConfirming ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-danger)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>称号マスタをすべて消去しますか？</span>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--accent-danger)' }}
              onClick={async () => {
                await useAppStore.getState().resetTitlesData()
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
            🗑️ 称号マスタをすべてリセット
          </button>
        )}
      </div>
    </div>
  )
}
