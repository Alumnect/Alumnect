import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminApi,
  type GetQuestionReportsParams,
  type UpdateQuestionReportStatusPayload,
} from '../api/adminApi'
import { toast } from '@/components/ui'

/**
 * Hook lấy danh sách báo cáo câu hỏi vi phạm cho Admin với React Query (UC78).
 */
export function useAdminQuestionReports(params: GetQuestionReportsParams) {
  return useQuery({
    queryKey: ['admin-question-reports', params],
    queryFn: async () => {
      const res = await adminApi.getQuestionReports(params)
      return res.data
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook cập nhật trạng thái xử lý báo cáo câu hỏi vi phạm (RESOLVED / DISMISSED) (UC78).
 */
export function useUpdateQuestionReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateQuestionReportStatusPayload) => adminApi.updateQuestionReportStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-question-reports'] })
      toast.success('Đã cập nhật trạng thái xử lý báo cáo câu hỏi thành công!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái báo cáo câu hỏi')
    },
  })
}
