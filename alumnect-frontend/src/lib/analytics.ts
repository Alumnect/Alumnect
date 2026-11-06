/**
 * Google Analytics 4 (GA4) Integration for AlumNect SPA
 * Hỗ trợ theo dõi lượt xem trang (Virtual Page Views) tự động theo React Router,
 * sự kiện tương tác người dùng (Event Tracking), và danh tính người dùng (User ID).
 */

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim()

let isInitialized = false

/**
 * Kiểm tra GA4 đã được cấu hình hợp lệ chưa (mã đo lường bắt đầu bằng G-)
 */
export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)
}

/**
 * Lấy Google Analytics Measurement ID hiện tại
 */
export function getGaMeasurementId(): string {
  return GA_MEASUREMENT_ID
}

/**
 * Khởi tạo Google Analytics 4:
 * Tải mã gtag.js bất đồng bộ vào <head> và thiết lập hàm gtag toàn cục.
 */
export function initGA(): void {
  if (typeof window === 'undefined') return
  if (isInitialized) return

  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.info(
        '[GA4] VITE_GA_MEASUREMENT_ID chưa được cấu hình hoặc không hợp lệ (cần định dạng G-XXXXXXXXXX). GA4 sẽ không kích hoạt.',
      )
    }
    return
  }

  // Khởi tạo dataLayer & gtag
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }

  // Tránh gắn trùng lặp script gtag
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)
  if (!existingScript) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  // Tắt send_page_view mặc định để Router SPA tự quản lý ảo hoá lượt xem không bị trùng lặp
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  })

  isInitialized = true

  if (import.meta.env.DEV) {
    console.info(`[GA4] Khởi tạo thành công với Measurement ID: ${GA_MEASUREMENT_ID}`)
  }
}

/**
 * Ghi nhận lượt xem trang ảo (Virtual Page View) khi chuyển route trong SPA
 */
export function trackPageView(path?: string, title?: string): void {
  if (typeof window === 'undefined') return

  const pagePath = path || `${window.location.pathname}${window.location.search}`
  const pageTitle = title || document.title
  const pageLocation = window.location.href

  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.debug('[GA4 page_view (mock)]', { pagePath, pageTitle, pageLocation })
    }
    return
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: pageLocation,
    })
  }
}

/**
 * Ghi nhận sự kiện tương tác tùy biến (Custom Event)
 * Ví dụ: trackEvent('click_apply_job', { job_id: '123', job_title: 'Software Engineer' })
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return

  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.debug(`[GA4 event (mock)]: ${eventName}`, params)
    }
    return
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

/**
 * Gắn User ID của người dùng đã đăng nhập để theo dõi hành vi xuyên thiết bị trong GA4
 */
export function setAnalyticsUser(userId: string | number | null, userProperties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !isAnalyticsEnabled() || typeof window.gtag !== 'function') return

  if (userId) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: String(userId),
    })
  }

  if (userProperties) {
    window.gtag('set', 'user_properties', userProperties)
  }
}

