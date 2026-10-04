import { Container, PageHeader } from '@/components/ui'
import { MentorStatusDashboard } from '@/features/mentorship'
import { Activity } from 'lucide-react'

/**
 * Trang Xem trạng thái Mentor & Subscription (UC94).
 * Cho phép cựu sinh viên (Alumni) và Mentor theo dõi tiến trình hồ sơ, điều khoản và hạn sử dụng gói.
 */
export function MentorStatusPage() {
  return (
    <Container className="py-8">
      <PageHeader
        icon={<Activity className="h-5 w-5 text-brand-600" />}
        title="Tình Trạng Hồ Sơ & Gói Dịch Vụ Cố Vấn"
        subtitle="Theo dõi tiến độ hoàn thiện hồ sơ, điều kiện kích hoạt và hạn mức duy trì mạng lưới Mentorship của bạn."
      />
      <div className="mt-6">
        <MentorStatusDashboard />
      </div>
    </Container>
  )
}
