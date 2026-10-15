import { ArrowLeft } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Quay lại bước trước trong lịch sử của ứng dụng; nếu trang được mở thẳng bằng URL
 * hoặc tải lại (không có lịch sử trong app) thì đi tới `fallback`.
 */
export function useBackNavigation(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    // React Router đặt key 'default' cho lần vào đầu tiên của phiên: lúc đó navigate(-1) sẽ rời khỏi app.
    if (location.key !== 'default') navigate(-1)
    else navigate(fallback)
  }
}

interface BackLinkProps {
  /** Trang cha cố định (cũng là đích của liên kết nếu bấm giữa/mở tab mới). */
  to: string
  children: ReactNode
  /** true: ưu tiên quay lại trang vừa đứng (dùng khi trang có nhiều nguồn vào), `to` là phương án dự phòng. */
  smart?: boolean
  className?: string
}

/** Nút quay lại thống nhất cho các trang Mentoring: mũi tên + nhãn, vùng bấm tối thiểu 44px trên mobile. */
export function BackLink({ to, children, smart = false, className }: BackLinkProps) {
  const goBack = useBackNavigation(to)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!smart) return
    // Giữ hành vi mặc định khi người dùng mở tab mới (Ctrl/Cmd/Shift/chuột giữa).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    goBack()
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      data-back-link
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-text-muted transition-colors hover:text-primary-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:min-h-0',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </Link>
  )
}
