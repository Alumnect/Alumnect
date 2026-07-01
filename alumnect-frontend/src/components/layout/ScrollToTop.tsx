import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to the top of the page on every route change (skips hash links). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}
