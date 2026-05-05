import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createUiSlice } from './slices/uiSlice'
import { createMasterSlice } from './slices/masterSlice'
import { createPeriodSlice } from './slices/periodSlice'
import { createListenerSlice } from './slices/listenerSlice'
import { createActivitySlice } from './slices/activitySlice'
import { createAdminSlice } from './slices/adminSlice'

/**
 * appStore — アプリ全体の状態管理（Zustand Slice Pattern）
 * 
 * 肥大化したStoreをドメインごとに分割（Slice）し、
 * persist ミドルウェアによりブラウザストレージにキャッシュします。
 */
export const useAppStore = create(
  persist(
    (set, get, api) => ({
      ...createUiSlice(set, get, api),
      ...createMasterSlice(set, get, api),
      ...createPeriodSlice(set, get, api),
      ...createListenerSlice(set, get, api),
      ...createActivitySlice(set, get, api),
      ...createAdminSlice(set, get, api),
    }),
    {
      name: 'badge-kanri-storage', // ローカルストレージのキー名
      storage: createJSONStorage(() => localStorage),
      // キャッシュに保存したいステートだけを指定（エラー状態やローディングなどは保存しない）
      partialize: (state) => ({
        listeners: state.listeners,
        periods: state.periods,
        activePeriod: state.activePeriod,
        titles: state.titles,
        rewards: state.rewards,
        myActivities: state.myActivities,
      }),
    }
  )
)
