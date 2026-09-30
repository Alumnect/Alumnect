import { MentoringTermsGate, MentorRegistrationForm } from '@/features/mentorship'
import { Container, Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { Award } from 'lucide-react'

function BecomeMentorContent() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  if (!isAlumni) {
    return (
      <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 dark:bg-gold-950/50 dark:text-gold-300">
          <Award className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
          Dành riêng cho Cựu sinh viên (ALUMNI)
        </h2>
        <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
          Chương trình đăng ký trở thành Mentor hiện tại chỉ áp dụng cho tài khoản Cựu sinh viên đã được hệ thống xác thực. Bạn có thể tham gia với vai trò Student để tìm kiếm người hướng dẫn phù hợp.
        </p>
      </Card>
    )
  }

  return <MentorRegistrationForm />
}

/**
 * Trang Đăng ký trở thành Mentor (UC91).
 * Được bảo vệ bởi MentoringTermsGate (source = BECOME_MENTOR).
 * Nếu Alumni chưa chấp nhận điều khoản, hệ thống sẽ tự động hiển thị UC90 Terms Gate trước.
 */
export function BecomeMentorPage() {
  return (
    <Container className="py-8">
      <MentoringTermsGate source="BECOME_MENTOR">
        <BecomeMentorContent />
      </MentoringTermsGate>
    </Container>
  )
}
