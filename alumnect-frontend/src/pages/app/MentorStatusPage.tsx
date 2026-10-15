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
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  if (!isAlumni) {
    return (
      <Container className="py-12">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-gold-600 dark:bg-amber-950/50 dark:text-gold-300">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Tính năng dành cho cựu sinh viên
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Bạn cần là cựu sinh viên đã xác thực để đăng ký và quản lý hồ sơ Mentor.
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
