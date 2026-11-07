import { useEffect } from 'react'

export interface SeoHeadProps {
  /** Tiêu đề trang (sẽ tự động thêm hậu tố " | AlumNect" nếu chưa có) */
  title?: string
  /** Thẻ mô tả ngắn gọn cho công cụ tìm kiếm (tối đa 160 ký tự) */
  description?: string
  /** Từ khóa liên quan cách nhau bằng dấu phẩy */
  keywords?: string
  /** Ảnh đại diện khi chia sẻ lên mạng xã hội (Facebook, Zalo, Twitter...) */
  image?: string
  /** Đường dẫn chính tắc (Canonical URL) */
  url?: string
  /** Loại trang Open Graph: website | article | profile */
  type?: 'website' | 'article' | 'profile'
  /** Dữ liệu có cấu trúc Schema.org (JSON-LD) để Google hiển thị Rich Snippets */
  schema?: object | object[]
  /** Đặt true nếu muốn chặn Google lập chỉ mục trang này (ví dụ trang lỗi, trang cá nhân riêng tư) */
  noIndex?: boolean
}

const DEFAULT_TITLE = 'AlumNect — Mạng lưới Cựu sinh viên Đại học FPT'
const DEFAULT_DESCRIPTION =
  'Cổng kết nối toàn diện cho cộng đồng Đại học FPT: Việc làm, cố vấn, tra cứu & khảo sát mức lương các ngành nghề, diễn đàn hỏi đáp và sự kiện.'
const DEFAULT_KEYWORDS =
  'AlumNect, cựu sinh viên FPT, FPT University Alumni, việc làm FPT, tuyển dụng FPT, cố vấn, mentor FPT, tra cứu mức lương, khảo sát lương cựu sinh viên, diễn đàn sinh viên FPT, sự kiện'
const DEFAULT_IMAGE = '/logo.png'

/**
 * Component quản lý metadata và SEO cho từng trang.
 * Hoàn toàn an toàn, tự động đồng bộ thẻ <head> và dọn dẹp khi chuyển trang.
 */
export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  schema,
  noIndex = false,
}: SeoHeadProps) {
  useEffect(() => {
    // 1. Cập nhật Title
    const formattedTitle = title
      ? title.includes('AlumNect')
        ? title
        : `${title} | AlumNect`
      : DEFAULT_TITLE
    document.title = formattedTitle

    // 2. Helper cập nhật thẻ meta an toàn
    const setMeta = (attr: 'name' | 'property', key: string, content?: string | null) => {
      if (!content) return
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.content = content
    }

    // Standard Meta
    setMeta('name', 'description', description)
    if (keywords) setMeta('name', 'keywords', keywords)
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    // Open Graph
    const pageUrl = url || window.location.href
    const absoluteImage = image.startsWith('http')
      ? image
      : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`

    setMeta('property', 'og:title', formattedTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', absoluteImage)
    setMeta('property', 'og:url', pageUrl)
    setMeta('property', 'og:type', type)

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', formattedTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', absoluteImage)

    // Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageUrl

    // 3. Schema.org JSON-LD
    let scriptTag = document.getElementById('alumnect-dynamic-schema') as HTMLScriptElement | null
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.id = 'alumnect-dynamic-schema'
        scriptTag.type = 'application/ld+json'
        document.head.appendChild(scriptTag)
      }
      scriptTag.text = JSON.stringify(schema)
    } else if (scriptTag) {
      scriptTag.remove()
    }

    // Dọn dẹp khi unmount trang
    return () => {
      const existingScript = document.getElementById('alumnect-dynamic-schema')
      if (existingScript) existingScript.remove()
    }
  }, [title, description, keywords, image, url, type, schema, noIndex])

  return null
}
