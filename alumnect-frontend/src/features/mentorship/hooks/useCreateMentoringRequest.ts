import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'
import type {
  CreateMentoringRequestPayload,
  CreateMentoringRequestData,
} from '../model/mentoringRequestTypes'

/**
 * Custom Hook gửi yêu cầu tạo Mentoring Request (UC100).
 */
export function useCreateMentoringRequest() {
  const queryClient = useQueryClient()

  return useMutation<CreateMentoringRequestData, Error, CreateMentoringRequestPayload>({
    mutationFn: (payload) => mentoringRequestApi.createRequest(payload),
    onSuccess: () => {
      // Làm mới danh sách yêu cầu sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] })
    },
  })
}
