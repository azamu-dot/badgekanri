import { supabase } from '../../lib/supabase'

export const createListenerSlice = (set, get) => ({
  listeners: [],
  listenerRewards: [],

  fetchListeners: async () => {
    const { data, error } = await supabase
      .from('listeners')
      .select('*')
      .order('name')
    if (error) { set({ error: error.message }); return }
    set({ listeners: data })
  },

  upsertListener: async (listener) => {
    const userId = get().currentUser?.id
    const { data, error } = await supabase
      .from('listeners')
      .upsert({ ...listener, user_id: userId }, { onConflict: 'name,user_id' })
      .select()
      .single()
    if (error) { 
      console.error('【リスナー登録エラー】詳細:', error)
      set({ error: error.message })
      return null 
    }
    await get().fetchListeners()
    return data
  },

  deleteListener: async (id) => {
    const { error } = await supabase.from('listeners').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    await get().fetchListeners()
    // 称号データの再取得はコンポーネント側の React Query (invalidate) で行うよう変更
    return true
  },

  // assignTitle, fetchListenerTitlesByPeriod はフックへ移行したため削除

  calcConsecutiveCount: async (listenerId) => {
    const { data, error } = await supabase
      .from('listener_titles')
      .select('*, periods(start_date, end_date), titles(id, name, color_code, sort_order)')
      .eq('listener_id', listenerId)
      .order('assigned_at', { ascending: false })
    if (error) return { total: 0, consecutive: 0, rankCounts: [] }

    const allTitles = get().titles || []
    const actualData = data.filter(d => !d.is_placeholder && d.periods != null)

    const sortedByDate = [...actualData]
      .filter(d => d.periods)
      .sort((a, b) => new Date(b.periods.start_date) - new Date(a.periods.start_date))

    const uniqueMonths = []
    const seenMonths = new Set()
    for (const item of sortedByDate) {
      const monthStr = item.periods.start_date.substring(0, 7)
      if (!seenMonths.has(monthStr)) {
        seenMonths.add(monthStr)
        uniqueMonths.push(item)
      }
    }

    let consecutive = 0
    for (let i = 0; i < uniqueMonths.length; i++) {
      if (i === 0) { consecutive = 1; continue }
      const prevStart = new Date(uniqueMonths[i - 1].periods.start_date)
      const currStart = new Date(uniqueMonths[i].periods.start_date)
      const diffMonths = (prevStart.getFullYear() - currStart.getFullYear()) * 12 + (prevStart.getMonth() - currStart.getMonth())
      if (diffMonths === 1) {
        consecutive++
      } else {
        break
      }
    }

    // Expand lower ranking titles
    const expandedData = []
    for (const item of actualData) {
      if (!item.titles) continue
      const currentOrder = item.titles.sort_order ?? 999
      const includedTitles = allTitles.filter(t => (t.sort_order ?? 999) >= currentOrder)
      
      if (includedTitles.length === 0) {
        expandedData.push(item)
      } else {
        for (const t of includedTitles) {
          expandedData.push({
            ...item,
            titles: { ...t }
          })
        }
      }
    }

    const countsMap = {}
    expandedData.forEach(item => {
      const t = item.titles
      if (!t) return
      if (!countsMap[t.id]) {
        countsMap[t.id] = { id: t.id, name: t.name, color_code: t.color_code, count: 0, sort_order: t.sort_order }
      }
      countsMap[t.id].count++
    })
    
    // Sort rankCounts by sort_order ascending
    const rankCounts = Object.values(countsMap).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))

    return { total: actualData.length, consecutive, rankCounts }
  },

  fetchListenerHistory: async (listenerId) => {
    const { data, error } = await supabase
      .from('listener_titles')
      .select('*, periods(label, start_date, end_date), titles(id, name, color_code, sort_order)')
      .eq('listener_id', listenerId)
      .order('assigned_at', { ascending: false })
    if (error) { set({ error: error.message }); return [] }
    
    const allTitles = get().titles || []
    const expanded = []
    for (const item of data) {
      if (!item.titles || item.is_placeholder || !item.periods) continue // ignore placeholders and orphaned records
      
      const currentOrder = item.titles.sort_order ?? 999
      const includedTitles = allTitles.filter(t => (t.sort_order ?? 999) >= currentOrder)
      
      if (includedTitles.length === 0) {
        expanded.push(item)
      } else {
        // Sort included titles by sort_order ascending (highest rank first)
        includedTitles.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        for (const t of includedTitles) {
          expanded.push({
            ...item,
            id: `${item.id}-${t.id}`, // synthetic ID
            titles: { ...t }
          })
        }
      }
    }
    return expanded
  },

  fetchListenerRewards: async (listenerTitleId) => {
    const { data, error } = await supabase
      .from('listener_rewards')
      .select('*, rewards(*)')
      .eq('listener_title_id', listenerTitleId)
    if (error) { set({ error: error.message }); return }
    set((state) => {
      const filtered = state.listenerRewards.filter((lr) => lr.listener_title_id !== listenerTitleId)
      return { listenerRewards: [...filtered, ...data] }
    })
  },

  fetchListenerRewardsByListenerTitles: async (listenerTitleIds) => {
    const validIds = listenerTitleIds.filter(id => !id.startsWith('placeholder-'))
    if (validIds.length === 0) {
      set({ listenerRewards: [] })
      return
    }
    const { data, error } = await supabase
      .from('listener_rewards')
      .select('*, rewards(*)')
      .in('listener_title_id', validIds)
    if (error) { set({ error: error.message }); return }
    set({ listenerRewards: data })
  },

  toggleRewardDone: async (listenerTitleId, rewardId, isDone) => {
    const userId = get().currentUser?.id
    const { data, error } = await supabase
      .from('listener_rewards')
      .upsert(
        {
          listener_title_id: listenerTitleId,
          reward_id: rewardId,
          is_done: isDone,
          done_at: isDone ? new Date().toISOString() : null,
          user_id: userId
        },
        { onConflict: 'listener_title_id,reward_id,user_id' }
      )
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchListenerRewards(listenerTitleId)
    return data
  },
})
