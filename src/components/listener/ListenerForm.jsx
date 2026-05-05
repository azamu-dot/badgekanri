import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { useAssignTitle } from '../../hooks/useAssignTitle'

/**
 * ListenerForm — リスナー入力フォーム
 * ・名前入力時に listeners テーブルからオートコンプリートサジェスト
 * ・新規リスナーの直接入力も可能
 * ・称号選択して「付与」ボタンで listener_titles に保存
 */
export default function ListenerForm({ onAssigned }) {
  const { listeners, titles, activePeriod, upsertListener } = useAppStore()
  const { mutateAsync: assignTitleMutate } = useAssignTitle()

  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedTitleId, setSelectedTitleId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputRef = useRef(null)
  const suggestRef = useRef(null)

  // 名前入力でサジェストをフィルタリング
  const handleNameChange = (val) => {
    setName(val)
    setSuccess('')
    setError('')
    if (val.trim().length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const filtered = listeners.filter(l =>
      l.name.toLowerCase().includes(val.trim().toLowerCase())
    )
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  // サジェストから選択
  const handleSelectSuggestion = (listener) => {
    setName(listener.name)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // サジェスト外クリックで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (
        suggestRef.current && !suggestRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) { setError('リスナー名を入力してください'); return }
    if (!selectedTitleId) { setError('称号を選択してください'); return }
    if (!activePeriod) { setError('集計期間が設定されていません。まず期間を作成してください'); return }

    setSaving(true)
    try {
      // 1. リスナーをupsert（既存なら何もしない、新規なら作成）
      const listener = await upsertListener({ name: name.trim() })
      if (!listener) { setError('リスナーの登録に失敗しました'); setSaving(false); return }

      // 2. 称号を付与（同一リスナー×同一期間は上書き）
      const result = await assignTitleMutate({
        listenerId: listener.id,
        periodId: activePeriod.id,
        titleId: selectedTitleId,
        note: note.trim() || null,
      })
      if (!result) { setError('称号の付与に失敗しました'); setSaving(false); return }

      const titleName = titles.find(t => t.id === selectedTitleId)?.name || ''
      setSuccess(`✅ ${name.trim()} さんに「${titleName}」を付与しました！`)
      setName('')
      setSelectedTitleId('')
      setNote('')
      onAssigned?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isDisabled = !activePeriod

  return (
    <div className="listener-form-wrap">
      <div className="listener-form-header">
        <h2 className="section-title">👤 リスナーに称号を付与</h2>
        {!activePeriod && (
          <span className="form-warn-badge" style={{ fontSize: '0.75rem' }}>⚠️ 全期間表示中は付与できません（月を選択してください）</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="listener-form" autoComplete="off">
        {/* リスナー名 入力 + オートコンプリート */}
        <div className="form-field">
          <label className="form-label" htmlFor="listener-name-input">
            リスナー名
          </label>
          <div className="autocomplete-wrap">
            <input
              id="listener-name-input"
              ref={inputRef}
              type="text"
              className="input"
              placeholder="名前を入力（サジェスト表示）"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={isDisabled}
              autoComplete="off"
            />
            {showSuggestions && (
              <ul className="suggestion-list" ref={suggestRef}>
                {suggestions.map(l => (
                  <li
                    key={l.id}
                    className="suggestion-item"
                    onMouseDown={() => handleSelectSuggestion(l)}
                  >
                    <span className="suggestion-icon">👤</span>
                    <span className="suggestion-name">{l.name}</span>
                    {l.note && <span className="suggestion-note">{l.note}</span>}
                  </li>
                ))}
                {name.trim() && !suggestions.find(l => l.name === name.trim()) && (
                  <li className="suggestion-item suggestion-new" onMouseDown={() => setShowSuggestions(false)}>
                    <span className="suggestion-icon">✨</span>
                    <span className="suggestion-name">「{name.trim()}」を新規登録</span>
                  </li>
                )}
              </ul>
            )}
          </div>
          <p className="form-hint">過去に入力したリスナー名が候補として表示されます</p>
        </div>

        {/* 称号選択 */}
        <div className="form-field">
          <label className="form-label" htmlFor="title-select">
            称号を選択
          </label>
          <div className="title-select-grid">
            {titles.map(t => (
              <button
                key={t.id}
                type="button"
                className={`title-select-btn ${selectedTitleId === t.id ? 'selected' : ''}`}
                style={{
                  '--title-color': t.color_code,
                  borderColor: selectedTitleId === t.id ? t.color_code : 'transparent',
                }}
                onClick={() => setSelectedTitleId(t.id)}
                disabled={isDisabled}
              >
                <span className="ts-dot" style={{ backgroundColor: t.color_code }} />
                <span className="ts-name">{t.name}</span>
                {selectedTitleId === t.id && <span className="ts-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* メモ（任意） */}
        <div className="form-field">
          <label className="form-label" htmlFor="note-input">
            メモ <span className="label-optional">（任意）</span>
          </label>
          <input
            id="note-input"
            type="text"
            className="input"
            placeholder="例: 連続5ヶ月目、特別イベント参加など"
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={isDisabled}
          />
        </div>

        {/* エラー・成功メッセージ */}
        {error && <p className="form-error">⚠️ {error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={saving || isDisabled}
        >
          {saving ? '⏳ 付与中...' : '🎖️ 称号を付与する'}
        </button>
      </form>
    </div>
  )
}
