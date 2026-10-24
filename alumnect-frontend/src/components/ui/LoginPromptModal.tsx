import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { X, LogIn, ArrowRight } from 'lucide-react'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useDialog } from '@/hooks/useDialog'

/**
 * Popup nhỏ mời đăng nhập (kiểu Facebook) — hiện khi Guest cố thực hiện một hành động
 * cần đăng nhập (thích/bình luận/đăng lại/báo cáo...). Điều khiển qua store `useLoginPrompt`,
 * render một lần trong `AppShell` để dùng chung cho toàn khu vực app.
 */
export function LoginPromptModal() {
  const isOpen = useLoginPrompt((s) => s.isOpen)
  const message = useLoginPrompt((s) => s.message)
  const close = useLoginPrompt((s) => s.close)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialog(panelRef, { open: isOpen, onClose: close })

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Lớp nền mờ — bấm ra ngoài để đóng */}
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: TRANSITION.exit }}
            transition={TRANSITION.overlay}
            onClick={close}
          />
          {/* Hộp thoại */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-sm rounded-3xl card-surface p-6 text-center"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6, transition: TRANSITION.exit }}
            transition={TRANSITION.pop}
          >
            <button
              type="button"
              onClick={close}
              data-dialog-close
              aria-label="Đóng"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X size={18} />
            </button>

            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary-solid">
              <LogIn size={26} />
            </span>
            <h3 id={titleId} className="mt-4 text-lg font-extrabold text-text">Đăng nhập để tiếp tục</h3>
            <p className="mt-1.5 text-sm text-text-subtle">{message}</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={close}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-solid text-sm font-semibold text-on-primary shadow-sm transition-transform hover:bg-primary-hover hover:-translate-y-0.5"
              >
                Đăng nhập <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2"
              >
                Tạo tài khoản mới
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
