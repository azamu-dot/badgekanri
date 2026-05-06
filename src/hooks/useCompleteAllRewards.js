import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

export const useCompleteAllRewards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rewardsToComplete) => {
      if (!rewardsToComplete || rewardsToComplete.length === 0) return [];
      
      const userId = useAppStore.getState().currentUser?.id;
      const doneAt = new Date().toISOString();

      const payload = rewardsToComplete.map(lr => ({
        listener_title_id: lr.listener_title_id,
        reward_id: lr.reward_id,
        is_done: true,
        done_at: doneAt,
        user_id: userId
      }));

      const { data, error } = await supabase
        .from('listener_rewards')
        .upsert(
          payload,
          { onConflict: 'listener_title_id,reward_id,user_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listenerRewards'] });
    },
    onError: (error) => {
      console.error('【一括特典状態の更新エラー】:', error);
      alert('一括更新に失敗しました。');
    }
  });
};
