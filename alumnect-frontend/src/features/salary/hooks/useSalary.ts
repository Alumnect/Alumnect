import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salaryApi } from '../api/salaryApi'
import type { CreateSalaryContributionInput, SalaryStatisticsFilters } from '../model/salary'

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
 * Hook xóa (cứng) một lượt đóng góp lương đã có (UC52 - Delete salary contribution). Không thể
 * hoàn tác. Thành công thì làm mới cache thống kê (UC53) và danh sách đóng góp của chính mình.
 * @return Đối tượng mutation nhận `id` lượt đóng góp cần xóa (mutate, isPending, error...)
 */
export function useDeleteSalaryContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salaryApi.deleteContribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['my-salary-contributions'] })
    },
  })
}

/**
 * Hook lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics), có thể kèm bộ
 * lọc tùy chọn (UC54 - Filter salary data) — mỗi tổ hợp bộ lọc khác nhau là 1 cache riêng (`filters`
 * nằm trong `queryKey`) để đổi bộ lọc không làm mất cache của tổ hợp trước đó. Cache vừa phải
 * (2 phút) vì dữ liệu tổng hợp toàn hệ thống không đổi theo từng giây.
 * @param filters Bộ lọc tùy chọn (ngành/khu vực/chức danh/cấp bậc) — bỏ trống = xem toàn bộ
 * @return Đối tượng query chứa thống kê lương (KPI tổng quan + danh sách dòng theo nhóm), khớp bộ lọc nếu có
 */
export function useSalaryStatistics(filters?: SalaryStatisticsFilters) {
  return useQuery({
    queryKey: ['salary-statistics', filters ?? {}],
    queryFn: () => salaryApi.getStatistics(filters),
    staleTime: 2 * 60 * 1000,
  })
}
