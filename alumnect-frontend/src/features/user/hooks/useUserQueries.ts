import { useQuery } from '@tanstack/react-query'
import { userApi } from '../api/userApi'

export const userKeys = {
  all: ['user-profile'] as const,
  ownProfile: () => ['user-profile', 'own'] as const,
  userProfile: (id: number | null) => ['user-profile', id] as const,
}

/**
 * Hook truy vấn thông tin hồ sơ của chính mình (Own Profile)
 */
export function useOwnProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.ownProfile(),
    queryFn: async () => {
      const response = await userApi.getOwnProfile()
      return response.data
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
