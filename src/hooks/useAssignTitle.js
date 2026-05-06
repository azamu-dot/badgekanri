import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'

/**
 * useAssignTitle — 称号付与のためのカスタムフック
 * 正しいOptimistic UI（楽観的更新）：Zustandを介さず、Queryキャッシュを直接書き換えます。
 */
export const useAssignTitle = () => {
  const queryClient = useQueryClient()
  const activePeriod = useAppStore(state => state.activePeriod)
  const setError = useAppStore(state => state.setError)

  return useMutation({
    mutationFn: async ({ listenerId, periodId, titleId, note }) => {
      const userId = useAppStore.getState().currentUser?.id

      // 称号を外す（削除する）処理
      if (!titleId || titleId === 'remove') {
        const { error } = await supabase
          .from('listener_titles')
          .delete()
          .eq('listener_id', listenerId)
          .eq('period_id', periodId)
          .eq('user_id', userId)
          
        if (error) throw error;
        return { deleted: true, listener_id: listenerId };
      }

      // 1. 称号付与
      const { data: ltData, error: ltError } = await supabase
        .from('listener_titles')
        .upsert(
          {
            listener_id: listenerId,
            period_id: periodId,
            title_id: titleId,
            note: note,
            user_id: userId
          },
          { onConflict: 'listener_id,period_id,user_id' }
        )
        .select()
        .single()
      
      if (ltError) {
        console.error('【称号付与エラー】詳細:', ltError)
        alert(`エラーが発生しました: ${ltError.message}`)
        throw ltError
      }

      // 2. 特典の自動生成（下位の称号の特典も含める）
      const allTitles = useAppStore.getState().titles
      const currentTitle = allTitles.find(t => t.id === titleId)
      
      let targetTitleIds = [titleId]
      if (currentTitle) {
        // 現在の称号の sort_order 以上（つまり同じかそれより下位）の称号をすべて取得
        targetTitleIds = allTitles
          .filter(t => t.sort_order >= currentTitle.sort_order)
          .map(t => t.id)
      }

      const { data: titleRewards } = await supabase
        .from('rewards')
        .select('id')
        .in('title_id', targetTitleIds)
      
      if (titleRewards && titleRewards.length > 0) {
        const { data: existingLR } = await supabase
          .from('listener_rewards')
          .select('reward_id')
          .eq('listener_title_id', ltData.id)
        
        const existingIds = existingLR ? existingLR.map(lr => lr.reward_id) : []
        const newRewards = titleRewards
          .filter(r => !existingIds.includes(r.id))
          .map(r => ({
            listener_title_id: ltData.id,
            reward_id: r.id,
            is_done: false,
            user_id: userId
          }))
        
        if (newRewards.length > 0) {
          await supabase.from('listener_rewards').insert(newRewards)
        }
      }

      return ltData
    },
    
    // 【Optimistic UI (楽観的更新)】
    onMutate: async (newAssignment) => {
      const queryKey = ['listenerTitles', activePeriod?.id || 'cumulative']
      
      await queryClient.cancelQueries({ queryKey })
      const previousTitles = queryClient.getQueryData(queryKey)

      // Queryキャッシュを直接書き換えて即座に画面反映
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old
        return old.map(item => {
          if (item.listener_id !== newAssignment.listenerId) return item;
          
          if (!newAssignment.titleId || newAssignment.titleId === 'remove') {
            return { ...item, title_id: null, is_placeholder: true, assigned_at: null, titles: null }
          } else {
            return { ...item, title_id: newAssignment.titleId, is_placeholder: false, assigned_at: new Date().toISOString() }
          }
        })
      })
      
      return { previousTitles, queryKey }
    },

    // エラー時はスナップショットからロールバック
    onError: (err, newAssignment, context) => {
      if (context?.previousTitles) {
        queryClient.setQueryData(context.queryKey, context.previousTitles)
      }
      setError(`付与に失敗しました: ${err.message}`)
    },

    // 成功・失敗に関わらず再同期（すべての期間と累計キャッシュを破棄）
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['listenerTitles'] })
    }
  })
}
