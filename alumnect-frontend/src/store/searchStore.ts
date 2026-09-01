import { create } from 'zustand'

interface SearchState {
  keyword: string
  setKeyword: (keyword: string) => void
}

export const useSearchStore = create<SearchState>((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
}))
