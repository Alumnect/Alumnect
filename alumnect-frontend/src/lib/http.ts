import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/* ---- auto-refresh queue ---- */
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let isRefreshing = false
let queue: QueueItem[] = []

const flushQueue = (error: unknown, token: string | null) => {
  queue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)))
  queue = []
}

/* 1. attach access token */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* 2. unwrap data + handle 401 with a single refresh + retry queue */
http.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!error.response) return Promise.reject(new Error('Mất kết nối mạng. Vui lòng thử lại.'))

    if (error.response.status === 401 && original && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`
          return http(original)
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        useAuthStore.getState().setTokens(accessToken, newRefresh)
        flushQueue(null, accessToken)
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`
        return http(original)
      } catch (refreshError) {
        flushQueue(refreshError, null)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const data = error.response.data as { message?: string } | undefined
    const finalError = new Error(data?.message ?? 'Đã có lỗi hệ thống xảy ra') as any
    finalError.data = error.response.data
    return Promise.reject(finalError)
  },
)

export default http
