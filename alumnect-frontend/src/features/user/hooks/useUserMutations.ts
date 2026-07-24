import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/userApi'
import { userKeys } from './useUserQueries'
import type { ChangePasswordPayload, UpdateProfileRequest } from '../model/userTypes'

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userApi.changePassword(payload),
  })
}

/**
 * Custom hook thực hiện cập nhật thông tin hồ sơ cá nhân và tự động invalidate cache
 */
export function useUpdateOwnProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userApi.updateOwnProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.ownProfile() })
    },
  })
}

