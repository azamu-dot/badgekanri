export const createUiSlice = (set, get) => ({
  isLoading: false,
  error: null,
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
})
