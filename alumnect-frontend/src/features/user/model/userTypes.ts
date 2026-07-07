import { z } from 'zod'

export interface ChangePasswordPayload {
  oldPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

// Zod Schema Validate cho Form Đổi Mật Khẩu
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z
      .string()
      .min(1, 'Mật khẩu mới không được để trống')
      .min(8, 'Mật khẩu mới phải có độ dài từ 8 đến 100 ký tự')
      .max(100, 'Mật khẩu mới phải có độ dài từ 8 đến 100 ký tự')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 chữ số'),
    confirmNewPassword: z.string().min(1, 'Xác nhận mật khẩu mới không được để trống'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword === data.oldPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      })
    }
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmNewPassword'],
        message: 'Xác nhận mật khẩu mới không trùng khớp',
      })
    }
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
