import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1'

// eslint-disable-next-line import/no-named-as-default-member
const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/* ---- hàng đợi tự làm mới token (giống Web) ---- */
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let isRefreshing = false
let queue: QueueItem[] = []

const flushQueue = (error: unknown, token: string | null) => {
  queue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)))
  queue = []
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!error.response) return Promise.reject(new Error('Mất kết nối mạng. Vui lòng thử lại.'))

    const isAuthCall = original?.url?.includes('/auth/')
    if (error.response.status === 401 && original && !original._retry && !isAuthCall) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`
          return http(original)
        })
      }

      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        const data = error.response.data as { message?: string } | undefined
        return Promise.reject(new Error(data?.message ?? 'Yêu cầu đăng nhập'))
      }

      isRefreshing = true
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        useAuthStore.getState().setTokens(accessToken, newRefresh)
        flushQueue(null, accessToken)
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`
        return http(original)
      } catch (refreshError) {
        flushQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const data = error.response.data as { message?: string } | undefined
    const err = new Error(data?.message ?? 'Đã có lỗi hệ thống xảy ra') as Error & { status?: number; data?: unknown }
    err.status = error.response.status
    err.data = error.response.data
    return Promise.reject(err)
  },
)

export default http

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}
