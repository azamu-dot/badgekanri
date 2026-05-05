import { supabase } from '../../lib/supabase'

export const createAdminSlice = (set, get) => ({
  initializeApp: async () => {
    set({ isLoading: true, error: null })
    try {
      await Promise.all([
        get().fetchListeners(),
        get().fetchPeriods(),
        get().fetchTitles(),
        get().fetchAllRewards(),
        get().fetchMyActivities(),
      ])
      const { activePeriod } = get()
      // listenerTitles の取得は React Query フックで行うため、ここでは行わない
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  resetAllData: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error: err1 } = await supabase.from('listeners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (err1) throw err1
      const { error: err2 } = await supabase.from('my_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (err2) throw err2
      set({ listenerTitles: [], listenerRewards: [], listeners: [], myActivities: [] })
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  resetTitlesData: async () => {
    set({ isLoading: true })
    const { error } = await supabase.from('titles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { set({ error: error.message, isLoading: false }); return false }
    await get().fetchTitles()
    await get().initializeApp()
    set({ isLoading: false })
    return true
  },

  resetRewardsData: async () => {
    set({ isLoading: true })
    const { error } = await supabase.from('rewards').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { set({ error: error.message, isLoading: false }); return false }
    await get().fetchAllRewards()
    await get().initializeApp()
    set({ isLoading: false })
    return true
  },

  resetActivitiesData: async () => {
    set({ isLoading: true })
    const { error } = await supabase.from('my_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { set({ error: error.message, isLoading: false }); return false }
    await get().fetchMyActivities()
    set({ isLoading: false })
    return true
  },
})
