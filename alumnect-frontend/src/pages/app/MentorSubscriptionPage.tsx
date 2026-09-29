import { CreditCard } from 'lucide-react'
import { Container, PageHeader } from '@/components/ui'
import { MentoringTermsGate, MentorSubscriptionList } from '@/features/mentorship'

/**
 * Màn hình Xem & Chọn gói Mentor (UC92).
 * Được bảo vệ bởi MentoringTermsGate. Nếu Alumni chưa chấp nhận điều khoản UC90,
 * hệ thống sẽ hiển thị màn hình chấp nhận điều khoản trước.
 */
export function MentorSubscriptionPage() {
  return (
    <Container className="py-8">
      <MentoringTermsGate source="BECOME_MENTOR">
        <PageHeader
          icon={<CreditCard className="h-5 w-5 text-brand-600" />}
          title="Chọn Gói Dịch Vụ Mentor"
          subtitle="Hãy lựa chọn thời hạn và gói dịch vụ duy trì mạng lưới cố vấn Alumni để kích hoạt tài khoản Mentor của bạn."
        />

        <div className="mt-8">
          <MentorSubscriptionList />
        </div>
      </MentoringTermsGate>
    </Container>
  )
}
