/** Hằng số và hàm tiện ích dùng chung cho form Mentoring. */

/** Ô nhập chuẩn của module Mentoring (input, textarea, select). */
export const MENTORING_INPUT =
  'w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-plum-900 outline-none transition placeholder:text-plum-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-cream-100 dark:border-white/10 dark:bg-[#18191a] dark:text-white'

/** Lấy thông báo lỗi từ phản hồi API (axios interceptor trả Error có message). */
export function apiErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const anyErr = err as { response?: { data?: { message?: string } }; message?: string }
    return anyErr.response?.data?.message || anyErr.message || fallback
  }
  return fallback
}

/** Giá trị cho input datetime-local theo giờ máy người dùng. */
export function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
