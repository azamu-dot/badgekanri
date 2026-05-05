import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * useListenerRewards — 特定期間または累計の特典取得状況を取得するフック
 */
export const useListenerRewards = (periodId) => {
  return useQuery({
    queryKey: ['listenerRewards', periodId || 'cumulative'],
    queryFn: async () => {
      if (!periodId || periodId === 'cumulative') {
        // 全期間: 未渡しの特典をすべて取得
        const { data, error } = await supabase
          .from('listener_rewards')
          .select('*, listener_titles(*, listeners(*)), rewards(*)')
          .eq('is_done', false); // Geminiの仕様に合わせ is_done=false を抽出
        
        if (error) throw error;
        return data;
      }

      // 各期間: その期間に付与された称号に紐づく特典を取得
      // !inner を使うことで、指定期間の title に紐づくものだけを厳格にJOIN
      const { data, error } = await supabase
        .from('listener_rewards')
        .select('*, listener_titles!inner(*, listeners(*)), rewards(*)')
        .eq('listener_titles.period_id', periodId);
      
      if (error) throw error;
      return data;
    }
  });
}
