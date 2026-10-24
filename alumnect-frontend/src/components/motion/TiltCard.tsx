import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TiltCardProps = {
  children: ReactNode
  className?: string
  /** giữ để tương thích: không còn nghiêng 3D theo chuột */
  max?: number
  glare?: boolean
}

/** Trước đây nghiêng 3D theo chuột (cập nhật liên tục khi di chuột → giật). Nay là khối thường, giữ API cũ. */
export function TiltCard({ children, className }: TiltCardProps) {
  return <div className={cn('spotlight', className)}>{children}</div>
}
