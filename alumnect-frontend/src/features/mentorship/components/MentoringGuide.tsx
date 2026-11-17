import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  GraduationCap,
  Briefcase,
  CreditCard,
  MessageSquare,
  Scale,
  DollarSign,
  UserCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

type RoleType = 'student' | 'mentor'

interface GuideStep {
  step: number
  title: string
  subtitle: string
  description: string
  icon: typeof Search
  actionLabel?: string
  actionLink?: string
  mockup: {
    badge: string
    title: string
    items: string[]
    highlight?: string
  }
  notes?: {
    type: 'tip' | 'warning'
    text: string
  }[]
}

const STUDENT_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Khám phá & Gửi yêu cầu Mentoring',
    subtitle: 'Tìm kiếm người hướng dẫn phù hợp với nhu cầu',
    description:
      'Duyệt danh sách Cố vấn theo chuyên ngành, kỹ năng hoặc tham khảo Bảng xếp hạng. Khi tạo yêu cầu, hãy nêu cụ thể bài toán bạn đang gặp phải, mong muốn đầu ra và ngân sách dự kiến.',
    icon: Search,
    actionLabel: 'Tìm kiếm Mentor ngay',
    actionLink: '/app/mentoring/discover',
    mockup: {
      badge: 'Yêu cầu Mentoring #101',
      title: 'Hỗ trợ đồ án tốt nghiệp: Tối ưu Backend Spring Boot',
      items: [
        'Kỹ năng cần: Spring Boot, PostgreSQL, Docker',
        'Thời hạn mong muốn: 2 tuần (3 buổi hướng dẫn)',
        'Ngân sách đề xuất: 500.000 đ',
      ],
      highlight: 'Trạng thái: Đã gửi đến Mentor · Chờ phản hồi',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Điền mô tả càng chi tiết và đính kèm đề cương thì Mentor càng dễ phản hồi nhanh và chính xác.',
      },
    ],
  },
  {
    step: 2,
    title: 'Thống nhất Thỏa thuận (Deal Ticket)',
    subtitle: 'Minh bạch phạm vi công việc, giá và deadline',
    description:
      'Sau khi trao đổi qua kênh Chat, Mentor sẽ khởi tạo Thỏa thuận (Deal Ticket). Bạn cần đọc kỹ các điều khoản về phạm vi nhiệm vụ, số tiền và hạn chót trước khi bấm Xác nhận.',
    icon: FileText,
    actionLabel: 'Xem các Thỏa thuận của bạn',
    actionLink: '/app/mentoring/deals',
    mockup: {
      badge: 'Deal Ticket #42 · Bản thảo số 1',
      title: 'Thỏa thuận hướng dẫn Task #42',
      items: [
        'Số tiền thống nhất: 500.000 đ',
        'Thời hạn hoàn thành: 25/11/2026',
        'Phạm vi: 3 buổi hướng dẫn online 1-1 + Review PR',
      ],
      highlight: 'Cần cả Học viên và Mentor cùng bấm [Xác nhận thỏa thuận]',
    },
    notes: [
      {
        type: 'warning',
        text: 'Lưu ý: Không trao đổi hoặc chuyển tiền ngoài hệ thống để luôn được AlumNect bảo hộ quyền lợi.',
      },
    ],
  },
  {
    step: 3,
    title: 'Thanh toán giữ tiền an toàn (Quỹ ký quỹ Escrow)',
    subtitle: 'Tiền được bảo vệ 100%, chưa chuyển cho Mentor ngay',
    description:
      'Sau khi hai bên đồng thuận Deal, bạn tiến hành quét mã QR PayOS để nộp học phí. Số tiền này sẽ được giữ an toàn trong Quỹ ký quỹ (Escrow) của AlumNect và chỉ giải ngân khi bạn bấm nghiệm thu hoàn thành.',
    icon: ShieldCheck,
    mockup: {
      badge: 'Quỹ Task #42 · PayOS QR',
      title: 'Tạm giữ Quỹ Escrow an toàn',
      items: [
        'Số tiền tạm giữ: 500.000 đ',
        'Cổng thanh toán: PayOS (VietQR liên ngân hàng)',
        'Bảo chứng: Tiền nằm an toàn ở quỹ hệ thống',
      ],
      highlight: 'An tâm 100%: Mentor chưa nhận được tiền cho đến khi nghiệm thu',
    },
    notes: [
      {
        type: 'tip',
        text: 'Chính sách hủy: Nếu bạn báo hủy trước 24 giờ kể từ khi Task bắt đầu, bạn sẽ được hoàn tiền 100%.',
      },
    ],
  },
  {
    step: 4,
    title: 'Theo dõi tiến độ & Xác nhận Work Log',
    subtitle: 'Nghiệm thu từng buổi làm việc trong vòng 72 giờ',
    description:
      'Sau mỗi phiên hướng dẫn, Mentor có nghĩa vụ tạo một bản ghi Nhật ký công việc (Work Log). Bạn có trách nhiệm kiểm tra nội dung và bấm xác nhận trong vòng 72 giờ.',
    icon: Clock,
    actionLabel: 'Theo dõi Công việc của tôi',
    actionLink: '/app/mentoring/tasks',
    mockup: {
      badge: 'Work Log #15 · Buổi 1',
      title: 'Phân tích cơ sở dữ liệu & Cấu hình Docker Compose',
      items: [
        'Thời gian log: 14:30 - 10/11/2026',
        'Đã hoàn thành: Chuẩn hóa 6 bảng quan hệ + Script flyway',
        'Minh chứng: 2 file đính kèm (ERD.png, docker-compose.yml)',
      ],
      highlight: 'Thời hạn phản hồi: 72 giờ (Quá 72h im lặng sẽ là căn cứ để Admin công nhận)',
    },
    notes: [
      {
        type: 'warning',
        text: 'Quy tắc 72h: Nếu quá 72 giờ mà bạn không phản hồi hay khiếu nại, đây sẽ là căn cứ pháp lý mặc định để Admin công nhận kết quả của Mentor.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nghiệm thu toàn bộ hoặc Mở khiếu nại nếu có sự cố',
    subtitle: 'Hoàn tất giải ngân và đánh giá chất lượng',
    description:
      'Khi Mentor nộp biên bản nghiệm thu cuối cùng (Task Completion), bạn kiểm tra toàn bộ sản phẩm và bấm Nghiệm thu. Hệ thống sẽ giải ngân tiền cho Mentor và bạn có thể đánh giá sao. Nếu có bất đồng, bạn có quyền mở Ticket tranh chấp để Admin hòa giải.',
    icon: CheckCircle2,
    mockup: {
      badge: 'Biên bản nghiệm thu Task #42',
      title: 'Bàn giao kết quả hướng dẫn hoàn tất',
      items: [
        'Tổng số buổi đã xác nhận: 3/3 buổi',
        'Sản phẩm bàn giao: Repo mã nguồn + Video hướng dẫn',
        'Nút hành động: [Nghiệm thu & Đánh giá] hoặc [Mở khiếu nại tranh chấp]',
      ],
      highlight: 'Thời hiệu khiếu nại: Tối đa 07 ngày kể từ khi Task hoàn thành',
    },
  },
]

const MENTOR_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Kích hoạt hồ sơ Cố vấn & Mua gói dịch vụ',
    subtitle: 'Hoàn thiện hồ sơ năng lực và tài khoản nhận thù lao',
    description:
      'Cập nhật đầy đủ thông tin CV, chuyên môn, kinh nghiệm thực chiến và số tài khoản ngân hàng thụ hưởng. Đăng ký gói duy trì Mentor và chấp thuận Điều khoản dịch vụ UC90 để bắt đầu nhận việc.',
    icon: Briefcase,
    actionLabel: 'Kiểm tra trạng thái hồ sơ',
    actionLink: '/app/mentoring/status',
    mockup: {
      badge: 'Hồ sơ Cố vấn (Mentor Profile)',
      title: 'Kích hoạt tài khoản nhận thù lao',
      items: [
        'CV & Bằng cấp: Đã xác thực cựu sinh viên FPT',
        'Tài khoản thụ hưởng: Vietcombank - 1012345678',
        'Gói dịch vụ: Gói Mentor Standard (Đang hoạt động)',
      ],
      highlight: 'Quy định: Mỗi Mentor nhận tối đa 5 Task hoạt động đồng thời',
    },
  },
  {
    step: 2,
    title: 'Tiếp nhận yêu cầu & Khởi tạo Deal Ticket',
    subtitle: 'Thương lượng rõ ràng trước khi nhận tiền',
    description:
      'Kiểm tra danh sách yêu cầu mới trong mục Yêu cầu gửi đến. Trao đổi với học viên trong kênh chat để làm rõ bài toán, sau đó khởi tạo Deal Ticket với số tiền, deadline và danh mục cam kết rõ ràng.',
    icon: MessageSquare,
    actionLabel: 'Xem Yêu cầu gửi đến',
    actionLink: '/app/mentoring/incoming-requests',
    mockup: {
      badge: 'Khởi tạo Deal Ticket',
      title: 'Đề xuất thỏa thuận hướng dẫn học viên',
      items: [
        'Học viên: Nguyễn Văn A (K16 FPTU)',
        'Mức thù lao thỏa thuận: 600.000 đ (Số nguyên VND)',
        'Hạn chót (Deadline): 30/11/2026',
      ],
      highlight: 'Deal Ticket sẽ kích hoạt ngay sau khi học viên thanh toán Escrow',
    },
  },
  {
    step: 3,
    title: 'Tiến hành hướng dẫn & Ghi nhận Work Log',
    subtitle: 'Căn cứ bảo vệ quyền lợi và thù lao của bạn',
    description:
      'Thực hiện các phiên hỗ trợ theo lịch đã hẹn. Sau mỗi buổi, ghi nhận Work Log với nội dung chi tiết, việc đã làm và đính kèm link/tài liệu minh chứng. Work Log là bằng chứng pháp lý cao nhất khi cần đối soát.',
    icon: Clock,
    actionLabel: 'Quản lý Công việc & Work Log',
    actionLink: '/app/mentoring/tasks',
    mockup: {
      badge: 'Nhật ký công việc mới',
      title: 'Ghi nhận Work Log phiên hướng dẫn',
      items: [
        'Ngày làm việc: 15/11/2026',
        'Nội dung: Hướng dẫn cấu hình Spring Security & JWT',
        'Kết quả: Học viên đã chạy test thành công trên máy',
      ],
      highlight: 'Chính sách Vắng mặt (No-show): Học viên trễ > 15 phút vẫn được tính Work Log',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Luôn đính kèm ảnh chụp màn hình hoặc tài liệu để được Admin hỗ trợ giải ngân ngay nếu học viên im lặng quá 72h.',
      },
    ],
  },
  {
    step: 4,
    title: 'Nộp biên bản hoàn thành (Task Completion)',
    subtitle: 'Tổng kết kết quả bàn giao cho học viên',
    description:
      'Khi đã hoàn thành đầy đủ phạm vi công việc trong Deal, bấm Nộp kết quả hoàn thành Task. Học viên sẽ nhận được thông báo nghiệm thu. Nếu cần thêm thời gian, hãy chủ động gửi Ticket gia hạn Deadline trước khi hết hạn.',
    icon: CheckCircle2,
    mockup: {
      badge: 'Nộp kết quả Task Completion',
      title: 'Tổng kết bàn giao nhiệm vụ',
      items: [
        'Tổng kết: Hoàn thành 100% mục tiêu đề ra ban đầu',
        'Bàn giao: Tài liệu hướng dẫn + Slide thuyết trình',
        'Trạng thái: Chờ học viên nghiệm thu (SUBMITTED)',
      ],
      highlight: 'Nếu học viên không phản hồi sau 72h, Admin sẽ vào đối soát và giải ngân',
    },
  },
  {
    step: 5,
    title: 'Nhận giải ngân thù lao về tài khoản ngân hàng',
    subtitle: 'Theo dõi dòng tiền minh bạch, tự động',
    description:
      'Ngay khi học viên bấm Nghiệm thu (hoặc Admin ra quyết định phân xử có lợi cho bạn), hệ thống sẽ kích hoạt lệnh chuyển tiền qua PayOS vào tài khoản ngân hàng của bạn. Bạn có thể tra cứu lịch sử trong mục Thu nhập.',
    icon: DollarSign,
    actionLabel: 'Xem Báo cáo Thu nhập',
    actionLink: '/app/mentoring/earnings',
    mockup: {
      badge: 'Giao dịch chi trả (PAYOUT)',
      title: 'Giải ngân thành công vào tài khoản',
      items: [
        'Khoản thực nhận: 600.000 đ',
        'Ngân hàng: Vietcombank (Đã chuyển khoản)',
        'Mã tham chiếu: PAYOUT-TASK-42',
      ],
      highlight: 'Minh bạch 100%: Lịch sử sổ quỹ được đối soát chính xác theo từng Task',
    },
  },
]

const FAQS = [
  {
    q: 'Tiền của Học viên có được an toàn khi Mentor chưa hoàn thành việc không?',
    a: 'Hoàn toàn an toàn. Toàn bộ tiền của Học viên được giữ trong Quỹ ký quỹ (Escrow) của AlumNect. Mentor chỉ nhận được thù lao khi Học viên bấm nghiệm thu hoặc khi có phán quyết giải quyết tranh chấp minh bạch từ Admin.',
  },
  {
    q: 'Nếu Mentor đã gửi Work Log đầy đủ mà Học viên im lặng không duyệt thì sao?',
    a: 'Theo Điều khoản dịch vụ UC90 (Mục 5), Học viên có trách nhiệm phản hồi trong vòng 72 giờ. Nếu quá 72 giờ Học viên không có phản hồi hay khiếu nại, đây sẽ là căn cứ pháp lý mặc định để Admin xác nhận kết quả và thực hiện giải ngân thù lao cho Mentor.',
  },
  {
    q: 'Quy định về việc vắng mặt hoặc vào trễ (No-show Policy) như thế nào?',
    a: 'Hai bên cần vào đúng giờ đã hẹn. Nếu một bên trễ quá 15 phút không báo trước mà không có lý do bất khả kháng, buổi hẹn sẽ tính là Vắng mặt (No-show). Nếu Học viên vắng mặt không báo trước, Mentor vẫn có quyền ghi nhận Work Log cho thời gian đã dành để chờ đợi.',
  },
  {
    q: 'Chính sách hoàn tiền khi hủy Deal như thế nào?',
    a: 'Nếu báo hủy trước 24 giờ kể từ khi Task bắt đầu, Học viên sẽ được hoàn tiền 100%. Nếu hủy sát giờ dưới 24 giờ mà không có lý do chính đáng, bên hủy có thể chịu khấu trừ phí bồi hoàn theo quy định của nền tảng.',
  },
  {
    q: 'Ai sở hữu sản phẩm và mã nguồn được tạo ra trong quá trình Mentoring?',
    a: 'Các sản phẩm, mã nguồn, tài liệu do Mentor tạo ra riêng cho Học viên trong phạm vi Deal sẽ thuộc quyền sở hữu của Học viên sau khi thanh toán đầy đủ. Các giáo trình, tài liệu mẫu có sẵn từ trước của Mentor vẫn thuộc quyền sở hữu của Mentor.',
  },
]

export function MentoringGuide() {
  const { t } = useTranslation()
  const [activeRole, setActiveRole] = useState<RoleType>('student')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const steps = activeRole === 'student' ? STUDENT_STEPS : MENTOR_STEPS

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Header Banner */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-surface via-surface to-surface-2 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-soft-border bg-primary-soft px-3 py-1 text-xs font-bold text-primary-solid">
            <BookOpen size={14} />
            <span>Cẩm nang sử dụng AlumNect Mentoring</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
            Hướng dẫn quy trình Mentoring chuẩn hóa
          </h1>
          <p className="text-sm leading-relaxed text-text-subtle">
            Quy trình 5 bước khép kín, minh bạch và an toàn tuyệt đối qua cổng ký quỹ PayOS Escrow. Giúp Học viên và
            Cố vấn nắm rõ cách thức trao đổi, nghiệm thu và bảo vệ quyền lợi.
          </p>
        </div>

        {/* Role Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mr-2">
            Xem hướng dẫn cho:
          </span>
          <button
            type="button"
            onClick={() => setActiveRole('student')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer',
              activeRole === 'student'
                ? 'bg-primary-solid text-white shadow-xs'
                : 'bg-surface-2 text-text-subtle hover:bg-surface-3 hover:text-text'
            )}
          >
            <GraduationCap size={16} />
            <span>Dành cho Học viên (Student)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('mentor')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer',
              activeRole === 'mentor'
                ? 'bg-primary-solid text-white shadow-xs'
                : 'bg-surface-2 text-text-subtle hover:bg-surface-3 hover:text-text'
            )}
          >
            <Briefcase size={16} />
            <span>Dành cho Cố vấn (Mentor)</span>
          </button>
        </div>
      </Card>

      {/* 5-Step Process Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-solid text-xs text-white">
              5
            </span>
            <span>Quy trình làm việc dành cho {activeRole === 'student' ? 'Học viên' : 'Cố vấn'}</span>
          </h2>
          <span className="text-xs font-semibold text-text-subtle">
            Tuân thủ chuẩn quy định UC90
          </span>
        </div>

        <div className="space-y-6">
          {steps.map((item) => {
            const IconComponent = item.icon
            return (
              <Card
                key={item.step}
                className="overflow-hidden border-border bg-surface p-5 sm:p-6 shadow-2xs transition hover:border-primary-soft-border"
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Cột trái: Thông tin bước & Mô tả */}
                  <div className="space-y-3.5 lg:col-span-7">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-black text-primary-solid">
                        {item.step}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-solid">
                          Bước {item.step}
                        </span>
                        <h3 className="text-base font-bold text-text leading-tight">{item.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-text-subtle">{item.subtitle}</p>
                    <p className="text-xs leading-relaxed text-text-muted">{item.description}</p>

                    {/* Hộp lưu ý / Tips */}
                    {item.notes && item.notes.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {item.notes.map((note, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed border',
                              note.type === 'tip'
                                ? 'border-primary-soft-border bg-primary-soft/50 text-text'
                                : 'border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                            )}
                          >
                            <AlertCircle size={15} className="shrink-0 mt-0.5 text-primary-solid" />
                            <span>{note.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Link điều hướng hành động nếu có */}
                    {item.actionLabel && item.actionLink && (
                      <div className="pt-2">
                        <Link
                          to={item.actionLink}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-solid hover:underline"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Khung ảnh minh họa / Mockup UI trực quan */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-border bg-surface-2/60 p-4 text-xs space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                        <span className="font-bold text-[11px] text-primary-solid uppercase tracking-wider">
                          {item.mockup.badge}
                        </span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      </div>

                      <h4 className="font-bold text-text text-xs leading-snug">{item.mockup.title}</h4>

                      <ul className="space-y-1.5 text-text-muted text-[11.5px]">
                        {item.mockup.items.map((it, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary-solid font-bold">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>

                      {item.mockup.highlight && (
                        <div className="rounded-lg border border-primary-soft-border bg-surface p-2 text-[11px] font-semibold text-primary-solid">
                          💡 {item.mockup.highlight}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <Card className="border-border bg-surface p-6 sm:p-8 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2.5 text-sm font-bold text-text">
          <HelpCircle size={18} className="text-primary-solid" />
          <span>Các câu hỏi thường gặp (FAQ)</span>
        </div>

        <div className="divide-y divide-border/60">
          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index
            return (
              <div key={index} className="py-3.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-3 text-left text-xs font-bold text-text hover:text-primary-solid transition cursor-pointer select-none"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn('shrink-0 text-text-subtle transition-transform duration-200', isOpen && 'rotate-180 text-primary-solid')}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs leading-relaxed text-text-muted font-normal pr-4">
                    {faq.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Footer Navigation Box */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2/60 p-5">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-text">Bạn muốn tìm hiểu thêm về mặt pháp lý?</h4>
          <p className="text-xs text-text-muted">
            Xem toàn bộ 10 điều khoản cam kết và quy định giải quyết tranh chấp chuẩn UC90.
          </p>
        </div>
        <Link
          to="/app/mentoring/terms"
          className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-text border border-border hover:border-primary-soft-border hover:text-primary-solid transition shadow-2xs"
        >
          <FileText size={15} />
          <span>Xem 10 Điều khoản dịch vụ</span>
        </Link>
      </div>
    </div>
  )
}
