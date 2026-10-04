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
  description,
  actions,
  action,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  const effectiveSubtitle = subtitle ?? description
  const effectiveActions = actions ?? action
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
              ? 'border-[#F27024] bg-[#F27024] text-white scale-105 shadow-xs'
              : 'border-slate-200/90 bg-white/90 text-slate-400 hover:border-[#F27024]/50 hover:bg-orange-50 hover:text-[#F27024] dark:border-[#393a3b] dark:bg-[#242526]/90 dark:text-[#b0b3b8] dark:hover:text-[#F27024]'
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
              className="absolute left-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-[#393a3b] dark:bg-[#242526]/95 dark:shadow-black/40"
            >
              {/* Header của popover: Icon + Tên trang + Nút đóng X */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-[#393a3b]">
                <div className="flex items-center gap-2 min-w-0">
                  {icon && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#F27024] dark:bg-orange-500/20 dark:text-orange-400">
                      {icon}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-slate-900 truncate dark:text-white">
                    {title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#3a3b3c] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Nội dung thông tin & hướng dẫn */}
              {effectiveSubtitle && (
                <div className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-[#e4e6eb]">
                  {effectiveSubtitle}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Các nút hành động bên phải nếu trang có (ví dụ nút Tạo bài, Đặt câu hỏi...) */}
      {effectiveActions && <div className="flex items-center gap-2 shrink-0">{effectiveActions}</div>}
    </div>
  )
}
