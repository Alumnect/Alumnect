import { ArrowUpRight, ArrowDownRight, BadgeCheck, Flag, UserPlus, CreditCard, Activity } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import { ADMIN_KPIS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const REVENUE = [42, 55, 48, 67, 72, 65, 80, 78, 92, 88, 96, 110]
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const ACTIVITY = [
  { icon: UserPlus, text: '128 new members joined today', time: '·  live', tone: 'text-brand-600' },
  { icon: BadgeCheck, text: 'Phạm Thu Hà was verified as Alumni', time: '12m', tone: 'text-gold-600' },
  { icon: Flag, text: '3 new content reports need review', time: '40m', tone: 'text-rose-500' },
  { icon: CreditCard, text: 'Recruiter package purchased by VNG', time: '1h', tone: 'text-emerald-600' },
]

const PENDING = [
  { name: 'Đỗ Gia Huy', cohort: 'SE · K13', avatar: 'https://i.pravatar.cc/60?img=51' },
  { name: 'Hoàng Thảo My', cohort: 'IS · K15', avatar: 'https://i.pravatar.cc/60?img=27' },
  { name: 'Bùi Tuấn Kiệt', cohort: 'SE · K11', avatar: 'https://i.pravatar.cc/60?img=15' },
]

export function AdminOverviewPage() {
  const maxRev = Math.max(...REVENUE)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Overview" subtitle="Platform health, growth and revenue at a glance." />

      {/* KPIs */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
        {ADMIN_KPIS.map((k) => (
          <StaggerItem key={k.label}>
            <Card hover={false} className="p-5">
              <p className="text-sm text-plum-500">{k.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-plum-900">
                {k.currency ? (
                  <><Counter value={Math.round(k.value / 1_000_000)} />M</>
                ) : (
                  <Counter value={k.value} compactFmt={k.value > 9999} />
                )}
              </p>
              <p className={cn('mt-2 inline-flex items-center gap-1 text-xs font-bold', k.up ? 'text-emerald-600' : 'text-rose-500')}>
                {k.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {k.delta}
                <span className="font-medium text-plum-400">vs last month</span>
              </p>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* revenue chart */}
        <Reveal>
          <Card hover={false} className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-plum-900">Revenue</h2>
                <p className="text-xs text-plum-400">Monthly (M VND)</p>
              </div>
              <Badge tone="success" icon={<Activity size={13} />}>+14.6%</Badge>
            </div>
            <div className="flex h-52 items-end gap-2">
              {REVENUE.map((v, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-600/40 to-violet-500 transition-all duration-500 group-hover:from-brand-500 group-hover:to-violet-400"
                      style={{ height: `${(v / maxRev) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-plum-400">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* recent activity */}
        <Reveal direction="left">
          <Card hover={false} className="p-6">
            <h2 className="mb-5 font-bold text-plum-900">Recent activity</h2>
            <ul className="space-y-4">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-plum-900/[0.04] ring-1 ring-inset ring-plum-900/10', a.tone)}>
                    <a.icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-plum-700">{a.text}</p>
                    <p className="text-xs text-plum-400">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* pending verifications */}
      <Reveal>
        <Card hover={false} className="mt-6 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-plum-900">Pending verifications</h2>
            <Badge tone="gold">132 in queue</Badge>
          </div>
          <ul className="divide-y divide-plum-900/8">
            {PENDING.map((p) => (
              <li key={p.name} className="flex items-center gap-3 py-3">
                <Avatar src={p.avatar} name={p.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-plum-900">{p.name}</p>
                  <p className="truncate text-xs text-plum-400">{p.cohort} · submitted FPTU proof</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary">Approve</Button>
                  <Button size="sm" variant="secondary">Reject</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  )
}
