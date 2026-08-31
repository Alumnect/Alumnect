import { z } from 'zod'

export const REPORT_REASONS = ['SPAM', 'INAPPROPRIATE', 'MISINFORMATION', 'SCAM_OR_FRAUD', 'OTHER'] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Nội dung không phù hợp',
  MISINFORMATION: 'Thông tin sai lệch',
  SCAM_OR_FRAUD: 'Lừa đảo hoặc gian lận',
  OTHER: 'Lý do khác',
}

export const createPostReportSchema = z.object({
  reason: z.string().min(1, 'Vui lòng chọn lý do báo cáo'),
  description: z.string().max(500, 'Mô tả báo cáo không được vượt quá 500 ký tự'),
}).superRefine((value, context) => {
  if (value.reason === 'OTHER' && !value.description.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['description'],
      message: 'Vui lòng mô tả lý do báo cáo khác',
    })
  }
})

export type CreatePostReportInput = z.infer<typeof createPostReportSchema>

export type ReportResponse = {
  id: number
  postId: number
  reason: ReportReason
  description: string | null
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
}
