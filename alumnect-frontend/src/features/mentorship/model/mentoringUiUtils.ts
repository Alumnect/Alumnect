/** Hằng số và hàm tiện ích dùng chung cho form Mentoring. */

/** Ô nhập chuẩn của module Mentoring (input, textarea, select). */
export const MENTORING_INPUT =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-2'

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
