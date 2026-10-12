import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/**
 * Custom Hook lấy danh sách yêu cầu Mentoring của sinh viên hiện tại.
 */
export function useMyMentoringRequests(page = 0, size = 10) {
  return useQuery({
    queryKey: ['mentoring', 'requests', 'my', page, size],
    queryFn: () => mentoringRequestApi.getMyRequests(page, size),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Custom Hook lấy chi tiết một yêu cầu Mentoring.
 */
export function useMentoringRequestDetail(id: number) {
  return useQuery({
    queryKey: ['mentoring', 'requests', 'detail', id],
    queryFn: () => mentoringRequestApi.getRequestDetail(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
  })
}
