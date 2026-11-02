import http from '@/lib/http'
import type { CreatePostReportInput, ReportResponse } from '../model/report'

type ApiResponse<T> = { data: T }

export const reportApi = {
  reportPost: async (postId: string, input: CreatePostReportInput): Promise<ReportResponse> => {
    const body = await http.post<unknown, ApiResponse<ReportResponse>>(
      `/posts/${encodeURIComponent(postId)}/reports`,
      {
        reason: input.reason,
        description: input.description.trim() || undefined,
      },
    )
    return body.data
  },
}
