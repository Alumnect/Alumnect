import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyThemeToDocument(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyThemeToDocument(next)
        set({ theme: next })
      },
    }),
    {
      name: 'alumnect-theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state.theme)
        }
      },
    },
  ),
)

// Khởi chạy đồng bộ ngay khi script được nạp để tránh giật giao diện
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('alumnect-theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      const initialTheme: Theme = parsed?.state?.theme === 'dark' ? 'dark' : 'light'
      applyThemeToDocument(initialTheme)
    } else {
      applyThemeToDocument('light')
    }
  } catch {
    applyThemeToDocument('light')
  }
}
