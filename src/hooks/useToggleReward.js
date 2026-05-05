import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * useToggleReward — 特典の完了状態を切り替えるフック
 */
export const useToggleReward = (listenerTitleId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rewardId, isDone }) => {
      const { data, error } = await supabase
        .from('listener_rewards')
        .upsert(
          {
            listener_title_id: listenerTitleId,
            reward_id: rewardId,
            is_done: isDone,
            done_at: isDone ? new Date().toISOString() : null,
          },
          { onConflict: 'listener_title_id,reward_id' }
        )
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSettled: () => {
      // 特典リストを再取得
      queryClient.invalidateQueries({ queryKey: ['listenerRewards'] })
    }
  })
}
