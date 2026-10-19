import { useState, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

/**
 * Consistent page title block for app & admin screens.
 * Thiết kế siêu tối giản (Zero-Clutter):
 * - Bỏ hoàn toàn tiêu đề chữ to và icon trang cồng kềnh ngoài giao diện chính.
 * - Chỉ để lại 1 nút icon tròn chữ (i) nhỏ nhắn, tinh tế.
 * - Khi click vào nút (i), popover kính mờ sẽ mở ra hiển thị Tên trang, Icon và Hướng dẫn chi tiết.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  useClickOutside(infoRef, () => setShowInfo(false), showInfo)

  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      {/* Nút icon tròn chữ (i) duy nhất - Tinh tế, không choán diện tích */}
      <div className="relative inline-flex" ref={infoRef}>
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          aria-label="Thông tin & hướng dẫn trang"
          title="Thông tin & hướng dẫn trang này"
          className={cn(
            'group grid h-7 w-7 place-items-center rounded-full border transition-all duration-200 cursor-pointer shadow-2xs',
            showInfo
              ? 'border-primary bg-primary-solid text-on-primary scale-105 shadow-xs'
              : 'border-border bg-surface text-text-subtle hover:border-primary-soft-border hover:bg-primary-soft hover:text-primary-solid dark:hover:text-primary-solid'
          )}
        >
          <Info size={14} strokeWidth={2.4} />
        </button>

        {/* Popover hiển thị Tên trang + Icon + Hướng dẫn khi người dùng bấm vào (i) */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={TRANSITION.pop}
              className="absolute left-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-border bg-surface p-4 shadow-xl backdrop-blur-md dark:shadow-black/40"
            >
              {/* Header của popover: Icon + Tên trang + Nút đóng X */}
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {icon && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-solid dark:bg-orange-500/20 dark:text-orange-400">
                      {icon}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-text truncate">
                    {title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-text-subtle hover:bg-surface-2 hover:text-text-muted transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Nội dung thông tin & hướng dẫn */}
              {subtitle && (
                <div className="mt-2.5 text-xs leading-relaxed text-text-muted">
                  {subtitle}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Các nút hành động bên phải nếu trang có (ví dụ nút Tạo bài, Đặt câu hỏi...) */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
