import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_IN, EASE_OUT } from '@/lib/motion'

/**
 * Đổi nội dung theo tab/bộ lọc có chuyển động: nội dung cũ mờ đi nhanh (~120ms), nội dung mới hiện lên
 * từ dưới nhẹ + mờ vào (~240ms). Đổi `id` (ví dụ khóa tab) thì mới chuyển; cập nhật dữ liệu bên trong không kích hoạt.
 * Chỉ animate opacity/transform. Tôn trọng "giảm chuyển động" qua MotionConfig ở main.tsx.
 */
export function FadeSwitch({ id, children, className }: { id: string | number; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE_IN } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
