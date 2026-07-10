import { useMutation } from '@tanstack/react-query'
import { userApi } from '../api/userApi'
import type { ChangePasswordPayload } from '../model/userTypes'

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userApi.changePassword(payload),
  })
}
