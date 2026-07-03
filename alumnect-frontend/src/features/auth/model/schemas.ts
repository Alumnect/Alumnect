import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  remember: z.boolean().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>


export const forgotSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
})
export type ForgotInput = z.infer<typeof forgotSchema>
