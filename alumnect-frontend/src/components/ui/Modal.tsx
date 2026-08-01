import { useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  maxWidthClassName?: string // ví dụ: 'max-w-md', 'max-w-lg', ...
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Lớp nền mờ (Backdrop) phủ toàn màn hình */}
          <motion.div
            className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Hộp thoại Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full rounded-3xl bg-cream-50 border border-plum-900/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
              maxWidthClassName,
              className
            )}
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-white border-b border-plum-900/5 shrink-0">
              <div className="flex items-center gap-2">
                {icon && (
                  <span className="p-1.5 rounded-xl bg-brand-100 text-brand-600 shrink-0">
                    {icon}
                  </span>
                )}
                <h3 className="text-base font-extrabold text-plum-900 line-clamp-1">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-plum-400 hover:text-plum-700 hover:bg-plum-900/[0.04] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-white border-t border-plum-900/5 shrink-0">
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
