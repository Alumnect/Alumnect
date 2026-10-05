import { useSearchParams } from 'react-router-dom'
import { CreditCard, QrCode, Award } from 'lucide-react'
import { Container, PageHeader } from '@/components/ui'
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 dark:bg-gold-950/50 dark:text-gold-300">
            <Award className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Dành riêng cho Cựu sinh viên (ALUMNI)
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Các gói dịch vụ Mentor (duy trì tư cách và kích hoạt hồ sơ Cố vấn) chỉ áp dụng cho tài khoản Cựu sinh viên (Alumni). Sinh viên tham gia mạng lưới để tìm kiếm Mentor và tạo các Thỏa thuận hỗ trợ (Deal).
          </p>
        </Card>
      </Container>
    )
  }

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
