import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import { Container } from '@/components/ui'
import { Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { MentoringTermsGate, MentorSubscriptionList, MentorPaymentCheckout } from '@/features/mentorship'

/**
 * Màn hình Quản lý Gói Mentor & Thanh toán (UC92 & UC93).
 * Được bảo vệ bởi MentoringTermsGate.
 * Hỗ trợ chuyển đổi mượt mà giữa danh sách gói (UC92) và màn hình thanh toán VietQR PayOS (UC93).
 */
export function MentorSubscriptionPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step')
  const isCheckout = step === 'checkout'

  if (!isAlumni) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-border bg-surface">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <Award className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-text">
            {t('mentoring.alumniOnlyTitle')}
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
      <MentoringTermsGate source="BECOME_MENTOR">
        {isCheckout ? (
          <MentorPaymentCheckout onBack={() => setSearchParams({})} />
        ) : (
          <MentorSubscriptionList />
        )}
      </MentoringTermsGate>
    </Container>
  )
}
