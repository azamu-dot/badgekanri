import { supabase } from '../../lib/supabase'

export const createActivitySlice = (set, get) => ({
  myActivities: [],

  fetchMyActivities: async () => {
    const { data, error } = await supabase
      .from('my_activities')
      .select('*')
      .order('activity_date', { ascending: false })
    if (error) { set({ error: error.message }); return }
    set({ myActivities: data })
  },

  createMyActivity: async (activityData) => {
    const { data, error } = await supabase
      .from('my_activities')
      .insert(activityData)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchMyActivities()
    return data
  },

  updateMyActivity: async (id, updates) => {
    const { data, error } = await supabase
      .from('my_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchMyActivities()
    return data
  },

  deleteMyActivity: async (id) => {
    const { error } = await supabase.from('my_activities').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    await get().fetchMyActivities()
    return true
  },
})
