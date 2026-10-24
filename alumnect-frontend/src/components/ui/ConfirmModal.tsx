import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialog } from '@/hooks/useDialog'

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
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Đang xử lý: Esc không đóng hộp thoại
  useDialog(panelRef, { open: isOpen, onClose: isLoading ? () => {} : onClose })

  const variantStyles = {
    danger: {
      iconBg: 'bg-danger-soft text-danger ring-8 ring-danger-soft/50',
      confirmBtn: 'bg-danger text-text-inverse hover:opacity-90',
    },
    warning: {
      iconBg: 'bg-warning-soft text-warning ring-8 ring-warning-soft/50',
      confirmBtn: 'bg-warning text-text-inverse hover:opacity-90',
    },
    primary: {
      iconBg: 'bg-primary-soft text-primary-solid ring-8 ring-primary-soft/50',
      confirmBtn: 'bg-primary-solid text-on-primary hover:bg-primary-hover',
    },
  }[variant]

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed inset-0 flex items-end justify-center sm:items-center sm:p-4', zIndexClassName)}>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal Card */}
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex w-full flex-col items-center rounded-t-2xl border border-border bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-text shadow-overlay sm:max-w-sm sm:rounded-2xl sm:pb-6"
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
                data-dialog-close
                aria-label="Đóng"
                className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X size={16} />
              </button>
            )}

            {/* Hero Icon */}
            <div className={cn('mb-3 grid h-14 w-14 place-items-center rounded-2xl transition-transform', variantStyles.iconBg)}>
              {icon || <AlertTriangle size={24} />}
            </div>

            {/* Title */}
            <h3 id={titleId} className="text-lg font-bold text-text">
              {title}
            </h3>

            {/* Message */}
            <div className="mt-2 text-sm leading-relaxed text-text-muted">
              {message}
            </div>

            {/* Actions */}
            <div className="mt-6 flex w-full items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-11 flex-1 rounded-xl bg-surface-2 text-sm font-semibold text-text transition-colors hover:bg-surface-3 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50',
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
