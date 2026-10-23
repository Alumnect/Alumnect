import { useId, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDialog } from '@/hooks/useDialog'

interface DialogFrameProps {
  onClose: () => void
  children: ReactNode
  /** Tên truy cập khi nội dung không có tiêu đề h1–h3 (nếu có, tiêu đề đầu tiên được dùng làm tên). */
  label?: string
  zIndexClassName?: string
  maxWidthClassName?: string
  /** Class cho hộp thoại (padding, cuộn, bố cục…). Nền/viền/bo góc/đổ bóng do khung quản lý. */
  className?: string
  /** false: Esc và bấm nền không đóng (ví dụ đang gửi dữ liệu hoặc bước bắt buộc). */
  dismissible?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Khung hộp thoại cho các modal có nội dung riêng (header/body/footer tự dựng).
 * Mount = mở: thành phần cha tự trả `null` khi đóng. Cung cấp role="dialog", aria-modal, tên truy cập từ
 * tiêu đề, bẫy tiêu điểm, Esc, inert nền, khóa cuộn và trả tiêu điểm — xem hooks/useDialog.
 * Điện thoại: sheet từ dưới lên; từ `sm`: hộp thoại ở giữa.
 */
export function DialogFrame({
  onClose,
  children,
  label,
  zIndexClassName = 'z-[100]',
  maxWidthClassName = 'max-w-lg',
  className,
  dismissible = true,
  initialFocusRef,
}: DialogFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const fallbackId = useId()
  const close = dismissible ? onClose : noop
  useDialog(panelRef, { open: true, onClose: close, initialFocus: initialFocusRef })

  // Tên truy cập = tiêu đề đầu tiên trong nội dung (không cần truyền id từng nơi)
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const heading = panel.querySelector<HTMLElement>('h1, h2, h3')
    if (heading) {
      if (!heading.id) heading.id = fallbackId
      panel.setAttribute('aria-labelledby', heading.id)
    }
  }, [fallbackId, children])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={cn('fixed inset-0 flex items-end justify-center sm:items-center sm:p-4', zIndexClassName)}>
      <motion.div
        className="absolute inset-0 bg-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={TRANSITION.overlay}
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-border bg-surface text-text shadow-overlay outline-none sm:max-h-[90dvh] sm:rounded-3xl',
          'pb-[env(safe-area-inset-bottom)] sm:pb-0',
          maxWidthClassName,
          className,
        )}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION.dialog}
      >
        {children}
      </motion.div>
    </div>,
    document.body,
  )
}

function noop() {}
