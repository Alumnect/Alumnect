import type { ComponentType } from 'react'
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Search,
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
        label: 'Tổng quan Mentorship',
        to: '/app/mentoring',
        icon: LayoutDashboard,
        end: true,
        audience: 'common',
      },
      {
        label: 'Khám phá Mentor',
        to: '/app/mentoring/discover',
        icon: Search,
        audience: 'common',
        planned: true,
      },
      {
        label: 'Bảng xếp hạng Mentor',
        to: '/app/mentoring/ranking',
        icon: Users,
        audience: 'common',
      },
      {
        label: 'Yêu cầu mentoring của tôi',
        to: '/app/mentoring/requests',
        icon: BookOpen,
        audience: 'common',
        planned: true,
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
        label: 'Đăng ký trở thành Mentor',
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
        label: 'Quản lý yêu cầu hướng dẫn',
        to: '/app/mentoring/requests/manage',
        icon: Users,
        audience: 'alumni',
        planned: true,
        visibility: 'with-profile',
      },
      {
        label: 'Quản lý công việc',
        to: '/app/mentoring/workspace',
        icon: BriefcaseBusiness,
        audience: 'alumni',
        planned: true,
        visibility: 'with-profile',
      },
      {
        label: 'Trạng thái Mentor',
        to: '/app/mentoring/status',
        icon: Activity,
        audience: 'alumni',
        visibility: 'with-profile',
      },
      {
        label: 'Gói Mentor / Subscription',
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
        label: 'Điều khoản Mentoring',
        to: '/app/mentoring/terms',
        icon: FileText,
        audience: 'common',
      },
    ],
  },
]
