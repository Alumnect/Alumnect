import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Skeleton } from '@/components/ui'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { EventRsvpButton } from './EventRsvpButton'
import { compact, cn } from '@/lib/utils'

interface UpcomingEventsWidgetProps {
  limit?: number
  className?: string
}

export function UpcomingEventsWidget({ limit = 3, className }: UpcomingEventsWidgetProps) {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError } = useFeed('event', '', limit, 'upcoming')

  const events = useMemo(() => {
    const allPosts = data?.pages.flatMap((page) => page.items) || []
    const now = Date.now()

    // Filter posts that have valid event metadata, not cancelled, and not started yet
    const eventPosts = allPosts.filter((post) => {
      const evt = post.event
      if (!evt || !evt.id || !evt.startTime) return false
      if (evt.status === 'CANCELLED') return false
      const startTime = new Date(evt.startTime).getTime()
      return startTime >= now
    })

    // Sort: upcoming events first, then by earliest startTime
    const sorted = [...eventPosts].sort((a, b) => {
      const timeA = a.event?.startTime ? new Date(a.event.startTime).getTime() : 0
      const timeB = b.event?.startTime ? new Date(b.event.startTime).getTime() : 0
      return timeA - timeB
    })

    return sorted.slice(0, limit)
  }, [data, limit])

  const getDateInfo = (isoString?: string | null) => {
    if (!isoString) return { month: '--', day: '--', isPast: false }
    const date = new Date(isoString)
    const isPast = date.getTime() < Date.now()
    const isEn = i18n.language?.startsWith('en')
    const month = isEn
      ? date.toLocaleDateString('en-US', { month: 'short' })
      : 'TH' + (date.getMonth() + 1).toString().padStart(2, '0')
    return {
      month,
      day: date.getDate().toString().padStart(2, '0'),
      isPast,
    }
  }

  if (isLoading) {
    return (
      <Card hover={false} className={cn('p-5', className)}>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-3.5">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (isError || events.length === 0) {
    return (
      <Card hover={false} className={cn('p-5', className)}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-text flex items-center gap-1.5">
            <CalendarDays size={16} className="text-primary-solid" />
            {t('feed.upcomingEvents')}
          </h3>
          <Link
            to="/app/events"
            className="text-xs font-semibold text-primary-solid hover:text-primary-solid"
          >
            {t('common.all')}
          </Link>
        </div>
        <div className="py-4 text-center text-xs text-text-subtle">
          <p>{t('feed.noUpcomingEvents')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card hover={false} className={cn('p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-text flex items-center gap-1.5">
          <CalendarDays size={16} className="text-primary-solid" />
          {t('feed.upcomingEvents')}
        </h3>
        <Link
          to="/app/events"
          className="text-xs font-semibold text-primary-solid hover:text-primary-solid transition-colors"
        >
          {t('common.viewAll')}
        </Link>
      </div>

      <ul className="space-y-3.5">
        {events.map((post) => {
          const event = post.event!
          const dateInfo = getDateInfo(event.startTime)
          const eventTitle =
            event.title || post.text?.split('\n')[0]?.replace(/^#+\s*/, '') || t('feed.communityEvent')

          return (
            <li
              key={post.id}
              className="group/event flex items-start gap-3 rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-surface-2"
            >
              <Link
                to={`/app/posts/${post.id}`}
                className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-surface-2 py-1.5 text-center ring-1 ring-inset ring-border transition-colors group-hover/event:bg-brand-50 group-hover/event:ring-brand-200"
                title={`Xem chi tiết ${eventTitle}`}
              >
                <span className="text-xs font-bold uppercase text-primary-solid">
                  {dateInfo.month}
                </span>
                <span className="text-base font-extrabold text-text">
                  {dateInfo.day}
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/app/posts/${post.id}`}
                  className="block truncate text-sm font-semibold text-text group-hover/event:text-brand-600 transition-colors"
                  title={eventTitle}
                >
                  {eventTitle}
                </Link>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-subtle">
                  <span className="flex items-center gap-1">
                    <Users size={11} className="shrink-0" />
                    {compact(event.attendeeCount ?? 0)}
                    {event.capacity ? `/${compact(event.capacity)}` : ''} {t('common.people')}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                      • <MapPin size={10} className="shrink-0 ml-0.5" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Mini RSVP button */}
              <div className="shrink-0 pt-0.5">
                <EventRsvpButton
                  eventId={event.id}
                  eventTitle={eventTitle}
                  initialRegistered={event.isRegistered}
                  initialAttendeeCount={event.attendeeCount}
                  capacity={event.capacity}
                  startTime={event.startTime}
                  endTime={event.endTime}
                  size="sm"
                  showCount={false}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
