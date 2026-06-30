import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  remember: z.boolean().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  role: z.enum(['STUDENT', 'ALUMNI']),
  agree: z.boolean().refine((v) => v === true, { message: 'Bạn cần đồng ý điều khoản' }),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const forgotSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
})
export type ForgotInput = z.infer<typeof forgotSchema>
