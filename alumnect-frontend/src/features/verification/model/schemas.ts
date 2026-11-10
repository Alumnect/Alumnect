import { z } from 'zod'

/**
 * Zod Schema xác thực biểu mẫu nâng cấp tài khoản từ Sinh viên lên Cựu sinh viên (UC08).
 * Các thông điệp lỗi khớp 100% với cấu hình JSR-380 trong SubmitVerificationRequestDto.java và VerificationServiceImpl.java.
 */
export const upgradeAlumniSchema = z.object({
  proofUrl: z
    .string()
    .min(1, 'Vui lòng tải lên tài liệu minh chứng tốt nghiệp')
    .max(500, 'Đường dẫn tài liệu minh chứng không được vượt quá 500 ký tự')
    .regex(/^https?:\/\/.+/, 'Đường dẫn tài liệu minh chứng không hợp lệ'),

  graduationYear: z
    .number({
      message: 'Năm tốt nghiệp không được để trống',
    })
    .int('Năm tốt nghiệp không được để trống')
    .min(2006, 'Năm tốt nghiệp phải từ năm 2006 trở đi')
    .refine((val) => val <= new Date().getFullYear() + 1, {
      message: 'Năm tốt nghiệp không được lớn hơn năm hiện tại quá 1 năm.',
    }),

  majorId: z
    .number({
      message: 'Vui lòng chọn chuyên ngành tốt nghiệp',
    })
    .positive('Chuyên ngành tốt nghiệp không hợp lệ'),
})

export type UpgradeAlumniFormValues = z.infer<typeof upgradeAlumniSchema>
