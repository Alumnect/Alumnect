import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Role = 'STUDENT' | 'ALUMNI' | 'ADMIN'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
  verified?: boolean
  avatarUrl?: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser | null) => void
  login: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  logout: () => void
}

/** Global auth/client state, persisted to localStorage. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      login: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'alumnect-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
