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
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
