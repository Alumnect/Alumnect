import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users, Clock, Loader2 } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, SmartImage, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { useAuthStore } from '@/store/authStore'
import { compact, cn } from '@/lib/utils'

const TABS = ['Upcoming', 'This month', 'Online', 'My events']
const CURRENT_MONTH = new Date().toLocaleString('en', { month: 'short' }).toUpperCase()
const CURRENT_MONTH_INDEX = new Date().getMonth()
const CURRENT_YEAR = new Date().getFullYear()

export function EventsPage() {
  const [tab, setTab] = useState('Upcoming')
  const [rsvp, setRsvp] = useState<Record<string, boolean>>({})
  const currentUser = useAuthStore((s) => s.user)

  // Fetch event posts from backend
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed('event')
  const posts = useMemo(() => data?.pages.flatMap((page) => page.items) || [], [data])

  const filteredEvents = posts.filter((post) => {
    const event = post.event
    if (!event || !event.startTime) return false
    
    const eventDate = new Date(event.startTime)
    
    if (tab === 'This month') {
      return eventDate.getMonth() === CURRENT_MONTH_INDEX && eventDate.getFullYear() === CURRENT_YEAR
    }
    
    if (tab === 'Online') {
      return event.location?.toLowerCase().includes('online') || false
    }
    
    if (tab === 'My events') {
      return !!rsvp[post.id] || post.author === currentUser?.name
    }
    
    // Default 'Upcoming' (show all for now, or you can filter by >= start of today)
    return true
  })

  const getEventDateInfo = (isoString?: string | null) => {
    if (!isoString) return { month: 'TBA', day: '--', dateStr: 'TBA', timeStr: '' }
    const date = new Date(isoString)
    return {
      month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString().padStart(2, '0'),
      dateStr: date.toLocaleDateString('vi-VN', { dateStyle: 'medium' }),
      timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<CalendarDays size={20} />}
        title="Events & Reunions"
        subtitle="Reconnect at meetups, talks and homecomings — RSVP in a tap."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              tab === t ? 'bg-brand-600 text-white shadow-sm' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="Failed to load events"
          description="There was an error connecting to the server."
          action={<Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>}
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="No events here yet"
          description="Try another tab, or check back soon for new events."
          action={<Button size="sm" variant="secondary" onClick={() => setTab('Upcoming')}>Clear filter</Button>}
        />
      ) : (
      <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
        {filteredEvents.map((post) => {
          const event = post.event!
          const cover = post.images && post.images.length > 0 ? post.images[0] : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
          const dateInfo = getEventDateInfo(event.startTime)
          
          return (
            <StaggerItem key={post.id}>
              <Card hover={false} className="group h-full flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
                <Link to={`/app/posts/${post.id}`} className="relative h-44 shrink-0 overflow-hidden block">
                  <SmartImage src={cover} alt={event.title || 'Event'} className="h-full w-full" imgClassName="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum-900/85 to-transparent" />
                  <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl glass-strong py-1.5 text-center">
                    <span className="text-[10px] font-bold uppercase text-gold-600">{dateInfo.month}</span>
                    <span className="text-xl font-extrabold text-plum-900">{dateInfo.day}</span>
                  </div>
                  {post.author && (
                    <Badge tone="violet" className="absolute right-3 top-3 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                      By {post.author}
                    </Badge>
                  )}
                </Link>
                <div className="flex flex-col justify-between flex-1 p-5">
                  <Link to={`/app/posts/${post.id}`} className="block">
                    <h2 className="text-lg font-bold text-plum-900 line-clamp-2 hover:underline hover:text-brand-600 transition-colors">{event.title || 'Untitled Event'}</h2>
                    {event.location && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-plum-500 truncate">
                        <MapPin size={14} className="shrink-0" /> {event.location}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-plum-500">
                      <Clock size={14} className="shrink-0" /> {dateInfo.dateStr} {dateInfo.timeStr && `· ${dateInfo.timeStr}`}
                    </p>
                    {post.text && (
                      <p className="mt-3 text-sm text-plum-600 line-clamp-3">
                        {post.text}
                      </p>
                    )}
                  </Link>
                  <div className="mt-4 flex items-center justify-between border-t border-plum-900/8 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {/* Placeholder for attendees avatar */}
                        <Avatar src={post.avatar} name={post.author} size={26} />
                      </div>
                      {event.capacity && (
                        <span className="inline-flex items-center gap-1 text-xs text-plum-400">
                          <Users size={12} /> Max {compact(event.capacity)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={rsvp[post.id] ? 'secondary' : 'primary'}
                      onClick={() => setRsvp((s) => ({ ...s, [post.id]: !s[post.id] }))}
                    >
                      {rsvp[post.id] ? 'Going ✓' : 'RSVP'}
                    </Button>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          )
        })}
      </Stagger>
      )}

      {hasNextPage && (
        <Reveal>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more events'}
            </Button>
          </div>
        </Reveal>
      )}
    </div>
  )
}

