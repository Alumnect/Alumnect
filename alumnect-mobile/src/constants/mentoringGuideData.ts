import type { ImageSourcePropType } from 'react-native'
import type { BrandIconName } from '@/components/BrandIcon'

export type GuideRoleType = 'student' | 'mentor'

export interface MobileCalloutPin {
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

export interface MobileGuideStep {
  step: number
  title: string
  subtitle: string
  description: string
  brandIcon: BrandIconName
  accentColor: string
  actionLabel: string
  actionRoute: string
  image: ImageSourcePropType
  imageCaption: string
  imageNotes: string
  imageWidth: number
  imageHeight: number
  callouts: MobileCalloutPin[]
  highlights: string[]
  notes: {
    type: 'tip' | 'warning'
    text: string
  }[]
}

export interface GuideFaqItem {
  q: string
  a: string
  tag: string
}

export interface GoldenRuleCard {
  id: string
  metric: string
  unit: string
  title: string
  desc: string
  brandIcon: BrandIconName
  tone: 'brand' | 'success' | 'warning' | 'info' | 'danger'
}

export interface CorePrincipleItem {
  id: string
  title: string
  desc: string
  brandIcon: BrandIconName
  tone: 'brand' | 'success' | 'info'
}

/** 3 nguyên tắc nền tảng — đồng bộ 100% với trang Web /app/mentoring/terms */
export const MENTORING_CORE_PRINCIPLES: CorePrincipleItem[] = [
  {
    id: 'honesty',
    title: 'Trung thực & bảo mật',
    desc: 'Thông tin chính xác, hồ sơ thật, dữ liệu cá nhân & mã nguồn dự án được bảo vệ tuyệt đối.',
    brandIcon: 'lock',
    tone: 'brand',
  },
  {
    id: 'respect',
    title: 'Tôn trọng lẫn nhau',
    desc: 'Giao tiếp văn minh, chuyên nghiệp, góp ý xây dựng theo chuẩn mực văn hóa ĐH FPT.',
    brandIcon: 'people',
    tone: 'success',
  },
  {
    id: 'transparency',
    title: 'Minh bạch cam kết',
    desc: 'Thực hiện đúng thỏa thuận đã chốt trên hệ thống, thanh toán 100% qua ký quỹ PayOS.',
    brandIcon: 'check',
    tone: 'info',
  },
]

/** 6 con số & quy tắc vàng từ 10 điều khoản UC90 */
export const MENTORING_GOLDEN_RULES: GoldenRuleCard[] = [
  {
    id: 'escrow',
    metric: '100%',
    unit: 'Ký quỹ Escrow',
    title: 'Bảo vệ nguồn tiền tuyệt đối',
    desc: 'Tiền học viên được tạm giữ an toàn qua PayOS, chỉ giải ngân khi nghiệm thu hoàn tất.',
    brandIcon: 'lock',
    tone: 'success',
  },
  {
    id: 'worklog-72h',
    metric: '72h',
    unit: 'Tự động duyệt',
    title: 'Đối soát Nhật ký công việc',
    desc: 'Học viên kiểm tra Work Log trong 72h. Quá hạn không phản hồi hệ thống mặc định xác nhận.',
    brandIcon: 'alarm_clock',
    tone: 'warning',
  },
  {
    id: 'reschedule-12h',
    metric: '12h / 15p',
    unit: 'Lịch hẹn',
    title: 'Hủy lịch & Vắng mặt',
    desc: 'Báo dời lịch trước tối thiểu 12 giờ. Trễ quá 15 phút không báo trước tính là vắng mặt.',
    brandIcon: 'calendar',
    tone: 'info',
  },
  {
    id: 'dispute-7d',
    metric: '07 ngày',
    unit: 'Thời hiệu',
    title: 'Mở phiếu Khiếu nại',
    desc: 'Gửi khiếu nại tối đa 07 ngày sau khi kết thúc để phong tỏa quỹ và Admin phân xử công tâm.',
    brandIcon: 'writing',
    tone: 'danger',
  },
  {
    id: 'payos-fee',
    metric: '0% / 3.000đ',
    unit: 'Phí nền tảng',
    title: 'Minh bạch Thu hộ – Chi hộ',
    desc: '0% phí hoa hồng nền tảng trên mỗi buổi học, chỉ trừ 3.000đ phí hạ tầng chuyển khoản PayOS.',
    brandIcon: 'coin',
    tone: 'brand',
  },
  {
    id: 'ip-rights',
    metric: 'Bản quyền',
    unit: 'Sở hữu trí tuệ',
    title: 'Phân định rõ sản phẩm',
    desc: 'Mã nguồn, báo cáo đồ án thuộc về Học viên sau thanh toán; giáo trình mẫu thuộc về Mentor.',
    brandIcon: 'badge_pro',
    tone: 'info',
  },
]

/** 5 Bước dành cho Sinh viên / Người học — Đồng bộ 100% nội dung Web MentoringGuide.tsx + ảnh chụp Mobile thật */
export const STUDENT_GUIDE_STEPS: MobileGuideStep[] = [
  {
    step: 1,
    title: 'Khám phá & Chọn lọc Cố vấn phù hợp',
    subtitle: 'Tìm kiếm người hướng dẫn theo chuyên ngành, kỹ năng và mức độ uy tín',
    description:
      'Truy cập tab "Cố vấn" → "Tìm mentor" để duyệt danh sách cựu sinh viên FPT giàu kinh nghiệm. Sử dụng thanh tìm kiếm, bộ lọc chuyên sâu theo Lĩnh vực, Chuyên ngành, Hình thức làm việc hoặc xem Bảng xếp hạng uy tín.',
    brandIcon: 'binoculars',
    accentColor: '#CE4A09',
    actionLabel: 'Mở danh bạ Tìm Mentor',
    actionRoute: '/(tabs)/mentoring',
    image: require('../../assets/guide/student-step1-discover.webp'),
    imageCaption: 'Cố vấn · Tìm kiếm & Lọc Mentor',
    imageNotes:
      'Hiển thị điểm đánh giá sao, điểm uy tín thực tế, thẻ chuyên ngành và nút Xem hồ sơ của từng Cố vấn.',
    imageWidth: 720,
    imageHeight: 980,
    callouts: [
      {
        id: 1,
        title: 'Thanh tìm kiếm & Bộ lọc nâng cao',
        shortLabel: 'Tìm kiếm & Lọc',
        description:
          'Tìm nhanh theo tên, kỹ năng, công ty hoặc bấm nút bộ lọc để chọn Lĩnh vực, Chuyên ngành và Hình thức 1-1.',
        targetX: 650,
        targetY: 385,
        labelX: 430,
        labelY: 328,
        path: 'M 430 328 L 650 328 L 650 374',
      },
      {
        id: 2,
        title: 'Đánh giá sao & Điểm uy tín',
        shortLabel: 'Uy tín & Đánh giá',
        description:
          'Đối chiếu điểm đánh giá thực tế từ sinh viên khóa trước (5.0 ★) cùng chỉ số Uy tín được hệ thống xác thực.',
        targetX: 425,
        targetY: 705,
        labelX: 495,
        labelY: 545,
        path: 'M 495 545 L 425 545 L 425 692',
      },
      {
        id: 3,
        title: 'Nút "Xem hồ sơ" chi tiết',
        shortLabel: 'Xem hồ sơ Mentor',
        description:
          'Chạm vào nút Xem hồ sơ để đọc kinh nghiệm làm việc thực chiến, lĩnh vực hỗ trợ và gửi yêu cầu trực tiếp.',
        targetX: 560,
        targetY: 868,
        labelX: 235,
        labelY: 868,
        path: 'M 235 868 L 546 868',
      },
    ],
    highlights: [
      'Lọc theo Chuyên ngành: CNTT, Thiết kế, Kinh tế, Ngôn ngữ...',
      'Hình thức hướng dẫn linh hoạt: Cá nhân 1-1 hoặc Nhóm',
      'Sắp xếp theo Uy tín cao nhất hoặc Đánh giá sao tốt nhất',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Bấm "Xem hồ sơ" để đọc kỹ kinh nghiệm dự án thực tế và phản hồi từ sinh viên khóa trước trước khi gửi yêu cầu.',
      },
    ],
  },
  {
    step: 2,
    title: 'Khởi tạo Yêu cầu Cố vấn chi tiết',
    subtitle: 'Mô tả rõ ràng bài toán kỹ thuật hoặc mục tiêu cần hỗ trợ',
    description:
      'Chọn "Đăng bài toán tìm mentor" để mở biểu mẫu 5 bước trực quan. Nêu rõ hình thức học (1:1 hoặc Nhóm), tiêu đề bài toán, mô tả bối cảnh cụ thể, chuyên môn kỹ thuật, ngân sách dự kiến và đính kèm đề cương/tài liệu.',
    brandIcon: 'pencil',
    accentColor: '#CE4A09',
    actionLabel: 'Tạo yêu cầu Cố vấn mới',
    actionRoute: '/mentoring/create-request',
    image: require('../../assets/guide/student-step2-request.webp'),
    imageCaption: 'Tạo yêu cầu Cố vấn · 5 Bước',
    imageNotes:
      'Mô tả chi tiết và đính kèm tài liệu giúp hệ thống ghép nối chuẩn xác để Cố vấn phản hồi nhanh nhất.',
    imageWidth: 720,
    imageHeight: 1170,
    callouts: [
      {
        id: 1,
        title: 'Thanh tiến trình 5 bước rõ ràng',
        shortLabel: 'Tiến trình 5 bước',
        description:
          'Hoàn thiện tuần tự 5 phần: Hình thức → Nội dung → Chuyên môn → Ngân sách → Tài liệu đính kèm.',
        targetX: 360,
        targetY: 145,
        labelX: 360,
        labelY: 256,
        path: 'M 360 256 L 360 158',
      },
      {
        id: 2,
        title: 'Chọn hình thức Cá nhân (1:1) hoặc Nhóm',
        shortLabel: 'Hình thức 1:1 / Nhóm',
        description:
          'Chọn học kèm trực tiếp 1-1 hoặc đại diện cho nhóm đồ án Capstone để Mentor nắm đúng quy mô hỗ trợ.',
        targetX: 185,
        targetY: 495,
        labelX: 480,
        labelY: 576,
        path: 'M 480 576 L 185 576 L 185 508',
      },
      {
        id: 3,
        title: 'Tiêu đề & Mô tả nhu cầu chi tiết',
        shortLabel: 'Tiêu đề & Mô tả',
        description:
          'Tóm tắt mục tiêu và khó khăn hiện tại (tối thiểu 20 ký tự, tối đa 3000 ký tự) rồi bấm "Đăng yêu cầu Cố vấn".',
        targetX: 350,
        targetY: 895,
        labelX: 505,
        labelY: 1005,
        path: 'M 505 1005 L 350 1005 L 350 908',
      },
    ],
    highlights: [
      'Tiêu đề ngắn gọn, súc tích đúng trọng tâm bài toán',
      'Mô tả bối cảnh, lỗi kỹ thuật hoặc mục tiêu đồ án Capstone',
      'Hỗ trợ đính kèm đề cương, slide, CV hoặc tài liệu tham khảo',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Ghi chú: Mô tả càng chi tiết thì Cố vấn càng dễ đánh giá tính khả thi và chủ động đề xuất mức ngân sách hợp lý.',
      },
    ],
  },
  {
    step: 3,
    title: 'Thống nhất Thỏa thuận & Ký quỹ an toàn',
    subtitle: 'Bảo vệ nguồn tiền 100% qua tài khoản ký quỹ trung gian AlumNect',
    description:
      'Sau khi trao đổi trong Phòng Chat, Cố vấn khởi tạo Thỏa thuận (Deal). Bạn kiểm tra kỹ Giá trị thỏa thuận, Hạn chót và Phạm vi cam kết. Khi xác nhận, thanh toán qua mã VietQR PayOS để nạp tiền vào quỹ ký quỹ an toàn.',
    brandIcon: 'lock',
    accentColor: '#15803D',
    actionLabel: 'Xem danh sách Thỏa thuận',
    actionRoute: '/mentoring/deals',
    image: require('../../assets/guide/student-step3-deals.webp'),
    imageCaption: 'Sổ cái Thỏa thuận & Bảo vệ Escrow',
    imageNotes:
      'Trạng thái "Đã thanh toán" xác nhận 100% tiền đã được khóa an toàn trong quỹ ký quỹ PayOS trước khi bắt đầu.',
    imageWidth: 720,
    imageHeight: 1150,
    callouts: [
      {
        id: 1,
        title: 'Huy hiệu Bảo chứng Ký quỹ Escrow',
        shortLabel: 'Ký quỹ Escrow',
        description:
          'Mọi hợp đồng được bảo vệ thanh toán qua cổng PayOS; tiền chưa chuyển cho Cố vấn cho đến khi bạn nghiệm thu.',
        targetX: 585,
        targetY: 365,
        labelX: 500,
        labelY: 245,
        path: 'M 500 245 L 585 245 L 585 352',
      },
      {
        id: 2,
        title: 'Trạng thái Đã chốt thỏa thuận',
        shortLabel: 'Đã chốt thỏa thuận',
        description:
          'Cả Học viên và Mentor đều đã xác nhận phạm vi công việc, mức phí cố định và hạn chót hoàn thành.',
        targetX: 535,
        targetY: 665,
        labelX: 480,
        labelY: 590,
        path: 'M 480 590 L 535 590 L 535 652',
      },
      {
        id: 3,
        title: 'Xác nhận Đã thanh toán & Giá trị Deal',
        shortLabel: 'Đã thanh toán 100%',
        description:
          'Huy hiệu xanh "Đã thanh toán" kèm số tiền cam kết cố định. Bấm "Nhắn tin" để trao đổi nhanh với Mentor.',
        targetX: 165,
        targetY: 965,
        labelX: 495,
        labelY: 965,
        path: 'M 495 965 L 180 965',
      },
    ],
    highlights: [
      'Chi phí cố định, tuyệt đối không phát sinh phụ phí ẩn',
      'Quét mã VietQR PayOS xác nhận tự động chỉ trong 5 giây',
      'Tiền ký quỹ chỉ giải ngân khi bạn bấm Nghiệm thu hoàn tất',
    ],
    notes: [
      {
        type: 'warning',
        text: 'Lưu ý: Tuyệt đối không chuyển khoản riêng ngoài hệ thống. Chỉ giao dịch qua PayOS mới được AlumNect bảo hộ 100%.',
      },
    ],
  },
  {
    step: 4,
    title: 'Theo dõi Tiến độ & Duyệt Nhật ký trong 72 giờ',
    subtitle: 'Quy tắc 72 giờ phản hồi đối soát Nhật ký công việc (Work Log)',
    description:
      'Trong Không gian Nhiệm vụ, bạn theo dõi thanh phần trăm tiến độ, số ngày còn lại và danh sách Nhật ký công việc mà Cố vấn ghi nhận sau từng buổi. Hãy kiểm tra kỹ và bấm [Xác nhận] hoặc phản hồi chỉnh sửa trong vòng 72 giờ.',
    brandIcon: 'task',
    accentColor: '#2563EB',
    actionLabel: 'Mở danh sách Nhiệm vụ',
    actionRoute: '/mentoring/tasks',
    image: require('../../assets/guide/student-step4-task.webp'),
    imageCaption: 'Không gian Nhiệm vụ & Nhật ký 72h',
    imageNotes:
      'Hiển thị rõ hạn chót hoàn thành, thanh tiến độ phần trăm, số nhật ký đã duyệt và chi tiết kết quả từng buổi.',
    imageWidth: 720,
    imageHeight: 1070,
    callouts: [
      {
        id: 1,
        title: 'Thời hạn hoàn thành (Deadline)',
        shortLabel: 'Hạn chót hoàn thành',
        description:
          'Mốc thời gian cam kết bàn giao nhiệm vụ để cả hai bên cùng đối chiếu tiến độ làm việc minh bạch.',
        targetX: 575,
        targetY: 185,
        labelX: 410,
        labelY: 112,
        path: 'M 410 112 L 575 112 L 575 172',
      },
      {
        id: 2,
        title: 'Thanh tiến độ & Số Nhật ký đã duyệt',
        shortLabel: 'Tiến độ & Nhật ký',
        description:
          'Tổng hợp tỷ lệ hoàn thành, số nhật ký đã xác nhận và ngân sách của nhiệm vụ đang đồng hành.',
        targetX: 165,
        targetY: 465,
        labelX: 495,
        labelY: 575,
        path: 'M 495 575 L 165 575 L 165 480',
      },
      {
        id: 3,
        title: 'Thẻ Nhật ký công việc & Quy tắc 72 giờ',
        shortLabel: 'Xác nhận trong 72h',
        description:
          'Kiểm tra nội dung buổi học và bấm xác nhận. Quá 72 giờ im lặng hệ thống tự động xác nhận hợp lệ.',
        targetX: 305,
        targetY: 765,
        labelX: 525,
        labelY: 825,
        path: 'M 525 825 L 305 825 L 305 780',
      },
    ],
    highlights: [
      'Minh bạch 3 giai đoạn: Chuẩn bị → Đang thực hiện → Nghiệm thu',
      'Mỗi buổi đều có Work Log lưu nội dung và tài liệu minh chứng',
      'Quy tắc vắng mặt: Trễ quá 15 phút không báo trước tính vắng mặt',
    ],
    notes: [
      {
        type: 'warning',
        text: 'QUAN TRỌNG: Bạn có 72 giờ để phản hồi hoặc yêu cầu sửa Nhật ký công việc. Quá 72 giờ không phản hồi, hệ thống mặc định tự động xác nhận kết quả.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nghiệm thu Hoàn tất & Khai báo Hoàn tiền',
    subtitle: 'Bảo vệ quyền lợi học viên, giải ngân minh bạch và hoàn tiền tự động',
    description:
      'Khi nhiệm vụ hoàn tất, bạn kiểm tra toàn bộ sản phẩm đầu ra và bấm [Nghiệm thu] để giải ngân cho Cố vấn và đánh giá sao. Hãy khai báo sẵn tài khoản ngân hàng chính chủ tại mục "Hoàn tiền & Tranh chấp" để nhận hoàn tiền tự động khi cần.',
    brandIcon: 'coin',
    accentColor: '#15803D',
    actionLabel: 'Khai báo Tài khoản Hoàn tiền',
    actionRoute: '/mentoring/refunds',
    image: require('../../assets/guide/student-step5-refunds.webp'),
    imageCaption: 'Hoàn tiền & Tranh chấp · VietQR',
    imageNotes:
      'Liên kết tài khoản ngân hàng chính chủ để nhận tiền hoàn tự động qua PayOS khi có tranh chấp hoặc hủy thỏa thuận.',
    imageWidth: 720,
    imageHeight: 1398,
    callouts: [
      {
        id: 1,
        title: 'Trạng thái liên kết Ngân hàng thụ hưởng',
        shortLabel: 'Tài khoản đã liên kết',
        description:
          'Dấu tích xanh xác nhận tài khoản ngân hàng chính chủ của bạn đã sẵn sàng nhận hoàn tiền tự động.',
        targetX: 642,
        targetY: 265,
        labelX: 460,
        labelY: 162,
        path: 'M 460 162 L 642 162 L 642 252',
      },
      {
        id: 2,
        title: 'Lưu tài khoản ngân hàng VietQR',
        shortLabel: 'Lưu tài khoản VietQR',
        description:
          'Chọn ngân hàng, nhập số tài khoản chính chủ và tên không dấu IN HOA, sau đó bấm nút Lưu tài khoản.',
        targetX: 360,
        targetY: 965,
        labelX: 485,
        labelY: 1055,
        path: 'M 485 1055 L 360 1055 L 360 980',
      },
      {
        id: 3,
        title: 'Bảng đối soát dòng tiền hoàn trả',
        shortLabel: 'Đối soát tiền hoàn',
        description:
          'Theo dõi minh bạch khoản tiền Đã nhận, Đang xử lý và lịch sử giải ngân hoàn tiền chi tiết.',
        targetX: 360,
        targetY: 1295,
        labelX: 455,
        labelY: 1185,
        path: 'M 455 1185 L 360 1185 L 360 1280',
      },
    ],
    highlights: [
      'Thời hiệu khiếu nại: Tối đa 07 ngày kể từ khi kết thúc nhiệm vụ',
      'Hoàn trả 100% nếu Cố vấn không thực hiện hoặc vi phạm cam kết',
      'Phần hoàn lại cho Học viên chỉ trừ 3.000đ phí chuyển khoản PayOS',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Khai báo số tài khoản nhận hoàn tiền ngay từ đầu giúp hệ thống xử lý chuyển hoàn tức thì khi có phán quyết tranh chấp.',
      },
    ],
  },
]

/** 5 Bước dành cho Cố vấn / Mentor — Đồng bộ 100% nội dung Web MentoringGuide.tsx + ảnh chụp Mobile thật */
export const MENTOR_GUIDE_STEPS: MobileGuideStep[] = [
  {
    step: 1,
    title: 'Kích hoạt Hồ sơ Cố vấn & Checklist Năng lực',
    subtitle: 'Xác thực cựu sinh viên FPT và hoàn thiện 5 điều kiện kích hoạt',
    description:
      'Mở mục "Hồ sơ & Trạng thái Mentor" để hoàn tất đủ 5 điều kiện kích hoạt: Đồng ý điều khoản, điền thông tin chuyên môn, tải lên CV năng lực, khai báo tài khoản ngân hàng nhận thù lao và kích hoạt gói thành viên.',
    brandIcon: 'badge_pro',
    accentColor: '#CE4A09',
    actionLabel: 'Mở Hồ sơ & Trạng thái Mentor',
    actionRoute: '/mentoring/status',
    image: require('../../assets/guide/mentor-step1-profile.webp'),
    imageCaption: 'Hồ sơ & Trạng thái hoạt động Mentor',
    imageNotes:
      'Hiển thị trạng thái "Đang hoạt động", thời hạn gói thành viên và danh sách 5 điều kiện đã hoàn tất.',
    imageWidth: 720,
    imageHeight: 1425,
    callouts: [
      {
        id: 1,
        title: 'Trạng thái Cố vấn & Thời hạn Gói',
        shortLabel: 'Trạng thái Hoạt động',
        description:
          'Xác nhận hồ sơ đã sẵn sàng hiển thị công khai trên danh bạ và hiển thị số ngày còn lại của gói dịch vụ.',
        targetX: 250,
        targetY: 245,
        labelX: 485,
        labelY: 125,
        path: 'M 485 125 L 250 125 L 250 232',
      },
      {
        id: 2,
        title: '5 Điều kiện kích hoạt nhận học viên',
        shortLabel: '5 Điều kiện kích hoạt',
        description:
          'Theo dõi nhanh từng hạng mục (Điều khoản, Chuyên môn, CV, Tài khoản ngân hàng, Gói thành viên) đã Hoàn tất.',
        targetX: 600,
        targetY: 790,
        labelX: 465,
        labelY: 535,
        path: 'M 465 535 L 600 535 L 600 775',
      },
      {
        id: 3,
        title: 'Cập nhật hồ sơ & Gia hạn gói nhanh',
        shortLabel: 'Cập nhật hồ sơ',
        description:
          'Bấm nút cam để chỉnh sửa kinh nghiệm, lĩnh vực cố vấn hoặc nâng cấp gói thành viên bất cứ lúc nào.',
        targetX: 360,
        targetY: 1265,
        labelX: 465,
        labelY: 1188,
        path: 'M 465 1188 L 360 1188 L 360 1252',
      },
    ],
    highlights: [
      'Cấp huy hiệu Cố vấn xác thực nổi bật trên toàn nền tảng',
      'Khai báo tài khoản ngân hàng thụ hưởng chính xác để nhận thù lao tự động',
      'Hồ sơ đầy đủ giúp tăng gấp 3 lần tỷ lệ sinh viên gửi yêu cầu',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Đính kèm CV mới nhất và mô tả rõ vị trí, công ty đang công tác để nhanh chóng đạt điểm uy tín cao trên Bảng xếp hạng.',
      },
    ],
  },
  {
    step: 2,
    title: 'Kích hoạt Gói thành viên Cố vấn',
    subtitle: 'Mở khóa danh bạ chuyên gia và hệ thống bảo trợ tài chính PayOS',
    description:
      'Chọn kỳ hạn gói phù hợp (Tiêu chuẩn 1 tháng, Phổ biến 3 tháng hoặc Cao cấp 6 tháng). AlumNect chỉ thu phí gói thành viên và cam kết 0% hoa hồng trên từng buổi học, giúp bạn tối đa hóa thu nhập giảng dạy.',
    brandIcon: 'sparkle',
    accentColor: '#CE4A09',
    actionLabel: 'Xem các Gói thành viên Mentor',
    actionRoute: '/mentoring/plans',
    image: require('../../assets/guide/mentor-step2-packages.webp'),
    imageCaption: 'Gói thành viên Mentor · Thanh toán PayOS',
    imageNotes:
      'So sánh trực quan các gói kỳ hạn 1 tháng, 3 tháng, 6 tháng với nút thanh toán VietQR PayOS tức thì.',
    imageWidth: 720,
    imageHeight: 1205,
    callouts: [
      {
        id: 1,
        title: 'Gói Tiêu chuẩn được Đề xuất',
        shortLabel: 'Gói Đề xuất',
        description:
          'Gói trải nghiệm khởi đầu dành cho Cựu sinh viên mới gia nhập mạng lưới Cố vấn AlumNect.',
        targetX: 575,
        targetY: 342,
        labelX: 485,
        labelY: 258,
        path: 'M 485 258 L 575 258 L 575 328',
      },
      {
        id: 2,
        title: 'Nút Chọn gói & Thanh toán PayOS',
        shortLabel: 'Thanh toán PayOS',
        description:
          'Quét mã VietQR kích hoạt tức thì trong 5 giây, tự động mở khóa quyền nhận yêu cầu & đối soát thù lao.',
        targetX: 360,
        targetY: 615,
        labelX: 475,
        labelY: 705,
        path: 'M 475 705 L 360 705 L 360 630',
      },
      {
        id: 3,
        title: 'Kỳ hạn dài tối ưu chi phí (3 - 6 tháng)',
        shortLabel: 'Gói 3 - 6 tháng',
        description:
          'Tiết kiệm chi phí duy trì huy hiệu Cố vấn chính thức và tham gia Bảng xếp hạng Mentor uy tín.',
        targetX: 240,
        targetY: 855,
        labelX: 525,
        labelY: 815,
        path: 'M 525 815 L 240 815 L 240 842',
      },
    ],
    highlights: [
      '0% phí hoa hồng nền tảng trên từng giao dịch nhiệm vụ',
      'Nhận tối đa 5 nhiệm vụ hoạt động song song cùng lúc',
      'Bảo trợ đối soát & giải ngân tự động qua cổng PayOS',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Lưu ý: Bạn có thể gia hạn hoặc nâng cấp gói thành viên bất kỳ lúc nào tại màn hình Hồ sơ & Trạng thái Mentor.',
      },
    ],
  },
  {
    step: 3,
    title: 'Tiếp nhận Yêu cầu & Lập Thỏa thuận (Deal)',
    subtitle: 'Chủ động thương lượng phạm vi, mức thù lao và hạn chót hoàn thành',
    description:
      'Mọi đề nghị từ sinh viên sẽ xuất hiện tại mục "Yêu cầu đến". Bấm [Xem chi tiết & Phản hồi] để đọc bài toán, mở Phòng Chat trao đổi và khởi tạo Thỏa thuận chính thức với chi phí VNĐ, thời hạn và cam kết đầu ra.',
    brandIcon: 'chat',
    accentColor: '#CE4A09',
    actionLabel: 'Mở Hòm thư Yêu cầu đến',
    actionRoute: '/mentoring/incoming-requests',
    image: require('../../assets/guide/mentor-step3-incoming.webp'),
    imageCaption: 'Hòm thư Yêu cầu đến từ Sinh viên',
    imageNotes:
      'Lọc nhanh yêu cầu Đang chờ duyệt / Đã chấp nhận, xem lĩnh vực nhu cầu và chạm để phản hồi lập Deal.',
    imageWidth: 720,
    imageHeight: 945,
    callouts: [
      {
        id: 1,
        title: 'Bộ lọc trạng thái yêu cầu nhanh',
        shortLabel: 'Lọc trạng thái',
        description:
          'Chuyển nhanh giữa Tất cả, Đang chờ duyệt và Đã chấp nhận để không bỏ lỡ sinh viên đang chờ phản hồi.',
        targetX: 295,
        targetY: 155,
        labelX: 475,
        labelY: 215,
        path: 'M 475 215 L 295 215 L 295 168',
      },
      {
        id: 2,
        title: 'Thông tin Sinh viên & Nhu cầu cụ thể',
        shortLabel: 'Nhu cầu sinh viên',
        description:
          'Xem rõ tên sinh viên, chuyên mục hỗ trợ (Định hướng nghề nghiệp, Tư vấn kỹ thuật...) và tiêu đề bài toán.',
        targetX: 290,
        targetY: 315,
        labelX: 495,
        labelY: 410,
        path: 'M 495 410 L 290 410 L 290 328',
      },
      {
        id: 3,
        title: 'Nút "Xem chi tiết & Phản hồi"',
        shortLabel: 'Xem & Phản hồi',
        description:
          'Mở chi tiết yêu cầu, chấp nhận hỗ trợ để kích hoạt Phòng Chat và tạo Thỏa thuận (Deal) cam kết.',
        targetX: 495,
        targetY: 490,
        labelX: 195,
        labelY: 490,
        path: 'M 195 490 L 480 490',
      },
    ],
    highlights: [
      'Chủ động đề xuất mức thù lao VNĐ và mốc hạn chót khả thi',
      'Khi học viên thanh toán ký quỹ, Nhiệm vụ tự động được mở',
      'Ghi rõ phạm vi bàn giao để bảo vệ đôi bên khi nghiệm thu',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Gợi ý: Hãy trao đổi kỹ nền tảng kiến thức hiện tại của học viên qua Chat trước khi chốt Deadline để tránh phát sinh gia hạn.',
      },
    ],
  },
  {
    step: 4,
    title: 'Hướng dẫn & Ghi nhận Nhật ký từng buổi',
    subtitle: 'Căn cứ pháp lý bảo vệ 100% thù lao với quy tắc 72 giờ',
    description:
      'Trong Không gian Nhiệm vụ, sử dụng Bảng điều khiển để mở Phòng Chat, xem Báo cáo dòng tiền và tạo Nhật ký công việc sau mỗi buổi học (tóm tắt nội dung, kết quả đạt được, ảnh/link minh chứng). Đây là bằng chứng cốt lõi để hệ thống bảo vệ quyền lợi cho bạn.',
    brandIcon: 'writing',
    accentColor: '#2563EB',
    actionLabel: 'Quản lý Nhiệm vụ & Nhật ký',
    actionRoute: '/mentoring/tasks',
    image: require('../../assets/guide/mentor-step4-tasks.webp'),
    imageCaption: 'Bảng điều khiển & Nhật ký công việc',
    imageNotes:
      'Truy cập nhanh Phòng Chat, Báo cáo dòng tiền và danh sách Log đã được Học viên xác nhận minh bạch.',
    imageWidth: 720,
    imageHeight: 1010,
    callouts: [
      {
        id: 1,
        title: 'Bảng điều khiển: Phòng Chat & Báo cáo',
        shortLabel: 'Chat & Dòng tiền',
        description:
          'Mở nhanh kênh trao đổi trực tiếp với Học viên hoặc kiểm tra biên lai, báo cáo tài chính của nhiệm vụ.',
        targetX: 350,
        targetY: 270,
        labelX: 495,
        labelY: 145,
        path: 'M 495 145 L 350 145 L 350 255',
      },
      {
        id: 2,
        title: 'Thẻ Nhật ký công việc & Trạng thái duyệt',
        shortLabel: 'Log #1 Đã xác nhận',
        description:
          'Ghi nhận từng phiên kèm ngày thực hiện. Quá 72 giờ học viên im lặng, hệ thống tự động xác nhận hợp lệ.',
        targetX: 295,
        targetY: 565,
        labelX: 525,
        labelY: 435,
        path: 'M 525 435 L 295 435 L 295 552',
      },
      {
        id: 3,
        title: 'Nội dung hoàn thành & Sản phẩm đạt được',
        shortLabel: 'Bằng chứng buổi học',
        description:
          'Ghi chi tiết kiến thức truyền đạt và sản phẩm bàn giao để làm căn cứ phân xử nếu phát sinh tranh chấp.',
        targetX: 340,
        targetY: 790,
        labelX: 515,
        labelY: 665,
        path: 'M 515 665 L 340 665 L 340 775',
      },
    ],
    highlights: [
      'Học viên trễ quá 15 phút không báo trước: vẫn tính 01 Log hợp lệ',
      'Quá 72 giờ không phản hồi: tự động xác nhận để giải ngân thù lao',
      'Có thể đề xuất Gia hạn thời hạn trước Deadline để giữ điểm uy tín',
    ],
    notes: [
      {
        type: 'warning',
        text: 'QUAN TRỌNG: Luôn tạo Nhật ký công việc ngay sau mỗi buổi hướng dẫn — đây là căn cứ pháp lý số 1 giúp bạn được bảo hộ thù lao 100%.',
      },
    ],
  },
  {
    step: 5,
    title: 'Nộp Nghiệm thu & Nhận Thù lao Tự động',
    subtitle: 'Giải ngân thẳng về tài khoản ngân hàng liên kết qua PayOS',
    description:
      'Khi hoàn thành mục tiêu, bạn nộp nghiệm thu cuối cùng. Ngay khi Học viên bấm xác nhận (hoặc Ban Quản trị đối soát), hệ thống tự động chi trả thù lao về tài khoản ngân hàng của bạn kèm bảng kê minh bạch từng giao dịch.',
    brandIcon: 'coin',
    accentColor: '#15803D',
    actionLabel: 'Xem Bảng kê Thu nhập Cố vấn',
    actionRoute: '/mentoring/earnings',
    image: require('../../assets/guide/mentor-step5-earnings.webp'),
    imageCaption: 'Thu nhập Cố vấn & Lịch sử Giải ngân',
    imageNotes:
      'Thống kê tổng giá trị Đã nhận, Đang xử lý cùng chi tiết từng lệnh chuyển khoản PayOS thành công.',
    imageWidth: 720,
    imageHeight: 1155,
    callouts: [
      {
        id: 1,
        title: 'Tổng quan Thu nhập Đã nhận',
        shortLabel: 'Tổng thu nhập',
        description:
          'Hiển thị tổng số tiền thù lao đã giải ngân thành công, đang xử lý và đối soát theo thời gian thực.',
        targetX: 255,
        targetY: 435,
        labelX: 485,
        labelY: 325,
        path: 'M 485 325 L 255 325 L 255 422',
      },
      {
        id: 2,
        title: 'Lịch sử dòng tiền chi tiết từng Nhiệm vụ',
        shortLabel: 'Bảng kê nhiệm vụ',
        description:
          'Liệt kê rõ tên nhiệm vụ, học viên đồng hành, ngày giao dịch và trạng thái đối soát ngân hàng.',
        targetX: 265,
        targetY: 855,
        labelX: 515,
        labelY: 695,
        path: 'M 515 695 L 265 695 L 265 842',
      },
      {
        id: 3,
        title: 'Huy hiệu "Thành công" chuyển khoản PayOS',
        shortLabel: 'PayOS đã chi trả',
        description:
          'Tiền tự động về tài khoản thụ hưởng qua PayOS (trừ 3.000đ phí chuyển khoản).',
        targetX: 585,
        targetY: 895,
        labelX: 485,
        labelY: 1005,
        path: 'M 485 1005 L 585 1005 L 585 910',
      },
    ],
    highlights: [
      'Chuyển khoản tự động qua PayOS, không cần chờ duyệt thủ công',
      'Thực nhận = Giá trị thỏa thuận − 3.000đ phí chuyển khoản PayOS',
      'Không thu phí hoa hồng trên từng buổi học',
    ],
    notes: [
      {
        type: 'tip',
        text: 'Mẹo: Kiểm tra chính xác số tài khoản thụ hưởng trong Hồ sơ Mentor để lệnh chi trả qua PayOS luôn chính xác.',
      },
    ],
  },
]

/** 5 Câu hỏi thường gặp — Đồng bộ 100% từ Web MentoringGuide.tsx */
export const MENTORING_GUIDE_FAQS: GuideFaqItem[] = [
  {
    tag: 'Ký quỹ & Phí',
    q: 'Tiền ký quỹ và phí giao dịch được tính như thế nào?',
    a: 'Khi Học viên thanh toán thỏa thuận, 100% số tiền được tạm giữ an toàn tại quỹ ký quỹ AlumNect qua PayOS và chỉ giải ngân khi hoàn tất nghiệm thu. AlumNect không thu hoa hồng trên từng buổi học (chỉ thu phí gói thành viên của Mentor), và mọi lệnh chi trả hoặc hoàn tiền chỉ trừ 3.000đ phí chuyển khoản PayOS.',
  },
  {
    tag: 'Quy tắc 72h',
    q: 'Quy định tự động xác nhận Nhật ký công việc sau 72 giờ hoạt động ra sao?',
    a: 'Sau mỗi buổi hướng dẫn, Cố vấn tạo Nhật ký công việc chi tiết kèm minh chứng. Học viên có quyền và trách nhiệm kiểm tra, bấm xác nhận hoặc phản hồi chỉnh sửa trong vòng 72 giờ. Nếu quá 72 giờ mà Học viên im lặng, không phản hồi và không gửi khiếu nại, hệ thống và Ban Quản trị mặc định tự động xác nhận nhật ký hợp lệ làm căn cứ quyết toán cho Cố vấn.',
  },
  {
    tag: 'Lịch hẹn',
    q: 'Chính sách hủy lịch hẹn và vắng mặt quá 15 phút quy định thế nào?',
    a: 'Việc báo hủy hoặc dời lịch buổi hẹn phải thông báo trước tối thiểu 12 giờ. Nếu một bên vào trễ quá 15 phút mà không có lý do chính đáng và không báo trước sẽ tính là vắng mặt: Học viên vắng mặt thì Cố vấn vẫn được ghi nhận nhật ký hợp lệ; Cố vấn vắng mặt thì Học viên được yêu cầu học bù tương đương hoặc hoàn 100% chi phí phiên đó kèm trừ điểm uy tín của Cố vấn.',
  },
  {
    tag: 'Khiếu nại',
    q: 'Thời hiệu mở phiếu khiếu nại tranh chấp là bao lâu?',
    a: 'Phiếu khiếu nại tranh chấp chỉ được phép mở trong vòng tối đa 07 ngày kể từ thời điểm phát sinh sự cố hoặc ngày kết thúc nhiệm vụ để tạm phong tỏa quỹ ký quỹ. Quá 07 ngày, hệ thống tự động đóng quyền khiếu nại và giải ngân dứt điểm theo dữ liệu nhật ký công việc. Phần hoàn lại cho Học viên chỉ trừ 3.000đ phí chuyển khoản hoàn tiền.',
  },
  {
    tag: 'Bản quyền',
    q: 'Quyền sở hữu trí tuệ và miễn trừ trách nhiệm chuyên môn được quy định ra sao?',
    a: 'Các sản phẩm tạo ra trong quá trình hướng dẫn (mã nguồn, thiết kế, báo cáo đồ án trong phạm vi thỏa thuận) thuộc quyền sở hữu của Học viên sau khi hoàn tất thanh toán; các giáo trình, bài giảng mẫu có sẵn của Cố vấn thuộc sở hữu trí tuệ riêng của Cố vấn. AlumNect đóng vai trò kết nối và bảo vệ giao dịch, không cam kết điểm số trên lớp hay kết quả tuyển dụng cuối cùng.',
  },
]
