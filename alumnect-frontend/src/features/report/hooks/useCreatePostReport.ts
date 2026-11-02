import { useMutation } from '@tanstack/react-query'
import { reportApi } from '../api/reportApi'
import type { CreatePostReportInput } from '../model/report'

export function useCreatePostReport() {
  return useMutation({
    mutationFn: ({ postId, input }: { postId: string; input: CreatePostReportInput }) =>
      reportApi.reportPost(postId, input),
  })
}
