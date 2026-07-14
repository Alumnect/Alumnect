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
} from 'lucide-react'

export const BRAND = {
  name: 'AlumNect',
  tagline: 'The verified home of the FPTU alumni community',
  university: 'FPT University',
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
  { label: 'Platform', to: '/#platform' },
  { label: 'Network', to: '/#network' },
  { label: 'Careers', to: '/#careers' },
  { label: 'Events', to: '/#events' },
  { label: 'Insights', to: '/#insights' },
]

/**
 * Primary, most-used features — shown as top-header tabs (Facebook/LinkedIn style)
 * and as the mobile bottom tab bar.
 */
export const APP_PRIMARY_NAV: NavItem[] = [
  { label: 'Feed', to: '/app', icon: Home },
  { label: 'Alumni', to: '/app/alumni', icon: Users },
  { label: 'Jobs', to: '/app/jobs', icon: Briefcase },
  { label: 'Events', to: '/app/events', icon: CalendarDays },
  { label: 'Q&A Forum', to: '/app/forum', icon: HelpCircle },
]

/** Secondary features — tucked into the "More" apps menu (used less often). */
export const APP_MORE_NAV: NavItem[] = [
  { label: 'Salary Board', to: '/app/salary', icon: LineChart },
  { label: 'Alumni Map', to: '/app/map', icon: MapIcon },
  { label: 'Career Paths', to: '/app/career', icon: Route },
]

/** Items inside the avatar / account dropdown. */
export const APP_ACCOUNT_NAV: NavItem[] = [
  { label: 'My Profile', to: '/app/profile', icon: Users },
  { label: 'Change Password', to: '/app/change-password', icon: Lock },
  { label: 'Subscription', to: '/app/subscription', icon: CreditCard },
  { label: 'Admin Console', to: '/admin', icon: ShieldCheck },
]

/** Full flat list (kept for any "all features" surfaces). */
export const APP_NAV: NavItem[] = [
  ...APP_PRIMARY_NAV,
  ...APP_MORE_NAV,
  { label: 'Messages', to: '/app/messages', icon: MessagesSquare, badge: '3' },
  { label: 'Notifications', to: '/app/notifications', icon: Bell },
  { label: 'Subscription', to: '/app/subscription', icon: CreditCard },
]

/** Admin dashboard navigation. */
export const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: UserCog },
  { label: 'Verifications', to: '/admin/verifications', icon: BadgeCheck },
  { label: 'Reports', to: '/admin/reports', icon: Flag },
  { label: 'Revenue', to: '/admin/revenue', icon: CreditCard },
  { label: 'Broadcast', to: '/admin/broadcast', icon: Megaphone },
  { label: 'Moderation', to: '/admin/moderation', icon: ShieldCheck },
]

/** Headline platform stats (marketing). */
export const STATS = [
  { value: 24800, suffix: '+', label: 'Verified alumni' },
  { value: 1260, suffix: '+', label: 'Jobs posted' },
  { value: 540, suffix: '+', label: 'Events hosted' },
  { value: 96, suffix: '%', label: 'Would recommend' },
]

export const MODULES = [
  {
    key: 'feed',
    icon: Home,
    title: 'Community Feed',
    desc: 'Achievements, stories and updates from a verified network — no noise, no fakes.',
    tone: 'brand',
  },
  {
    key: 'jobs',
    icon: Briefcase,
    title: 'Jobs & Recruitment',
    desc: 'Alumni-only hiring with paid posting packages and trusted referrals.',
    tone: 'gold',
  },
  {
    key: 'events',
    icon: CalendarDays,
    title: 'Events & Reunions',
    desc: 'Create, RSVP and get reminders for meetups, talks and reunions.',
    tone: 'aqua',
  },
  {
    key: 'forum',
    icon: HelpCircle,
    title: 'Q&A Forum',
    desc: 'Ask seniors, answer juniors, and build a living knowledge base.',
    tone: 'violet',
  },
  {
    key: 'salary',
    icon: LineChart,
    title: 'Salary Board',
    desc: 'Anonymous, aggregated salary insight by role, industry and region.',
    tone: 'brand',
  },
  {
    key: 'map',
    icon: MapIcon,
    title: 'Alumni Map',
    desc: 'See where the network lives and works across the globe.',
    tone: 'aqua',
  },
  {
    key: 'career',
    icon: Route,
    title: 'Career Paths',
    desc: 'Visualise real journeys FPTU graduates took to reach their roles.',
    tone: 'violet',
  },
  {
    key: 'messaging',
    icon: MessagesSquare,
    title: 'Direct Messaging',
    desc: 'Mentor and connect privately with verified members.',
    tone: 'gold',
  },
] as const

export const STEPS = [
  {
    n: '01',
    title: 'Register & verify',
    desc: 'Sign up with email or Google, then submit FPTU proof to earn the verified badge.',
  },
  {
    n: '02',
    title: 'Build your profile',
    desc: 'Add your career timeline, skills and cohort so the right people can find you.',
  },
  {
    n: '03',
    title: 'Connect & grow',
    desc: 'Follow alumni, join events, ask questions, get hired and give back.',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'AlumNect is the first place that actually feels official. I found my first job through a senior I met here.',
    name: 'Trần Minh Anh',
    role: 'Software Engineer · SE K15',
    avatar: 'https://i.pravatar.cc/120?img=12',
  },
  {
    quote:
      'The verified badge changes everything. You know you are talking to real FPTU graduates, not random accounts.',
    name: 'Nguyễn Hải Long',
    role: 'Product Manager · IB K13',
    avatar: 'https://i.pravatar.cc/120?img=33',
  },
  {
    quote:
      'We hired two interns from a single recruitment post. The quality of the network is unmatched.',
    name: 'Phạm Thu Hà',
    role: 'Talent Lead · MKT K12',
    avatar: 'https://i.pravatar.cc/120?img=45',
  },
  {
    quote:
      'The salary board gave me the confidence to negotiate a 30% raise. Anonymous, but real data.',
    name: 'Lê Quốc Bảo',
    role: 'Data Analyst · AI K16',
    avatar: 'https://i.pravatar.cc/120?img=8',
  },
  {
    quote:
      'I came back to mentor on the forum and ended up reconnecting with my whole cohort.',
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
    time: '2h',
    text: 'Just got promoted to Senior Engineer! Forever grateful to the seniors on AlumNect who mentored me through system design interviews. 🚀',
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
    time: '5h',
    text: "We're hiring 3 Frontend Interns (React/TS) for our Q3 cohort. FPTU alumni & students get a priority screening — drop a comment or DM me.",
    image: null,
    likes: 96,
    comments: 54,
    reposts: 28,
  },
  {
    id: 'p3',
    type: 'event',
    author: 'AlumNect Events',
    role: 'Official',
    avatar: 'https://i.pravatar.cc/120?img=64',
    verified: true,
    time: '1d',
    text: 'FPTU Alumni Homecoming 2026 — a night of reconnection, talks and live music. Limited seats. RSVP now.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
    likes: 512,
    comments: 88,
    reposts: 64,
  },
]

/** Mock jobs. */
export const JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', company: 'FPT Software', location: 'Đà Nẵng · Hybrid', type: 'Full-time', salary: '$1,800 – $2,800', tags: ['React', 'TypeScript', 'Tailwind'], featured: true, logo: '🟧' },
  { id: 'j2', title: 'Product Designer', company: 'Momo', location: 'HCMC · On-site', type: 'Full-time', salary: '$1,500 – $2,400', tags: ['Figma', 'Design System'], featured: true, logo: '🟣' },
  { id: 'j3', title: 'Data Analyst Intern', company: 'Shopee', location: 'Remote', type: 'Internship', salary: '$500 – $800', tags: ['SQL', 'Python', 'Tableau'], featured: false, logo: '🟠' },
  { id: 'j4', title: 'Backend Engineer (Java)', company: 'Techcombank', location: 'Hà Nội · Hybrid', type: 'Full-time', salary: '$2,000 – $3,200', tags: ['Spring Boot', 'PostgreSQL', 'AWS'], featured: false, logo: '🔵' },
  { id: 'j5', title: 'Mobile Engineer (Flutter)', company: 'VNG', location: 'HCMC · On-site', type: 'Full-time', salary: '$1,600 – $2,600', tags: ['Flutter', 'Dart'], featured: false, logo: '🟢' },
  { id: 'j6', title: 'AI Research Engineer', company: 'Viettel AI', location: 'Hà Nội · On-site', type: 'Full-time', salary: '$2,400 – $4,000', tags: ['PyTorch', 'NLP', 'LLM'], featured: true, logo: '🔴' },
]
export type Job = (typeof JOBS)[number]

/** Mock events. */
export const EVENTS = [
  { id: 'e1', title: 'FPTU Alumni Homecoming 2026', date: 'Jul 26', month: 'JUL', day: '26', location: 'FPT Campus, Đà Nẵng', attendees: 480, cover: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop', tag: 'Reunion' },
  { id: 'e2', title: 'Tech Talk: Scaling to a Million Users', date: 'Aug 03', month: 'AUG', day: '03', location: 'Online · Zoom', attendees: 1240, cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop', tag: 'Talk' },
  { id: 'e3', title: 'Alumni Startup Demo Night', date: 'Aug 18', month: 'AUG', day: '18', location: 'Dreamplex, HCMC', attendees: 320, cover: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop', tag: 'Networking' },
  { id: 'e4', title: 'Career Fair: Hire from the Network', date: 'Sep 09', month: 'SEP', day: '09', location: 'FPT Campus, Hà Nội', attendees: 760, cover: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop', tag: 'Career' },
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
  { id: 'q1', title: 'How do I transition from QA to a backend engineering role?', topic: 'Career', votes: 42, answers: 11, author: 'Anonymous', time: '3h', tags: ['career', 'backend'] },
  { id: 'q2', title: 'What system design topics should I review for a senior interview?', topic: 'Interview', votes: 88, answers: 23, author: 'Lê Quốc Bảo', time: '6h', tags: ['interview', 'system-design'] },
  { id: 'q3', title: 'Is a master degree worth it for a product manager in Vietnam?', topic: 'Education', votes: 31, answers: 14, author: 'Nguyễn Hải Long', time: '1d', tags: ['education', 'pm'] },
  { id: 'q4', title: 'Best resources to learn Spring Boot in 2026?', topic: 'Engineering', votes: 56, answers: 19, author: 'Đỗ Gia Huy', time: '2d', tags: ['java', 'spring'] },
]
export type Question = (typeof QUESTIONS)[number]

/** Mock salary rows for the salary board. */
export const SALARY = [
  { role: 'Software Engineer', level: 'Junior', region: 'Đà Nẵng', median: 18, p25: 14, p75: 24, samples: 142 },
  { role: 'Software Engineer', level: 'Senior', region: 'HCMC', median: 42, p25: 34, p75: 58, samples: 96 },
  { role: 'Product Manager', level: 'Mid', region: 'HCMC', median: 38, p25: 30, p75: 50, samples: 54 },
  { role: 'Data Analyst', level: 'Mid', region: 'Hà Nội', median: 28, p25: 22, p75: 36, samples: 71 },
  { role: 'UX Designer', level: 'Mid', region: 'Remote', median: 26, p25: 20, p75: 34, samples: 48 },
  { role: 'DevOps Engineer', level: 'Senior', region: 'HCMC', median: 50, p25: 40, p75: 66, samples: 39 },
]
export type SalaryRow = (typeof SALARY)[number]

/** Mock career path stages. */
export const CAREER_PATH = [
  { stage: 'Graduate', roles: ['Intern', 'Fresher Engineer'], years: 'Year 0–1', share: 100 },
  { stage: 'Early career', roles: ['Software Engineer', 'QA Engineer', 'BA'], years: 'Year 1–3', share: 82 },
  { stage: 'Mid career', roles: ['Senior Engineer', 'Team Lead', 'Product Owner'], years: 'Year 3–6', share: 54 },
  { stage: 'Leadership', roles: ['Engineering Manager', 'Principal', 'Founder'], years: 'Year 6+', share: 23 },
]

/** Mock map markers (percentage coordinates on the stylised map). */
export const MAP_MARKERS = [
  { id: 'm1', city: 'Hà Nội', count: 6200, x: 62, y: 22 },
  { id: 'm2', city: 'Đà Nẵng', count: 4100, x: 66, y: 41 },
  { id: 'm3', city: 'HCMC', count: 9800, x: 64, y: 60 },
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
    name: 'Starter',
    price: 0,
    period: 'free',
    highlight: false,
    features: ['1 active job post', 'Basic profile', 'Community feed', 'Event RSVP'],
    cta: 'Current plan',
  },
  {
    name: 'Recruiter',
    price: 990000,
    period: '/ month',
    highlight: true,
    features: ['10 active job posts', 'Featured listings', 'Applicant insights', 'Priority support', 'Verified recruiter badge'],
    cta: 'Upgrade now',
  },
  {
    name: 'Enterprise',
    price: 4900000,
    period: '/ month',
    highlight: false,
    features: ['Unlimited job posts', 'Employer branding page', 'Talent analytics', 'Dedicated manager', 'Event sponsorship'],
    cta: 'Contact sales',
  },
]

/** Admin KPI cards. */
export const ADMIN_KPIS = [
  { label: 'Total users', value: 24800, delta: '+8.2%', up: true },
  { label: 'Pending verifications', value: 132, delta: '+12', up: true },
  { label: 'Active jobs', value: 486, delta: '-3.1%', up: false },
  { label: 'Monthly revenue', value: 78_400_000, delta: '+14.6%', up: true, currency: true },
]
export type AdminKpi = (typeof ADMIN_KPIS)[number]
