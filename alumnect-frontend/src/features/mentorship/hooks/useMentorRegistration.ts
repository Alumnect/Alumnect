import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorRegistrationApi } from '../api/mentorRegistrationApi'
import type {
  MentorRegistrationResponse,
  MentorRegistrationRequest,
  MentorRegistrationSaveResponse,
  SupportedIndustryItem,
} from '../model/mentorRegistrationTypes'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export const MENTOR_REGISTRATION_QUERY_KEY = ['mentoring', 'registration'] as const
export const MENTOR_INDUSTRIES_QUERY_KEY = ['mentoring', 'industries'] as const

/**
 * Hook truy vấn thông tin đăng ký Mentor hiện tại của Alumni.
 */
export function useMentorRegistration(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  return useQuery<MentorRegistrationResponse, Error>({
    queryKey: MENTOR_REGISTRATION_QUERY_KEY,
    queryFn: () => mentorRegistrationApi.getRegistration(),
    enabled: isAuthenticated && isAlumni && enabled,
    staleTime: 1000 * 60 * 3, // Cache trong 3 phút
    retry: 1,
  })
}

/**
 * Hook truy vấn danh mục ngành nghề chuẩn để chọn lĩnh vực hỗ trợ.
 */
export function useMentorIndustries() {
  return useQuery<SupportedIndustryItem[], Error>({
    queryKey: MENTOR_INDUSTRIES_QUERY_KEY,
    queryFn: () => mentorRegistrationApi.getIndustries(),
    staleTime: 1000 * 60 * 30, // Danh mục ngành ít thay đổi, cache 30 phút
  })
}

/**
 * Hook gửi mutation lưu thông tin đăng ký Mentor (Lưu nháp hoặc Hoàn tất).
 */
export function useSaveMentorRegistration() {
  const queryClient = useQueryClient()

  return useMutation<MentorRegistrationSaveResponse, Error, MentorRegistrationRequest>({
    mutationFn: (payload: MentorRegistrationRequest) => mentorRegistrationApi.saveRegistration(payload),
    onSuccess: (data) => {
      // Invalidate cache để đồng bộ dữ liệu mới nhất
      queryClient.invalidateQueries({ queryKey: MENTOR_REGISTRATION_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['mentor-status'] })
      if (data.isComplete) {
        toast.success('Chúc mừng! Bạn đã hoàn tất hồ sơ đăng ký Mentor.')
      } else {
        toast.success('Đã lưu nháp hồ sơ thành công!')
      }
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err.message || 'Lưu thông tin đăng ký thất bại.'
      toast.error(message)
    },
  })
}
