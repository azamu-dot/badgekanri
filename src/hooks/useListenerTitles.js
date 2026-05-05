import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * useListenerTitles — 特定期間の称号一覧を取得するフック
 * v6: 累計モードとRPCモードのデータ形式を完全に統一。
 */
export const useListenerTitles = (periodId) => {
  return useQuery({
    queryKey: ['listenerTitles', periodId || 'unselected'],
    queryFn: async () => {
      // 【全期間（累計）モード】
      if (!periodId || periodId === 'cumulative') {
        const { data, error } = await supabase
          .from('listener_titles')
          .select('*, listeners(*), titles(*), periods(*)')
          .order('assigned_at', { ascending: false });
        
        if (error) throw error;
        
        // UI側の描画統一のため、RPCの出力形式（エイリアス）にマッピング
        return data.map(item => ({
          id: item.id,
          listener_id: item.listener_id,
          period_id: item.period_id,
          title_id: item.title_id,
          note: item.note,
          is_placeholder: false,
          listeners: item.listeners,
          titles: item.titles,
          periods: item.periods,
          assigned_at: item.assigned_at
        }));
      }

      // 【各期間モード（RPC呼び出し）】
      // UUID形式チェック
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(periodId)) return [];

      const { data, error } = await supabase.rpc('get_listener_titles_with_placeholder', {
        p_period_id: periodId
      });
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.res_id,
        listener_id: item.res_listener_id,
        period_id: item.res_period_id,
        title_id: item.res_title_id,
        note: item.res_note,
        is_placeholder: item.res_is_placeholder,
        listeners: item.res_listener_data,
        titles: item.res_title_data,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
