import { useMutation } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { AiStudioResult } from '../model/aiStudio'

/**
 * Hook gọi AI Studio [B1]: sinh bài viết + dữ liệu form + cấu hình Poster từ một câu ý tưởng ngắn.
 * Không đụng cache bảng tin vì chỉ tạo bản nháp trong form, chưa đăng.
 * @return Đối tượng mutation (mutateAsync, isPending, ...)
 */
export function useAiStudio() {
  return useMutation<AiStudioResult, Error, { prompt: string; preferredType?: string }>({
    mutationFn: ({ prompt, preferredType }) => feedApi.aiStudio(prompt, preferredType),
  })
}
