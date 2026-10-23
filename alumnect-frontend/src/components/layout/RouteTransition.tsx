import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_IN, EASE_OUT } from '@/lib/motion'

/**
 * Chuyển trang cho mọi màn hình dùng chung khung (App, Admin, Cố vấn):
 * trang cũ mờ đi nhanh (~140ms) → trang mới hiện lên từ dưới nhẹ + mờ dần vào (~280ms).
 * `mode="wait"` tạo độ trễ ngắn có chủ đích giữa hai trang (không còn cảm giác "giật" khi nội dung đổi tức thì).
 * Chỉ animate opacity/transform; tôn trọng "giảm chuyển động" của hệ điều hành qua MotionConfig ở main.tsx.
 * Chuyển chỉ khi pathname đổi — đổi query (?tab=…) hoặc cập nhật dữ liệu không kích hoạt.
 */
export function RouteTransition({ className }: { className?: string }) {
  const outlet = useOutlet()
  const { pathname } = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT, delay: 0.04 } }}
        exit={{ opacity: 0, y: -4, transition: { duration: 0.14, ease: EASE_IN } }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
