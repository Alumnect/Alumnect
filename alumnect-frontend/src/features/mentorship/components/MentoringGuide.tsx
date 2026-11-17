import { useState, useEffect } from 'react'
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
  ZoomIn,
  X,
  ExternalLink,
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
  image: string
  imageCaption: string
  imageNotes: string
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
    title: 'Khám phá & Chọn lọc Mentor phù hợp',
    subtitle: 'Tìm kiếm người hướng dẫn theo chuyên ngành, kỹ năng và mức độ uy tín',
    description:
      'Truy cập mục "Khám phá Mentor" để duyệt danh sách các cựu sinh viên FPT giàu kinh nghiệm. Bạn có thể sử dụng bộ lọc chuyên sâu theo Chuyên ngành, Lĩnh vực hoạt động, Hình thức làm việc hoặc tham khảo Bảng xếp hạng Mentor uy tín.',
    icon: Search,
    actionLabel: 'Đến trang Khám phá Mentor',
    actionLink: '/app/mentoring/discover',
    image: '/images/guide/student-step1-discover.png',
    imageCaption: 'Giao diện Khám phá & Lọc Mentor (alumnect.vn/app/mentoring/discover)',
    imageNotes:
      'Giao diện hiển thị số điểm uy tín, số đánh giá, số buổi hoàn thành và các thẻ chuyên ngành nổi bật của từng Mentor.',
    mockup: {
      badge: 'Bộ lọc tiêu chí',
      title: 'Tìm kiếm thông minh theo nhu cầu',
      items: [
        'Lọc theo Chuyên ngành: Kỹ thuật phần mềm (SE), An toàn thông tin (IA), Thiết kế đồ họa (GD)...',
        'Hình thức hướng dẫn: Cá nhân 1-1 hoặc Nhóm (Group Mentoring)',
        'Sắp xếp: Điểm uy tín cao nhất hoặc Đánh giá sao tốt nhất',
      ],
      highlight: 'Xem kỹ hồ sơ và đánh giá từ sinh viên khóa trước trước khi gửi yêu cầu',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Hãy bấm vào nút "Xem hồ sơ" để đọc chi tiết kinh nghiệm làm việc, dự án thực tế và các gói hướng dẫn mà Mentor cung cấp.',
      },
    ],
  },
  {
    step: 2,
    title: 'Khởi tạo Yêu cầu Cố vấn chi tiết',
    subtitle: 'Mô tả rõ ràng vấn đề kỹ thuật hoặc bài toán cần hỗ trợ',
    description:
      'Sau khi chọn được Mentor ưng ý hoặc muốn phát yêu cầu công khai, hãy điền biểu mẫu "Tạo yêu cầu mới". Hãy nêu rõ bối cảnh bài toán, khó khăn hiện tại, mục tiêu kỳ vọng và đính kèm đề cương/tài liệu liên quan.',
    icon: FileText,
    actionLabel: 'Tạo yêu cầu Cố vấn mới',
    actionLink: '/app/mentoring/requests/create',
    image: '/images/guide/student-step2-request.png',
    imageCaption: 'Biểu mẫu Khởi tạo Yêu cầu Cố vấn (alumnect.vn/app/mentoring/requests/create)',
    imageNotes:
      'Mô tả chi tiết và tải lên tài liệu/đề cương giúp hệ thống matching chuẩn xác và Mentor phản hồi nhanh hơn.',
    mockup: {
      badge: 'Yêu cầu Cố vấn',
      title: 'Các thông tin trọng tâm cần điền',
      items: [
        'Tiêu đề yêu cầu: Tóm tắt ngắn gọn bài toán (Ví dụ: Tối ưu kiến trúc Spring Boot Microservices)',
        'Mô tả chi tiết: Bối cảnh, lỗi kỹ thuật đang gặp hoặc định hướng mục tiêu tốt nghiệp',
        'Lĩnh vực / Chuyên môn hỗ trợ & Đính kèm tài liệu',
      ],
      highlight: 'Tối thiểu 20 ký tự, hỗ trợ đính kèm file tài liệu tối đa 25MB',
    },
    notes: [
      {
        type: 'tip',
        text: 'Ghi chú: Mô tả càng rõ ràng thì Mentor càng dễ đánh giá tính khả thi và chủ động đề xuất mức ngân sách hợp lý cho bạn.',
      },
    ],
  },
  {
    step: 3,
    title: 'Thống nhất Thỏa thuận (Deal) & Ký quỹ Escrow',
    subtitle: 'Bảo vệ nguồn tiền 100% qua tài khoản trung gian AlumNect',
    description:
      'Sau khi trao đổi qua kênh Chat, Mentor sẽ khởi tạo Thỏa thuận (Deal Ticket). Bạn kiểm tra kỹ Mức giá thỏa thuận, Hạn chót (Deadline) và Phạm vi công việc. Sau khi bấm [Xác nhận thỏa thuận], bạn thực hiện thanh toán qua Cổng PayOS để nạp tiền vào quỹ Ký quỹ (Escrow).',
    icon: CreditCard,
    actionLabel: 'Xem danh sách Thỏa thuận (Deals)',
    actionLink: '/app/mentoring/deals',
    image: '/images/guide/student-step3-deals.png',
    imageCaption: 'Giao diện Thỏa thuận & Nút Mở Task (alumnect.vn/app/mentoring/deals)',
    imageNotes:
      'Khi trạng thái chuyển sang "Đã thanh toán", tiền được giữ an toàn tại Escrow AlumNect. Nút "Mở Task" sẽ xuất hiện để bắt đầu làm việc.',
    mockup: {
      badge: 'Thỏa thuận Deal Ticket',
      title: 'Cơ chế Ký quỹ An toàn (Escrow Mechanism)',
      items: [
        'Mức giá: Được cố định và không thay đổi trong suốt quá trình thực hiện',
        'Quỹ Escrow: Tiền của bạn chưa chuyển cho Mentor mà được AlumNect tạm giữ bảo đảm',
        'Thanh toán PayOS: Quét mã VietQR chuyển khoản tức thì, xác nhận tự động trong 5 giây',
      ],
      highlight: 'Tuyệt đối không chuyển khoản cá nhân ngoài hệ thống để tránh mất quyền bảo hộ',
    },
    notes: [
      {
        type: 'warning',
        text: 'Lưu ý: Tiền ký quỹ chỉ được giải ngân cho Mentor khi bạn chính thức bấm [Nghiệm thu] sau khi hoàn thành nhiệm vụ.',
      },
    ],
  },
  {
    step: 4,
    title: 'Theo dõi Tiến độ & Phản hồi Work Log trong 72 giờ',
    subtitle: 'Quy tắc 72 giờ phản hồi đối soát nhật ký công việc',
    description:
      'Trong quá trình hướng dẫn, Mentor có trách nhiệm ghi nhận Work Log chi tiết sau mỗi buổi (nội dung thực hiện, kết quả, tài liệu). Khi Mentor gửi Work Log, bạn cần kiểm tra và bấm [Xác nhận] hoặc phản hồi chỉnh sửa. Nếu có khiếu nại, bạn phải phản hồi trong vòng 72 giờ.',
    icon: Clock,
    actionLabel: 'Xem chi tiết Task & Work Log',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/student-step4-task.png',
    imageCaption: 'Chi tiết Task công việc & Theo dõi Work Log (alumnect.vn/app/mentoring/tasks/:id)',
    imageNotes:
      'Hiển thị rõ 3 giai đoạn tiến trình (Chuẩn bị -> Đang thực hiện -> Kết thúc & Nghiệm thu), thông tin Deadline và danh sách Work Log từng buổi.',
    mockup: {
      badge: 'Quản lý Tiến trình 3 Giai đoạn',
      title: 'Quy tắc nghiệm thu Work Log & Deadline',
      items: [
        'Giai đoạn 1 (Chuẩn bị): Kích hoạt thỏa thuận và chuẩn bị tài liệu',
        'Giai đoạn 2 (Đang thực hiện): Mentor gửi Work Log từng phiên hướng dẫn',
        'Giai đoạn 3 (Kết thúc): Nghiệm thu bàn giao sản phẩm cuối cùng',
      ],
      highlight: 'Thời hạn 72h: Quá 72h không phản hồi là căn cứ pháp lý để Admin công nhận Work Log',
    },
    notes: [
      {
        type: 'warning',
        text: 'QUAN TRỌNG: Học viên có trách nhiệm kiểm tra Work Log trong vòng 72 giờ kể từ khi Mentor gửi. Nếu quá 72 giờ mà bạn không phản hồi hay khiếu nại, đây là căn cứ pháp lý mặc định để Admin công nhận kết quả khi có đối soát tranh chấp.',
      },
      {
        type: 'tip',
        text: 'Quy tắc Vắng mặt (No-show): Nếu bạn vào trễ quá 15 phút so với lịch hẹn mà không thông báo trước, Mentor có quyền ghi nhận Work Log phiên đó và tính vào tiến độ hoàn thành.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nghiệm thu Hoàn tất hoặc Khiếu nại Hoàn tiền',
    subtitle: 'Bảo vệ quyền lợi học viên và giải ngân minh bạch',
    description:
      'Khi nhiệm vụ kết thúc và Mentor nộp biên bản hoàn thành, bạn kiểm tra toàn bộ sản phẩm đầu ra và bấm [Nghiệm thu]. Tiền Escrow sẽ giải ngân cho Mentor và bạn có thể đánh giá sao. Nếu có vi phạm thỏa thuận, bạn có thể Mở Ticket tranh chấp hoặc yêu cầu Hoàn tiền về tài khoản ngân hàng.',
    icon: CheckCircle2,
    actionLabel: 'Khai báo Tài khoản Nhận Hoàn tiền',
    actionLink: '/app/mentoring/refunds',
    image: '/images/guide/student-step5-refunds.png',
    imageCaption: 'Giao diện Khai báo Tài khoản & Đối soát Hoàn tiền (alumnect.vn/app/mentoring/refunds)',
    imageNotes:
      'Khai báo số tài khoản ngân hàng chính chủ để nhận hoàn tiền tự động 100% khi có tranh chấp hoặc Mentor vi phạm thỏa thuận.',
    mockup: {
      badge: 'Quyền lợi Học viên',
      title: 'Chính sách Hoàn tiền & Thời hiệu Khiếu nại',
      items: [
        'Khai báo STK: Khai báo số tài khoản ngân hàng (Vietcombank, BIDV, Techcombank...) để nhận tiền hoàn',
        'Thời hiệu khiếu nại: Bạn có tối đa 07 ngày kể từ khi Task hoàn thành để mở Ticket tranh chấp',
        'Hoàn trả 100%: Hoàn tiền toàn bộ nếu Mentor không thực hiện hoặc vi phạm nghiêm trọng cam kết',
      ],
      highlight: 'AlumNect cam kết đứng ra hòa giải công tâm dựa trên bằng chứng Work Log và Chat hệ thống',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Hãy khai báo số tài khoản nhận tiền hoàn ngay từ đầu tại mục "Hoàn tiền" để được hệ thống tự động xử lý khi phát sinh hoàn tiền.',
      },
    ],
  },
]

const MENTOR_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Kích hoạt Hồ sơ Mentor & Thông tin Cá nhân',
    subtitle: 'Xác thực năng lực cựu sinh viên và cập nhật lĩnh vực cố vấn',
    description:
      'Để trở thành Mentor chính thức, bạn cần hoàn thiện hồ sơ năng lực bao gồm: kinh nghiệm làm việc, công ty hiện tại, chuyên môn kỹ thuật và liên kết tài khoản ngân hàng để nhận thù lao. Hệ thống sẽ tự động đồng bộ và cấp huy hiệu Mentor đã xác thực.',
    icon: UserCheck,
    actionLabel: 'Cập nhật Hồ sơ Mentor',
    actionLink: '/app/mentoring/become-mentor',
    image: '/images/guide/mentor-step1-profile.png',
    imageCaption: 'Hồ sơ Cố vấn & Trạng thái Hoạt động (alumnect.vn/app/mentoring/become-mentor)',
    imageNotes:
      'Hiển thị thông tin cựu sinh viên FPT, chức danh công việc, trạng thái hồ sơ "Đang hoạt động" và nút quản lý gói dịch vụ.',
    mockup: {
      badge: 'Hồ sơ Cố vấn (Mentor Profile)',
      title: 'Tiêu chuẩn phê duyệt hồ sơ',
      items: [
        'Xác thực cựu sinh viên: Mã SV FPTU, Chuyên ngành và Năm tốt nghiệp',
        'Thông tin nghề nghiệp: Vị trí công việc hiện tại, Công ty/Tập đoàn đang công tác',
        'Lĩnh vực cố vấn: Chọn các kỹ năng và chuyên môn có thể hỗ trợ đàn em',
      ],
      highlight: 'Hồ sơ chuyên nghiệp và chi tiết giúp tăng 300% tỷ lệ học viên gửi yêu cầu',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Cập nhật link LinkedIn và kinh nghiệm thực chiến tại các doanh nghiệp lớn để đạt điểm uy tín cao trên Bảng xếp hạng Mentor.',
      },
    ],
  },
  {
    step: 2,
    title: 'Kích hoạt Gói dịch vụ Cố vấn (Mentor Subscription)',
    subtitle: 'Mở khóa tính năng kết nối và bảo trợ tài chính hệ thống',
    description:
      'Lựa chọn gói dịch vụ cố vấn phù hợp (Gói Tiêu chuẩn 1 tháng, Gói Phổ biến 3 tháng hoặc Gói Cao cấp 6 tháng). Gói dịch vụ giúp duy trì huy hiệu Mentor chính thức trên hệ thống, quyền nhận tối đa 5 Task hoạt động đồng thời và hưởng chính sách bảo trợ thanh toán tự động qua PayOS.',
    icon: CreditCard,
    actionLabel: 'Xem các Gói dịch vụ Mentor',
    actionLink: '/app/mentoring/packages',
    image: '/images/guide/mentor-step2-packages.png',
    imageCaption: 'Bảng Gói dịch vụ Mentor (alumnect.vn/app/mentoring/packages)',
    imageNotes:
      'Hiển thị thời hạn gói đang dùng, chi phí theo kỳ hạn, huy hiệu Mentor trên hồ sơ và kết nối cổng đối soát thù lao PayOS.',
    mockup: {
      badge: 'Gói Dịch Vụ Cố Vấn',
      title: 'Quyền lợi dành cho Mentor có gói kích hoạt',
      items: [
        'Huy hiệu Mentor nổi bật trên trang Khám phá & Hồ sơ',
        'Quyền nhận yêu cầu trực tiếp từ sinh viên và mở Deal Ticket',
        'Bảo trợ dòng tiền: Tự động đối soát và giải ngân thù lao qua cổng PayOS',
      ],
      highlight: 'Hỗ trợ thanh toán linh hoạt bằng quét mã VietQR PayOS trong 5 giây',
    },
    notes: [
      {
        type: 'tip',
        text: 'Lưu ý: Bạn có thể kiểm tra thời hạn gói dịch vụ tại mục "Gói dịch vụ" trên Sidebar bất cứ lúc nào.',
      },
    ],
  },
  {
    step: 3,
    title: 'Tiếp nhận Yêu cầu & Tạo Thỏa thuận (Deal Ticket)',
    subtitle: 'Chủ động thương lượng phạm vi, giá thù lao và deadline',
    description:
      'Khi sinh viên gửi yêu cầu, bạn sẽ nhận được thông báo tại mục "Yêu cầu gửi đến". Bạn có thể bấm [Xem & phản hồi] để trò chuyện với sinh viên, trao đổi làm rõ đề bài. Sau khi đồng thuận, bạn khởi tạo Deal Ticket với số tiền (VND), deadline hoàn thành và cam kết đầu ra.',
    icon: MessageSquare,
    actionLabel: 'Xem Hòm thư Yêu cầu gửi đến',
    actionLink: '/app/mentoring/incoming-requests',
    image: '/images/guide/mentor-step3-incoming.png',
    imageCaption: 'Hòm thư Tiếp nhận Yêu cầu Cố vấn (alumnect.vn/app/mentoring/incoming-requests)',
    imageNotes:
      'Xem thông tin chi tiết sinh viên, tiêu đề nhu cầu, hình thức (Online/Offline), hạn chót và nút hành động "Xem & phản hồi".',
    mockup: {
      badge: 'Quy trình khởi tạo Deal',
      title: 'Các điều khoản cần chốt trong Deal Ticket',
      items: [
        'Mức thù lao thỏa thuận: Số nguyên dương VND (Ví dụ: 650.000 đ)',
        'Hạn chót hoàn thành (Deadline): Ngày giờ kết thúc nhiệm vụ',
        'Phạm vi cam kết: Số buổi hướng dẫn, tài liệu bàn giao, hỗ trợ review',
      ],
      highlight: 'Sau khi sinh viên thanh toán Escrow, Task sẽ tự động được kích hoạt sang Giai đoạn 2',
    },
    notes: [
      {
        type: 'tip',
        text: 'Gợi ý: Luôn trao đổi kỹ năng lực hiện tại của học viên để đặt Deadline khả thi, tránh phải xin gia hạn về sau.',
      },
    ],
  },
  {
    step: 4,
    title: 'Thực hiện Hướng dẫn & Ghi nhận Work Log từng buổi',
    subtitle: 'Căn cứ pháp lý cốt lõi để nhận thù lao và giải quyết tranh chấp',
    description:
      'Sau mỗi phiên hướng dẫn, hãy bấm nút [+ Thêm Work Log] trong trang chi tiết Task để ghi nhận nội dung đã giảng dạy, bài tập giao về và sản phẩm học viên làm được. Đây là bằng chứng pháp lý quan trọng nhất để Admin công nhận kết quả và giải ngân tiền cho bạn khi sinh viên im lặng quá 72h.',
    icon: Clock,
    actionLabel: 'Đến trang Quản lý Task & Work Log',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/mentor-step4-tasks.png',
    imageCaption: 'Giao diện Chi tiết Task & Thêm Work Log mới (alumnect.vn/app/mentoring/tasks/:id)',
    imageNotes:
      'Giao diện trực quan với nút "+ Thêm Work Log" màu cam, lịch sử Work Log từng buổi, trạng thái xác nhận và nút trao đổi tin nhắn nhanh.',
    mockup: {
      badge: 'Căn cứ bảo hộ thù lao',
      title: 'Quy tắc Work Log & Pháp lý 72 giờ',
      items: [
        'Nội dung buổi học: Ghi rõ chủ đề, kiến thức truyền đạt và link minh chứng (Drive/Git)',
        'Quy tắc No-show 15 phút: Học viên trễ > 15 phút không báo trước vẫn được tính là 01 Work Log hợp lệ',
        'Pháp lý 72h: Nếu học viên im lặng quá 72h kể từ lúc gửi Log, Admin mặc định công nhận buổi học',
      ],
      highlight: 'Ghi log đầy đủ giúp bạn được bảo vệ 100% thù lao dù học viên có biến mất hay không phản hồi',
    },
    notes: [
      {
        type: 'warning',
        text: 'CĂN CỨ PHÁP LÝ QUAN TRỌNG: Học viên có 72 giờ để phản hồi Work Log. Nếu sau 72 giờ học viên không có phản hồi hay khiếu nại, đây sẽ là căn cứ mặc định để Ban Quản Trị (Admin) công nhận kết quả và thực hiện giải ngân cho bạn khi có yêu cầu đối soát tranh chấp.',
      },
      {
        type: 'tip',
        text: 'Mẹo: Khi gặp khó khăn về tiến độ, hãy sử dụng tính năng "Gia hạn Deadline" trước khi hết hạn chót để giữ điểm uy tín.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nộp Nghiệm thu & Nhận Thù lao Tự động (Payout)',
    subtitle: 'Tiền tự động chuyển về tài khoản ngân hàng liên kết',
    description:
      'Khi đã hoàn thành trọn vẹn mục tiêu của Task, bạn nộp biên bản nghiệm thu cuối cùng (Task Completion). Ngay khi học viên bấm Nghiệm thu (hoặc Admin can thiệp giải ngân đối soát), tiền thù lao từ quỹ Escrow sẽ tự động được chuyển thẳng về tài khoản ngân hàng của bạn qua cổng PayOS.',
    icon: DollarSign,
    actionLabel: 'Xem Bảng kê Thu nhập & Lịch sử Payout',
    actionLink: '/app/mentoring/earnings',
    image: '/images/guide/mentor-step5-earnings.png',
    imageCaption: 'Bảng kê Thu nhập & Lịch sử Chuyển khoản Payout (alumnect.vn/app/mentoring/earnings)',
    imageNotes:
      'Bảng điều khiển chi tiết số tiền "Đã nhận", "Đang xử lý", danh sách Task kèm tên học viên, số tiền và trạng thái chuyển khoản tự động.',
    mockup: {
      badge: 'Thanh toán & Thu nhập',
      title: 'Cơ chế giải ngân tự động (PayOS Payout)',
      items: [
        'Tự động 100%: Tiền chuyển thẳng về tài khoản ngân hàng không cần chờ duyệt thủ công',
        'Minh bạch: Bảng kê chi tiết từng mã Task, ngày giờ giao dịch và biên lai ngân hàng',
        'Bảo hộ quyền tác giả: Tài liệu do bạn soạn thảo vẫn thuộc quyền sở hữu trí tuệ của bạn',
      ],
      highlight: 'AlumNect không thu phí ẩn, số tiền hiển thị trên bảng kê là số tiền thực nhận của bạn',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Hãy kiểm tra thông tin tài khoản ngân hàng thụ hưởng tại mục Hồ sơ Mentor để đảm bảo lệnh chuyển tiền tự động luôn thành công tức thì.',
      },
    ],
  },
]

const FAQS = [
  {
    q: 'Tiền ký quỹ (Escrow) được bảo vệ như thế nào?',
    a: 'Khi Học viên thanh toán Deal Ticket, số tiền được phong tỏa tại tài khoản trung gian của AlumNect. Mentor KHÔNG THỂ rút số tiền này cho đến khi Học viên bấm xác nhận Nghiệm thu công việc (hoặc có quyết định phân xử chính thức từ Ban Quản Trị AlumNect).',
  },
  {
    q: 'Quy tắc 72 giờ đối soát Work Log hoạt động ra sao nếu một bên im lặng?',
    a: 'Sau mỗi buổi hướng dẫn, Mentor gửi Work Log. Học viên có trách nhiệm kiểm tra và phản hồi trong vòng 72 giờ. Nếu quá 72 giờ mà Học viên không có phản hồi hay khiếu nại, đây sẽ là căn cứ pháp lý mặc định để Admin công nhận kết quả và thực hiện giải ngân cho Mentor khi có yêu cầu đối soát hoặc tranh chấp.',
  },
  {
    q: 'Chính sách Vắng mặt (No-show 15 phút) quy định như thế nào?',
    a: 'Nếu một bên đến muộn quá 15 phút so với lịch hẹn mà không có thỏa thuận dời lịch hợp lệ: Trường hợp Học viên vắng mặt, Mentor vẫn có quyền ghi nhận buổi làm việc vào Work Log và tính vào tiến độ. Trường hợp Mentor vắng mặt, Học viên có quyền yêu cầu hoàn tiền hoặc yêu cầu buổi bù tương đương.',
  },
  {
    q: 'Nếu có tranh chấp hoặc không hài lòng về chất lượng, tôi phải làm gì?',
    a: 'Trong vòng tối đa 07 ngày kể từ khi kết thúc Task, bạn có quyền mở Ticket khiếu nại trong mục Công việc. Ban Quản Trị AlumNect sẽ căn cứ vào: Nhật ký Work Log, Lịch sử trao đổi tin nhắn trên hệ thống và Bằng chứng hai bên cung cấp để ra quyết định hoàn tiền (toàn phần/bán phần) hoặc giải ngân cho Mentor.',
  },
  {
    q: 'Quyền sở hữu trí tuệ và bảo mật tài liệu được quy định ra sao?',
    a: 'Tài liệu hướng dẫn, giáo trình do Mentor tạo ra thuộc quyền tác giả của Mentor; Học viên chỉ được sử dụng cho mục đích học tập cá nhân. Ngược lại, đồ án, đề tài nghiên cứu của Học viên thuộc sở hữu của Học viên và Mentor cam kết bảo mật tuyệt đối, không chia sẻ cho bên thứ ba.',
  },
]

export function MentoringGuide() {
  const { t } = useTranslation()
  const [activeRole, setActiveRole] = useState<RoleType>('student')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; notes?: string } | null>(null)

  const steps = activeRole === 'student' ? STUDENT_STEPS : MENTOR_STEPS

  const toggleFaq = (index: number) => {
    setExpandedFaq((current) => (current === index ? null : index))
  }

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Lightbox Modal phóng to ảnh */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h4 className="ml-2 text-xs font-bold text-text truncate max-w-[500px]">
                  {previewImage.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="grid h-8 w-8 place-items-center rounded-xl text-text-subtle hover:bg-surface-3 hover:text-text transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ảnh phóng to */}
            <div className="max-h-[75vh] overflow-y-auto bg-surface-2/40 p-2">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="w-full h-auto rounded-lg shadow-xs"
              />
            </div>

            {/* Chú thích chân ảnh */}
            {previewImage.notes && (
              <div className="border-t border-border bg-surface px-4 py-3 text-xs text-text-muted leading-relaxed">
                <span className="font-bold text-primary-solid">Ghi chú đối soát: </span>
                {previewImage.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary-soft-border bg-gradient-to-br from-primary-soft/40 via-surface to-surface p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-soft-border bg-primary-soft/80 px-3 py-1 text-xs font-bold text-primary-solid">
            <BookOpen size={14} />
            <span>Cẩm nang Hướng dẫn Mentoring (Playbook)</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
            Hướng dẫn Quy trình Mentoring
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed text-text-muted">
            Quy trình làm việc chuẩn hóa 5 bước từ lúc kết nối, thống nhất Thỏa thuận (Deal Ticket),
            ký quỹ an toàn (Escrow), ghi nhận Work Log đến nghiệm thu và giải ngân thù lao.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-text-subtle">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Bảo vệ quỹ Escrow</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <Clock size={14} className="text-amber-500" />
              <span>Đối soát Work Log 72h</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <Scale size={14} className="text-primary-solid" />
              <span>Chuẩn quy định UC90</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <Card className="border-border bg-surface p-2 shadow-2xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveRole('student')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition cursor-pointer',
              activeRole === 'student'
                ? 'bg-primary-solid text-white shadow-xs'
                : 'bg-surface-2 text-text-subtle hover:bg-surface-3 hover:text-text'
            )}
          >
            <GraduationCap size={16} />
            <span>Dành cho Sinh viên / Người học (Student)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('mentor')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition cursor-pointer',
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

      {/* 5-Step Process Timeline with Actual Web Screenshots */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-solid text-xs text-white">
              5
            </span>
            <span>Quy trình làm việc dành cho {activeRole === 'student' ? 'Học viên' : 'Cố vấn'}</span>
          </h2>
          <span className="text-xs font-semibold text-text-subtle">
            Hình ảnh chụp thực tế từ Web AlumNect
          </span>
        </div>

        <div className="space-y-8">
          {steps.map((item) => {
            return (
              <Card
                key={item.step}
                className="overflow-hidden border-border bg-surface p-5 sm:p-6 shadow-2xs transition hover:border-primary-soft-border"
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Cột trái: Thông tin bước, Mô tả & Lưu ý nghiệp vụ */}
                  <div className="space-y-4 lg:col-span-6 flex flex-col justify-between">
                    <div className="space-y-3">
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

                      {/* Checklist trọng tâm của bước */}
                      <div className="rounded-xl border border-border/80 bg-surface-2/60 p-3 text-xs space-y-2">
                        <span className="font-bold text-[11px] text-primary-solid uppercase tracking-wider">
                          {item.mockup.badge}
                        </span>
                        <ul className="space-y-1.5 text-text-muted text-[11.5px]">
                          {item.mockup.items.map((it, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary-solid font-bold">•</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

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
                    </div>

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

                  {/* Cột phải: Khung ảnh chụp thực tế từ Web với Browser Mockup */}
                  <div className="lg:col-span-6">
                    <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/40 shadow-xs transition hover:shadow-md">
                      {/* Browser Frame Top Bar */}
                      <div className="flex items-center justify-between border-b border-border/80 bg-surface-2/90 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="font-mono text-[10.5px] font-semibold text-text-subtle truncate max-w-[220px]">
                          {item.imageCaption}
                        </span>
                        <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[9.5px] font-bold text-primary-solid">
                          Ảnh chụp web
                        </span>
                      </div>

                      {/* Image with zoom on hover and click */}
                      <div
                        onClick={() =>
                          setPreviewImage({
                            src: item.image,
                            title: item.title,
                            notes: item.imageNotes,
                          })
                        }
                        className="group relative cursor-pointer overflow-hidden bg-surface-2"
                        title="Bấm để phóng to xem rõ nét"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-auto object-cover max-h-[360px] transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                          <span className="text-white text-xs font-bold flex items-center gap-1.5 drop-shadow-sm">
                            <ZoomIn size={14} />
                            Bấm để phóng to xem chi tiết
                          </span>
                          <span className="text-white/80 text-[11px] font-medium">
                            Bước {item.step}
                          </span>
                        </div>
                      </div>

                      {/* Chú thích tính năng trên giao diện ảnh */}
                      <div className="border-t border-border/60 bg-surface/90 p-3 text-[11.5px] text-text-muted leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-primary-solid shrink-0">Vị trí thao tác:</span>
                          <span>{item.imageNotes}</span>
                        </div>
                      </div>
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
                    className={cn(
                      'shrink-0 text-text-subtle transition-transform duration-200',
                      isOpen && 'rotate-180 text-primary-solid'
                    )}
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
export default MentoringGuide
