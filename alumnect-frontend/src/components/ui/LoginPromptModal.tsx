import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LogIn, ArrowRight } from 'lucide-react'
import { useLoginPrompt } from '@/store/loginPrompt'

/**
 * Popup nhỏ mời đăng nhập (kiểu Facebook) — hiện khi Guest cố thực hiện một hành động
 * cần đăng nhập (thích/bình luận/đăng lại/báo cáo...). Điều khiển qua store `useLoginPrompt`,
 * render một lần trong `AppShell` để dùng chung cho toàn khu vực app.
 */
export function LoginPromptModal() {
  const isOpen = useLoginPrompt((s) => s.isOpen)
  const message = useLoginPrompt((s) => s.message)
  const close = useLoginPrompt((s) => s.close)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Lớp nền mờ — bấm ra ngoài để đóng */}
          <motion.div
            className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          {/* Hộp thoại */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-3xl card-surface p-6 text-center"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={close}
              aria-label="Đóng"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900"
            >
              <X size={18} />
            </button>

            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600">
              <LogIn size={26} />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-plum-900">Đăng nhập để tiếp tục</h3>
            <p className="mt-1.5 text-sm text-plum-500">{message}</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={close}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-brand-700 hover:-translate-y-0.5"
              >
                Đăng nhập <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-plum-900/10 text-sm font-semibold text-plum-700 transition-colors hover:bg-plum-900/[0.04]"
              >
                Tạo tài khoản mới
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
