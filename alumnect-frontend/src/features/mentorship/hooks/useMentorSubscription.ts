import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
import { mentorSubscriptionApi } from '../api/mentorSubscriptionApi'
import type { SelectMentorPackageRequest } from '../model/mentorSubscriptionTypes'

/** Key cache cho React Query */
export const MENTOR_SUBSCRIPTION_KEYS = {
  packages: ['mentor-subscriptions', 'packages'] as const,
  mySubscription: ['mentor-subscriptions', 'my-subscription'] as const,
}

/**
 * Custom Hook lấy danh sách gói Mentor active từ Server.
 */
export function useMentorPackages() {
  return useQuery({
    queryKey: MENTOR_SUBSCRIPTION_KEYS.packages,
    queryFn: mentorSubscriptionApi.getActivePackages,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Custom Hook lấy thông tin gói Mentor hiện tại của người dùng.
 */
export function useMyMentorSubscription() {
  return useQuery({
    queryKey: MENTOR_SUBSCRIPTION_KEYS.mySubscription,
    queryFn: mentorSubscriptionApi.getMySubscription,
    retry: false,
  })
}

/**
 * Custom Hook thực hiện hành động Lựa chọn gói Mentor (UC92).
 */
export function useSelectMentorPackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SelectMentorPackageRequest) =>
      mentorSubscriptionApi.selectPackage(data),
    onSuccess: (response) => {
      toast.success(
        `Đã chọn gói ${response.packageName} thành công! Đang chuyển hướng sang thanh toán...`
      )
      // Invalidate queries liên quan để tự động làm mới UI
      queryClient.invalidateQueries({ queryKey: MENTOR_SUBSCRIPTION_KEYS.mySubscription })
      queryClient.invalidateQueries({ queryKey: ['mentor-registration'] })
      queryClient.invalidateQueries({ queryKey: ['mentor-status'] })
    },
    onError: (error: Error) => {
      // Hiển thị trực tiếp thông điệp nghiệp vụ từ Backend
      toast.error(error.message || 'Không thể lựa chọn gói Mentor. Vui lòng thử lại.')
    },
  })
}
