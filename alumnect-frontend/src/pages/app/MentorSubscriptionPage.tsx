import { useSearchParams } from 'react-router-dom'
import { CreditCard, QrCode } from 'lucide-react'
import { Container, PageHeader } from '@/components/ui'
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
          <>
            <PageHeader
              icon={<QrCode className="h-5 w-5 text-brand-600" />}
              title="Thanh Toán Gói Mentor Qua PayOS"
              subtitle="Quét mã VietQR chuyển khoản an toàn. Gói dịch vụ của bạn sẽ được kích hoạt tự động ngay sau khi ngân hàng nhận tiền."
            />
            <div className="mt-6">
              <MentorPaymentCheckout onBack={() => setSearchParams({})} />
            </div>
          </>
        ) : (
          <>
            <PageHeader
              icon={<CreditCard className="h-5 w-5 text-brand-600" />}
              title="Chọn Gói Dịch Vụ Mentor"
              subtitle="Hãy lựa chọn thời hạn và gói dịch vụ duy trì mạng lưới cố vấn Alumni để kích hoạt tài khoản Mentor của bạn."
            />
            <div className="mt-8">
              <MentorSubscriptionList />
            </div>
          </>
        )}
      </MentoringTermsGate>
    </Container>
  )
}
