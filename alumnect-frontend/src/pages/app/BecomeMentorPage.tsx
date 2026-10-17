import { MentoringTermsGate, MentorRegistrationForm } from '@/features/mentorship'
import { Container, Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { Award } from 'lucide-react'

function BecomeMentorContent() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'

  if (!isAlumni) {
    return (
      <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-border bg-surface">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <Award className="h-7 w-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-text">
          Tính năng dành cho cựu sinh viên
        </h2>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          Bạn cần là cựu sinh viên đã xác thực để đăng ký trở thành Mentor.
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
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="BECOME_MENTOR">
        <BecomeMentorContent />
      </MentoringTermsGate>
    </Container>
  )
}
