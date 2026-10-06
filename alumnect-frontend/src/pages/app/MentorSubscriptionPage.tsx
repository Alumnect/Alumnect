import { useSearchParams } from 'react-router-dom'
import { Container } from '@/components/ui'
import { MentoringTermsGate, MentorSubscriptionList, MentorPaymentCheckout } from '@/features/mentorship'

/**
 * Màn hình Quản lý Gói Mentor & Thanh toán (UC92 & UC93).
 * Được bảo vệ bởi MentoringTermsGate.
 * Hỗ trợ chuyển đổi mượt mà giữa danh sách gói (UC92) và màn hình thanh toán VietQR PayOS (UC93).
 */
export function MentorSubscriptionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step')
  const isCheckout = step === 'checkout'

  return (
    <Container className="py-8">
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
