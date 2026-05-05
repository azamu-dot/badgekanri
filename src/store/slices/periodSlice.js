import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export const createPeriodSlice = (set, get) => ({
  periods: [],
  activePeriod: null,

  fetchPeriods: async () => {
    const now = new Date()
    const currentLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`
    
    let { data, error } = await supabase
      .from('periods')
      .select('*')
      .order('start_date', { ascending: false })
    if (error) { set({ error: error.message }); return }

    let currentMonthPeriod = data.find(p => p.label === currentLabel)
    
    if (!currentMonthPeriod) {
      const start_date = format(startOfMonth(now), 'yyyy-MM-dd')
      const end_date = format(endOfMonth(now), 'yyyy-MM-dd')
      
      await supabase.from('periods').update({ is_active: false }).eq('is_active', true)
      
      const { data: newPeriod, error: insertError } = await supabase
        .from('periods')
        .insert({
          label: currentLabel,
          start_date,
          end_date,
          is_monthly: true,
          is_active: true
        })
        .select()
        .single()
        
      if (!insertError && newPeriod) {
        data = [newPeriod, ...data.map(p => ({ ...p, is_active: false }))]
        currentMonthPeriod = newPeriod
      }
    }

    const active = data.find((p) => p.is_active) || null
    set({ periods: data, activePeriod: active })
  },

  // 【最重要修正】古いフェッチコードを全削除。純粋に状態を入れるだけ。
  setActivePeriod: (period) => {
    set({ activePeriod: period })
  },

  createPeriod: async (periodData) => {
    if (periodData.is_active) {
      await supabase.from('periods').update({ is_active: false }).eq('is_active', true)
    }
    const { data, error } = await supabase
      .from('periods')
      .insert(periodData)
      .select()
      .single()
    if (error) { set({ error: error.message }); return null }
    await get().fetchPeriods()
    return data
  },

  updatePeriodActive: async (periodId) => {
    await supabase.from('periods').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    if (periodId) {
      const { error } = await supabase
        .from('periods')
        .update({ is_active: true })
        .eq('id', periodId)
      if (error) { set({ error: error.message }); return }
    }
    await get().fetchPeriods()
  },

  deletePeriod: async (id) => {
    const { activePeriod } = get()
    if (activePeriod?.id === id) {
      set({ activePeriod: null })
    }
    const { error } = await supabase.from('periods').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    await get().fetchPeriods()
    return true
  },
})
