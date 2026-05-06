import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * useListenerRewards — 特定期間または累計の特典取得状況を取得するフック
 */
export const useListenerRewards = (params = {}) => {
  const { periodId, listenerTitleId } = typeof params === 'string' ? { periodId: params } : params;

  return useQuery({
    queryKey: ['listenerRewards', { periodId, listenerTitleId }],
    queryFn: async () => {
      let query = supabase
        .from('listener_rewards')
        .select('*, listener_titles!inner(*, listeners(*)), rewards(*)');

      if (listenerTitleId) {
        // 特定の付与レコードに紐づく特典
        query = query.eq('listener_title_id', listenerTitleId);
      } else if (periodId && periodId !== 'cumulative') {
        // 特定期間の特典
        query = query.eq('listener_titles.period_id', periodId);
      } else {
        // 全期間の未完了特典
        query = query.eq('is_done', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}
