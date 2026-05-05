export const createUiSlice = (set, get) => ({
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
})
