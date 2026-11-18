import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

type RoleType = 'student' | 'mentor'

interface CalloutPin {
  id: number
  title: string
  shortLabel: string
  description: string
  targetX: number
  targetY: number
  labelX: number
  labelY: number
  path: string
}

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
  imageWidth?: number
  imageHeight?: number
  callouts: CalloutPin[]
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
    imageCaption: 'Giao diện Khám phá & Lọc Mentor',
    imageNotes:
      'Giao diện hiển thị số điểm uy tín, số đánh giá, số buổi hoàn thành và các thẻ chuyên ngành nổi bật của từng Mentor.',
    callouts: [
      {
        id: 1,
        title: 'Thanh tìm kiếm & sắp xếp Mentor',
        shortLabel: 'Thanh tìm kiếm & sắp xếp',
        description: 'Lọc nhanh theo Chuyên ngành (Kỹ thuật phần mềm SE, An toàn thông tin IA, Thiết kế đồ họa GD...), Lĩnh vực và Hình thức hướng dẫn 1-1.',
        targetX: 480,
        targetY: 306,
        labelX: 480,
        labelY: 242,
        path: 'M 480 242 L 480 296',
      },
      {
        id: 2,
        title: 'Bộ lọc tiêu chí chuyên ngành',
        shortLabel: 'Bộ lọc tiêu chí',
        description: 'Hiển thị các bộ lọc chi tiết theo Lĩnh vực, Chuyên ngành, Hình thức làm việc và Hình thức hướng dẫn.',
        targetX: 658,
        targetY: 421,
        labelX: 658,
        labelY: 368,
        path: 'M 658 368 L 658 410',
      },
      {
        id: 3,
        title: 'Điểm uy tín & Nút Xem hồ sơ',
        shortLabel: 'Nút Xem hồ sơ',
        description: 'Điểm uy tín, số đánh giá thực tế và nút màu cam "Xem hồ sơ" để xem chi tiết kinh nghiệm và các gói hỗ trợ của Mentor.',
        targetX: 465,
        targetY: 752,
        labelX: 465,
        labelY: 638,
        path: 'M 465 638 L 465 740',
      },
    ],
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
    imageCaption: 'Biểu mẫu Khởi tạo Yêu cầu Cố vấn',
    imageNotes:
      'Mô tả chi tiết và tải lên tài liệu/đề cương giúp hệ thống matching chuẩn xác và Mentor phản hồi nhanh hơn.',
    callouts: [
      {
        id: 1,
        title: 'Tiêu đề yêu cầu hỗ trợ',
        shortLabel: 'Tiêu đề yêu cầu',
        description: 'Tóm tắt ngắn gọn bài toán kỹ thuật (Ví dụ: Cố vấn định hướng đồ án Capstone Spring Boot & Microservices).',
        targetX: 600,
        targetY: 423,
        labelX: 780,
        labelY: 372,
        path: 'M 780 372 L 600 372 L 600 412',
      },
      {
        id: 2,
        title: 'Mô tả chi tiết nhu cầu',
        shortLabel: 'Mô tả chi tiết nhu cầu',
        description: 'Trình bày cụ thể bối cảnh hiện tại, mục tiêu muốn đạt được và những khó khăn đang gặp (tối thiểu 20 ký tự, tối đa 3000 ký tự).',
        targetX: 600,
        targetY: 545,
        labelX: 780,
        labelY: 468,
        path: 'M 780 468 L 600 468 L 600 534',
      },
      {
        id: 3,
        title: 'Lĩnh vực & Chuyên môn hỗ trợ',
        shortLabel: 'Lĩnh vực & Chuyên môn',
        description: 'Chọn chuyên môn kỹ thuật để hệ thống matching chuẩn xác tới các Mentor có năng lực chuyên sâu trong ngành.',
        targetX: 655,
        targetY: 735,
        labelX: 870,
        labelY: 735,
        path: 'M 870 735 L 667 735',
      },
    ],
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
    imageCaption: 'Giao diện Thỏa thuận & Nút Mở Task',
    imageNotes:
      'Khi trạng thái chuyển sang "Đã thanh toán", tiền được giữ an toàn tại Escrow AlumNect. Nút "Mở Task" sẽ xuất hiện để bắt đầu làm việc.',
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Đã thanh toán (Ký quỹ Escrow)',
        shortLabel: 'Đã thanh toán (Escrow)',
        description: 'Huy hiệu xanh lá "Đã thanh toán" xác nhận nguồn tiền của bạn đã vào quỹ bảo đảm Escrow AlumNect an toàn 100%.',
        targetX: 408,
        targetY: 363,
        labelX: 640,
        labelY: 312,
        path: 'M 640 312 L 408 312 L 408 352',
      },
      {
        id: 2,
        title: 'Mức giá thỏa thuận & Hạn chót Deadline',
        shortLabel: 'Mức giá & Hạn chót',
        description: 'Chi phí cam kết cố định không phát sinh phụ phí và mốc thời gian hoàn thành nhiệm vụ rõ ràng.',
        targetX: 830,
        targetY: 586,
        labelX: 1050,
        labelY: 586,
        path: 'M 1050 586 L 842 586',
      },
      {
        id: 3,
        title: 'Nút "Mở Task" màu cam để bắt đầu',
        shortLabel: 'Nút Mở Task',
        description: 'Bấm nút [Mở Task] để truy cập không gian làm việc, theo dõi tiến trình 3 giai đoạn và nhận Work Log từ Mentor.',
        targetX: 540,
        targetY: 669,
        labelX: 540,
        labelY: 745,
        path: 'M 540 745 L 540 682',
      },
    ],
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
    imageCaption: 'Chi tiết Task công việc & Theo dõi Work Log',
    imageNotes:
      'Hiển thị rõ 3 giai đoạn tiến trình (Chuẩn bị -> Đang thực hiện -> Kết thúc & Nghiệm thu), thông tin Deadline và danh sách Work Log từng buổi.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: 'Tiến trình Mentoring Task 3 Giai đoạn',
        shortLabel: 'Tiến trình 3 giai đoạn',
        description: 'Thanh tiến độ % và 3 giai đoạn trực quan: Giai đoạn 1 (Chuẩn bị), Giai đoạn 2 (Đang thực hiện), Giai đoạn 3 (Kết thúc & Nghiệm thu).',
        targetX: 675,
        targetY: 388,
        labelX: 675,
        labelY: 275,
        path: 'M 675 275 L 675 372',
      },
      {
        id: 2,
        title: 'Thời hạn hoàn thành (Deadline)',
        shortLabel: 'Thời hạn Deadline',
        description: 'Mốc thời gian hạn chót cam kết hoàn thành công việc để hai bên cùng đối chiếu tiến độ.',
        targetX: 544,
        targetY: 615,
        labelX: 700,
        labelY: 530,
        path: 'M 700 530 L 544 530 L 544 602',
      },
      {
        id: 3,
        title: 'Nhật ký công việc (Work Logs) & Căn cứ 72h',
        shortLabel: 'Nhật ký Work Log',
        description: 'Chi tiết từng buổi học (tóm tắt, nội dung, sản phẩm đạt được) và nút xác nhận. QUAN TRỌNG: Quá 72h không phản hồi là căn cứ pháp lý để Admin công nhận kết quả.',
        targetX: 796,
        targetY: 968,
        labelX: 796,
        labelY: 880,
        path: 'M 796 880 L 796 955',
      },
    ],
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
    imageCaption: 'Giao diện Khai báo Tài khoản & Đối soát Hoàn tiền',
    imageNotes:
      'Khai báo số tài khoản ngân hàng chính chủ để nhận hoàn tiền tự động 100% khi có tranh chấp hoặc Mentor vi phạm thỏa thuận.',
    callouts: [
      {
        id: 1,
        title: 'Banner cảnh báo STK ngân hàng',
        shortLabel: 'Cảnh báo khai báo STK',
        description: 'Thông báo bắt buộc khai báo số tài khoản chính chủ trước khi kích hoạt hoàn tiền hoặc kết thúc Task.',
        targetX: 550,
        targetY: 296,
        labelX: 550,
        labelY: 235,
        path: 'M 550 235 L 550 285',
      },
      {
        id: 2,
        title: 'Dropdown chọn ngân hàng & nhập số tài khoản',
        shortLabel: 'Chọn ngân hàng & STK',
        description: 'Hỗ trợ hệ thống ngân hàng liên kết VietQR (Vietcombank, MB, Techcombank, TPBank...). Bấm [Lưu tài khoản] để ghi nhận.',
        targetX: 580,
        targetY: 426,
        labelX: 780,
        labelY: 362,
        path: 'M 780 362 L 580 362 L 580 415',
      },
      {
        id: 3,
        title: 'Bảng đối soát trạng thái tiền hoàn',
        shortLabel: 'Bảng đối soát hoàn tiền',
        description: 'Theo dõi chi tiết số tiền Đã nhận, Đang xử lý đối soát và Chưa thành công để hỗ trợ khiếu nại kịp thời.',
        targetX: 470,
        targetY: 673,
        labelX: 640,
        labelY: 762,
        path: 'M 640 762 L 470 762 L 470 685',
      },
    ],
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
    imageCaption: 'Hồ sơ Cố vấn & Trạng thái Hoạt động',
    imageNotes:
      'Hiển thị thông tin cựu sinh viên FPT, chức danh công việc, trạng thái hồ sơ "Đang hoạt động" và nút quản lý gói dịch vụ.',
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Bản nháp (Chưa hoàn thiện)',
        shortLabel: 'Trạng thái Bản nháp',
        description: 'Hồ sơ ở trạng thái Bản nháp cần cập nhật đầy đủ thông tin trước khi gửi duyệt kích hoạt huy hiệu Mentor.',
        targetX: 510,
        targetY: 191,
        labelX: 720,
        labelY: 191,
        path: 'M 720 191 L 522 191',
      },
      {
        id: 2,
        title: 'Thông tin cá nhân & Lĩnh vực đào tạo',
        shortLabel: 'Thông tin cá nhân',
        description: 'Khai báo họ tên, chức danh hiện tại, cơ sở đào tạo FPTU và kinh nghiệm chuyên môn để sinh viên tin tưởng kết nối.',
        targetX: 570,
        targetY: 435,
        labelX: 780,
        labelY: 335,
        path: 'M 780 335 L 570 335 L 570 422',
      },
      {
        id: 3,
        title: 'Nút "Hoàn tất ->" gửi duyệt hồ sơ',
        shortLabel: 'Nút Hoàn tất hồ sơ',
        description: 'Sau khi điền đủ các mục, bấm nút màu cam [Hoàn tất ->] để hoàn thành và kích hoạt quyền nhận yêu cầu.',
        targetX: 1101,
        targetY: 685,
        labelX: 1050,
        labelY: 615,
        path: 'M 1050 615 L 1101 615 L 1101 672',
      },
    ],
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
    imageCaption: 'Bảng Gói dịch vụ Mentor',
    imageNotes:
      'Hiển thị thời hạn gói đang dùng, chi phí theo kỳ hạn, huy hiệu Mentor trên hồ sơ và kết nối cổng đối soát thù lao PayOS.',
    callouts: [
      {
        id: 1,
        title: 'Banner Gói dịch vụ đang kích hoạt',
        shortLabel: 'Gói dịch vụ đang kích hoạt',
        description: 'Hiển thị chi tiết Gói đang dùng (Ví dụ: Gói Cao Cấp 6 Tháng), trạng thái Đang hoạt động và Hạn dùng đến 21/04/2027.',
        targetX: 590,
        targetY: 303,
        labelX: 590,
        labelY: 235,
        path: 'M 590 235 L 590 292',
      },
      {
        id: 2,
        title: 'Bảng 3 gói dịch vụ đa dạng kỳ hạn',
        shortLabel: 'Bảng 3 gói dịch vụ Mentor',
        description: 'Gói Tiêu Chuẩn 1 Tháng, Gói Phổ Biến 3 Tháng, và Gói Cao Cấp 6 Tháng kèm mức giá ưu đãi theo tháng.',
        targetX: 762,
        targetY: 420,
        labelX: 762,
        labelY: 365,
        path: 'M 762 365 L 762 408',
      },
      {
        id: 3,
        title: 'Quyền lợi Đối soát thù lao qua PayOS',
        shortLabel: 'Quyền lợi đối soát PayOS',
        description: 'Huy hiệu xác thực Mentor và hệ thống bảo trợ đối soát thù lao tự động 100% qua cổng thanh toán PayOS.',
        targetX: 1058,
        targetY: 704,
        labelX: 762,
        labelY: 704,
        path: 'M 762 704 L 1045 704',
      },
    ],
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
    imageCaption: 'Hòm thư Tiếp nhận Yêu cầu Cố vấn',
    imageNotes:
      'Xem thông tin chi tiết sinh viên, tiêu đề nhu cầu, hình thức (Online/Offline), hạn chót và nút hành động "Xem & phản hồi".',
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Chờ phản hồi & Thông tin Sinh viên',
        shortLabel: 'Thông tin sinh viên gửi yêu cầu',
        description: 'Hiển thị rõ thông tin sinh viên gửi yêu cầu, khóa học (K16/K18 FPTU) và thời gian gửi đến.',
        targetX: 460,
        targetY: 452,
        labelX: 780,
        labelY: 452,
        path: 'M 780 452 L 472 452',
      },
      {
        id: 2,
        title: 'Tiêu đề nhu cầu, Mức ngân sách & Hạn chót',
        shortLabel: 'Nhu cầu & Mức ngân sách',
        description: 'Tóm tắt bài toán kỹ thuật, mức ngân sách đề xuất (300.000đ - 700.000đ), hình thức và hạn chót mong muốn.',
        targetX: 595,
        targetY: 572,
        labelX: 595,
        labelY: 665,
        path: 'M 595 665 L 595 584',
      },
      {
        id: 3,
        title: 'Nút "Xem & phản hồi ->" màu cam',
        shortLabel: 'Nút Xem & phản hồi',
        description: 'Bấm nút [Xem & phản hồi] để mở kênh trao đổi tin nhắn, làm rõ đề bài và khởi tạo Thỏa thuận Deal Ticket chính thức.',
        targetX: 1108,
        targetY: 632,
        labelX: 880,
        labelY: 632,
        path: 'M 880 632 L 1095 632',
      },
    ],
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
    imageCaption: 'Giao diện Chi tiết Task & Thêm Work Log mới',
    imageNotes:
      'Giao diện trực quan với nút "+ Thêm Work Log" màu cam, lịch sử Work Log từng buổi, trạng thái xác nhận và nút trao đổi tin nhắn nhanh.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: 'Nút "+ Thêm Work Log" màu cam',
        shortLabel: 'Nút + Thêm Work Log',
        description: 'Bấm nút [+ Thêm Work Log] sau mỗi buổi làm việc để ghi lại nhật ký, nội dung giảng dạy và sản phẩm bàn giao.',
        targetX: 794,
        targetY: 874,
        labelX: 794,
        labelY: 805,
        path: 'M 794 805 L 794 862',
      },
      {
        id: 2,
        title: 'Thẻ Work Log ghi nhận từng phiên',
        shortLabel: 'Nhật ký buổi hướng dẫn (Log #1)',
        description: 'Liệt kê tóm tắt buổi hướng dẫn, nội dung đạt được và ngày thực hiện để học viên xác nhận trong vòng 72 giờ.',
        targetX: 405,
        targetY: 968,
        labelX: 740,
        labelY: 1030,
        path: 'M 740 1030 L 405 1030 L 405 980',
      },
      {
        id: 3,
        title: 'Thỏa thuận gốc #DEAL và thông tin nhiệm vụ',
        shortLabel: 'Thỏa thuận gốc #DEAL',
        description: 'Xem lại thỏa thuận ban đầu, mức thù lao đã chốt và mở tin nhắn trao đổi nhanh với học viên.',
        targetX: 1050,
        targetY: 975,
        labelX: 1050,
        labelY: 900,
        path: 'M 1050 900 L 1050 963',
      },
    ],
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
    imageCaption: 'Bảng kê Thu nhập & Lịch sử Chuyển khoản Payout',
    imageNotes:
      'Bảng điều khiển chi tiết số tiền "Đã nhận", "Đang xử lý", danh sách Task kèm tên học viên, số tiền và trạng thái chuyển khoản tự động.',
    callouts: [
      {
        id: 1,
        title: 'Thẻ tổng quan thu nhập "Đã nhận"',
        shortLabel: 'Tổng quan Đã nhận',
        description: 'Tổng số tiền thù lao đã giải ngân thành công sau khi học viên bấm nghiệm thu nhiệm vụ.',
        targetX: 460,
        targetY: 319,
        labelX: 460,
        labelY: 235,
        path: 'M 460 235 L 460 308',
      },
      {
        id: 2,
        title: 'Bảng kê chi tiết Task hoàn thành',
        shortLabel: 'Bảng kê chi tiết Task',
        description: 'Danh sách các Task đã bàn giao, thông tin học viên (Lê Thảo Vy) và mức thù lao tương ứng (350.000 đ).',
        targetX: 420,
        targetY: 455,
        labelX: 450,
        labelY: 545,
        path: 'M 450 545 L 420 545 L 420 468',
      },
      {
        id: 3,
        title: 'Huy hiệu "Đã chuyển" giải ngân thành công',
        shortLabel: 'Huy hiệu Đã chuyển',
        description: 'Trạng thái chuyển khoản tự động về tài khoản ngân hàng của bạn, minh bạch và an toàn 100%.',
        targetX: 886,
        targetY: 453,
        labelX: 886,
        labelY: 545,
        path: 'M 886 545 L 886 465',
      },
    ],
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

const GUIDE_IMAGE_VERSION = '?v=20261118_v11'

export function MentoringGuide() {
  const [activeRole, setActiveRole] = useState<RoleType>('student')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [hoveredCallout, setHoveredCallout] = useState<{ step: number; id: number } | null>(null)
  const [modalHoveredCallout, setModalHoveredCallout] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<{
    src: string
    title: string
    notes?: string
    callouts?: CalloutPin[]
    imageWidth?: number
    imageHeight?: number
  } | null>(null)

  const steps = activeRole === 'student' ? STUDENT_STEPS : MENTOR_STEPS

  const toggleFaq = (index: number) => {
    setExpandedFaq((current) => (current === index ? null : index))
  }

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null)
        setModalHoveredCallout(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Lightbox Modal phóng to ảnh kèm Khoanh chú thích tương tác */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => {
            setPreviewImage(null)
            setModalHoveredCallout(null)
          }}
        >
          <div
            className="relative max-h-[94vh] max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-2xl border border-white/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h4 className="ml-2 text-xs font-bold text-text truncate max-w-[550px]">
                  {previewImage.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null)
                  setModalHoveredCallout(null)
                }}
                className="grid h-8 w-8 place-items-center rounded-xl text-text-subtle hover:bg-surface-3 hover:text-text transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vùng hiển thị ảnh phóng to */}
            <div className="max-h-[70vh] overflow-y-auto bg-surface-2/40 p-3">
              <div className="relative mx-auto inline-block w-full">
                <img
                  src={`${previewImage.src}${GUIDE_IMAGE_VERSION}`}
                  alt={previewImage.title}
                  className="w-full h-auto rounded-lg shadow-xs block"
                />

                {/* SVG Leader Lines & Target Anchor Dots trong Modal */}
                {(() => {
                  const modalImgW = previewImage.imageWidth || 1280
                  const modalImgH =
                    previewImage.imageHeight || (previewImage.src?.includes('step4') ? 1200 : 800)
                  return (
                    <>
                      <svg
                        viewBox={`0 0 ${modalImgW} ${modalImgH}`}
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      >
                        {previewImage.callouts?.map((c) => {
                          const isHovered = modalHoveredCallout === c.id
                          return (
                            <g key={c.id} className="transition-all duration-200">
                              {/* Target Halo */}
                              <circle
                                cx={c.targetX}
                                cy={c.targetY}
                                r={isHovered ? 13 : 9.5}
                                className={cn(
                                  'transition-all duration-200',
                                  isHovered
                                    ? 'fill-primary-solid/35 stroke-primary-solid stroke-[2px]'
                                    : 'fill-primary-solid/15 stroke-primary-solid/65 stroke-[1.5px]'
                                )}
                              />
                              {/* Target Dot */}
                              <circle
                                cx={c.targetX}
                                cy={c.targetY}
                                r={isHovered ? 5.5 : 4.5}
                                className="fill-primary-solid stroke-white stroke-[2.5px] [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.35))]"
                              />
                              {/* Connector Leader Line */}
                              <path
                                d={c.path}
                                className={cn(
                                  'fill-none transition-all duration-200 stroke-linecap-round stroke-linejoin-round',
                                  isHovered
                                    ? 'stroke-primary-solid stroke-[2.5px] [filter:drop-shadow(0_0_6px_rgba(242,112,36,0.8))]'
                                    : 'stroke-primary-solid/85 stroke-[1.8px] [filter:drop-shadow(0_1px_3px_rgba(242,112,36,0.35))]'
                                )}
                              />
                            </g>
                          )
                        })}
                      </svg>

                      {/* Nhãn chữ chỉ dẫn (Pill Labels) nổi trên ảnh trong Modal */}
                      {previewImage.callouts?.map((c) => {
                        const isHovered = modalHoveredCallout === c.id
                        const xPct = (c.labelX / modalImgW) * 100
                        const yPct = (c.labelY / modalImgH) * 100

                        return (
                          <button
                            key={c.id}
                            type="button"
                            style={{
                              left: `${xPct}%`,
                              top: `${yPct}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            onMouseEnter={() => setModalHoveredCallout(c.id)}
                            onMouseLeave={() => setModalHoveredCallout(null)}
                            className={cn(
                              'absolute inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs border transition-all duration-200 cursor-pointer pointer-events-auto z-20 max-w-[220px]',
                              isHovered
                                ? 'bg-white text-primary-solid border-primary-solid shadow-[0_4px_16px_rgba(242,112,36,0.45)] ring-2 ring-primary-solid/30 scale-105'
                                : 'bg-white/95 text-text border-primary-solid/80 hover:bg-white hover:border-primary-solid hover:scale-102'
                            )}
                            title={`Vị trí ${c.id}: ${c.title}`}
                          >
                            <span
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-solid font-black text-white text-[10px] transition-transform',
                                isHovered ? 'scale-110' : ''
                              )}
                            >
                              {c.id}
                            </span>
                            <span className="truncate">{c.shortLabel}</span>
                          </button>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Bảng chú thích danh sách các điểm thao tác */}
            {previewImage.callouts && previewImage.callouts.length > 0 && (
              <div className="border-t border-border bg-surface px-5 py-3.5 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {previewImage.callouts.map((c) => {
                    const isHovered = modalHoveredCallout === c.id
                    return (
                      <div
                        key={c.id}
                        onMouseEnter={() => setModalHoveredCallout(c.id)}
                        onMouseLeave={() => setModalHoveredCallout(null)}
                        className={cn(
                          'flex items-start gap-2.5 text-[11.5px] leading-snug rounded-xl p-2.5 border transition-all duration-200 cursor-pointer',
                          isHovered
                            ? 'border-primary-solid bg-primary-soft shadow-xs ring-2 ring-primary-solid/30 scale-[1.01]'
                            : 'bg-primary-soft/30 border-primary-soft-border/70 hover:bg-primary-soft/60'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-black text-white text-[11px] transition-all',
                            isHovered
                              ? 'bg-primary-solid scale-110 shadow-md ring-2 ring-primary-solid ring-offset-1'
                              : 'bg-primary-solid shadow-xs'
                          )}
                        >
                          {c.id}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-text truncate">{c.title}</p>
                          <p className="text-text-muted text-[11px] line-clamp-2 mt-0.5">
                            {c.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
              <span>Chuẩn quy định</span>
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
            <span>Dành cho Sinh viên / Người học</span>
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
            <span>Dành cho Cố vấn</span>
          </button>
        </div>
      </Card>

      {/* 5-Step Process Timeline with Actual Web Screenshots & Red Callouts */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-solid text-xs text-white">
              5
            </span>
            <span>Quy trình làm việc dành cho {activeRole === 'student' ? 'Học viên' : 'Cố vấn'}</span>
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map((item) => {
            return (
              <Card
                key={item.step}
                className="overflow-hidden border-border bg-surface p-5 sm:p-6 shadow-2xs transition hover:border-primary-soft-border"
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Cột trái: Thông tin bước, Mô tả & Danh mục thao tác chính */}
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

                      {/* Danh mục các vị trí thao tác chính */}
                      <div className="space-y-2 pt-1">
                        {item.callouts.map((c) => {
                          const isHovered =
                            hoveredCallout?.step === item.step && hoveredCallout?.id === c.id
                          return (
                            <div
                              key={c.id}
                              onMouseEnter={() => setHoveredCallout({ step: item.step, id: c.id })}
                              onMouseLeave={() => setHoveredCallout(null)}
                              className={cn(
                                'flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-200 cursor-pointer',
                                isHovered
                                  ? 'border-primary-solid bg-primary-soft/80 shadow-2xs'
                                  : 'border-primary-soft-border/80 bg-primary-soft/30 hover:bg-primary-soft/60'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-black text-white text-[11px] transition-all',
                                  isHovered
                                    ? 'bg-primary-solid shadow-xs ring-2 ring-primary-solid/25'
                                    : 'bg-primary-solid shadow-xs'
                                )}
                              >
                                {c.id}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-text text-xs leading-tight">{c.title}</p>
                                <p className="mt-0.5 text-[11.5px] text-text-muted leading-relaxed">
                                  {c.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
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
                  <div className="lg:col-span-6 flex flex-col justify-start">
                    <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/40 shadow-xs transition hover:shadow-md">
                      {/* Browser Frame Top Bar */}
                      <div className="flex items-center justify-between border-b border-border/80 bg-surface-2/90 px-3 py-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="font-mono text-[10px] font-semibold text-text-subtle truncate max-w-[280px] sm:max-w-[360px]">
                          {item.imageCaption}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              src: item.image,
                              title: item.title,
                              notes: item.imageNotes,
                              callouts: item.callouts,
                              imageWidth: item.imageWidth,
                              imageHeight: item.imageHeight,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-text-subtle hover:text-primary-solid bg-surface px-2 py-0.5 rounded-md border border-border shadow-2xs hover:border-primary-soft-border transition cursor-pointer shrink-0"
                          title="Phóng to ảnh (Lightbox)"
                        >
                          <ZoomIn size={12} />
                          <span>Phóng to</span>
                        </button>
                      </div>

                      {/* Image container */}
                      <div className="group relative overflow-hidden bg-surface-2">
                        <img
                          src={`${item.image}${GUIDE_IMAGE_VERSION}`}
                          alt={item.title}
                          className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.005] cursor-pointer"
                          onClick={() =>
                            setPreviewImage({
                              src: item.image,
                              title: item.title,
                              notes: item.imageNotes,
                              callouts: item.callouts,
                              imageWidth: item.imageWidth,
                              imageHeight: item.imageHeight,
                            })
                          }
                          loading="lazy"
                        />

                        {/* SVG Leader Lines & Target Anchor Dots */}
                        {(() => {
                          const imgW = item.imageWidth || 1280
                          const imgH =
                            item.imageHeight || (item.image.includes('step4') ? 1200 : 800)
                          return (
                            <>
                              <svg
                                viewBox={`0 0 ${imgW} ${imgH}`}
                                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                              >
                                {item.callouts.map((c) => {
                                  const isHovered =
                                    hoveredCallout?.step === item.step && hoveredCallout?.id === c.id
                                  return (
                                    <g key={c.id} className="transition-all duration-200">
                                      {/* Target Halo */}
                                      <circle
                                        cx={c.targetX}
                                        cy={c.targetY}
                                        r={isHovered ? 13 : 9.5}
                                        className={cn(
                                          'transition-all duration-200',
                                          isHovered
                                            ? 'fill-primary-solid/35 stroke-primary-solid stroke-[2px]'
                                            : 'fill-primary-solid/15 stroke-primary-solid/65 stroke-[1.5px]'
                                        )}
                                      />
                                      {/* Target Dot */}
                                      <circle
                                        cx={c.targetX}
                                        cy={c.targetY}
                                        r={isHovered ? 5.5 : 4.5}
                                        className="fill-primary-solid stroke-white stroke-[2.5px] [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.35))]"
                                      />
                                      {/* Connector Leader Line */}
                                      <path
                                        d={c.path}
                                        className={cn(
                                          'fill-none transition-all duration-200 stroke-linecap-round stroke-linejoin-round',
                                          isHovered
                                            ? 'stroke-primary-solid stroke-[2.5px] [filter:drop-shadow(0_0_6px_rgba(242,112,36,0.8))]'
                                            : 'stroke-primary-solid/85 stroke-[1.8px] [filter:drop-shadow(0_1px_3px_rgba(242,112,36,0.35))]'
                                        )}
                                      />
                                    </g>
                                  )
                                })}
                              </svg>

                              {/* Nhãn chữ chỉ dẫn (Pill Labels) nổi trên ảnh */}
                              {item.callouts.map((c) => {
                                const isHovered =
                                  hoveredCallout?.step === item.step && hoveredCallout?.id === c.id
                                const xPct = (c.labelX / imgW) * 100
                                const yPct = (c.labelY / imgH) * 100

                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    style={{
                                      left: `${xPct}%`,
                                      top: `${yPct}%`,
                                      transform: 'translate(-50%, -50%)',
                                    }}
                                    onMouseEnter={() => setHoveredCallout({ step: item.step, id: c.id })}
                                    onMouseLeave={() => setHoveredCallout(null)}
                                    onClick={() =>
                                      setPreviewImage({
                                        src: item.image,
                                        title: item.title,
                                        notes: item.imageNotes,
                                        callouts: item.callouts,
                                        imageWidth: item.imageWidth,
                                        imageHeight: item.imageHeight,
                                      })
                                    }
                                    className={cn(
                                      'absolute inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold shadow-xs border transition-all duration-200 cursor-pointer pointer-events-auto z-20 max-w-[155px] sm:max-w-[210px]',
                                      isHovered
                                        ? 'bg-white text-primary-solid border-primary-solid shadow-[0_4px_16px_rgba(242,112,36,0.45)] ring-2 ring-primary-solid/30 scale-105'
                                        : 'bg-white/95 text-text border-primary-solid/80 hover:bg-white hover:border-primary-solid hover:scale-102'
                                    )}
                                    title={`Vị trí ${c.id}: ${c.title} (Bấm để phóng to)`}
                                  >
                                    <span
                                      className={cn(
                                        'flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full bg-primary-solid font-black text-white text-[9px] sm:text-[10px] transition-transform',
                                        isHovered ? 'scale-110' : ''
                                      )}
                                    >
                                      {c.id}
                                    </span>
                                    <span className="truncate">{c.shortLabel}</span>
                                  </button>
                                )
                              })}
                            </>
                          )
                        })()}
                      </div>

                      {/* Chú thích chân ảnh */}
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
