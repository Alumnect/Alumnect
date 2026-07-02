import { z } from 'zod'

/**
 * Định nghĩa các kiểu dữ liệu (TypeScript interfaces) phục vụ cho chức năng xác thực và đăng ký.
 */

export interface Major {
  id: number
  code: string
  name: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  role: 'STUDENT' | 'ALUMNI'
  majorId: number
  cohort: number
  studentCode: string
  graduationYear?: number
  proofUrl?: string
  note?: string
}

export interface PresignedUrlResponse {
  uploadUrl: string
  publicUrl: string
}

// Zod Schema Validate cho Form Đăng Ký
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(150, 'Họ và tên không được vượt quá 150 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ')
    .max(255, 'Email không được vượt quá 255 ký tự'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải có độ dài từ 8 đến 100 ký tự')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'),
  role: z.enum(['STUDENT', 'ALUMNI']),
  majorId: z.coerce.number().min(1, 'Chuyên ngành không được để trống'),
  cohort: z.coerce.number().min(1, 'Khóa học không được để trống'),
  studentCode: z.string().min(1, 'Mã số sinh viên không được để trống').max(20, 'Mã số sinh viên không được vượt quá 20 ký tự'),
  graduationYear: z.coerce.number().optional(),
  proofUrl: z.string().max(500, 'URL minh chứng không được vượt quá 500 ký tự').optional(),
  note: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự').optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'ALUMNI') {
    const currentYear = new Date().getFullYear();
    if (!data.graduationYear || data.graduationYear <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['graduationYear'],
        message: 'Năm tốt nghiệp là bắt buộc khi đăng ký với vai trò Cựu sinh viên',
      });
    } else if (data.graduationYear > currentYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['graduationYear'],
        message: 'Năm tốt nghiệp không được lớn hơn năm hiện tại',
      });
    }
    if (!data.proofUrl || data.proofUrl.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proofUrl'],
        message: 'Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên',
      });
    }
  }
});

export type RegisterFormValues = z.infer<typeof registerSchema>
