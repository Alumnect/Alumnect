import type { ComponentType } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  PlusCircle,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  WalletCards,
} from 'lucide-react'

export type MentorshipNavIcon = ComponentType<{ className?: string }>

export type MentorshipNavigationItem = {
  label: string
  to?: string
  activePaths?: string[]
  icon: MentorshipNavIcon
  end?: boolean
  planned?: boolean
  audience: 'common' | 'alumni'
  visibility?: 'always' | 'without-profile' | 'with-profile'
  children?: MentorshipNavigationItem[]
}

export type MentorshipNavigationSection = {
  label: string
  items: MentorshipNavigationItem[]
}

export const MENTORSHIP_NAVIGATION: MentorshipNavigationSection[] = [
  {
    label: 'Mentoring',
    items: [
      {
        label: 'Tổng quan',
        to: '/app/mentoring',
        icon: LayoutDashboard,
        end: true,
        audience: 'common',
      },
      {
        label: 'Tìm Mentor',
        icon: Search,
        audience: 'common',
        children: [
          {
            label: 'Khám phá Mentor',
            to: '/app/mentoring/discover',
            activePaths: ['/app/mentoring/discover', '/app/mentoring/mentors'],
            icon: Search,
            audience: 'common',
          },
          {
            label: 'Mentor nổi bật',
            to: '/app/mentoring/ranking',
            icon: BarChart3,
            audience: 'common',
          },
        ],
      },
      {
        label: 'Mentoring của tôi',
        icon: BookOpen,
        audience: 'common',
        children: [
          {
            label: 'Tạo yêu cầu mới',
            to: '/app/mentoring/requests/create',
            activePaths: ['/app/mentoring/requests/create', '/app/mentoring/mentors'],
            icon: PlusCircle,
            audience: 'common',
          },
          {
            label: 'Yêu cầu của tôi',
            to: '/app/mentoring/requests',
            activePaths: ['/app/mentoring/requests'],
            icon: BookOpen,
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
            label: 'Hoàn tiền',
            to: '/app/mentoring/refunds',
            icon: RotateCcw,
            audience: 'common',
          },
        ],
      },
      {
        label: 'Tin nhắn',
        to: '/app/mentoring/messages',
        activePaths: ['/app/mentoring/messages', '/app/mentoring/chats'],
        icon: MessageCircle,
        audience: 'common',
      },
      {
        label: 'Nhóm Mentoring',
        to: '/app/mentoring/groups',
        activePaths: ['/app/mentoring/groups'],
        icon: Users,
        audience: 'common',
      },
    ],
  },
  {
    label: 'Dành cho Mentor',
    items: [
      {
        label: 'Đăng ký làm Mentor',
        to: '/app/mentoring/become-mentor',
        icon: UserCheck,
        audience: 'alumni',
        visibility: 'without-profile',
      },
      {
        label: 'Trung tâm Mentor',
        icon: BriefcaseBusiness,
        audience: 'alumni',
        visibility: 'with-profile',
        children: [
          {
            label: 'Hồ sơ Mentor',
            to: '/app/mentoring/become-mentor',
            icon: FileText,
            audience: 'alumni',
            visibility: 'with-profile',
          },
          {
            label: 'Nhiệm vụ & Work Log',
            to: '/app/mentoring/tasks',
            activePaths: ['/app/mentoring/tasks'],
            icon: BriefcaseBusiness,
            audience: 'alumni',
            visibility: 'with-profile',
          },
          {
            label: 'Thu nhập',
            to: '/app/mentoring/earnings',
            icon: CircleDollarSign,
            audience: 'alumni',
            visibility: 'with-profile',
          },
          {
            label: 'Trạng thái hồ sơ',
            to: '/app/mentoring/status',
            icon: Activity,
            audience: 'alumni',
            visibility: 'with-profile',
          },
          {
            label: 'Gói dịch vụ',
            to: '/app/mentoring/packages',
            activePaths: ['/app/mentoring/packages', '/app/mentoring/subscription'],
            icon: WalletCards,
            audience: 'alumni',
            visibility: 'with-profile',
          },
        ],
      },
      {
        label: 'Yêu cầu gửi đến',
        to: '/app/mentoring/incoming-requests',
        activePaths: ['/app/mentoring/incoming-requests', '/app/mentoring/requests/incoming', '/app/mentoring/requests/manage'],
        icon: Inbox,
        audience: 'alumni',
        visibility: 'with-profile',
      },
    ],
  },
]

export const MENTORSHIP_TERMS_ITEM: MentorshipNavigationItem = {
  label: 'Điều khoản dịch vụ',
  to: '/app/mentoring/terms',
  icon: FileText,
  audience: 'common',
}
