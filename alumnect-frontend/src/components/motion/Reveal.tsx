import type { ReactNode } from 'react'

/**
 * Các bao bọc "xuất hiện khi cuộn" trước đây dùng whileInView (IntersectionObserver + transform cho từng khối) gây khựng khi
 * cuộn danh sách dài. Nay là khối thường: nội dung hiện ngay, không animation. Giữ API cũ để không phải sửa nơi gọi.
 */
type RevealProps = {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  duration?: number
  once?: boolean
  blur?: boolean
}

export function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>
}

export function Stagger({ children, className }: { children: ReactNode; className?: string; gap?: number; once?: boolean }) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
