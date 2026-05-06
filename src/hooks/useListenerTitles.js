import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useListenerTitles = (periodId) => {
  return useQuery({
    queryKey: ['listenerTitles', periodId || 'unselected'],
    queryFn: async () => {
      // ==========================================
      // 1. 累計（全期間）モードの処理
      // ==========================================
      if (!periodId || periodId === 'cumulative') {
        const { data, error } = await supabase
          .from('listener_titles')
          .select('*, listeners(*), titles(*), periods(*)')
          .order('assigned_at', { ascending: false });
          
        if (error) throw error;
        
        return (data || [])
          // 💡 【重要】称号が未付与のデータや、リスナーが削除された幽霊データを除外する
          .filter(item => item.title_id != null && item.listeners != null)
          .map(item => ({
            ...item,
            is_placeholder: false,
          }));
      }

      // ==========================================
      // 2. 期間別（特定の月）モードの処理
      // ==========================================
      const { data: ltData, error: ltError } = await supabase
        .from('listener_titles')
        .select('*, listeners(*), titles(*)')
        .eq('period_id', periodId)
        
      if (ltError) throw ltError

      const { data: allListeners, error: lError } = await supabase
        .from('listeners').select('*')
        
      if (lError) throw lError

      // クラッシュ対策
      const safeLtData = ltData || [];
      const safeListeners = allListeners || [];

      // その月に付与されたリスナーのIDリストを作成
      const assignedListenerIds = new Set(safeLtData.map(lt => lt.listener_id))
      
      // まだ付与されていないリスナーのプレースホルダー（未付与枠）を作成
      const placeholders = safeListeners
        .filter(l => !assignedListenerIds.has(l.id))
        .map(l => ({
          id: `placeholder-${l.id}`,
          listener_id: l.id,
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
