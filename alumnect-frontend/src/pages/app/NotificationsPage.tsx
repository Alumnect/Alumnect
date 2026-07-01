import { Bell, Heart, UserPlus, MessageCircle, CalendarCheck, BadgeCheck, Briefcase, Check } from 'lucide-react'
import { PageHeader, Avatar, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

const ICONS = { like: Heart, follow: UserPlus, comment: MessageCircle, event: CalendarCheck, verify: BadgeCheck, job: Briefcase }
const TONE = {
  like: 'bg-rose-500/15 text-rose-500',
  follow: 'bg-brand-500/15 text-brand-600',
  comment: 'bg-aqua-500/15 text-aqua-500',
  event: 'bg-violet-500/15 text-violet-600',
  verify: 'bg-gold-400/15 text-gold-600',
  job: 'bg-emerald-500/15 text-emerald-600',
}

type Kind = keyof typeof ICONS

const NOTIFS: { kind: Kind; who: string; avatar: string; text: string; time: string; unread: boolean }[] = [
  { kind: 'verify', who: 'AlumNect', avatar: 'https://i.pravatar.cc/60?img=64', text: 'Your alumni verification was approved. Welcome aboard! 🎉', time: '5m', unread: true },
  { kind: 'like', who: 'Nguyễn Hải Long', avatar: 'https://i.pravatar.cc/60?img=33', text: 'and 24 others liked your achievement post.', time: '1h', unread: true },
  { kind: 'follow', who: 'Phạm Thu Hà', avatar: 'https://i.pravatar.cc/60?img=45', text: 'started following you.', time: '3h', unread: true },
  { kind: 'comment', who: 'Lê Quốc Bảo', avatar: 'https://i.pravatar.cc/60?img=8', text: 'commented: “Congrats! Well deserved.”', time: '5h', unread: false },
  { kind: 'event', who: 'Events', avatar: 'https://i.pravatar.cc/60?img=64', text: 'Reminder: FPTU Homecoming starts in 2 days.', time: '1d', unread: false },
  { kind: 'job', who: 'VNG', avatar: 'https://i.pravatar.cc/60?img=51', text: 'A new job matching your profile was posted.', time: '2d', unread: false },
]

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={<Bell size={20} />}
        title="Notifications"
        subtitle="Stay on top of likes, follows, comments and events."
        actions={<Button variant="secondary" size="sm" leftIcon={<Check size={15} />}>Mark all read</Button>}
      />

      <Stagger className="space-y-3" gap={0.05}>
        {NOTIFS.map((n, i) => {
          const Icon = ICONS[n.kind]
          return (
            <StaggerItem key={i}>
              <Card hover={false} className={cn('flex items-center gap-4 p-4 transition-colors', n.unread && 'ring-1 ring-inset ring-brand-400/20')}>
                <div className="relative">
                  <Avatar src={n.avatar} name={n.who} size={46} />
                  <span className={cn('absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-ink-900', TONE[n.kind])}>
                    <Icon size={12} />
                  </span>
                </div>
                <p className="flex-1 text-sm text-plum-700">
                  <span className="font-bold text-plum-900">{n.who}</span> {n.text}
                </p>
                <span className="shrink-0 text-xs text-plum-400">{n.time}</span>
                {n.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400" />}
              </Card>
            </StaggerItem>
          )
        })}
      </Stagger>
    </div>
  )
}
