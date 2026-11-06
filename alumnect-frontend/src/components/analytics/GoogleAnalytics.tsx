import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGA, trackPageView } from '@/lib/analytics'

/**
 * Component lắng nghe sự kiện chuyển trang trong React Router SPA
 * và gửi sự kiện page_view đến Google Analytics 4 (GA4).
 * Đặt component này bên trong <BrowserRouter>.
 */
export function GoogleAnalytics() {
  const location = useLocation()

  // Khởi tạo GA4 khi ứng dụng tải
  useEffect(() => {
    initGA()
  }, [])

  // Theo dõi page_view mỗi khi thay đổi URL (pathname hoặc query search)
  useEffect(() => {
    // Đợi 120ms để SeoHead kịp cập nhật thẻ document.title chính xác của route mới
    const timer = window.setTimeout(() => {
      const fullPath = `${location.pathname}${location.search}`
      trackPageView(fullPath, document.title)
    }, 120)

    return () => {
      window.clearTimeout(timer)
    }
  }, [location.pathname, location.search])

  return null
}

export default GoogleAnalytics
