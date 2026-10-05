import { Container, PageHeader } from '@/components/ui'
import { Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { MentorStatusDashboard } from '@/features/mentorship'
import { Activity } from 'lucide-react'

/**
 * Trang Xem trạng thái Mentor & Subscription (UC94).
 * Cho phép cựu sinh viên (Alumni) và Mentor theo dõi tiến trình hồ sơ, điều khoản và hạn sử dụng gói.
 */
export function MentorStatusPage() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  if (!isAlumni) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 dark:bg-gold-950/50 dark:text-gold-300">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Dành riêng cho Cựu sinh viên (ALUMNI)
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Bảng theo dõi trạng thái Mentor và thời hạn gói dịch vụ chỉ áp dụng cho tài khoản Cựu sinh viên đã đăng ký trở thành Cố vấn.
          </p>
        </Card>
      </Container>
    )
  }
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
