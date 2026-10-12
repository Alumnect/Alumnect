import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 - 1 // < 10 MB

export const mentoringAttachmentSchema = z.object({
  fileName: z.string().min(1, 'Tên tệp tin không được để trống').max(255, 'Tên tệp tin không được vượt quá 255 ký tự'),
  fileUrl: z.string().min(1, 'Đường dẫn tệp tin không được để trống').max(500, 'Đường dẫn tệp tin không được vượt quá 500 ký tự'),
  fileSize: z
    .number({ message: 'Kích thước tệp tin không hợp lệ' })
    .positive('Kích thước tệp tin phải lớn hơn 0')
    .max(MAX_FILE_SIZE, 'Kích thước tệp tin phải nhỏ hơn 10 MB'),
  fileType: z.string().max(100).optional(),
})

export const createMentoringRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Tiêu đề yêu cầu không được để trống')
      .min(5, 'Tiêu đề yêu cầu phải từ 5 đến 200 ký tự')
      .max(200, 'Tiêu đề yêu cầu phải từ 5 đến 200 ký tự'),

    description: z
      .string()
      .trim()
      .min(1, 'Mô tả chi tiết không được để trống')
      .min(20, 'Mô tả chi tiết phải từ 20 đến 3000 ký tự')
      .max(3000, 'Mô tả chi tiết phải từ 20 đến 3000 ký tự'),

    industryId: z.coerce
      .number()
      .positive('Lĩnh vực cần hỗ trợ không được để trống'),

    budgetMin: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (val === '' || val === null || val === undefined) return null
        const num = Number(val)
        return isNaN(num) ? null : num
      })
      .refine((val) => val === null || val >= 0, {
        message: 'Ngân sách tối thiểu không được âm',
      }),

    budgetMax: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (val === '' || val === null || val === undefined) return null
        const num = Number(val)
        return isNaN(num) ? null : num
      })
      .refine((val) => val === null || val >= 0, {
        message: 'Ngân sách tối đa không được âm',
      }),

    workingMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH'], {
      message: 'Hình thức làm việc không được để trống',
    }),

    participationType: z.enum(['INDIVIDUAL', 'GROUP', 'BOTH'], {
      message: 'Hình thức tham gia không được để trống',
    }),

    taskType: z.enum(
      [
        'CAREER_ORIENTATION',
        'RESUME_REVIEW',
        'MOCK_INTERVIEW',
        'TECHNICAL_CONSULTING',
        'CAPSTONE_ADVICE',
        'OTHER',
      ],
      {
        message: 'Loại nhiệm vụ không được để trống',
      }
    ),

    expectedDeadline: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true
          const date = new Date(val)
          return !isNaN(date.getTime()) && date.getTime() > Date.now()
        },
        {
          message: 'Thời hạn mong muốn phải ở trong tương lai',
        }
      ),

    attachments: z
      .array(mentoringAttachmentSchema)
      .max(5, 'Chỉ được đính kèm tối đa 5 tệp tin')
      .default([]),
  })
  .refine(
    (data) => {
      if (data.budgetMin !== null && data.budgetMax !== null) {
        return data.budgetMax >= data.budgetMin
      }
      return true
    },
    {
      message: 'Ngân sách tối đa không được nhỏ hơn ngân sách tối thiểu',
      path: ['budgetMax'],
    }
  )

export type CreateMentoringRequestFormInput = z.input<typeof createMentoringRequestSchema>
export type CreateMentoringRequestFormOutput = z.output<typeof createMentoringRequestSchema>
