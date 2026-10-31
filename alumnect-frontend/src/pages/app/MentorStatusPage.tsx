import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui'
import { Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { MentorStatusDashboard } from '@/features/mentorship'
import { Activity } from 'lucide-react'

/**
 * Trang Xem trạng thái Mentor & Subscription (UC94).
 * Cho phép cựu sinh viên (Alumni) và Mentor theo dõi tiến trình hồ sơ, điều khoản và hạn sử dụng gói.
 */
export function MentorStatusPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  if (!isAlumni) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-border bg-surface">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-text">
            {t('mentoring.alumniOnlyFeature')}
          </h2>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            {t('mentoring.alumniOnlyDesc')}
          </p>
        </Card>
      </Container>
    )
  }
  return (
    <Container className="py-2 sm:py-4">
      <MentorStatusDashboard />
    </Container>
  )
}
