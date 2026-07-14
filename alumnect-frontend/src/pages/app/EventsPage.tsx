import { useState } from 'react'
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, SmartImage, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import type { EventItem } from '@/lib/constants'
import { compact, cn } from '@/lib/utils'

const TABS = ['Upcoming', 'This month', 'Online', 'My events']
const CURRENT_MONTH = new Date().toLocaleString('en', { month: 'short' }).toUpperCase()

// TODO(team): chưa có API Events — thay EVENTS bằng dữ liệu thật khi backend sẵn sàng.
const EVENTS: EventItem[] = []

export function EventsPage() {
  const [tab, setTab] = useState('Upcoming')
  const [rsvp, setRsvp] = useState<Record<string, boolean>>({})

  const filteredEvents = EVENTS.filter((e) => {
    if (tab === 'This month') return e.month === CURRENT_MONTH
    if (tab === 'Online') return e.location.toLowerCase().includes('online')
    if (tab === 'My events') return !!rsvp[e.id]
    return true // 'Upcoming' — toàn bộ sự kiện trong dữ liệu mock đều ở tương lai
  })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<CalendarDays size={20} />}
        title="Events & Reunions"
        subtitle="Reconnect at meetups, talks and homecomings — RSVP in a tap."
        actions={<Button variant="gold" size="sm">Create event</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              tab === t ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="No events here yet"
          description="Try another tab, or check back soon for new events."
          action={<Button size="sm" variant="secondary" onClick={() => setTab('Upcoming')}>Clear filter</Button>}
        />
      ) : (
      <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
        {filteredEvents.map((e) => (
          <StaggerItem key={e.id}>
            <Card hover={false} className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="relative h-44 overflow-hidden">
                <SmartImage src={e.cover} alt={e.title} className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-plum-900/85 to-transparent" />
                <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl glass-strong py-1.5 text-center">
                  <span className="text-[10px] font-bold uppercase text-gold-600">{e.month}</span>
                  <span className="text-xl font-extrabold text-plum-900">{e.day}</span>
                </div>
                <Badge tone="violet" className="absolute right-3 top-3">{e.tag}</Badge>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-plum-900">{e.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-plum-500"><MapPin size={14} /> {e.location}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-plum-500"><Clock size={14} /> {e.date} · 18:00</p>
                <div className="mt-4 flex items-center justify-between border-t border-plum-900/8 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[12, 33, 45].map((n) => (
                        <Avatar key={n} src={`https://i.pravatar.cc/60?img=${n}`} name="a" size={26} />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-plum-400"><Users size={12} /> {compact(e.attendees)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={rsvp[e.id] ? 'secondary' : 'primary'}
                    onClick={() => setRsvp((s) => ({ ...s, [e.id]: !s[e.id] }))}
                  >
                    {rsvp[e.id] ? 'Going ✓' : 'RSVP'}
                  </Button>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
      )}

      <Reveal>
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="md">Load more events</Button>
        </div>
      </Reveal>
    </div>
  )
}
