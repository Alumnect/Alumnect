import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the top of the page on every route change (skips hash links).
 * Dùng 'instant' để nhảy tức thì — 'auto' sẽ theo CSS scroll-behavior nên từng bị cuộn mượt chạy song song với animation vào trang.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    // Chờ trang cũ mờ đi (~140ms, xem RouteTransition) rồi mới về đầu trang — tránh nội dung cũ nhảy lên khi đang rời đi
    const id = window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 150)
    return () => window.clearTimeout(id)
  }, [pathname, hash])
  return null
}
