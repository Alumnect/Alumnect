import type { ReactNode } from 'react'
import { BrandBanner } from '@/components/brand/BrandBlocks'
import type { BannerSceneKey } from '@/components/brand/BannerScenes'

interface MentorPageHeaderProps {
  title: ReactNode
  /** Một câu thông tin thật về dữ liệu/quy tắc của trang; không dùng cho khẩu hiệu */
  description?: ReactNode
  actions?: ReactNode
  className?: string
  /** Cảnh minh hoạ riêng của trang (mặc định: campus FPT) */
  scene?: BannerSceneKey
}

/**
 * Tiêu đề dùng chung cho không gian Mentoring: dải kem cam thương hiệu có minh hoạ theo nội dung trang,
 * câu mô tả ngắn (nếu có) và vùng hành động bên dưới tiêu đề.
 */
export function MentorPageHeader({ title, description, actions, className, scene = 'campus' }: MentorPageHeaderProps) {
  return <BrandBanner className={className} title={title} description={description} actions={actions} scene={scene} />
}