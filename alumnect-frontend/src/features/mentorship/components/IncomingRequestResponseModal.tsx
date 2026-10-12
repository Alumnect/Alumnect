import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, MessageSquare, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IncomingRequestResponseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'ACCEPT' | 'DECLINE'
  requestTitle: string
  studentName: string
  onSubmit: (responseNote?: string) => Promise<void>
  isLoading: boolean
}

/**
 * Modal xác nhận phản hồi (Chấp nhận / Từ chối) yêu cầu Mentoring của Mentor (UC103).
 * Tuân thủ quy chuẩn Pastel Premium Design System và nguyên tắc ACCEPTED ≠ Deal.
 */
export function IncomingRequestResponseModal({
  isOpen,
  onClose,
  type,
  requestTitle,
  studentName,
  onSubmit,
  isLoading,
}: IncomingRequestResponseModalProps) {
  const [responseNote, setResponseNote] = useState('')
  const isAccept = type === 'ACCEPT'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(responseNote.trim() ? responseNote.trim() : undefined)
    setResponseNote('')
  }

  const handleClose = () => {
    if (isLoading) return
    setResponseNote('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-plum-900/40 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="relative w-full max-w-lg rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]"
          >
            {/* Nút đóng */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-plum-400 transition-colors hover:bg-cream-100 hover:text-plum-900 disabled:opacity-50 dark:text-[#8f9399] dark:hover:bg-white/[0.05] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Modal */}
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
                  isAccept
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
                )}
              >
                {isAccept ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-plum-900 dark:text-white">
                  {isAccept ? 'Chấp nhận yêu cầu hướng dẫn?' : 'Từ chối yêu cầu hướng dẫn?'}
                </h3>
                <p className="text-xs text-plum-600 dark:text-[#b0b3b8]">
                  Yêu cầu từ sinh viên: <strong className="text-plum-800 dark:text-white">{studentName}</strong>
                </p>
                <p className="line-clamp-1 text-xs italic text-plum-500 dark:text-[#8f9399]">
                  "{requestTitle}"
                </p>
              </div>
            </div>

            {/* Cảnh báo quy tắc nghiệp vụ */}
            {isAccept ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Khi chấp nhận, bạn đồng ý tiếp nhận trao đổi với sinh viên về yêu cầu này.
                  </p>
                  <p className="text-[11px] opacity-90">
                    <strong>Lưu ý:</strong> Thao tác này <strong>KHÔNG tự động tạo thỏa thuận (Deal)</strong>, không thu phí hay trừ tiền sinh viên. Hai bên có thể bắt đầu nhắn tin trao đổi nội dung chi tiết.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/60 bg-rose-50/60 p-3.5 text-xs text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p>
                  Sinh viên sẽ nhìn thấy trạng thái từ chối của bạn đối với yêu cầu này. Quyết định không thể hoàn tác sau khi xác nhận.
                </p>
              </div>
            )}

            {/* Form nhập lời nhắn / lý do */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-plum-700 dark:text-[#e4e6eb]">
                  <MessageSquare className="h-3.5 w-3.5 text-plum-400" />
                  <span>{isAccept ? 'Lời nhắn gửi sinh viên (không bắt buộc):' : 'Lý do / Lời nhắn từ chối (không bắt buộc):'}</span>
                </label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={isLoading}
                  placeholder={
                    isAccept
                      ? 'Ví dụ: Chào bạn, mình rất sẵn lòng trao đổi và định hướng về chủ đề này...'
                      : 'Ví dụ: Hiện tại mình đang kín lịch công tác, hẹn bạn dịp khác nhé...'
                  }
                  className="mt-1.5 w-full rounded-2xl border border-plum-900/[0.1] bg-cream-50/50 p-3 text-xs text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-[#393a3b] dark:bg-[#18191a] dark:text-white dark:placeholder-[#8f9399]"
                />
                <div className="mt-1 flex justify-end text-[10px] text-plum-400 dark:text-[#8f9399]">
                  {responseNote.length}/500 ký tự
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 border-t border-plum-900/[0.06] pt-4 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-xl border border-plum-900/[0.1] bg-white px-4 py-2.5 text-xs font-bold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 disabled:opacity-50 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 disabled:opacity-50',
                    isAccept
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:shadow-rose-500/20',
                  )}
                >
                  {isLoading && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>{isAccept ? 'Xác nhận chấp nhận' : 'Xác nhận từ chối'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
