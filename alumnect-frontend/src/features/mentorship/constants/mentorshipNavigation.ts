import type { ComponentType } from 'react'
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Handshake,
  Inbox,
  Landmark,
  LayoutDashboard,
  MessageCircle,
  Search,
  RotateCcw,
  Send,
  UserCheck,
  Users,
  WalletCards,
} from 'lucide-react'

export type MentorshipNavIcon = ComponentType<{ className?: string }>

export type MentorshipNavigationItem = {
  label: string
  to: string
  activePaths?: string[]
  icon: MentorshipNavIcon
  end?: boolean
  planned?: boolean
  audience: 'common' | 'alumni'
  visibility?: 'always' | 'without-profile' | 'with-profile'
}

export type MentorshipNavigationSection = {
  label: string
  items: MentorshipNavigationItem[]
}

export const MENTORSHIP_NAVIGATION: MentorshipNavigationSection[] = [
  {
    label: 'Khám phá',
    items: [
      {
        label: 'Tổng quan',
        to: '/app/mentoring',
        icon: LayoutDashboard,
        end: true,
        audience: 'common',
      },
      {
        label: 'Khám phá',
        to: '/app/mentoring/discover',
        icon: Search,
        audience: 'common',
      },
      {
        label: 'Tin nhắn Mentoring',
        to: '/app/mentoring/messages',
        activePaths: ['/app/mentoring/messages', '/app/mentoring/chats'],
        icon: MessageCircle,
        audience: 'common',
      },
      {
        label: 'Nhóm Mentoring',
        to: '/app/mentoring/groups',
        icon: Users,
        audience: 'common',
      },
      {
        label: 'Bảng xếp hạng',
        to: '/app/mentoring/ranking',
        icon: Users,
        audience: 'common',
      },
      {
        label: 'Tạo yêu cầu',
        to: '/app/mentoring/requests/create',
        icon: Send,
        audience: 'common',
      },
      {
        label: 'Thỏa thuận',
        to: '/app/mentoring/deals',
        icon: Handshake,
        audience: 'common',
      },
      {
        label: 'Nhiệm vụ của tôi',
        to: '/app/mentoring/tasks',
        activePaths: ['/app/mentoring/tasks'],
        icon: BriefcaseBusiness,
        audience: 'common',
        visibility: 'without-profile',
      },
      {
        label: 'Yêu cầu của tôi',
        to: '/app/mentoring/requests',
        activePaths: ['/app/mentoring/requests'],
        icon: BookOpen,
        audience: 'common',
      },
      {
        label: 'Hoàn tiền',
        to: '/app/mentoring/refunds',
        icon: RotateCcw,
        audience: 'common',
      },
      {
        label: 'Buổi hướng dẫn',
        to: '/app/mentoring/sessions',
        icon: GraduationCap,
        audience: 'common',
        planned: true,
      },
    ],
  },
  {
    label: 'Dành cho Mentor',
    items: [
      {
        label: 'Đăng ký Mentor',
        to: '/app/mentoring/become-mentor',
        icon: UserCheck,
        audience: 'alumni',
        visibility: 'without-profile',
      },
      {
        label: 'Hồ sơ Mentor',
        to: '/app/mentoring/become-mentor',
        icon: FileText,
        audience: 'alumni',
        visibility: 'with-profile',
      },
      {
        label: 'Yêu cầu gửi đến',
        to: '/app/mentoring/incoming-requests',
        activePaths: ['/app/mentoring/incoming-requests', '/app/mentoring/requests/incoming', '/app/mentoring/requests/manage'],
        icon: Inbox,
        audience: 'alumni',
        planned: false,
        visibility: 'with-profile',
      },
      {
        label: 'Nhiệm vụ & Work Log',
        to: '/app/mentoring/tasks',
        activePaths: ['/app/mentoring/tasks'],
        icon: BriefcaseBusiness,
        audience: 'alumni',
        planned: false,
        visibility: 'with-profile',
      },
      {
        label: 'Thu nhập',
        to: '/app/mentoring/earnings',
        icon: Landmark,
        audience: 'alumni',
        visibility: 'with-profile',
      },
      {
        label: 'Trạng thái',
        to: '/app/mentoring/status',
        icon: Activity,
        audience: 'alumni',
        visibility: 'with-profile',
      },
      {
        label: 'Gói thành viên',
        to: '/app/mentoring/packages',
        activePaths: ['/app/mentoring/packages', '/app/mentoring/subscription'],
        icon: WalletCards,
        audience: 'alumni',
        visibility: 'with-profile',
      },
    ],
  },
  {
    label: 'Thông tin',
    items: [
      {
        label: 'Điều khoản dịch vụ',
        to: '/app/mentoring/terms',
        icon: FileText,
        audience: 'common',
      },
    ],
  },
]
