import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

export const useToggleReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, isDone, listenerTitleId }) => {
      const userId = useAppStore.getState().currentUser?.id;

      const { data, error } = await supabase
        .from('listener_rewards')
        .upsert(
          {
            listener_title_id: listenerTitleId,
            reward_id: rewardId,
            is_done: isDone,
            done_at: isDone ? new Date().toISOString() : null,
            user_id: userId
          },
          { onConflict: 'listener_title_id,reward_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // 成功したらデータを再取得して画面を更新
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listenerRewards'] });
    },
    onError: (error) => {
      console.error('【特典状態の更新エラー】:', error);
      alert('特典の更新に失敗しました。');
    }
  });
};
