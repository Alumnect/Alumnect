import { MentoringTermsGate, useMentoringTermsStatus } from '@/features/mentorship'
import { Container, Card, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMentorStatus } from '@/features/mentorship/hooks/useMentorStatus'
import {
  Compass,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Activity,
  Clock,
} from 'lucide-react'

function MentoringHomeContent() {
  const user = useAuthStore((s) => s.user)
  const isAlumni = user?.role === 'ALUMNI'
  const { data: status } = useMentorStatus(isAlumni)
  const mentorStatus = status?.mentorStatus
  const isMentorActive = mentorStatus === 'ACTIVE'
  const isPaymentPending = mentorStatus === 'PAYMENT_PENDING'
  const isExpired = mentorStatus === 'EXPIRED'

  return (
    <div className="space-y-6 py-4">
      {/* Hero Banner: Tối giản, gọn gàng, không có khối phụ rườm rà */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/40 p-6 sm:p-8 border border-brand-500/20 shadow-xs dark:bg-[#242526] dark:border-[#393a3b] dark:from-brand-950/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Mạng Lưới Mentor FPT
            </Badge>
            {isMentorActive ? (
              <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Mentor đang hoạt động
              </Badge>
            ) : isExpired ? (
              <Badge tone="danger" icon={<Clock className="h-3.5 w-3.5" />}>
                Gói Mentor đã hết hạn
              </Badge>
            ) : isPaymentPending ? (
              <Badge tone="gold" icon={<Activity className="h-3.5 w-3.5" />}>
                Hồ sơ chờ thanh toán
              </Badge>
            ) : null}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-plum-900 dark:text-[#e4e6eb]">
            Hỗ Trợ & Đồng Hành Cùng Mentor
          </h1>

          <p className="text-sm leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
            {isExpired
              ? 'Gói dịch vụ Mentor của bạn đã hết hạn. Hãy gia hạn để tiếp tục nhận yêu cầu kết nối mới từ các thành viên trong mạng lưới.'
              : 'Không gian kết nối và sẻ chia — nơi mọi người luôn sẵn sàng hỗ trợ, giúp đỡ và đồng hành cùng nhau trên mọi chặng đường phát triển.'}
          </p>

          {/* Các nút bấm tinh gọn, kích thước vừa vặn trên 1 hàng */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {isAlumni ? (
              isMentorActive ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/status"
                    variant="primary"
                    size="sm"
                    leftIcon={<Activity className="h-3.5 w-3.5" />}
                    className="shadow-xs"
                  >
                    Trạng thái & Gói Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/become-mentor"
                    variant="outline"
                    size="sm"
                    leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                  >
                    Hồ sơ Mentor
                  </ButtonLink>
                </>
              ) : isExpired ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/packages"
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="shadow-xs"
                  >
                    Gia hạn gói Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/status"
                    variant="outline"
                    size="sm"
                    leftIcon={<Activity className="h-3.5 w-3.5" />}
                  >
                    Trạng thái Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/become-mentor"
                    variant="outline"
                    size="sm"
                    leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                  >
                    Hồ sơ Mentor
                  </ButtonLink>
                </>
              ) : isPaymentPending ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/subscription?step=checkout"
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="shadow-xs"
                  >
                    Kích hoạt gói Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/status"
                    variant="outline"
                    size="sm"
                    leftIcon={<Activity className="h-3.5 w-3.5" />}
                  >
                    Xem trạng thái
                  </ButtonLink>
                </>
              ) : status?.hasMentorProfile ? (
                <>
                  <ButtonLink
                    to="/app/mentoring/become-mentor"
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="shadow-xs"
                  >
                    Hoàn thiện hồ sơ Mentor
                  </ButtonLink>
                  <ButtonLink
                    to="/app/mentoring/status"
                    variant="outline"
                    size="sm"
                    leftIcon={<Activity className="h-3.5 w-3.5" />}
                  >
                    Kiểm tra điều kiện
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink
                  to="/app/mentoring/become-mentor"
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="shadow-xs"
                >
                  Đăng ký trở thành Mentor
                </ButtonLink>
              )
            ) : null}

            <ButtonLink
              to="/app/mentoring/terms"
              variant="ghost"
              size="sm"
              leftIcon={<ShieldCheck className="h-3.5 w-3.5 text-plum-500" />}
              className="text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-[#e4e6eb]"
            >
              Điều khoản
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Lợi ích và các tính năng cốt lõi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            Thỏa Thuận Hợp Tác Rõ Ràng
          </h3>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Thiết lập phạm vi công việc, mục tiêu hướng dẫn và ngân sách minh bạch trước khi bắt đầu lộ trình hỗ trợ.
          </p>
        </Card>

        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600 dark:bg-gold-950/60 dark:text-gold-300">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            Nhật Ký Hướng Dẫn & Tiến Độ
          </h3>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Mentor ghi nhận chi tiết từng buổi trao đổi và tiến độ nhiệm vụ; người học dễ dàng theo dõi và xác nhận.
          </p>
        </Card>

        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-950/60 dark:text-mint-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            Bảo Vệ Quyền Lợi & Quyết Toán
          </h3>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Hệ thống quản lý nguồn quỹ an toàn, thanh toán minh bạch và hỗ trợ hòa giải kịp thời từ Ban Quản trị.
          </p>
        </Card>
      </div>

      {/* Danh sách người hướng dẫn nổi bật */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
            Mentor Tiêu Biểu Mạng Lưới FPT
          </h2>
          <span className="text-xs text-plum-500">Cập nhật theo mạng lưới cựu sinh viên</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Nguyễn Hoàng Long',
              role: 'Kiến trúc sư phần mềm cấp cao @ TechCom',
              major: 'Kỹ thuật phần mềm (SE)',
              cohort: 'K14',
              topics: ['Kiến trúc hệ thống', 'Microservices', 'Spring Boot'],
            },
            {
              name: 'Phạm Thu Trang',
              role: 'Trưởng nhóm sản phẩm @ VNG Corporation',
              major: 'Quản trị kinh doanh (BA)',
              cohort: 'K13',
              topics: ['Quản lý sản phẩm', 'Agile/Scrum', 'Phát triển sự nghiệp'],
            },
            {
              name: 'Lê Tuấn Hưng',
              role: 'Chuyên gia nghiên cứu AI @ FPT AI Center',
              major: 'Trí tuệ nhân tạo (AI)',
              cohort: 'K15',
              topics: ['Deep Learning', 'Computer Vision', 'Nghiên cứu khoa học'],
            },
          ].map((m, idx) => (
            <Card key={idx} hover className="p-4 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-heading text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">{m.name}</h4>
                  <p className="text-[11px] text-plum-500 dark:text-[#8a8d91]">{m.role}</p>
                </div>
                <Badge tone="brand" className="text-[10px]">
                  {m.cohort}
                </Badge>
              </div>
              <p className="text-xs text-plum-600 dark:text-[#b0b3b8]">Chuyên ngành: {m.major}</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {m.topics.map((t, tidx) => (
                  <span
                    key={tidx}
                    className="inline-block rounded-md bg-plum-900/[0.04] px-2 py-0.5 text-[10px] font-medium text-plum-600 dark:bg-white/[0.05] dark:text-[#b0b3b8]"
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
  const { data: termsStatus } = useMentoringTermsStatus()

  // Khi chưa chấp nhận điều khoản: Hiển thị MentoringTermsGate trực tiếp để vừa vặn trọn vẹn màn hình không bị thanh cuộn ngoài
  if (termsStatus && !termsStatus.accepted) {
    return (
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringHomeContent />
      </MentoringTermsGate>
    )
  }

  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringHomeContent />
      </MentoringTermsGate>
    </Container>
  )
}
