import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  maxWidthClassName?: string // ví dụ: 'max-w-md', 'max-w-lg', ...
  zIndexClassName?: string // ví dụ: 'z-50', 'z-[10000]', ...
  bodyClassName?: string
}

/**
 * Component Modal dùng chung cho toàn bộ dự án.
 * Tự động sử dụng React Portal để gắn vào document.body nhằm giải quyết triệt để lỗi
 * không tràn màn hình do ảnh hưởng bởi thuộc tính transform/filter của các component cha.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  className,
  maxWidthClassName = 'max-w-md',
  zIndexClassName = 'z-50',
  bodyClassName,
}: ModalProps) {
  // Ngăn cuộn trang (scroll) khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 flex items-end justify-center sm:items-center sm:p-4", zIndexClassName)}>
          {/* Lớp nền mờ (Backdrop) phủ toàn màn hình */}
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: TRANSITION.exit }}
            transition={TRANSITION.overlay}
            onClick={onClose}
          />

          {/* Hộp thoại Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative flex w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface text-text shadow-overlay max-h-[90vh] pb-[env(safe-area-inset-bottom)] sm:rounded-2xl sm:max-h-[85vh] sm:pb-0",
              maxWidthClassName,
              className
            )}
            initial={{ opacity: 0, scale: 0.98, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6, transition: TRANSITION.exit }}
            transition={TRANSITION.pop}
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3 sm:px-6">
              <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-surface-3 sm:hidden" />
              <div className="flex min-w-0 items-center gap-2">
                {icon && (
                  <span className="shrink-0 rounded-xl bg-primary-soft p-1.5 text-primary-solid">
                    {icon}
                  </span>
                )}
                <h3 className="line-clamp-1 text-base font-extrabold text-text">{title}</h3>
              </div>
              <button
                onClick={onClose}
                type="button"
                aria-label="Đóng"
                className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-text-subtle transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className={cn("flex-1 overflow-y-auto p-5 text-text-muted", bodyClassName)}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-border bg-surface px-5 py-3 sm:px-6 sm:py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
