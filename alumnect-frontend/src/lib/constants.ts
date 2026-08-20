import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Users,
  Briefcase,
  CalendarDays,
  MessagesSquare,
  HelpCircle,
  LineChart,
  Map as MapIcon,
  Route,
  Bell,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
  Flag,
  BadgeCheck,
  Megaphone,
  UserCog,
  Lock,
  FileText,
} from 'lucide-react'

export const BRAND = {
  name: 'AlumNect',
  tagline: 'Mạng lưới kết nối cựu sinh viên FPTU',
  university: 'Đại học FPT',
  email: 'hello@alumnect.edu.vn',
}

export type NavItem = {
  label: string
  to: string
  icon?: LucideIcon
  badge?: string
}

/** Top navigation for the public marketing site. */
export const MARKETING_NAV: NavItem[] = [
  { label: 'Nền tảng', to: '/#platform' },
  { label: 'Mạng lưới', to: '/#network' },
  { label: 'Tuyển dụng', to: '/#careers' },
  { label: 'Sự kiện', to: '/#events' },
  { label: 'Góc nhìn', to: '/#insights' },
]

/**
 * Primary, most-used features — shown as top-header tabs (Facebook/LinkedIn style)
 * and as the mobile bottom tab bar.
 */
export const APP_PRIMARY_NAV: NavItem[] = [
  { label: 'Bảng tin', to: '/app', icon: Home },
  { label: 'Cựu sinh viên', to: '/app/alumni', icon: Users },
  { label: 'Tuyển dụng', to: '/app/jobs', icon: Briefcase },
  { label: 'Sự kiện', to: '/app/events', icon: CalendarDays },
  { label: 'Diễn đàn hỏi đáp', to: '/app/forum', icon: HelpCircle },
]

/** Secondary features — tucked into the "More" apps menu (used less often). */
export const APP_MORE_NAV: NavItem[] = [
  { label: 'Bảng lương', to: '/app/salary', icon: LineChart },
  { label: 'Bản đồ cựu SV', to: '/app/map', icon: MapIcon },
  { label: 'Lộ trình nghề nghiệp', to: '/app/career', icon: Route },
]

/** Items inside the avatar / account dropdown. */
export const APP_ACCOUNT_NAV: NavItem[] = [
  { label: 'Trang cá nhân', to: '/app/profile', icon: Users },
  { label: 'Đổi mật khẩu', to: '/app/change-password', icon: Lock },
  { label: 'Gói thành viên', to: '/app/subscription', icon: CreditCard },
  { label: 'Bảng quản trị', to: '/admin', icon: ShieldCheck },
]

/** Full flat list (kept for any "all features" surfaces). */
export const APP_NAV: NavItem[] = [
  ...APP_PRIMARY_NAV,
  ...APP_MORE_NAV,
  { label: 'Tin nhắn', to: '/app/messages', icon: MessagesSquare, badge: '3' },
  { label: 'Thông báo', to: '/app/notifications', icon: Bell },
  { label: 'Gói thành viên', to: '/app/subscription', icon: CreditCard },
]

/** Admin dashboard navigation. */
export const ADMIN_NAV: NavItem[] = [
  { label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
  { label: 'Người dùng', to: '/admin/users', icon: UserCog },
  { label: 'Bài viết', to: '/admin/posts', icon: FileText },
  { label: 'Xác minh', to: '/admin/verifications', icon: BadgeCheck },
  { label: 'Báo cáo', to: '/admin/reports', icon: Flag },
  { label: 'Doanh thu', to: '/admin/revenue', icon: CreditCard },
  { label: 'Thông báo chung', to: '/admin/broadcast', icon: Megaphone },
  { label: 'Kiểm duyệt', to: '/admin/moderation', icon: ShieldCheck },
]

/** Headline platform stats (marketing). */
export const STATS = [
  { value: 24800, suffix: '+', label: 'Cựu sinh viên đã xác minh' },
  { value: 1260, suffix: '+', label: 'Việc làm đã đăng' },
  { value: 540, suffix: '+', label: 'Sự kiện đã tổ chức' },
  { value: 96, suffix: '%', label: 'Đánh giá hài lòng' },
]

export const MODULES = [
  {
    key: 'feed',
    icon: Home,
    title: 'Bảng tin cộng đồng',
    desc: 'Cập nhật thành tựu, câu chuyện và tin tức từ mạng lưới đã xác thực.',
    tone: 'brand',
  },
  {
    key: 'jobs',
    icon: Briefcase,
    title: 'Tuyển dụng & Việc làm',
    desc: 'Cơ hội việc làm nội bộ dành riêng cho cựu sinh viên và sinh viên FPTU.',
    tone: 'gold',
  },
  {
    key: 'events',
    icon: CalendarDays,
    title: 'Sự kiện & Họp mặt',
    desc: 'Tạo, đăng ký tham gia và nhận nhắc nhở về các buổi workshop, giao lưu.',
    tone: 'aqua',
  },
  {
    key: 'forum',
    icon: HelpCircle,
    title: 'Diễn đàn hỏi đáp',
    desc: 'Hỏi tiền bối, giải đáp hậu bối, cùng nhau xây dựng kho tri thức.',
    tone: 'violet',
  },
  {
    key: 'salary',
    icon: LineChart,
    title: 'Bảng lương ẩn danh',
    desc: 'Tra cứu mức lương thực tế theo vị trí, ngành nghề và khu vực.',
    tone: 'brand',
  },
  {
    key: 'map',
    icon: MapIcon,
    title: 'Bản đồ cựu SV',
    desc: 'Xem mạng lưới cựu sinh viên đang sinh sống và làm việc trên toàn cầu.',
    tone: 'aqua',
  },
  {
    key: 'career',
    icon: Route,
    title: 'Lộ trình nghề nghiệp',
    desc: 'Khám phá hành trình thăng tiến thực tế của các cựu sinh viên FPTU.',
    tone: 'violet',
  },
  {
    key: 'messaging',
    icon: MessagesSquare,
    title: 'Nhắn tin trực tiếp',
    desc: 'Kết nối và trao đổi kinh nghiệm trực tiếp với các thành viên đã xác thực.',
    tone: 'gold',
  },
] as const

export const STEPS = [
  {
    n: '01',
    title: 'Đăng ký & Xác minh',
    desc: 'Tạo tài khoản qua Email hoặc Google FPT, gửi minh chứng để nhận huy hiệu đã xác minh.',
  },
  {
    n: '02',
    title: 'Hoàn thiện hồ sơ',
    desc: 'Thêm quá trình công tác, kỹ năng và khóa học để kết nối đúng người.',
  },
  {
    n: '03',
    title: 'Kết nối & Phát triển',
    desc: 'Theo dõi cựu sinh viên, tham gia sự kiện, tìm việc làm và mở rộng mạng lưới.',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'AlumNect là nền tảng kết nối rất hữu ích. Tôi đã tìm được công việc đầu tiên nhờ một anh cựu sinh viên khóa trên.',
    name: 'Trần Minh Anh',
    role: 'Software Engineer · SE K15',
    avatar: 'https://i.pravatar.cc/120?img=12',
  },
  {
    quote:
      'Huy hiệu xác minh giúp mọi kết nối an tâm hơn hẳn. Bạn luôn biết mình đang trò chuyện với cựu sinh viên FPTU thật sự.',
    name: 'Nguyễn Hải Long',
    role: 'Product Manager · IB K13',
    avatar: 'https://i.pravatar.cc/120?img=33',
  },
  {
    quote:
      'Chúng tôi đã tuyển được 2 thực tập sinh xuất sắc chỉ sau một bài đăng tuyển dụng trên AlumNect.',
    name: 'Phạm Thu Hà',
    role: 'Talent Lead · MKT K12',
    avatar: 'https://i.pravatar.cc/120?img=45',
  },
  {
    quote:
      'Bảng lương giúp tôi tự tin hơn rất nhiều khi đàm phán mức lương mới. Dữ liệu ẩn danh nhưng rất thực tế.',
    name: 'Lê Quốc Bảo',
    role: 'Data Analyst · AI K16',
    avatar: 'https://i.pravatar.cc/120?img=8',
  },
  {
    quote:
      'Tôi quay lại chia sẻ kinh nghiệm trên diễn đàn và đã kết nối lại với rất nhiều bạn bè cùng khóa.',
    name: 'Vũ Khánh Vy',
    role: 'UX Designer · GD K14',
    avatar: 'https://i.pravatar.cc/120?img=20',
  },
]

export const LOGOS = ['FPT Software', 'VNG', 'Momo', 'Shopee', 'Viettel', 'Grab', 'Techcombank', 'KMS']

/** Mock feed posts. */
export const FEED_POSTS = [
  {
    id: 'p1',
    type: 'achievement',
    author: 'Trần Minh Anh',
    role: 'Software Engineer @ FPT Software',
    avatar: 'https://i.pravatar.cc/120?img=12',
    verified: true,
    time: '2 giờ trước',
    text: 'Vừa chính thức được thăng chức lên Senior Engineer! Cảm ơn các anh chị tiền bối trên AlumNect đã nhiệt tình hỗ trợ và chia sẻ kinh nghiệm phỏng vấn System Design. 🚀',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop',
    likes: 248,
    comments: 36,
    reposts: 12,
  },
  {
    id: 'p2',
    type: 'recruitment',
    author: 'Phạm Thu Hà',
    role: 'Talent Lead @ VNG',
    avatar: 'https://i.pravatar.cc/120?img=45',
    verified: true,
    time: '5 giờ trước',
    text: 'Bên mình đang tuyển 3 bạn Thực tập sinh Frontend (React/TS) cho đợt Q3. Sinh viên & cựu sinh viên FPTU sẽ được ưu tiên duyệt hồ sơ phỏng vấn sớm — hãy để lại bình luận hoặc nhắn tin trực tiếp cho mình nhé.',
    image: null,
    likes: 96,
    comments: 54,
    reposts: 28,
  },
  {
    id: 'p3',
    type: 'event',
    author: 'AlumNect Events',
    role: 'Ban tổ chức',
    avatar: 'https://i.pravatar.cc/120?img=64',
    verified: true,
    time: '1 ngày trước',
    text: 'FPTU Alumni Homecoming 2026 — Đêm hội ngộ, giao lưu và âm nhạc dành riêng cho cựu sinh viên FPTU. Số lượng chỗ có hạn, hãy nhanh tay đăng ký ngay.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
    likes: 512,
    comments: 88,
    reposts: 64,
  },
]

/** Mock jobs. */
export const JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', company: 'FPT Software', location: 'Đà Nẵng · Hybrid', type: 'Toàn thời gian', salary: '$1,800 – $2,800', tags: ['React', 'TypeScript', 'Tailwind'], featured: true, logo: '🟧' },
  { id: 'j2', title: 'Product Designer', company: 'Momo', location: 'TP.HCM · Trực tiếp', type: 'Toàn thời gian', salary: '$1,500 – $2,400', tags: ['Figma', 'Design System'], featured: true, logo: '🟣' },
  { id: 'j3', title: 'Data Analyst Intern', company: 'Shopee', location: 'Từ xa (Remote)', type: 'Thực tập', salary: '$500 – $800', tags: ['SQL', 'Python', 'Tableau'], featured: false, logo: '🟠' },
  { id: 'j4', title: 'Backend Engineer (Java)', company: 'Techcombank', location: 'Hà Nội · Hybrid', type: 'Toàn thời gian', salary: '$2,000 – $3,200', tags: ['Spring Boot', 'PostgreSQL', 'AWS'], featured: false, logo: '🔵' },
  { id: 'j5', title: 'Mobile Engineer (Flutter)', company: 'VNG', location: 'TP.HCM · Trực tiếp', type: 'Toàn thời gian', salary: '$1,600 – $2,600', tags: ['Flutter', 'Dart'], featured: false, logo: '🟢' },
  { id: 'j6', title: 'AI Research Engineer', company: 'Viettel AI', location: 'Hà Nội · Trực tiếp', type: 'Toàn thời gian', salary: '$2,400 – $4,000', tags: ['PyTorch', 'NLP', 'LLM'], featured: true, logo: '🔴' },
]
export type Job = (typeof JOBS)[number]

/** Mock events. */
export const EVENTS = [
  { id: 'e1', title: 'FPTU Alumni Homecoming 2026', date: '26 Th7', month: 'TH7', day: '26', location: 'FPT Campus, Đà Nẵng', attendees: 480, cover: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop', tag: 'Hội ngộ' },
  { id: 'e2', title: 'Tech Talk: Tối ưu hệ thống triệu người dùng', date: '03 Th8', month: 'TH8', day: '03', location: 'Trực tuyến · Zoom', attendees: 1240, cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop', tag: 'Hội thảo' },
  { id: 'e3', title: 'Alumni Startup Demo Night', date: '18 Th8', month: 'TH8', day: '18', location: 'Dreamplex, TP.HCM', attendees: 320, cover: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop', tag: 'Kết nối' },
  { id: 'e4', title: 'Ngày hội việc làm: Tuyển dụng nội bộ FPTU', date: '09 Th9', month: 'TH9', day: '09', location: 'FPT Campus, Hà Nội', attendees: 760, cover: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop', tag: 'Tuyển dụng' },
]
export type EventItem = (typeof EVENTS)[number]

/** Mock alumni directory. */
export const ALUMNI = [
  { id: 'a1', name: 'Trần Minh Anh', role: 'Senior SWE @ FPT Software', category: 'Software', cohort: 'SE · K15', avatar: 'https://i.pravatar.cc/160?img=12', skills: ['React', 'Node', 'AWS'], verified: true, followers: 1240 },
  { id: 'a2', name: 'Nguyễn Hải Long', role: 'Product Manager @ Grab', category: 'Product', cohort: 'IB · K13', avatar: 'https://i.pravatar.cc/160?img=33', skills: ['Strategy', 'Analytics'], verified: true, followers: 2310 },
  { id: 'a3', name: 'Phạm Thu Hà', role: 'Talent Lead @ VNG', category: 'Business', cohort: 'MKT · K12', avatar: 'https://i.pravatar.cc/160?img=45', skills: ['Recruiting', 'Branding'], verified: true, followers: 980 },
  { id: 'a4', name: 'Lê Quốc Bảo', role: 'Data Analyst @ Shopee', category: 'Data', cohort: 'AI · K16', avatar: 'https://i.pravatar.cc/160?img=8', skills: ['SQL', 'Python', 'ML'], verified: true, followers: 640 },
  { id: 'a5', name: 'Vũ Khánh Vy', role: 'UX Designer @ Momo', category: 'Design', cohort: 'GD · K14', avatar: 'https://i.pravatar.cc/160?img=20', skills: ['Figma', 'Research'], verified: false, followers: 410 },
  { id: 'a6', name: 'Đỗ Gia Huy', role: 'DevOps @ Techcombank', category: 'Software', cohort: 'SE · K13', avatar: 'https://i.pravatar.cc/160?img=51', skills: ['K8s', 'Terraform'], verified: true, followers: 720 },
  { id: 'a7', name: 'Hoàng Thảo My', role: 'BA @ Viettel', category: 'Business', cohort: 'IS · K15', avatar: 'https://i.pravatar.cc/160?img=27', skills: ['BPMN', 'SQL'], verified: true, followers: 530 },
  { id: 'a8', name: 'Bùi Tuấn Kiệt', role: 'Founder @ Stealth', category: 'Business', cohort: 'SE · K11', avatar: 'https://i.pravatar.cc/160?img=15', skills: ['Leadership', 'Go'], verified: true, followers: 3100 },
]
export type AlumniProfile = (typeof ALUMNI)[number]

/** Mock forum questions. */
export const QUESTIONS = [
  { id: 'q1', title: 'Làm thế nào để chuyển hướng từ QA sang Backend Engineer?', topic: 'Sự nghiệp', votes: 42, answers: 11, author: 'Ẩn danh', time: '3 giờ trước', tags: ['career', 'backend'] },
  { id: 'q2', title: 'Những chủ đề System Design nào cần ôn tập khi phỏng vấn vị trí Senior?', topic: 'Phỏng vấn', votes: 88, answers: 23, author: 'Lê Quốc Bảo', time: '6 giờ trước', tags: ['interview', 'system-design'] },
  { id: 'q3', title: 'Học thạc sĩ có thực sự cần thiết cho vị trí Product Manager tại VN không?', topic: 'Học vấn', votes: 31, answers: 14, author: 'Nguyễn Hải Long', time: '1 ngày trước', tags: ['education', 'pm'] },
  { id: 'q4', title: 'Tài liệu tốt nhất để học Spring Boot nâng cao năm 2026?', topic: 'Kỹ thuật', votes: 56, answers: 19, author: 'Đỗ Gia Huy', time: '2 ngày trước', tags: ['java', 'spring'] },
]
export type Question = (typeof QUESTIONS)[number]

/** Mock salary rows for the salary board. */
export const SALARY = [
  { role: 'Software Engineer', level: 'Junior', region: 'Đà Nẵng', median: 18, p25: 14, p75: 24, samples: 142 },
  { role: 'Software Engineer', level: 'Senior', region: 'TP.HCM', median: 42, p25: 34, p75: 58, samples: 96 },
  { role: 'Product Manager', level: 'Mid', region: 'TP.HCM', median: 38, p25: 30, p75: 50, samples: 54 },
  { role: 'Data Analyst', level: 'Mid', region: 'Hà Nội', median: 28, p25: 22, p75: 36, samples: 71 },
  { role: 'UX Designer', level: 'Mid', region: 'Từ xa (Remote)', median: 26, p25: 20, p75: 34, samples: 48 },
  { role: 'DevOps Engineer', level: 'Senior', region: 'TP.HCM', median: 50, p25: 40, p75: 66, samples: 39 },
]
export type SalaryRow = (typeof SALARY)[number]

/** Mock career path stages. */
export const CAREER_PATH = [
  { stage: 'Mới tốt nghiệp', roles: ['Thực tập sinh', 'Fresher Engineer'], years: '0–1 năm', share: 100 },
  { stage: 'Giai đoạn đầu', roles: ['Software Engineer', 'QA Engineer', 'BA'], years: '1–3 năm', share: 82 },
  { stage: 'Giai đoạn giữa', roles: ['Senior Engineer', 'Team Lead', 'Product Owner'], years: '3–6 năm', share: 54 },
  { stage: 'Lãnh đạo / Quản lý', roles: ['Engineering Manager', 'Principal', 'Founder'], years: '6+ năm', share: 23 },
]

/** Mock map markers (percentage coordinates on the stylised map). */
export const MAP_MARKERS = [
  { id: 'm1', city: 'Hà Nội', count: 6200, x: 62, y: 22 },
  { id: 'm2', city: 'Đà Nẵng', count: 4100, x: 66, y: 41 },
  { id: 'm3', city: 'TP.HCM', count: 9800, x: 64, y: 60 },
  { id: 'm4', city: 'Singapore', count: 880, x: 70, y: 70 },
  { id: 'm5', city: 'Tokyo', count: 640, x: 82, y: 30 },
  { id: 'm6', city: 'Sydney', count: 320, x: 88, y: 82 },
  { id: 'm7', city: 'San Francisco', count: 410, x: 14, y: 34 },
  { id: 'm8', city: 'Berlin', count: 230, x: 47, y: 24 },
]
export type MapMarker = (typeof MAP_MARKERS)[number]

/** Pricing / posting packages. */
export const PACKAGES = [
  {
    name: 'Cơ bản (Starter)',
    price: 0,
    period: 'miễn phí',
    highlight: false,
    features: ['1 tin tuyển dụng đang chạy', 'Hồ sơ cơ bản', 'Bảng tin cộng đồng', 'Đăng ký sự kiện'],
    cta: 'Gói hiện tại',
  },
  {
    name: 'Nhà tuyển dụng (Recruiter)',
    price: 990000,
    period: '/ tháng',
    highlight: true,
    features: ['10 tin tuyển dụng đang chạy', 'Ghim bài nổi bật', 'Thống kê ứng viên', 'Hỗ trợ ưu tiên', 'Huy hiệu nhà tuyển dụng uy tín'],
    cta: 'Nâng cấp ngay',
  },
  {
    name: 'Doanh nghiệp (Enterprise)',
    price: 4900000,
    period: '/ tháng',
    highlight: false,
    features: ['Không giới hạn tin tuyển dụng', 'Trang thương hiệu doanh nghiệp', 'Phân tích nhân tài nâng cao', 'Chuyên viên hỗ trợ riêng', 'Tài trợ sự kiện'],
    cta: 'Liên hệ tư vấn',
  },
]

/** Admin KPI cards. */
export const ADMIN_KPIS = [
  { label: 'Tổng người dùng', value: 24800, delta: '+8.2%', up: true },
  { label: 'Chờ xác minh', value: 132, delta: '+12', up: true },
  { label: 'Việc làm đang mở', value: 486, delta: '-3.1%', up: false },
  { label: 'Doanh thu tháng', value: 78_400_000, delta: '+14.6%', up: true, currency: true },
]
export type AdminKpi = (typeof ADMIN_KPIS)[number]

