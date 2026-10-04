import { MentoringTermsGate } from '@/features/mentorship'
import { Container, Card, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMentorRegistration } from '@/features/mentorship/hooks/useMentorRegistration'
import {
  Compass,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
  CreditCard,
  UserCheck,
  Activity,
} from 'lucide-react'

function MentoringHomeContent() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: registration } = useMentorRegistration(isAlumni)
  const isMentorActive = registration?.mentorStatus === 'ACTIVE'
  const isPaymentPending = registration?.mentorStatus === 'PAYMENT_PENDING'

  return (
    <div className="space-y-8 py-6">
      {/* Hero Banner giới thiệu module */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-6 sm:p-10 border border-brand-500/15">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Mạng lưới Hướng dẫn & Hỗ trợ FPTU
            </Badge>
            {isMentorActive && (
              <Badge tone="success" icon={<CheckCircle className="h-3.5 w-3.5" />}>
                Bạn đang là Mentor chính thức (Active)
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-plum-900 dark:text-[#e4e6eb]">
            Kết nối Cố vấn & Hướng nghiệp 1:1
          </h1>
          <p className="text-sm sm:text-base text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Nơi kết nối các thế hệ sinh viên và cựu sinh viên Đại học FPT thông qua chương trình hướng dẫn thực tế, đồng hành đồ án, định hướng nghề nghiệp và phát triển chuyên môn.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isAlumni && (
              isMentorActive ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/subscription"
                    variant="primary"
                    size="md"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    Quản lý gói Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/become-mentor"
                    variant="outline"
                    size="md"
                    leftIcon={<UserCheck className="h-4 w-4" />}
                  >
                    Hồ sơ Mentor của tôi
                  </ButtonLink>
                </>
              ) : isPaymentPending ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/subscription"
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Kích hoạt gói Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/become-mentor"
                    variant="outline"
                    size="md"
                  >
                    Chỉnh sửa hồ sơ
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink
                  to="/app/mentoring/become-mentor"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Đăng ký trở thành Mentor
                </ButtonLink>
              )
            )}
            {isAlumni && (
              <ButtonLink
                to="/app/mentoring/status"
                variant="outline"
                size="md"
                leftIcon={<Activity className="h-4 w-4 text-brand-600" />}
              >
                Trạng thái Mentor
              </ButtonLink>
            )}
            <ButtonLink
              to="/app/mentoring/terms"
              variant="outline"
              size="md"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Xem Điều khoản Mentorship
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Lợi ích và các tính năng cốt lõi của Mentorship */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Thỏa thuận Minh bạch (Deal)
          </h3>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Thiết lập phạm vi công việc, mục tiêu học tập và ngân sách rõ ràng trước khi bắt đầu lộ trình hỗ trợ.
          </p>
        </Card>

        <Card hover className="p-6 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 dark:bg-gold-950/60 dark:text-gold-300">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Nhật ký Thực hiện (Work Log)
          </h3>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Mentor ghi nhận chi tiết từng buổi hướng dẫn và tiến độ task; Student dễ dàng theo dõi và xác nhận.
          </p>
        </Card>

        <Card hover className="p-6 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b]">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-600 dark:bg-mint-950/60 dark:text-mint-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Bảo vệ Quyền lợi 100%
          </h3>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Cơ chế hòa giải và quyết toán tranh chấp công bằng với sự tham gia trực tiếp từ Ban Quản trị hệ thống.
          </p>
        </Card>
      </div>

      {/* Danh sách người hướng dẫn nổi bật (Giả lập giao diện kết nối) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Mentor Tiêu Biểu FPT University
          </h2>
          <span className="text-xs text-plum-500">Cập nhật theo mạng lưới cựu sinh viên</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              name: 'Nguyễn Hoàng Long',
              role: 'Senior Software Architect @ TechCom',
              major: 'Kỹ thuật phần mềm (SE)',
              cohort: 'K14',
              topics: ['System Design', 'Microservices', 'Spring Boot'],
            },
            {
              name: 'Phạm Thu Trang',
              role: 'Product Lead @ VNG Corporation',
              major: 'Quản trị kinh doanh (BA)',
              cohort: 'K13',
              topics: ['Product Management', 'Agile/Scrum', 'Phát triển sự nghiệp'],
            },
            {
              name: 'Lê Tuấn Hưng',
              role: 'AI Researcher @ FPT AI Center',
              major: 'Trí tuệ nhân tạo (AI)',
              cohort: 'K15',
              topics: ['Deep Learning', 'Computer Vision', 'Nghiên cứu khoa học'],
            },
          ].map((m, idx) => (
            <Card key={idx} hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">{m.name}</h4>
                  <p className="text-xs text-plum-500 dark:text-[#8a8d91]">{m.role}</p>
                </div>
                <Badge tone="brand" className="text-[10px]">
                  {m.cohort}
                </Badge>
              </div>
              <p className="text-xs text-plum-600 dark:text-[#b0b3b8]">Chuyên ngành: {m.major}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {m.topics.map((t, tidx) => (
                  <span
                    key={tidx}
                    className="inline-block rounded-md bg-plum-900/[0.04] px-2 py-0.5 text-[11px] font-medium text-plum-600 dark:bg-white/[0.05] dark:text-[#b0b3b8]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Trang chủ module Hướng dẫn & Hỗ trợ (Mentorship).
 * Được bảo vệ bởi MentoringTermsGate (source = MENTORING_HOME).
 * Người dùng chỉ có thể vào trang này khi đã chấp nhận phiên bản điều khoản hiện tại.
 */
export function MentoringHomePage() {
  return (
    <Container className="py-6">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringHomeContent />
      </MentoringTermsGate>
    </Container>
  )
}
