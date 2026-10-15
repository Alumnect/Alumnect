import { useSearchParams } from 'react-router-dom'
import { BackLink } from '@/components/ui'
import { MentoringTerms } from '@/features/mentorship'
import type { MentoringEntrySource } from '@/features/mentorship'

/**
 * Trang xem & chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90).
 * Cho phép xem trực tiếp điều khoản hoặc nhận redirect từ các flow nghiệp vụ.
 */
export function MentoringTermsPage() {
  const [searchParams] = useSearchParams()
  const sourceParam = searchParams.get('source') as MentoringEntrySource | null
  const source: MentoringEntrySource = sourceParam === 'BECOME_MENTOR' ? 'BECOME_MENTOR' : 'MENTORING_HOME'

  return (
    <div className="w-full">
      <BackLink to="/app/mentoring" className="mb-3">Tổng quan Mentoring</BackLink>
      <MentoringTerms source={source} />
    </div>
  )
}
