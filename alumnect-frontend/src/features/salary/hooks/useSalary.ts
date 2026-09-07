import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salaryApi } from '../api/salaryApi'
import type { CreateSalaryContributionInput } from '../model/salary'

/**
 * Hook lấy danh mục ngành nghề cho dropdown chọn ngành (UC50). Dữ liệu ít thay đổi nên cache lâu,
 * cùng pattern với `useTopics` (forum).
 * @return Đối tượng query chứa danh sách ngành nghề
 */
export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: () => salaryApi.getIndustries(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook đóng góp một mẫu lương ẩn danh (UC50 - Contribute salary data). Thành công thì làm mới cache
 * thống kê (['salary-statistics'], UC53) và danh sách đóng góp của chính mình (['my-salary-contributions'],
 * UC51) — Salary Board không còn chỉ ghi mà đã có nơi đọc lại dữ liệu này.
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useCreateSalaryContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSalaryContributionInput) => salaryApi.createContribution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['my-salary-contributions'] })
    },
  })
}

/**
 * Hook lấy toàn bộ lượt đóng góp lương của chính người dùng đang đăng nhập (UC51 - Edit salary
 * contribution) — để họ xem lại và chọn bản ghi cần sửa. Cache ngắn (30 giây) vì cần phản ánh
 * nhanh sau khi tự sửa/đóng góp thêm.
 * @return Đối tượng query chứa danh sách đóng góp của chính mình, mới nhất trước
 */
export function useMyContributions() {
  return useQuery({
    queryKey: ['my-salary-contributions'],
    queryFn: () => salaryApi.getMyContributions(),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook chỉnh sửa một lượt đóng góp lương đã có (UC51 - Edit salary contribution). Thành công thì
 * làm mới cache thống kê (UC53) và danh sách đóng góp của chính mình.
 * @param id ID lượt đóng góp cần sửa
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useUpdateSalaryContribution(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSalaryContributionInput) => salaryApi.updateContribution(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['my-salary-contributions'] })
    },
  })
}

/**
 * Hook lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics). Dữ liệu tổng
 * hợp toàn hệ thống, không đổi theo từng giây nên cache vừa phải (2 phút) để tránh gọi lại quá dày
 * khi người dùng chuyển bộ lọc khu vực (lọc client-side trên cùng 1 lần fetch).
 * @return Đối tượng query chứa thống kê lương (KPI tổng quan + danh sách dòng theo nhóm)
 */
export function useSalaryStatistics() {
  return useQuery({
    queryKey: ['salary-statistics'],
    queryFn: () => salaryApi.getStatistics(),
    staleTime: 2 * 60 * 1000,
  })
}
