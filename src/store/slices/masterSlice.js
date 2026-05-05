import { supabase } from '../../lib/supabase'

export const createMasterSlice = (set, get) => ({
  titles: [],
  rewards: [],

  fetchTitles: async () => {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .order('sort_order')
    if (error) { set({ error: error.message }); return }
    set({ titles: data })
  },

  createTitle: async (titleData) => {
    const { data, error } = await supabase
      .from('titles')
      .insert(titleData)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().normalizeTitleSortOrders()
    return data
  },

  updateTitle: async (id, updates) => {
    const { data, error } = await supabase
      .from('titles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().normalizeTitleSortOrders()
    return data
  },

  deleteTitle: async (id) => {
    const { error } = await supabase.from('titles').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    await get().normalizeTitleSortOrders()
    return true
  },

  normalizeTitleSortOrders: async () => {
    const { data } = await supabase.from('titles').select('id, sort_order').order('sort_order', { ascending: true })
    if (!data) return
    
    for (let i = 0; i < data.length; i++) {
      const correctSortOrder = i + 1
      if (data[i].sort_order !== correctSortOrder) {
        await supabase.from('titles').update({ sort_order: correctSortOrder }).eq('id', data[i].id)
      }
    }
    await get().fetchTitles()
  },

  fetchAllRewards: async () => {
    const { data, error } = await supabase.from('rewards').select('*')
    if (error) { set({ error: error.message }); return }
    set({ rewards: data })
  },

  createReward: async (rewardData) => {
    const { data, error } = await supabase
      .from('rewards')
      .insert(rewardData)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchAllRewards()
    return data
  },

  updateReward: async (id, updates) => {
    const { data, error } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchAllRewards()
    return data
  },

  deleteReward: async (id) => {
    const { error } = await supabase.from('rewards').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    await get().fetchAllRewards()
    return true
  },
})
