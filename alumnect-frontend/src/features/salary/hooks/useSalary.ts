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
