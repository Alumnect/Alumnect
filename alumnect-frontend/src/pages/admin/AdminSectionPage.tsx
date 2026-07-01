import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Flag, CreditCard, Megaphone, ShieldCheck, Inbox } from 'lucide-react'
import { PageHeader, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

type Section = {
  title: string
  subtitle: string
  icon: LucideIcon
  stats: { label: string; value: string; tone: string }[]
  rows: { primary: string; secondary: string; status: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }[]
  primaryAction: string
}

export const ADMIN_SECTIONS: Record<string, Section> = {
  verifications: {
    title: 'Alumni Verifications',
    subtitle: 'Review FPTU proof and approve or reject alumni accounts.',
    icon: BadgeCheck,
    stats: [
      { label: 'Pending', value: '132', tone: 'text-gold-600' },
      { label: 'Approved (30d)', value: '1,204', tone: 'text-emerald-600' },
      { label: 'Rejected (30d)', value: '38', tone: 'text-rose-500' },
    ],
    rows: [
      { primary: 'Đỗ Gia Huy', secondary: 'SE · K13 · Student ID SE150421', status: 'Pending', tone: 'gold' },
      { primary: 'Hoàng Thảo My', secondary: 'IS · K15 · Student ID IS151088', status: 'Pending', tone: 'gold' },
      { primary: 'Bùi Tuấn Kiệt', secondary: 'SE · K11 · Student ID SE110233', status: 'Pending', tone: 'gold' },
    ],
    primaryAction: 'Review queue',
  },
  reports: {
    title: 'Content Reports',
    subtitle: 'Resolve reported posts, jobs, questions and answers.',
    icon: Flag,
    stats: [
      { label: 'Open reports', value: '17', tone: 'text-rose-500' },
      { label: 'Resolved (30d)', value: '286', tone: 'text-emerald-600' },
      { label: 'Avg. resolve time', value: '4.2h', tone: 'text-brand-600' },
    ],
    rows: [
      { primary: 'Spam in recruitment post', secondary: 'Reported 3× · Post #4821', status: 'Open', tone: 'danger' },
      { primary: 'Inappropriate comment', secondary: 'Reported 1× · Comment #9912', status: 'Open', tone: 'danger' },
      { primary: 'Misleading job listing', secondary: 'Reported 2× · Job #312', status: 'Reviewing', tone: 'gold' },
    ],
    primaryAction: 'Open report queue',
  },
  revenue: {
    title: 'Payments & Revenue',
    subtitle: 'Track transactions, package history and revenue over time.',
    icon: CreditCard,
    stats: [
      { label: 'Revenue (MTD)', value: '78.4M', tone: 'text-emerald-600' },
      { label: 'Transactions', value: '342', tone: 'text-brand-600' },
      { label: 'Open complaints', value: '4', tone: 'text-gold-600' },
    ],
    rows: [
      { primary: 'TXN-10421 · VNG', secondary: 'Recruiter package · 990,000₫', status: 'Paid', tone: 'success' },
      { primary: 'TXN-10420 · Momo', secondary: 'Enterprise package · 4,900,000₫', status: 'Paid', tone: 'success' },
      { primary: 'TXN-10418 · Shopee', secondary: 'Recruiter package · 990,000₫', status: 'Refund req.', tone: 'gold' },
    ],
    primaryAction: 'Export report',
  },
  broadcast: {
    title: 'Broadcast Notifications',
    subtitle: 'Send announcements to all members or a targeted group.',
    icon: Megaphone,
    stats: [
      { label: 'Sent (30d)', value: '12', tone: 'text-brand-600' },
      { label: 'Avg. open rate', value: '64%', tone: 'text-emerald-600' },
      { label: 'Scheduled', value: '2', tone: 'text-gold-600' },
    ],
    rows: [
      { primary: 'Homecoming 2026 is live!', secondary: 'All members · 24,800 recipients', status: 'Sent', tone: 'success' },
      { primary: 'New salary board insights', secondary: 'Alumni only · 18,200 recipients', status: 'Sent', tone: 'success' },
      { primary: 'Maintenance window Sat 2am', secondary: 'All members · scheduled', status: 'Scheduled', tone: 'gold' },
    ],
    primaryAction: 'New broadcast',
  },
  moderation: {
    title: 'Q&A Moderation',
    subtitle: 'Manage forum topics and moderate reported questions & answers.',
    icon: ShieldCheck,
    stats: [
      { label: 'Topics', value: '24', tone: 'text-brand-600' },
      { label: 'Flagged Q&A', value: '9', tone: 'text-rose-500' },
      { label: 'Hidden (30d)', value: '41', tone: 'text-gold-600' },
    ],
    rows: [
      { primary: 'Off-topic question', secondary: 'Topic: Career · Q #1182', status: 'Flagged', tone: 'danger' },
      { primary: 'Duplicate answer', secondary: 'Topic: Interview · A #6620', status: 'Flagged', tone: 'danger' },
      { primary: 'New topic: AI & ML', secondary: 'Requested by 12 members', status: 'Review', tone: 'gold' },
    ],
    primaryAction: 'Manage topics',
  },
}

export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  const s = ADMIN_SECTIONS[sectionKey]
  const Icon = s.icon

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={s.title}
        subtitle={s.subtitle}
        actions={<Button variant="gold" size="sm">{s.primaryAction}</Button>}
      />

      <Stagger className="mb-6 grid grid-cols-3 gap-4" gap={0.07}>
        {s.stats.map((st) => (
          <StaggerItem key={st.label}>
            <Card hover={false} className="p-5">
              <p className={cn('text-3xl font-extrabold', st.tone)}>{st.value}</p>
              <p className="mt-1 text-xs text-plum-400">{st.label}</p>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <Card hover={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-plum-900/8 p-5">
            <h2 className="flex items-center gap-2 font-bold text-plum-900">
              <Icon size={18} className="text-gold-600" /> Queue
            </h2>
            <Badge tone="neutral">{s.rows.length} items</Badge>
          </div>
          <ul className="divide-y divide-plum-900/8">
            {s.rows.map((r, i) => (
              <li key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.03]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10">
                  <Inbox size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-plum-900">{r.primary}</p>
                  <p className="truncate text-xs text-plum-400">{r.secondary}</p>
                </div>
                <Badge tone={r.tone} className="px-2.5 py-0.5">{r.status}</Badge>
                <Button size="sm" variant="secondary">Open</Button>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  )
}
