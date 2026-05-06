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
      
      // 1. 詳細画面用（特定の付与IDが指定されている場合）
      if (listenerTitleId) {
        const { data, error } = await supabase
          .from('listener_rewards')
          .select('*, listener_titles!inner(*, listeners(*)), rewards(*)')
          .eq('listener_title_id', listenerTitleId);
        
        if (error) throw error;
        return data;
      }

      // 2. 期間指定がある場合（ダッシュボード等：ここが繰り越しのメインロジック！）
      if (periodId && periodId !== 'cumulative') {
        
        // ① 【今期の特典】をすべて取得（完了・未完了、期限の種類を問わず全て）
        const fetchCurrent = supabase
          .from('listener_rewards')
          .select('*, listener_titles!inner(*, listeners(*)), rewards(*)')
          .eq('listener_titles.period_id', periodId);

        // ② 【過去の繰り越し特典】を取得（未完了 かつ monthly以外）
        // 💡 rewards!inner を使うことで、rewardsテーブルの条件で絞り込みができます
        const fetchCarryOver = supabase
          .from('listener_rewards')
          .select('*, listener_titles!inner(*, listeners(*)), rewards!inner(*)')
          .eq('is_done', false)
          .neq('rewards.deadline_type', 'monthly');

        // 2つのクエリを同時に実行して待機（Promise.allで高速化）
        const [currentRes, carryOverRes] = await Promise.all([fetchCurrent, fetchCarryOver]);

        if (currentRes.error) throw currentRes.error;
        if (carryOverRes.error) throw carryOverRes.error;

        // ③ 取得した2つのデータを合体し、重複を排除する
        // （Mapを使うと同じIDのデータが重複して表示されるバグを防げます）
        const mergedMap = new Map();
        
        // 先に過去のデータを入れ、後から今期のデータで上書きする
        carryOverRes.data.forEach(item => mergedMap.set(item.id, item));
        currentRes.data.forEach(item => mergedMap.set(item.id, item)); 

        // 配列に戻す
        return Array.from(mergedMap.values());
      }

      // 3. 全期間（cumulative）の場合
      const { data, error } = await supabase
        .from('listener_rewards')
        .select('*, listener_titles!inner(*, listeners(*)), rewards(*)')
        .eq('is_done', false);
        
      if (error) throw error;
      return data || []; // 💡 クラッシュ対策
    }
  });
}
