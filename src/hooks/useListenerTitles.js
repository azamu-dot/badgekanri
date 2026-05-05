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

      // 【各期間モード（フロントエンドでプレースホルダー生成）】
      // UUID形式チェック
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(periodId)) return [];

      // 1. 指定期間の listener_titles を取得
      const { data: ltData, error: ltError } = await supabase
        .from('listener_titles')
        .select('*, listeners(*), titles(*)')
        .eq('period_id', periodId)
      
      if (ltError) throw ltError

      // 2. すべてのリスナーを取得
      const { data: allListeners, error: lError } = await supabase
        .from('listeners')
        .select('*')
        
      if (lError) throw lError

      // 3. 結合してプレースホルダーを生成
      const assignedListenerIds = new Set(ltData.map(lt => lt.listener_id))
      
      const placeholders = allListeners
        .filter(l => !assignedListenerIds.has(l.id))
        .map(l => ({
          id: `placeholder-${l.id}`,
          listener_id: l.id,
          period_id: periodId,
          title_id: null,
          note: null,
          is_placeholder: true,
          listeners: l,
          titles: null,
          assigned_at: null
        }))

      const assigned = ltData.map(item => ({
        id: item.id,
        listener_id: item.listener_id,
        period_id: item.period_id,
        title_id: item.title_id,
        note: item.note,
        is_placeholder: false,
        listeners: item.listeners,
        titles: item.titles,
        assigned_at: item.assigned_at
      }))

      return [...assigned, ...placeholders]
    },
    staleTime: 1000 * 60 * 5,
  });
}
