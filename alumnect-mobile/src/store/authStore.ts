import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  hydrated: boolean
  hydrate: () => Promise<void>
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser | null) => void
  login: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  logout: () => void
}

const K = { access: 'alumnect.access', refresh: 'alumnect.refresh', user: 'alumnect.user' }

const persistTokens = (a: string | null, r: string | null) => {
  if (a && r) {
    SecureStore.setItemAsync(K.access, a).catch(() => {})
    SecureStore.setItemAsync(K.refresh, r).catch(() => {})
  } else {
    SecureStore.deleteItemAsync(K.access).catch(() => {})
    SecureStore.deleteItemAsync(K.refresh).catch(() => {})
  }
}

/** Token lưu trong SecureStore (Keystore), thông tin user lưu AsyncStorage. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,
  hydrate: async () => {
    try {
      const [access, refresh, userJson] = await Promise.all([
        SecureStore.getItemAsync(K.access),
        SecureStore.getItemAsync(K.refresh),
        AsyncStorage.getItem(K.user),
      ])
      if (access && refresh) {
        set({
          accessToken: access,
          refreshToken: refresh,
          user: userJson ? (JSON.parse(userJson) as AuthUser) : null,
          isAuthenticated: true,
        })
      }
    } catch {
      /* coi như chưa đăng nhập */
    } finally {
      set({ hydrated: true })
    }
  },
  setTokens: (accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },
  setUser: (user) => {
    if (user) AsyncStorage.setItem(K.user, JSON.stringify(user)).catch(() => {})
    else AsyncStorage.removeItem(K.user).catch(() => {})
    set({ user })
  },
  login: ({ user, accessToken, refreshToken }) => {
    persistTokens(accessToken, refreshToken)
    AsyncStorage.setItem(K.user, JSON.stringify(user)).catch(() => {})
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },
  logout: () => {
    persistTokens(null, null)
    AsyncStorage.removeItem(K.user).catch(() => {})
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },
}))
