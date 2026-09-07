import { useMutation, useQuery } from '@tanstack/react-query'
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
 * Hook đóng góp một mẫu lương ẩn danh (UC50 - Contribute salary data). Bọc `useMutation`;
 * không cần invalidate cache danh sách/thống kê vì UC50 không hiển thị lại dữ liệu đã đóng góp
 * (Salary Board chỉ hiển thị số liệu tổng hợp — thuộc UC53, ngoài phạm vi UC50).
 * @return Đối tượng mutation (mutate, isPending, error...)
 */
export function useCreateSalaryContribution() {
  return useMutation({
    mutationFn: (input: CreateSalaryContributionInput) => salaryApi.createContribution(input),
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
