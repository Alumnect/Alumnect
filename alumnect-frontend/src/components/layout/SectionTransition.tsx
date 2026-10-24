import type { ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_IN, EASE_OUT } from '@/lib/motion'

/**
 * Chuyển giữa các "khu" lớn của ứng dụng (đăng nhập ↔ ứng dụng ↔ quản trị): mờ đi nhanh rồi mờ vào.
 * Chỉ đổi khi phân đoạn đầu của đường dẫn đổi (/login → /app…); trong cùng một khu, RouteTransition trong khung lo hiệu ứng.
 * Truyền `location` đã đóng băng cho <Routes> để lúc trang cũ đang mờ đi nó vẫn hiển thị đúng nội dung cũ.
 * Chỉ dùng opacity (không transform) để không tạo containing block cho phần tử `position: fixed` bên trong.
 */
export function SectionTransition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const section = location.pathname.split('/')[1] ?? ''
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE_IN } }}
      >
        {children(location)}
      </motion.div>
    </AnimatePresence>
  )
}
