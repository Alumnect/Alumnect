import { useSearchParams } from 'react-router-dom'
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
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step')
  const isCheckout = step === 'checkout'

  if (!isAlumni) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-gold-600 dark:bg-amber-950/50 dark:text-gold-300">
            <Award className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Tính năng dành cho cựu sinh viên
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Bạn cần là cựu sinh viên đã xác thực để đăng ký gói và duy trì hồ sơ Mentor.
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
