import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Flag, CreditCard, Megaphone, ShieldCheck } from 'lucide-react'

export type Section = {
  title: string
  subtitle: string
  icon: LucideIcon
  stats: { label: string; value: string; tone: string }[]
  rows: { primary: string; secondary: string; status: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }[]
  primaryAction: string
}

/**
 * Cấu hình các trang con của Admin Console (verifications, reports, revenue,
 * broadcast, moderation). `stats`/`rows` để rỗng — TODO(team): nối dữ liệu
 * thật từ backend khi API tương ứng sẵn sàng.
 */
export const ADMIN_SECTIONS: Record<string, Section> = {
  verifications: {
    title: 'Alumni Verifications',
    subtitle: 'Review FPTU proof and approve or reject alumni accounts.',
    icon: BadgeCheck,
    stats: [],
    rows: [],
    primaryAction: 'Review queue',
  },
  reports: {
    title: 'Content Reports',
    subtitle: 'Resolve reported posts, jobs, questions and answers.',
    icon: Flag,
    stats: [],
    rows: [],
    primaryAction: 'Open report queue',
  },
  revenue: {
    title: 'Payments & Revenue',
    subtitle: 'Track transactions, package history and revenue over time.',
    icon: CreditCard,
    stats: [],
    rows: [],
    primaryAction: 'Export report',
  },
  broadcast: {
    title: 'Broadcast Notifications',
    subtitle: 'Send announcements to all members or a targeted group.',
    icon: Megaphone,
    stats: [],
    rows: [],
    primaryAction: 'New broadcast',
  },
  moderation: {
    title: 'Q&A Moderation',
    subtitle: 'Manage forum topics and moderate reported questions & answers.',
    icon: ShieldCheck,
    stats: [],
    rows: [],
    primaryAction: 'Manage topics',
  },
}
