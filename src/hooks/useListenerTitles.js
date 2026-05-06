import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useListenerTitles = (periodId) => {
  return useQuery({
    queryKey: ['listenerTitles', periodId || 'unselected'],
    queryFn: async () => {
      // 1. 累計（全期間）モードの処理
      if (!periodId || periodId === 'cumulative') {
        const { data, error } = await supabase
          .from('listener_titles')
          .select('*, listeners(*), titles(*), periods(*)')
          .order('assigned_at', { ascending: false });
          
        if (error) throw error;
        
        return (data || [])
          // 💡 【超重要】item自体が存在するか（nullではないか）を「最初」に確認する！
          .filter(item => {
            if (!item) return false; // itemがnullなら即座に除外（これでクラッシュを防ぐ）
            // 削除された期間の孤児データ（item.periods == null）も除外する
            return item.title_id != null && item.listeners != null && item.periods != null;
          })
          .map(item => ({
            ...item,
            is_placeholder: false,
          }));
      }

      // 2. 期間別（特定の月）モードの処理
      const { data: ltData, error: ltError } = await supabase
        .from('listener_titles')
        .select('*, listeners(*), titles(*)')
        .eq('period_id', periodId)
        
      if (ltError) throw ltError

      const { data: allListeners, error: lError } = await supabase
        .from('listeners').select('*')
        
      if (lError) throw lError

      const safeLtData = ltData || [];
      const safeListeners = allListeners || [];

      const assignedListenerIds = new Set(safeLtData.map(lt => lt?.listener_id).filter(Boolean))
      
      const placeholders = safeListeners
        .filter(l => l && !assignedListenerIds.has(l.id))
        .map(l => ({
          id: `placeholder-${l?.id}`,
          listener_id: l?.id,
          period_id: periodId,
          is_placeholder: true,
          listeners: l,
          assigned_at: null
        }))

      return [...safeLtData.map(item => ({ ...item, is_placeholder: false })), ...placeholders]
    },
    staleTime: 1000 * 60 * 5,
  });
}
