import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ADMIN_NAV, APP_ACCOUNT_NAV, APP_NAV } from '@/lib/constants'
import {
  MENTORSHIP_NAVIGATION,
  MENTORSHIP_TERMS_ITEM,
  type MentorshipNavigationItem,
} from '@/features/mentorship/constants/mentorshipNavigation'

type RouteLabel = { to: string; label: string }

const mentoringLeaves = (item: MentorshipNavigationItem): MentorshipNavigationItem[] => item.children ?? [item]

const ROUTE_LABELS: RouteLabel[] = [
  ...APP_NAV,
  ...APP_ACCOUNT_NAV,
  ...ADMIN_NAV,
  ...[...MENTORSHIP_NAVIGATION.flatMap((section) => section.items.flatMap(mentoringLeaves)), MENTORSHIP_TERMS_ITEM].flatMap(
    (item) => [item.to, ...(item.activePaths ?? [])].filter(Boolean).map((to) => ({ to: to as string, label: `Mentoring – ${item.label}` })),
  ),
]

/** Tên mục theo đường dẫn (khớp tiền tố dài nhất). */
function routeLabel(pathname: string) {
  let best: RouteLabel | undefined
  for (const entry of ROUTE_LABELS) {
    if (pathname !== entry.to && !pathname.startsWith(`${entry.to}/`)) continue
    if (!best || entry.to.length > best.to.length) best = entry
  }
  return best?.label ?? 'AlumNect'
}

/**
 * Mỗi trang cần đúng một <h1> cho trình đọc màn hình. Phần lớn trang tự có tiêu đề; những trang chỉ có danh sách,
 * trạng thái đang tải hoặc lỗi thì dùng h1 ẩn mang tên mục này. Khi nội dung xuất hiện h1 thật, h1 ẩn tự gỡ.
 */
export function PageHeadingGuard() {
  const { pathname } = useLocation()
  const ref = useRef<HTMLHeadingElement>(null)
  const [needed, setNeeded] = useState(true)

  useEffect(() => {
    const scope: ParentNode = ref.current?.closest('main') ?? document.body
    let timer = 0
    const check = () => {
      timer = 0
      setNeeded(!scope.querySelector('h1:not([data-heading-guard])'))
    }
    const schedule = () => {
      if (!timer) timer = window.setTimeout(check, 200)
    }
    check()
    const observer = new MutationObserver(schedule)
    observer.observe(scope, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [pathname])

  return (
    <h1 ref={ref} data-heading-guard hidden={!needed} className="sr-only">
      {routeLabel(pathname)}
    </h1>
  )
}
