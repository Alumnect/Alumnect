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
    title: 'Khám phá & Chọn lọc Cố vấn phù hợp',
    subtitle: 'Tìm kiếm người hướng dẫn theo chuyên ngành, kỹ năng và mức độ uy tín',
    description:
      'Truy cập mục "Khám phá Cố vấn" để duyệt danh sách các cựu sinh viên FPT giàu kinh nghiệm. Bạn có thể sử dụng bộ lọc chuyên sâu theo Chuyên ngành, Lĩnh vực hoạt động, Hình thức làm việc hoặc tham khảo Bảng xếp hạng Cố vấn uy tín.',
    icon: Search,
    actionLabel: 'Đến trang Khám phá Cố vấn',
    actionLink: '/app/mentoring/discover',
    image: '/images/guide/student-step1-discover.png',
    imageCaption: 'Giao diện Khám phá & Lọc Cố vấn',
    imageNotes:
      'Giao diện hiển thị số điểm uy tín, số đánh giá, số buổi hoàn thành và các thẻ chuyên ngành nổi bật của từng Cố vấn.',
    callouts: [
      {
        id: 1,
        title: 'Thanh tìm kiếm & sắp xếp Cố vấn',
        shortLabel: 'Thanh tìm kiếm & sắp xếp',
        description: 'Lọc nhanh theo Chuyên ngành (Kỹ thuật phần mềm, An toàn thông tin, Thiết kế đồ họa...), Lĩnh vực và Hình thức hướng dẫn 1-1.',
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
        description: 'Điểm uy tín, số đánh giá thực tế và nút "Xem hồ sơ" để xem chi tiết kinh nghiệm và các gói hỗ trợ của Cố vấn.',
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
        'Lọc theo Chuyên ngành: Kỹ thuật phần mềm, An toàn thông tin, Thiết kế đồ họa...',
        'Hình thức hướng dẫn: Cá nhân 1-1 hoặc Nhóm',
        'Sắp xếp: Điểm uy tín cao nhất hoặc Đánh giá sao tốt nhất',
      ],
      highlight: 'Xem kỹ hồ sơ và đánh giá từ sinh viên khóa trước trước khi gửi yêu cầu',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Hãy bấm vào nút "Xem hồ sơ" để đọc chi tiết kinh nghiệm làm việc, dự án thực tế và các gói hướng dẫn mà Cố vấn cung cấp.',
      },
    ],
  },
  {
    step: 2,
    title: 'Khởi tạo Yêu cầu Cố vấn chi tiết',
    subtitle: 'Mô tả rõ ràng vấn đề kỹ thuật hoặc bài toán cần hỗ trợ',
    description:
      'Sau khi chọn được Cố vấn ưng ý hoặc muốn phát yêu cầu công khai, hãy điền biểu mẫu "Tạo yêu cầu mới". Hãy nêu rõ bối cảnh bài toán, khó khăn hiện tại, mục tiêu kỳ vọng và đính kèm đề cương hoặc tài liệu liên quan.',
    icon: FileText,
    actionLabel: 'Tạo yêu cầu Cố vấn mới',
    actionLink: '/app/mentoring/requests/create',
    image: '/images/guide/student-step2-request.png',
    imageCaption: 'Biểu mẫu Khởi tạo Yêu cầu Cố vấn',
    imageNotes:
      'Mô tả chi tiết và tải lên tài liệu/đề cương giúp hệ thống ghép nối chuẩn xác và Cố vấn phản hồi nhanh hơn.',
    callouts: [
      {
        id: 1,
        title: 'Tiêu đề yêu cầu hỗ trợ',
        shortLabel: 'Tiêu đề yêu cầu',
        description: 'Tóm tắt ngắn gọn bài toán kỹ thuật cần Cố vấn định hướng hoặc tháo gỡ.',
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
        description: 'Chọn chuyên môn kỹ thuật để hệ thống ghép nối chuẩn xác tới các Cố vấn có năng lực chuyên sâu trong ngành.',
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
        'Tiêu đề yêu cầu: Tóm tắt ngắn gọn bài toán cần hỗ trợ',
        'Mô tả chi tiết: Bối cảnh, lỗi kỹ thuật đang gặp hoặc định hướng mục tiêu tốt nghiệp',
        'Lĩnh vực / Chuyên môn hỗ trợ & Đính kèm tài liệu',
      ],
      highlight: 'Tối thiểu 20 ký tự, hỗ trợ đính kèm tệp tài liệu tối đa 25MB',
    },
    notes: [
      {
        type: 'tip',
        text: 'Ghi chú: Mô tả càng rõ ràng thì Cố vấn càng dễ đánh giá tính khả thi và chủ động đề xuất mức ngân sách hợp lý cho bạn.',
      },
    ],
  },
  {
    step: 3,
    title: 'Thống nhất Thỏa thuận & Ký quỹ an toàn',
    subtitle: 'Bảo vệ nguồn tiền 100% qua tài khoản trung gian AlumNect',
    description:
      'Sau khi trao đổi qua kênh tin nhắn, Cố vấn sẽ khởi tạo Thỏa thuận. Bạn kiểm tra kỹ Mức giá thỏa thuận, Hạn chót và Phạm vi công việc. Sau khi bấm [Xác nhận thỏa thuận], bạn thực hiện thanh toán qua cổng PayOS để nạp tiền vào quỹ ký quỹ.',
    icon: CreditCard,
    actionLabel: 'Xem danh sách Thỏa thuận',
    actionLink: '/app/mentoring/deals',
    image: '/images/guide/student-step3-deals.png',
    imageCaption: 'Giao diện Thỏa thuận & Nút Mở nhiệm vụ',
    imageNotes:
      'Khi trạng thái chuyển sang "Đã thanh toán", tiền được giữ an toàn tại quỹ ký quỹ AlumNect. Nút mở nhiệm vụ sẽ xuất hiện để bắt đầu làm việc.',
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Đã thanh toán (Ký quỹ)',
        shortLabel: 'Đã thanh toán ký quỹ',
        description: 'Huy hiệu xanh lá "Đã thanh toán" xác nhận nguồn tiền của bạn đã vào quỹ bảo đảm ký quỹ AlumNect an toàn 100%.',
        targetX: 408,
        targetY: 363,
        labelX: 640,
        labelY: 312,
        path: 'M 640 312 L 408 312 L 408 352',
      },
      {
        id: 2,
        title: 'Mức giá thỏa thuận & Hạn chót',
        shortLabel: 'Mức giá & Hạn chót',
        description: 'Chi phí cam kết cố định không phát sinh phụ phí và mốc thời gian hoàn thành nhiệm vụ rõ ràng.',
        targetX: 830,
        targetY: 586,
        labelX: 765,
        labelY: 480,
        path: 'M 765 480 L 830 480 L 830 574',
      },
      {
        id: 3,
        title: 'Nút mở nhiệm vụ để bắt đầu',
        shortLabel: 'Nút Mở nhiệm vụ',
        description: 'Bấm nút mở nhiệm vụ để truy cập không gian làm việc, theo dõi tiến trình 3 giai đoạn và nhận nhật ký công việc từ Cố vấn.',
        targetX: 540,
        targetY: 669,
        labelX: 540,
        labelY: 745,
        path: 'M 540 745 L 540 682',
      },
    ],
    mockup: {
      badge: 'Thỏa thuận cố vấn',
      title: 'Cơ chế Ký quỹ An toàn',
      items: [
        'Mức giá: Được cố định và không thay đổi trong suốt quá trình thực hiện',
        'Quỹ ký quỹ: Tiền của bạn chưa chuyển cho Cố vấn mà được AlumNect tạm giữ bảo đảm',
        'Thanh toán PayOS: Quét mã VietQR chuyển khoản tức thì, xác nhận tự động trong 5 giây',
      ],
      highlight: 'Tuyệt đối không chuyển khoản cá nhân ngoài hệ thống để tránh mất quyền bảo hộ',
    },
    notes: [
      {
        type: 'warning',
        text: 'Lưu ý: Tiền ký quỹ chỉ được giải ngân cho Cố vấn khi bạn chính thức bấm [Nghiệm thu] sau khi hoàn thành nhiệm vụ.',
      },
    ],
  },
  {
    step: 4,
    title: 'Theo dõi Tiến độ & Phản hồi Nhật ký công việc trong 72 giờ',
    subtitle: 'Quy tắc 72 giờ phản hồi đối soát nhật ký công việc',
    description:
      'Trong quá trình hướng dẫn, Cố vấn có trách nhiệm ghi nhận nhật ký công việc chi tiết sau mỗi buổi (nội dung thực hiện, kết quả, tài liệu). Khi Cố vấn gửi nhật ký, bạn cần kiểm tra và bấm [Xác nhận] hoặc phản hồi chỉnh sửa. Nếu có khiếu nại, bạn phải phản hồi trong vòng 72 giờ.',
    icon: Clock,
    actionLabel: 'Xem chi tiết Nhiệm vụ & Nhật ký công việc',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/student-step4-task.png',
    imageCaption: 'Chi tiết Nhiệm vụ công việc & Theo dõi Nhật ký',
    imageNotes:
      'Hiển thị rõ 3 giai đoạn tiến trình (Chuẩn bị -> Đang thực hiện -> Kết thúc & Nghiệm thu), thông tin thời hạn hoàn thành và danh sách nhật ký từng buổi.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: 'Tiến trình Nhiệm vụ 3 Giai đoạn',
        shortLabel: 'Tiến trình 3 giai đoạn',
        description: 'Thanh tiến độ phần trăm và 3 giai đoạn trực quan: Giai đoạn 1 (Chuẩn bị), Giai đoạn 2 (Đang thực hiện), Giai đoạn 3 (Kết thúc & Nghiệm thu).',
        targetX: 675,
        targetY: 388,
        labelX: 675,
        labelY: 275,
        path: 'M 675 275 L 675 372',
      },
      {
        id: 2,
        title: 'Thời hạn hoàn thành nhiệm vụ',
        shortLabel: 'Thời hạn hoàn thành',
        description: 'Mốc thời gian hạn chót cam kết hoàn thành công việc để hai bên cùng đối chiếu tiến độ.',
        targetX: 544,
        targetY: 615,
        labelX: 700,
        labelY: 530,
        path: 'M 700 530 L 544 530 L 544 602',
      },
      {
        id: 3,
        title: 'Nhật ký công việc & Căn cứ 72 giờ',
        shortLabel: 'Nhật ký công việc',
        description: 'Chi tiết từng buổi học (tóm tắt, nội dung, sản phẩm đạt được) và nút xác nhận. QUAN TRỌNG: Quá 72 giờ không phản hồi là căn cứ pháp lý để Ban Quản trị tự động xác nhận kết quả.',
        targetX: 796,
        targetY: 968,
        labelX: 796,
        labelY: 880,
        path: 'M 796 880 L 796 955',
      },
    ],
    mockup: {
      badge: 'Quản lý Tiến trình 3 Giai đoạn',
      title: 'Quy tắc nghiệm thu Nhật ký công việc & Thời hạn',
      items: [
        'Giai đoạn 1 (Chuẩn bị): Kích hoạt thỏa thuận và chuẩn bị tài liệu',
        'Giai đoạn 2 (Đang thực hiện): Cố vấn gửi nhật ký công việc từng phiên hướng dẫn',
        'Giai đoạn 3 (Kết thúc): Nghiệm thu bàn giao sản phẩm cuối cùng',
      ],
      highlight: 'Thời hạn 72 giờ: Quá 72 giờ không phản hồi là căn cứ pháp lý để tự động xác nhận nhật ký công việc',
    },
    notes: [
      {
        type: 'warning',
        text: 'QUAN TRỌNG: Học viên có trách nhiệm kiểm tra nhật ký công việc trong vòng 72 giờ kể từ khi Cố vấn gửi. Nếu quá 72 giờ mà bạn không phản hồi hay khiếu nại, hệ thống và Ban Quản trị sẽ mặc định tự động xác nhận kết quả.',
      },
      {
        type: 'tip',
        text: 'Quy tắc vắng mặt: Nếu bạn vào trễ quá 15 phút so với lịch hẹn mà không thông báo trước, Cố vấn có quyền ghi nhận nhật ký công việc phiên đó và tính vào tiến độ hoàn thành.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nghiệm thu Hoàn tất hoặc Khiếu nại Hoàn tiền',
    subtitle: 'Bảo vệ quyền lợi học viên và giải ngân minh bạch',
    description:
      'Khi nhiệm vụ kết thúc và Cố vấn nộp biên bản hoàn thành, bạn kiểm tra toàn bộ sản phẩm đầu ra và bấm [Nghiệm thu]. Tiền ký quỹ sẽ giải ngân cho Cố vấn và bạn có thể đánh giá sao. Nếu có vi phạm thỏa thuận, bạn có thể mở phiếu khiếu nại tranh chấp hoặc yêu cầu hoàn tiền về tài khoản ngân hàng.',
    icon: CheckCircle2,
    actionLabel: 'Khai báo Tài khoản Nhận Hoàn tiền',
    actionLink: '/app/mentoring/refunds',
    image: '/images/guide/student-step5-refunds.png',
    imageCaption: 'Giao diện Khai báo Tài khoản & Đối soát Hoàn tiền',
    imageNotes:
      'Khai báo số tài khoản ngân hàng chính chủ để nhận hoàn tiền tự động 100% khi có tranh chấp hoặc Cố vấn vi phạm thỏa thuận.',
    callouts: [
      {
        id: 1,
        title: 'Thông báo cảnh báo số tài khoản ngân hàng',
        shortLabel: 'Cảnh báo khai báo STK',
        description: 'Thông báo bắt buộc khai báo số tài khoản chính chủ trước khi kích hoạt hoàn tiền hoặc kết thúc nhiệm vụ.',
        targetX: 550,
        targetY: 296,
        labelX: 550,
        labelY: 235,
        path: 'M 550 235 L 550 285',
      },
      {
        id: 2,
        title: 'Chọn ngân hàng & nhập số tài khoản',
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
        'Thời hiệu khiếu nại: Bạn có tối đa 07 ngày kể từ khi nhiệm vụ hoàn thành để mở phiếu khiếu nại tranh chấp',
        'Hoàn trả 100%: Hoàn tiền toàn bộ nếu Cố vấn không thực hiện hoặc vi phạm nghiêm trọng cam kết',
      ],
      highlight: 'AlumNect cam kết đứng ra hòa giải công tâm dựa trên bằng chứng nhật ký công việc và tin nhắn hệ thống',
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
    title: 'Kích hoạt Hồ sơ Cố vấn & Thông tin Cá nhân',
    subtitle: 'Xác thực năng lực cựu sinh viên và cập nhật lĩnh vực cố vấn',
    description:
      'Để trở thành Cố vấn chính thức, bạn cần hoàn thiện hồ sơ năng lực bao gồm: kinh nghiệm làm việc, công ty hiện tại, chuyên môn kỹ thuật và liên kết tài khoản ngân hàng để nhận thù lao. Hệ thống sẽ tự động đồng bộ và cấp huy hiệu Cố vấn đã xác thực.',
    icon: UserCheck,
    actionLabel: 'Cập nhật Hồ sơ Cố vấn',
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
        description: 'Hồ sơ ở trạng thái Bản nháp cần cập nhật đầy đủ thông tin trước khi gửi duyệt kích hoạt huy hiệu Cố vấn.',
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
        title: 'Nút "Hoàn tất" gửi duyệt hồ sơ',
        shortLabel: 'Nút Hoàn tất hồ sơ',
        description: 'Sau khi điền đủ các mục, bấm nút màu cam [Hoàn tất] để hoàn thành và kích hoạt quyền nhận yêu cầu.',
        targetX: 1101,
        targetY: 685,
        labelX: 900,
        labelY: 615,
        path: 'M 900 615 L 1101 615 L 1101 672',
      },
    ],
    mockup: {
      badge: 'Hồ sơ Cố vấn',
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
        text: 'Mẹo: Cập nhật hồ sơ mạng xã hội nghề nghiệp và kinh nghiệm thực chiến tại các doanh nghiệp lớn để đạt điểm uy tín cao trên Bảng xếp hạng Cố vấn.',
      },
    ],
  },
  {
    step: 2,
    title: 'Kích hoạt Gói dịch vụ Cố vấn',
    subtitle: 'Mở khóa tính năng kết nối và bảo trợ tài chính hệ thống',
    description:
      'Lựa chọn gói dịch vụ cố vấn phù hợp (Gói Tiêu chuẩn 1 tháng, Gói Phổ biến 3 tháng hoặc Gói Cao cấp 6 tháng). Gói dịch vụ giúp duy trì huy hiệu Cố vấn chính thức trên hệ thống, quyền nhận tối đa 5 nhiệm vụ hoạt động đồng thời và hưởng chính sách bảo trợ thanh toán tự động qua PayOS.',
    icon: CreditCard,
    actionLabel: 'Xem các Gói dịch vụ Cố vấn',
    actionLink: '/app/mentoring/packages',
    image: '/images/guide/mentor-step2-packages.png',
    imageCaption: 'Bảng Gói dịch vụ Cố vấn',
    imageNotes:
      'Hiển thị thời hạn gói đang dùng, chi phí theo kỳ hạn, huy hiệu Cố vấn trên hồ sơ và kết nối cổng đối soát thù lao PayOS.',
    callouts: [
      {
        id: 1,
        title: 'Thông báo Gói dịch vụ đang kích hoạt',
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
        shortLabel: 'Bảng 3 gói dịch vụ Cố vấn',
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
        description: 'Huy hiệu xác thực Cố vấn và hệ thống bảo trợ đối soát thù lao tự động 100% qua cổng thanh toán PayOS.',
        targetX: 1058,
        targetY: 704,
        labelX: 762,
        labelY: 704,
        path: 'M 762 704 L 1045 704',
      },
    ],
    mockup: {
      badge: 'Gói Dịch Vụ Cố Vấn',
      title: 'Quyền lợi dành cho Cố vấn có gói kích hoạt',
      items: [
        'Huy hiệu Cố vấn nổi bật trên trang Khám phá & Hồ sơ',
        'Quyền nhận yêu cầu trực tiếp từ sinh viên và tạo Thỏa thuận',
        'Bảo trợ dòng tiền: Tự động đối soát và giải ngân thù lao qua cổng PayOS',
      ],
      highlight: 'Hỗ trợ thanh toán linh hoạt bằng quét mã VietQR PayOS trong 5 giây',
    },
    notes: [
      {
        type: 'tip',
        text: 'Lưu ý: Bạn có thể kiểm tra thời hạn gói dịch vụ tại mục "Gói dịch vụ" trên thanh điều hướng bên trái bất cứ lúc nào.',
      },
    ],
  },
  {
    step: 3,
    title: 'Tiếp nhận Yêu cầu & Tạo Thỏa thuận',
    subtitle: 'Chủ động thương lượng phạm vi, giá thù lao và thời hạn hoàn thành',
    description:
      'Khi sinh viên gửi yêu cầu, bạn sẽ nhận được thông báo tại mục "Yêu cầu gửi đến". Bạn có thể bấm [Xem & phản hồi] để trò chuyện với sinh viên, trao đổi làm rõ đề bài. Sau khi đồng thuận, bạn khởi tạo Thỏa thuận với số tiền (VNĐ), thời hạn hoàn thành và cam kết đầu ra.',
    icon: MessageSquare,
    actionLabel: 'Xem Hòm thư Yêu cầu gửi đến',
    actionLink: '/app/mentoring/incoming-requests',
    image: '/images/guide/mentor-step3-incoming.png',
    imageCaption: 'Hòm thư Tiếp nhận Yêu cầu Cố vấn',
    imageNotes:
      'Xem thông tin chi tiết sinh viên, tiêu đề nhu cầu, hình thức (Trực tuyến/Trực tiếp), hạn chót và nút hành động "Xem & phản hồi".',
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Chờ phản hồi & Thông tin Sinh viên',
        shortLabel: 'Thông tin sinh viên',
        description: 'Hiển thị rõ thông tin sinh viên gửi yêu cầu, khóa học (K16/K18 FPTU) và thời gian gửi đến.',
        targetX: 460,
        targetY: 452,
        labelX: 760,
        labelY: 452,
        path: 'M 760 452 L 472 452',
      },
      {
        id: 2,
        title: 'Tiêu đề nhu cầu, Mức ngân sách & Hạn chót',
        shortLabel: 'Nhu cầu & Ngân sách',
        description: 'Tóm tắt bài toán kỹ thuật, mức ngân sách đề xuất (300.000đ - 700.000đ), hình thức và hạn chót mong muốn.',
        targetX: 595,
        targetY: 572,
        labelX: 520,
        labelY: 745,
        path: 'M 520 745 L 595 745 L 595 584',
      },
      {
        id: 3,
        title: 'Nút "Xem & phản hồi"',
        shortLabel: 'Nút Xem & phản hồi',
        description: 'Bấm nút [Xem & phản hồi] để mở kênh trao đổi tin nhắn, làm rõ đề bài và khởi tạo Thỏa thuận chính thức.',
        targetX: 1108,
        targetY: 632,
        labelX: 860,
        labelY: 632,
        path: 'M 860 632 L 1095 632',
      },
    ],
    mockup: {
      badge: 'Quy trình khởi tạo Thỏa thuận',
      title: 'Các điều khoản cần chốt trong Thỏa thuận',
      items: [
        'Mức thù lao thỏa thuận: Số nguyên dương VNĐ (Ví dụ: 650.000 đ)',
        'Hạn chót hoàn thành: Ngày giờ kết thúc nhiệm vụ',
        'Phạm vi cam kết: Số buổi hướng dẫn, tài liệu bàn giao, hỗ trợ đánh giá',
      ],
      highlight: 'Sau khi sinh viên thanh toán ký quỹ, nhiệm vụ sẽ tự động được kích hoạt sang Giai đoạn 2',
    },
    notes: [
      {
        type: 'tip',
        text: 'Gợi ý: Luôn trao đổi kỹ năng lực hiện tại của học viên để đặt thời hạn hoàn thành khả thi, tránh phải xin gia hạn về sau.',
      },
    ],
  },
  {
    step: 4,
    title: 'Thực hiện Hướng dẫn & Ghi nhận Nhật ký công việc từng buổi',
    subtitle: 'Căn cứ pháp lý cốt lõi để nhận thù lao và giải quyết tranh chấp',
    description:
      'Sau mỗi phiên hướng dẫn, hãy bấm nút thêm nhật ký công việc trong trang chi tiết nhiệm vụ để ghi nhận nội dung đã giảng dạy, bài tập giao về và sản phẩm học viên làm được. Đây là bằng chứng pháp lý quan trọng nhất để Ban Quản trị tự động xác nhận kết quả và giải ngân tiền cho bạn khi sinh viên im lặng quá 72 giờ.',
    icon: Clock,
    actionLabel: 'Đến trang Quản lý Nhiệm vụ & Nhật ký',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/mentor-step4-tasks.png',
    imageCaption: 'Giao diện Chi tiết Nhiệm vụ & Thêm Nhật ký mới',
    imageNotes:
      'Giao diện trực quan với nút thêm nhật ký công việc, lịch sử nhật ký từng buổi, trạng thái xác nhận và nút trao đổi tin nhắn nhanh.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: 'Nút thêm nhật ký công việc',
        shortLabel: 'Nút Thêm nhật ký',
        description: 'Bấm nút thêm nhật ký sau mỗi buổi làm việc để ghi lại nhật ký, nội dung giảng dạy và sản phẩm bàn giao.',
        targetX: 794,
        targetY: 874,
        labelX: 660,
        labelY: 775,
        path: 'M 660 775 L 794 775 L 794 862',
      },
      {
        id: 2,
        title: 'Thẻ Nhật ký công việc ghi nhận từng phiên',
        shortLabel: 'Nhật ký buổi hướng dẫn',
        description: 'Liệt kê tóm tắt buổi hướng dẫn, nội dung đạt được và ngày thực hiện để học viên xác nhận trong vòng 72 giờ.',
        targetX: 405,
        targetY: 968,
        labelX: 680,
        labelY: 1040,
        path: 'M 680 1040 L 405 1040 L 405 980',
      },
      {
        id: 3,
        title: 'Thỏa thuận gốc và thông tin nhiệm vụ',
        shortLabel: 'Thỏa thuận gốc',
        description: 'Xem lại thỏa thuận ban đầu, mức thù lao đã chốt và mở tin nhắn trao đổi nhanh với học viên.',
        targetX: 1050,
        targetY: 975,
        labelX: 900,
        labelY: 905,
        path: 'M 900 905 L 1050 905 L 1050 963',
      },
    ],
    mockup: {
      badge: 'Căn cứ bảo hộ thù lao',
      title: 'Quy tắc Nhật ký công việc & Pháp lý 72 giờ',
      items: [
        'Nội dung buổi học: Ghi rõ chủ đề, kiến thức truyền đạt và đường dẫn minh chứng',
        'Quy tắc vắng mặt 15 phút: Học viên trễ quá 15 phút không báo trước vẫn được tính là 01 nhật ký hợp lệ',
        'Pháp lý 72 giờ: Nếu học viên im lặng quá 72 giờ kể từ lúc gửi nhật ký, hệ thống mặc định tự động xác nhận buổi học',
      ],
      highlight: 'Ghi nhật ký đầy đủ giúp bạn được bảo vệ 100% thù lao dù học viên có biến mất hay không phản hồi',
    },
    notes: [
      {
        type: 'warning',
        text: 'CĂN CỨ PHÁP LÝ QUAN TRỌNG: Học viên có 72 giờ để phản hồi nhật ký công việc. Nếu sau 72 giờ học viên không có phản hồi hay khiếu nại, hệ thống và Ban Quản trị sẽ mặc định tự động xác nhận kết quả và thực hiện giải ngân cho bạn.',
      },
      {
        type: 'tip',
        text: 'Mẹo: Khi gặp khó khăn về tiến độ, hãy sử dụng tính năng "Gia hạn thời hạn" trước khi hết hạn chót để giữ điểm uy tín.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nộp Nghiệm thu & Nhận Thù lao Tự động',
    subtitle: 'Tiền tự động chuyển về tài khoản ngân hàng liên kết',
    description:
      'Khi đã hoàn thành trọn vẹn mục tiêu của nhiệm vụ, bạn nộp biên bản nghiệm thu cuối cùng. Ngay khi học viên bấm Nghiệm thu (hoặc Ban Quản trị can thiệp giải ngân đối soát), tiền thù lao từ quỹ ký quỹ sẽ tự động được chuyển thẳng về tài khoản ngân hàng của bạn qua cổng PayOS.',
    icon: DollarSign,
    actionLabel: 'Xem Bảng kê Thu nhập & Lịch sử Giải ngân',
    actionLink: '/app/mentoring/earnings',
    image: '/images/guide/mentor-step5-earnings.png',
    imageCaption: 'Bảng kê Thu nhập & Lịch sử Chuyển khoản Giải ngân',
    imageNotes:
      'Bảng điều khiển chi tiết số tiền "Đã nhận", "Đang xử lý", danh sách nhiệm vụ kèm tên học viên, số tiền và trạng thái chuyển khoản tự động.',
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
        title: 'Bảng kê chi tiết nhiệm vụ hoàn thành',
        shortLabel: 'Bảng kê chi tiết nhiệm vụ',
        description: 'Danh sách các nhiệm vụ đã bàn giao, thông tin học viên (Lê Thảo Vy) và mức thù lao tương ứng (350.000 đ).',
        targetX: 420,
        targetY: 455,
        labelX: 450,
        labelY: 540,
        path: 'M 450 540 L 420 540 L 420 468',
      },
      {
        id: 3,
        title: 'Huy hiệu "Đã chuyển" giải ngân thành công',
        shortLabel: 'Huy hiệu Đã chuyển',
        description: 'Trạng thái chuyển khoản tự động về tài khoản ngân hàng của bạn, minh bạch và an toàn 100%.',
        targetX: 886,
        targetY: 453,
        labelX: 860,
        labelY: 640,
        path: 'M 860 640 L 886 640 L 886 465',
      },
    ],
    mockup: {
      badge: 'Thanh toán & Thu nhập',
      title: 'Cơ chế giải ngân tự động qua PayOS',
      items: [
        'Tự động 100%: Tiền chuyển thẳng về tài khoản ngân hàng không cần chờ duyệt thủ công',
        'Minh bạch: Bảng kê chi tiết từng mã nhiệm vụ, ngày giờ giao dịch và biên lai ngân hàng',
        'Bảo hộ quyền tác giả: Tài liệu do bạn soạn thảo vẫn thuộc quyền sở hữu trí tuệ của bạn',
      ],
      highlight: 'AlumNect không thu phí ẩn, số tiền hiển thị trên bảng kê là số tiền thực nhận của bạn',
    },
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Hãy kiểm tra thông tin tài khoản ngân hàng thụ hưởng tại mục Hồ sơ Cố vấn để đảm bảo lệnh chuyển tiền tự động luôn thành công tức thì.',
      },
    ],
  },
]

const STUDENT_STEPS_EN: GuideStep[] = [
  {
    step: 1,
    title: 'Discover & Filter Suitable Mentors',
    subtitle: 'Search for mentors by major, technical skills, and reputation score',
    description:
      'Visit "Discover Mentors" to browse experienced FPT University alumni. Use advanced filters by Major, Industry Domain, Mentoring Format, or check the Mentor Reputation Leaderboard.',
    icon: Search,
    actionLabel: 'Go to Discover Mentors',
    actionLink: '/app/mentoring/discover',
    image: '/images/guide/student-step1-discover.png',
    imageCaption: 'Discover & Filter Mentors Interface',
    imageNotes:
      'Displays reputation score, verified reviews, completed sessions, and specialized major tags for each Mentor.',
    callouts: [
      {
        id: 1,
        title: 'Search Bar & Mentor Sorting',
        shortLabel: 'Search & Sort Bar',
        description: 'Quickly filter by Major (Software Engineering, Information Assurance, Graphic Design...), Domain, and 1-on-1 Format.',
        targetX: 480,
        targetY: 306,
        labelX: 480,
        labelY: 242,
        path: 'M 480 242 L 480 296',
      },
      {
        id: 2,
        title: 'Major & Domain Filter Criteria',
        shortLabel: 'Filter Criteria',
        description: 'Detailed filters by Domain, Major, Working Mode, and Mentoring Format.',
        targetX: 658,
        targetY: 421,
        labelX: 658,
        labelY: 368,
        path: 'M 658 368 L 658 410',
      },
      {
        id: 3,
        title: 'Reputation Score & View Profile Button',
        shortLabel: 'View Profile Button',
        description: 'Reputation score, verified reviews, and the "View Profile" button to inspect the Mentor\'s work experience and packages.',
        targetX: 465,
        targetY: 752,
        labelX: 465,
        labelY: 638,
        path: 'M 465 638 L 465 740',
      },
    ],
    mockup: {
      badge: 'Filter Criteria',
      title: 'Smart Search Tailored to Your Needs',
      items: [
        'Filter by Major: Software Engineering, Information Assurance, Graphic Design...',
        'Mentoring Format: 1-on-1 Individual or Group',
        'Sort by: Highest Reputation Score or Best Star Ratings',
      ],
      highlight: 'Review Mentor profiles and feedback from previous students before sending a request',
    },
    notes: [
      {
        type: 'tip',
        text: 'Tip: Click "View Profile" to read detailed work experience, real-world projects, and mentoring packages offered by the Mentor.',
      },
    ],
  },
  {
    step: 2,
    title: 'Create a Detailed Mentoring Request',
    subtitle: 'Clearly describe your technical challenge or project goal',
    description:
      'Once you choose a Mentor or want to post an open request, fill out the "Create New Request" form. State your project context, current obstacles, expected outcomes, and attach any syllabus or reference documents.',
    icon: FileText,
    actionLabel: 'Create New Mentoring Request',
    actionLink: '/app/mentoring/requests/create',
    image: '/images/guide/student-step2-request.png',
    imageCaption: 'Create Mentoring Request Form',
    imageNotes:
      'Providing a clear description and uploading documents/outlines helps the system match accurately and Mentors respond faster.',
    callouts: [
      {
        id: 1,
        title: 'Support Request Title',
        shortLabel: 'Request Title',
        description: 'Briefly summarize the technical problem or project topic requiring Mentor guidance.',
        targetX: 600,
        targetY: 423,
        labelX: 780,
        labelY: 372,
        path: 'M 780 372 L 600 372 L 600 412',
      },
      {
        id: 2,
        title: 'Detailed Requirement Description',
        shortLabel: 'Detailed Description',
        description: 'Describe your current context, target outcomes, and technical blockers (min 20 characters, max 3000 characters).',
        targetX: 600,
        targetY: 545,
        labelX: 780,
        labelY: 468,
        path: 'M 780 468 L 600 468 L 600 534',
      },
      {
        id: 3,
        title: 'Domain & Technical Expertise',
        shortLabel: 'Domain & Expertise',
        description: 'Select the technical specialization so the system matches you with Mentors experienced in that field.',
        targetX: 655,
        targetY: 735,
        labelX: 870,
        labelY: 735,
        path: 'M 870 735 L 667 735',
      },
    ],
    mockup: {
      badge: 'Mentoring Request',
      title: 'Key Information to Provide',
      items: [
        'Request Title: Concise summary of the problem needing support',
        'Detailed Description: Context, technical errors, or graduation project goals',
        'Support Domain / Specialization & Document Attachments',
      ],
      highlight: 'Minimum 20 characters, supports file attachments up to 25MB',
    },
    notes: [
      {
        type: 'tip',
        text: 'Note: The clearer your description, the easier it is for Mentors to evaluate feasibility and propose a reasonable budget.',
      },
    ],
  },
  {
    step: 3,
    title: 'Confirm Deal Agreement & Secure Escrow Payment',
    subtitle: '100% fund protection via the AlumNect Escrow account',
    description:
      'After discussing via chat, the Mentor creates a Deal Agreement. Review the Agreed Price, Deadline, and Scope of Work carefully. After clicking [Confirm Deal], complete payment via PayOS to fund the secure Escrow account.',
    icon: CreditCard,
    actionLabel: 'View Deals List',
    actionLink: '/app/mentoring/deals',
    image: '/images/guide/student-step3-deals.png',
    imageCaption: 'Deal Agreement & Open Task Interface',
    imageNotes:
      'Once status changes to "Paid", funds are safely held in AlumNect Escrow and the Open Task button appears to begin work.',
    callouts: [
      {
        id: 1,
        title: 'Paid Status (Escrow Funded)',
        shortLabel: 'Paid in Escrow',
        description: 'The green "Paid" badge confirms your payment is 100% safely held in the AlumNect Escrow account.',
        targetX: 408,
        targetY: 363,
        labelX: 640,
        labelY: 312,
        path: 'M 640 312 L 408 312 L 408 352',
      },
      {
        id: 2,
        title: 'Agreed Fee & Deadline',
        shortLabel: 'Agreed Fee & Deadline',
        description: 'Fixed committed fee with no hidden charges and a clear task completion deadline.',
        targetX: 830,
        targetY: 586,
        labelX: 765,
        labelY: 480,
        path: 'M 765 480 L 830 480 L 830 574',
      },
      {
        id: 3,
        title: 'Open Task Button to Start',
        shortLabel: 'Open Task Button',
        description: 'Click Open Task to access the workspace, track the 3-stage progress, and review Work Logs from your Mentor.',
        targetX: 540,
        targetY: 669,
        labelX: 540,
        labelY: 745,
        path: 'M 540 745 L 540 682',
      },
    ],
    mockup: {
      badge: 'Mentoring Deal',
      title: 'Secure Escrow Mechanism',
      items: [
        'Fixed Price: Locked in and unchanged throughout the entire task',
        'Escrow Protection: Funds are held by AlumNect rather than sent directly to the Mentor upfront',
        'PayOS Payment: Instant VietQR scan with automatic verification within 5 seconds',
      ],
      highlight: 'Never transfer money privately outside the platform to avoid losing payment protection',
    },
    notes: [
      {
        type: 'warning',
        text: 'Important: Escrow funds are only disbursed to the Mentor after you officially click [Accept & Complete] upon task completion.',
      },
    ],
  },
  {
    step: 4,
    title: 'Track Progress & Confirm Work Logs Within 72 Hours',
    subtitle: '72-hour response rule for Work Log verification',
    description:
      'During mentoring, your Mentor logs detailed Work Logs after each session (topics covered, outcomes, deliverables). When a Work Log is submitted, review and click [Confirm] or request edits. Any feedback or dispute must be submitted within 72 hours.',
    icon: Clock,
    actionLabel: 'View Task Details & Work Logs',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/student-step4-task.png',
    imageCaption: 'Task Details & Work Log Tracking',
    imageNotes:
      'Displays the 3-stage progress bar (Preparation -> In Progress -> Completion & Acceptance), deadline info, and session Work Logs.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: '3-Stage Task Progress',
        shortLabel: '3-Stage Progress',
        description: 'Visual percentage bar and 3 stages: Stage 1 (Preparation), Stage 2 (In Progress), Stage 3 (Completion & Acceptance).',
        targetX: 675,
        targetY: 388,
        labelX: 675,
        labelY: 275,
        path: 'M 675 275 L 675 372',
      },
      {
        id: 2,
        title: 'Task Completion Deadline',
        shortLabel: 'Task Deadline',
        description: 'Committed completion timestamp for both parties to track progress against.',
        targetX: 544,
        targetY: 615,
        labelX: 700,
        labelY: 530,
        path: 'M 700 530 L 544 530 L 544 602',
      },
      {
        id: 3,
        title: 'Work Logs & 72-Hour Auto-Approve Rule',
        shortLabel: 'Session Work Logs',
        description: 'Session details (summary, work completed, deliverables) and confirmation button. IMPORTANT: Silence beyond 72 hours triggers automatic confirmation.',
        targetX: 796,
        targetY: 968,
        labelX: 796,
        labelY: 880,
        path: 'M 796 880 L 796 955',
      },
    ],
    mockup: {
      badge: '3-Stage Task Management',
      title: 'Work Log Verification & Deadline Rules',
      items: [
        'Stage 1 (Preparation): Deal activation and material preparation',
        'Stage 2 (In Progress): Mentor submits Work Logs for each mentoring session',
        'Stage 3 (Completion): Final deliverable review and acceptance',
      ],
      highlight: '72-Hour Rule: No response within 72 hours serves as legal basis for automatic Work Log approval',
    },
    notes: [
      {
        type: 'warning',
        text: 'IMPORTANT: Students must review Work Logs within 72 hours of submission. If no feedback or dispute is raised within 72 hours, the system automatically approves the Work Log as valid.',
      },
      {
        type: 'tip',
        text: 'No-Show Policy: If you join more than 15 minutes late without at least 12 hours prior notice, the Mentor is entitled to log that session as completed.',
      },
    ],
  },
  {
    step: 5,
    title: 'Accept Final Deliverables or Request a Refund',
    subtitle: 'Protecting student rights with transparent settlement',
    description:
      'When the task concludes and the Mentor submits final completion, inspect all deliverables and click [Accept]. Escrow funds are then released to the Mentor and you can leave a rating. If the agreement was breached, open a Dispute Ticket or request a refund to your bank account.',
    icon: CheckCircle2,
    actionLabel: 'Set Up Refund Bank Account',
    actionLink: '/app/mentoring/refunds',
    image: '/images/guide/student-step5-refunds.png',
    imageCaption: 'Refund Bank Account & Reconciliation Interface',
    imageNotes:
      'Register your bank account under your own name to receive 100% automated refunds in case of disputes or Mentor cancellation.',
    callouts: [
      {
        id: 1,
        title: 'Bank Account Registration Alert',
        shortLabel: 'Bank Account Alert',
        description: 'Reminder to register your personal bank account before triggering a refund or closing a disputed task.',
        targetX: 550,
        targetY: 296,
        labelX: 550,
        labelY: 235,
        path: 'M 550 235 L 550 285',
      },
      {
        id: 2,
        title: 'Select Bank & Enter Account Number',
        shortLabel: 'Select Bank & Account',
        description: 'Supports VietQR-linked banks (Vietcombank, MB, Techcombank, TPBank...). Click [Save Account] to store.',
        targetX: 580,
        targetY: 426,
        labelX: 780,
        labelY: 362,
        path: 'M 780 362 L 580 362 L 580 415',
      },
      {
        id: 3,
        title: 'Refund Status Reconciliation Table',
        shortLabel: 'Refund Status Table',
        description: 'Track Received, Processing, and Failed refund amounts in detail for timely support.',
        targetX: 470,
        targetY: 673,
        labelX: 640,
        labelY: 762,
        path: 'M 640 762 L 470 762 L 470 685',
      },
    ],
    mockup: {
      badge: 'Student Protection',
      title: 'Refund Policy & Dispute Window',
      items: [
        'Bank Setup: Register your bank account (Vietcombank, BIDV, Techcombank...) to receive refunds',
        'Dispute Window: Up to 07 days from the incident or task completion date to open a Dispute Ticket',
        '100% Refund: Full refund if the Mentor fails to deliver or unilaterally cancels the Deal',
      ],
      highlight: 'AlumNect mediates fairly based on Work Log records and in-app chat evidence',
    },
    notes: [
      {
        type: 'tip',
        text: 'Tip: Register your refund bank account early under "Refunds" so any eligible refund is processed automatically.',
      },
    ],
  },
]

const MENTOR_STEPS_EN: GuideStep[] = [
  {
    step: 1,
    title: 'Activate Mentor Profile & Personal Credentials',
    subtitle: 'Verify alumni expertise and configure mentoring specializations',
    description:
      'To become an official Mentor, complete your competency profile including work experience, current company, technical skills, and linked bank account for payouts. The system verifies your profile and grants the Verified Mentor badge.',
    icon: UserCheck,
    actionLabel: 'Update Mentor Profile',
    actionLink: '/app/mentoring/become-mentor',
    image: '/images/guide/mentor-step1-profile.png',
    imageCaption: 'Mentor Profile & Active Status',
    imageNotes:
      'Displays FPT alumni info, job title, "Active" profile status, and service package management controls.',
    callouts: [
      {
        id: 1,
        title: 'Draft Status (Incomplete Profile)',
        shortLabel: 'Draft Status Badge',
        description: 'Profiles in Draft status require complete information before submitting for Verified Mentor activation.',
        targetX: 510,
        targetY: 191,
        labelX: 720,
        labelY: 191,
        path: 'M 720 191 L 522 191',
      },
      {
        id: 2,
        title: 'Personal Info & Mentoring Domains',
        shortLabel: 'Personal & Domain Info',
        description: 'Provide your full name, current title, FPTU campus, and professional background so students can connect with confidence.',
        targetX: 570,
        targetY: 435,
        labelX: 780,
        labelY: 335,
        path: 'M 780 335 L 570 335 L 570 422',
      },
      {
        id: 3,
        title: 'Complete & Submit Profile Button',
        shortLabel: 'Complete Profile Button',
        description: 'After filling in all required fields, click the orange [Complete] button to activate incoming request permissions.',
        targetX: 1101,
        targetY: 685,
        labelX: 900,
        labelY: 615,
        path: 'M 900 615 L 1101 615 L 1101 672',
      },
    ],
    mockup: {
      badge: 'Mentor Profile',
      title: 'Profile Approval Standards',
      items: [
        'Alumni Verification: FPTU Student ID, Major, and Graduation Year',
        'Career Details: Current Role and Company/Organization',
        'Mentoring Domains: Select technical skills and topics you can mentor',
      ],
      highlight: 'A complete, detailed profile increases student request rates by up to 300%',
    },
    notes: [
      {
        type: 'tip',
        text: 'Tip: Add your professional portfolio and industry project experience to rank higher on the Mentor Leaderboard.',
      },
    ],
  },
  {
    step: 2,
    title: 'Activate a Mentor Service Package',
    subtitle: 'Unlock student matching and automated financial escrow protection',
    description:
      'Choose a suitable Mentor subscription plan (1-Month Standard, 3-Month Popular, or 6-Month Premium). Active packages maintain your official Mentor badge, allow up to 5 concurrent active tasks, and enable automated payout settlement via PayOS.',
    icon: CreditCard,
    actionLabel: 'View Mentor Service Packages',
    actionLink: '/app/mentoring/packages',
    image: '/images/guide/mentor-step2-packages.png',
    imageCaption: 'Mentor Service Packages Dashboard',
    imageNotes:
      'Displays current package validity, tier pricing, profile badge status, and PayOS payout integration.',
    callouts: [
      {
        id: 1,
        title: 'Active Service Package Banner',
        shortLabel: 'Active Package Status',
        description: 'Shows your active plan (e.g., 6-Month Premium Plan), Active status, and expiration date.',
        targetX: 590,
        targetY: 303,
        labelX: 590,
        labelY: 235,
        path: 'M 590 235 L 590 292',
      },
      {
        id: 2,
        title: '3 Flexible Subscription Tiers',
        shortLabel: '3 Service Package Tiers',
        description: '1-Month Standard, 3-Month Popular, and 6-Month Premium plans with discounted monthly rates.',
        targetX: 762,
        targetY: 420,
        labelX: 762,
        labelY: 365,
        path: 'M 762 365 L 762 408',
      },
      {
        id: 3,
        title: 'Automated PayOS Payout Benefits',
        shortLabel: 'PayOS Payout Benefits',
        description: 'Verified Mentor badge and 100% automated fee reconciliation and disbursement via PayOS.',
        targetX: 1058,
        targetY: 704,
        labelX: 762,
        labelY: 704,
        path: 'M 762 704 L 1045 704',
      },
    ],
    mockup: {
      badge: 'Mentor Service Packages',
      title: 'Benefits for Active Package Mentors',
      items: [
        'Featured Mentor badge on Discover & Profile pages',
        'Receive direct requests from students and create Deal Agreements',
        'Escrow Protection: Automated reconciliation and payout disbursement via PayOS',
      ],
      highlight: 'Instant 5-second VietQR payment activation via PayOS',
    },
    notes: [
      {
        type: 'tip',
        text: 'Note: Check your subscription validity anytime under "Packages" in the left navigation sidebar.',
      },
    ],
  },
  {
    step: 3,
    title: 'Review Incoming Requests & Create a Deal',
    subtitle: 'Proactively negotiate scope, mentoring fee, and completion deadline',
    description:
      'When a student sends a request, it appears in "Incoming Requests". Click [View & Respond] to chat with the student and clarify requirements. Once aligned, create a Deal specifying the fee (VND), completion deadline, and expected deliverables.',
    icon: MessageSquare,
    actionLabel: 'Open Incoming Requests Inbox',
    actionLink: '/app/mentoring/incoming-requests',
    image: '/images/guide/mentor-step3-incoming.png',
    imageCaption: 'Incoming Mentoring Requests Inbox',
    imageNotes:
      'Inspect student details, request title, format (Online/Offline), target deadline, and the "View & Respond" action button.',
    callouts: [
      {
        id: 1,
        title: 'Pending Status & Student Info',
        shortLabel: 'Student Info',
        description: 'Displays the requesting student\'s profile, FPTU cohort, and submission timestamp.',
        targetX: 460,
        targetY: 452,
        labelX: 760,
        labelY: 452,
        path: 'M 760 452 L 472 452',
      },
      {
        id: 2,
        title: 'Request Title, Budget & Deadline',
        shortLabel: 'Scope & Budget',
        description: 'Summarizes the technical challenge, proposed budget range (300,000d - 700,000d), format, and target deadline.',
        targetX: 595,
        targetY: 572,
        labelX: 520,
        labelY: 745,
        path: 'M 520 745 L 595 745 L 595 584',
      },
      {
        id: 3,
        title: '"View & Respond" Action Button',
        shortLabel: 'View & Respond Button',
        description: 'Click [View & Respond] to open the chat channel, clarify scope, and create an official Deal Agreement.',
        targetX: 1108,
        targetY: 632,
        labelX: 860,
        labelY: 632,
        path: 'M 860 632 L 1095 632',
      },
    ],
    mockup: {
      badge: 'Deal Creation Workflow',
      title: 'Key Terms to Finalize in a Deal',
      items: [
        'Agreed Mentoring Fee: Positive integer in VND (e.g., 650,000 VND)',
        'Completion Deadline: Exact date and time for task delivery',
        'Committed Scope: Number of sessions, deliverables, and review support',
      ],
      highlight: 'Once the student funds Escrow, the task automatically advances to Stage 2',
    },
    notes: [
      {
        type: 'tip',
        text: 'Tip: Discuss the student\'s current skill level beforehand to set a realistic deadline and avoid extension requests later.',
      },
    ],
  },
  {
    step: 4,
    title: 'Conduct Mentoring & Log Session Work Logs',
    subtitle: 'Core legal evidence for payout settlement and dispute protection',
    description:
      'After each mentoring session, click Add Work Log on the task detail page to record topics taught, assigned exercises, and achieved deliverables. This serves as the primary evidence for automatic confirmation and payout if the student remains silent for over 72 hours.',
    icon: Clock,
    actionLabel: 'Go to Tasks & Work Logs',
    actionLink: '/app/mentoring/tasks',
    image: '/images/guide/mentor-step4-tasks.png',
    imageCaption: 'Task Details & Add Work Log Interface',
    imageNotes:
      'Interactive workspace featuring the Add Work Log button, session log history, confirmation badges, and quick chat access.',
    imageWidth: 1280,
    imageHeight: 1200,
    callouts: [
      {
        id: 1,
        title: 'Add Session Work Log Button',
        shortLabel: 'Add Work Log Button',
        description: 'Click after each session to record session summary, work completed, and delivered artifacts.',
        targetX: 794,
        targetY: 874,
        labelX: 660,
        labelY: 775,
        path: 'M 660 775 L 794 775 L 794 862',
      },
      {
        id: 2,
        title: 'Recorded Session Work Log Card',
        shortLabel: 'Session Work Log Card',
        description: 'Lists session summary, completed work, and date for the student to confirm within 72 hours.',
        targetX: 405,
        targetY: 968,
        labelX: 680,
        labelY: 1040,
        path: 'M 680 1040 L 405 1040 L 405 980',
      },
      {
        id: 3,
        title: 'Original Deal & Task Reference',
        shortLabel: 'Original Deal Card',
        description: 'Review the original agreed scope, locked fee, and open quick messaging with the student.',
        targetX: 1050,
        targetY: 975,
        labelX: 900,
        labelY: 905,
        path: 'M 900 905 L 1050 905 L 1050 963',
      },
    ],
    mockup: {
      badge: 'Payout Protection Basis',
      title: 'Work Log Rules & 72-Hour Auto-Approval',
      items: [
        'Session Details: Record topics covered, guidance provided, and deliverable links',
        '15-Minute No-Show Rule: Student absence beyond 15 minutes without notice counts as 1 valid Work Log',
        '72-Hour Auto-Approve: If the student does not respond within 72 hours, the system automatically approves the log',
      ],
      highlight: 'Thorough Work Logs protect 100% of your mentoring fee even if the student becomes unresponsive',
    },
    notes: [
      {
        type: 'warning',
        text: 'KEY LEGAL BASIS: Students have 72 hours to review each Work Log. If no response or dispute is submitted within 72 hours, the system automatically confirms the Work Log for payout settlement.',
      },
      {
        type: 'tip',
        text: 'Tip: If the schedule needs adjustment, use "Extend Deadline" before expiration to protect your reputation score.',
      },
    ],
  },
  {
    step: 5,
    title: 'Submit Final Completion & Receive Automated Payouts',
    subtitle: 'Funds are transferred directly to your linked bank account',
    description:
      'Once all task objectives are fulfilled, submit final completion. As soon as the student clicks Accept (or after 72-hour auto-confirmation / Admin settlement), Escrow funds are automatically disbursed to your bank account via PayOS.',
    icon: DollarSign,
    actionLabel: 'View Earnings & Payout History',
    actionLink: '/app/mentoring/earnings',
    image: '/images/guide/mentor-step5-earnings.png',
    imageCaption: 'Earnings Statement & Automated Payout History',
    imageNotes:
      'Dashboard displaying "Received" and "Processing" balances, completed tasks, student names, and automated bank transfer status.',
    callouts: [
      {
        id: 1,
        title: '"Received" Earnings Summary Card',
        shortLabel: 'Received Balance Card',
        description: 'Total mentoring fees successfully disbursed after task acceptance.',
        targetX: 460,
        targetY: 319,
        labelX: 460,
        labelY: 235,
        path: 'M 460 235 L 460 308',
      },
      {
        id: 2,
        title: 'Completed Tasks Statement Table',
        shortLabel: 'Completed Tasks Table',
        description: 'Detailed list of delivered tasks, student info (Le Thao Vy), and corresponding payout amounts (350,000 VND).',
        targetX: 420,
        targetY: 455,
        labelX: 450,
        labelY: 540,
        path: 'M 450 540 L 420 540 L 420 468',
      },
      {
        id: 3,
        title: '"Transferred" Payout Status Badge',
        shortLabel: 'Transferred Badge',
        description: 'Confirms 100% transparent, automated payout transfer to your linked bank account.',
        targetX: 886,
        targetY: 453,
        labelX: 860,
        labelY: 640,
        path: 'M 860 640 L 886 640 L 886 465',
      },
    ],
    mockup: {
      badge: 'Payouts & Earnings',
      title: 'Automated Disbursement via PayOS',
      items: [
        '100% Automated: Funds transfer directly to your bank account without manual delays',
        'Transparent: Detailed statement with task IDs, timestamps, and bank transfer statuses',
        'IP Protection: Your pre-existing teaching materials and templates remain your intellectual property',
      ],
      highlight: 'AlumNect charges 0% hidden platform fees on task payouts—you receive the full stated amount',
    },
    notes: [
      {
        type: 'tip',
        text: 'Tip: Verify your beneficiary bank account details in your Mentor Profile so automated transfers succeed immediately.',
      },
    ],
  },
]

const FAQS = [
  {
    q: 'Tiền ký quỹ, phí nền tảng và chính sách hoàn tiền khi hủy thỏa thuận như thế nào?',
    a: 'Khi Học viên thanh toán thỏa thuận, 100% số tiền được tạm giữ an toàn tại quỹ ký quỹ của AlumNect (hiện áp dụng mức phí nền tảng ưu đãi 0% trên giao dịch nhiệm vụ) và chỉ giải ngân cho Cố vấn khi Học viên xác nhận nghiệm thu. Nếu Học viên hủy trước 24 giờ trước khi bắt đầu sẽ được hoàn 100%; nếu tự ý hủy sát giờ (dưới 24 giờ) không có lý do bất khả kháng sẽ khấu trừ 20% phí bồi hoàn chuẩn bị cho Cố vấn và hoàn 80%. Nếu Cố vấn đơn phương hủy, Học viên được hoàn 100%.',
  },
  {
    q: 'Quy định tự động xác nhận nhật ký công việc sau 72 giờ hoạt động ra sao?',
    a: 'Sau mỗi buổi hướng dẫn, Cố vấn tạo nhật ký công việc chi tiết. Học viên có quyền và trách nhiệm kiểm tra, bấm xác nhận hoặc phản hồi trong vòng 72 giờ. Nếu quá 72 giờ mà Học viên im lặng, không phản hồi hay khiếu nại, hệ thống và Ban Quản trị sẽ mặc định tự động xác nhận nhật ký công việc đó là hợp lệ để làm căn cứ quyết toán và giải ngân cho Cố vấn, ngăn chặn việc cố tình né tránh thanh toán.',
  },
  {
    q: 'Chính sách hủy lịch hẹn và vắng mặt quá 15 phút được quy định như thế nào?',
    a: 'Việc báo hủy hoặc xin dời lịch buổi hẹn phải được thông báo trước tối thiểu 12 giờ. Nếu một bên vào trễ quá 15 phút mà không báo trước thì tính là vắng mặt: Trường hợp Học viên vắng mặt, Cố vấn vẫn được tính nhật ký công việc hợp lệ cho buổi đó; trường hợp Cố vấn vắng mặt, Học viên được quyền yêu cầu xếp buổi học bù tương đương hoặc hoàn trả 100% chi phí phiên đó kèm trừ điểm uy tín của Cố vấn.',
  },
  {
    q: 'Thời hiệu mở phiếu khiếu nại tranh chấp là bao lâu?',
    a: 'Phiếu khiếu nại tranh chấp chỉ được phép mở trong vòng tối đa 07 ngày kể từ thời điểm phát sinh sự cố hoặc ngày kết thúc thỏa thuận và nhiệm vụ. Quá thời hiệu 07 ngày, hệ thống tự động đóng quyền khiếu nại và giải ngân dứt điểm theo dữ liệu nhật ký công việc. Khi có khiếu nại, Ban Quản trị sẽ đối chiếu thỏa thuận, nhật ký công việc và bằng chứng hai bên để ra phán quyết cuối cùng.',
  },
  {
    q: 'Quyền sở hữu trí tuệ và miễn trừ trách nhiệm chuyên môn được quy định ra sao?',
    a: 'Các sản phẩm tạo ra trong quá trình hướng dẫn (đoạn mã nguồn, bản thiết kế, báo cáo do Cố vấn hướng dẫn hoặc cùng Học viên thực hiện trong thỏa thuận) thuộc quyền sở hữu của Học viên sau khi hoàn tất thanh toán; còn giáo trình, tài liệu mẫu có sẵn của Cố vấn vẫn thuộc sở hữu trí tuệ riêng của Cố vấn. Lưu ý: AlumNect đóng vai trò kết nối và bảo đảm giao dịch, không cam kết hay chịu trách nhiệm về điểm số trên lớp hoặc kết quả tuyển dụng cuối cùng của Học viên.',
  },
]

const FAQS_EN = [
  {
    q: 'How do Escrow protection, platform fees, and cancellation refunds work?',
    a: 'When a Student pays for a Deal, 100% of the payment is held securely in AlumNect Escrow (currently with a 0% promotional platform fee on task transactions) and is only disbursed to the Mentor upon completion acceptance. If the Student cancels at least 24 hours before the start time, a 100% refund is issued; late cancellations (under 24 hours) without force majeure incur a 20% preparation compensation fee for the Mentor and an 80% refund. If the Mentor unilaterally cancels, the Student receives a 100% refund.',
  },
  {
    q: 'How does the 72-hour automatic Work Log confirmation rule work?',
    a: 'After each mentoring session, the Mentor submits a detailed Work Log. The Student has 72 hours to review, confirm, or submit feedback. If the Student remains silent and raises no dispute within 72 hours, the system and Administrators automatically confirm the Work Log as valid for settlement and payout disbursement, preventing payment evasion.',
  },
  {
    q: 'What is the policy for session rescheduling and 15-minute no-shows?',
    a: 'Any cancellation or rescheduling request must be communicated at least 12 hours in advance. Joining more than 15 minutes late without prior notice is recorded as a No-Show: if the Student is absent, the Mentor is still entitled to log the session as completed; if the Mentor is absent, the Student may request an equivalent make-up session or a 100% refund for that session, and the Mentor incurs a reputation penalty.',
  },
  {
    q: 'What is the time window for opening a Dispute Ticket?',
    a: 'A Dispute Ticket must be opened within a maximum of 07 days from the incident date or the Deal/Task completion date. After 07 days, the dispute window closes automatically and funds are settled permanently based on Work Log records. During a dispute, Administrators review the Deal, Work Logs, and chat evidence from both parties to issue a final binding decision.',
  },
  {
    q: 'How are Intellectual Property (IP) rights and professional disclaimers defined?',
    a: 'Deliverables created during mentoring (source code, designs, reports guided by the Mentor or co-created under the Deal) belong to the Student upon full payment completion, whereas the Mentor\'s pre-existing curricula, slides, and personal templates remain the Mentor\'s exclusive IP. Disclaimer: AlumNect acts as a connection and transaction-protection platform and does not guarantee or assume liability for classroom grades or final employment outcomes.',
  },
]

const GUIDE_IMAGE_VERSION = '?v=20261118_v12'

export function MentoringGuide() {
  const { i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')
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

  const steps = isEn
    ? activeRole === 'student'
      ? STUDENT_STEPS_EN
      : MENTOR_STEPS_EN
    : activeRole === 'student'
      ? STUDENT_STEPS
      : MENTOR_STEPS
  const faqs = isEn ? FAQS_EN : FAQS

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
                title={isEn ? 'Close (ESC)' : 'Đóng (ESC)'}
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
                            title={isEn ? `Point ${c.id}: ${c.title}` : `Vị trí ${c.id}: ${c.title}`}
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
            <span>{isEn ? 'Mentoring Handbook & Guide' : 'Cẩm nang Hướng dẫn Cố vấn'}</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
            {isEn ? 'Mentoring Workflow Guide' : 'Hướng dẫn Quy trình Cố vấn'}
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed text-text-muted">
            {isEn
              ? 'Standardized 5-step workflow from connecting, confirming the Deal agreement, secure Escrow payment, logging session Work Logs, to final acceptance and payout.'
              : 'Quy trình làm việc chuẩn hóa 5 bước từ lúc kết nối, thống nhất thỏa thuận, ký quỹ an toàn, ghi nhận nhật ký công việc đến nghiệm thu và giải ngân thù lao.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-text-subtle">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{isEn ? '100% Escrow Protection' : 'Bảo vệ quỹ ký quỹ'}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <Clock size={14} className="text-amber-500" />
              <span>{isEn ? '72-Hour Log Verification' : 'Đối soát nhật ký 72 giờ'}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 shadow-2xs border border-border">
              <Scale size={14} className="text-primary-solid" />
              <span>{isEn ? 'Policy Compliant' : 'Chuẩn quy định'}</span>
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
            <span>{isEn ? 'For Students / Learners' : 'Dành cho Sinh viên / Người học'}</span>
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
            <span>{isEn ? 'For Mentors' : 'Dành cho Cố vấn'}</span>
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
            <span>
              {isEn
                ? `Step-by-Step Workflow for ${activeRole === 'student' ? 'Students' : 'Mentors'}`
                : `Quy trình làm việc dành cho ${activeRole === 'student' ? 'Học viên' : 'Cố vấn'}`}
            </span>
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
                            {isEn ? `Step ${item.step}` : `Bước ${item.step}`}
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
                          title={isEn ? 'Zoom in' : 'Phóng to ảnh'}
                        >
                          <ZoomIn size={12} />
                          <span>{isEn ? 'Zoom in' : 'Phóng to'}</span>
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
                                    title={
                                      isEn
                                        ? `Point ${c.id}: ${c.title} (Click to zoom)`
                                        : `Vị trí ${c.id}: ${c.title} (Bấm để phóng to)`
                                    }
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
                          <span className="font-bold text-primary-solid shrink-0">
                            {isEn ? 'Key Elements:' : 'Vị trí thao tác:'}
                          </span>
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
          <span>{isEn ? 'Frequently Asked Questions' : 'Các câu hỏi thường gặp'}</span>
        </div>

        <div className="divide-y divide-border/60">
          {faqs.map((faq, index) => {
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
          <h4 className="text-xs font-bold text-text">
            {isEn ? 'Want to learn more about legal policies?' : 'Bạn muốn tìm hiểu thêm về mặt pháp lý?'}
          </h4>
          <p className="text-xs text-text-muted">
            {isEn
              ? 'Read all 10 official Mentoring Terms of Service and dispute resolution policies.'
              : 'Xem toàn bộ 10 điều khoản cam kết và quy định giải quyết tranh chấp trên nền tảng.'}
          </p>
        </div>
        <Link
          to="/app/mentoring/terms"
          className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-text border border-border hover:border-primary-soft-border hover:text-primary-solid transition shadow-2xs"
        >
          <FileText size={15} />
          <span>{isEn ? 'View 10 Terms of Service' : 'Xem 10 Điều khoản dịch vụ'}</span>
        </Link>
      </div>
    </div>
  )
}
export default MentoringGuide
