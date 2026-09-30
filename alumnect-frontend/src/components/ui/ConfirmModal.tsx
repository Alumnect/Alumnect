import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  icon?: ReactNode
  isLoading?: boolean
  zIndexClassName?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  icon,
  isLoading = false,
  zIndexClassName = 'z-50',
}: ConfirmModalProps) {
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

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 ring-8 ring-rose-500/10 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-500/10',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 ring-8 ring-amber-500/10 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-500/10',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25',
    },
    primary: {
      iconBg: 'bg-brand-50 text-brand-600 ring-8 ring-brand-500/10 dark:bg-brand-500/20 dark:text-brand-400 dark:ring-brand-500/10',
      confirmBtn: 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/25',
    },
  }[variant]

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed inset-0 flex items-center justify-center p-4', zIndexClassName)}>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs dark:bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal Card */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-plum-900/10 bg-white p-6 text-center shadow-2xl dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#f0f2f5]"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1.5 text-plum-400 transition-colors hover:bg-plum-900/5 hover:text-plum-700 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}

            {/* Hero Icon */}
            <div className={cn('mb-3 grid h-14 w-14 place-items-center rounded-2xl transition-transform', variantStyles.iconBg)}>
              {icon || <AlertTriangle size={24} />}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5]">
              {title}
            </h3>

            {/* Message */}
            <div className="mt-2 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
              {message}
            </div>

            {/* Actions */}
            <div className="mt-6 flex w-full items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-plum-900/5 py-2.5 text-xs font-semibold text-plum-700 transition-colors hover:bg-plum-900/10 disabled:opacity-50 dark:bg-[#3a3b3c] dark:text-[#e4e6eb] dark:hover:bg-[#4e4f50]"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50',
                  variantStyles.confirmBtn
                )}
              >
                {isLoading && <Loader2 size={13} className="animate-spin" />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
