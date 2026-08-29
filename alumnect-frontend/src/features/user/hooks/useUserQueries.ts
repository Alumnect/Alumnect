import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '../api/userApi'
import type { UserSearchParams } from '../model/userTypes'

export const userKeys = {
  all: ['user-profile'] as const,
  ownProfile: () => ['user-profile', 'own'] as const,
  userProfile: (id: number | null) => ['user-profile', id] as const,
  search: (params?: UserSearchParams) => ['user-search', params] as const,
}


/**
 * Hook truy vấn thông tin hồ sơ của chính mình (Own Profile)
 */
export function useOwnProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.ownProfile(),
    queryFn: async () => {
      const response = await userApi.getOwnProfile()
      const data = response.data
      if (data) {
        const currentUser = useAuthStore.getState().user
        if (currentUser && (currentUser.name !== data.fullName || currentUser.avatarUrl !== data.avatarUrl)) {
          useAuthStore.getState().setUser({
            ...currentUser,
            name: data.fullName,
            avatarUrl: data.avatarUrl || currentUser.avatarUrl,
          })
        }
      }
      return data
    },
    ...options,
  })
}


/**
 * Hook truy vấn thông tin hồ sơ của người dùng khác bằng userId (Other User Profile)
 */
export function useUserProfile(userId: number | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Yêu cầu ID người dùng hợp lệ')
      const response = await userApi.getUserProfile(userId)
      return response.data
    },
    enabled: (options?.enabled !== false) && !!userId && !isNaN(userId),
  })
}

/**
 * Hook truy vấn danh sách người theo dõi (Followers) kiểu cuộn vô hạn
 */
export function useUserFollowers(userId: number, size = 10, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['user-followers', userId, size],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await userApi.getFollowers(userId, pageParam, size)
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
    enabled: (options?.enabled !== false) && !!userId && !isNaN(userId),
  })
}

/**
 * Hook truy vấn danh sách đang theo dõi (Following) kiểu cuộn vô hạn
 */
export function useUserFollowing(userId: number, size = 10, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['user-following', userId, size],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await userApi.getFollowing(userId, pageParam, size)
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
    enabled: (options?.enabled !== false) && !!userId && !isNaN(userId),
  })
}

/**
 * Hook tìm kiếm và lọc danh sách thành viên trong mạng lưới AlumNect (Alumni Directory)
 */
export function useSearchUsers(params?: UserSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: async () => {
      const response = await userApi.searchUsers(params)
      return response.data
    },
    ...options,
  })
}


/**
 * Hook nạp danh sách các tùy chọn lọc động (Khóa học, Tỉnh/Thành phố) từ DB
 */
export function useUserFilterOptions() {
  return useQuery({
    queryKey: ['user-filter-options'],
    queryFn: async () => {
      const response = await userApi.getFilterOptions()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

