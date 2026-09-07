import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users, MapPin } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui'
import { useFeed } from '@/features/feed'
import { EventRsvpButton } from './EventRsvpButton'
import { compact, cn } from '@/lib/utils'

interface UpcomingEventsWidgetProps {
  limit?: number
  className?: string
}

export function UpcomingEventsWidget({ limit = 3, className }: UpcomingEventsWidgetProps) {
  const { data, isLoading, isError } = useFeed('event')

  const events = useMemo(() => {
    const allPosts = data?.pages.flatMap((page) => page.items) || []
    const now = Date.now()

    // Filter posts that have event metadata
    const eventPosts = allPosts.filter((post) => post.event && post.event.id)

    // Sort: upcoming events first, then by earliest startTime
    const sorted = [...eventPosts].sort((a, b) => {
      const timeA = a.event?.startTime ? new Date(a.event.startTime).getTime() : 0
      const timeB = b.event?.startTime ? new Date(b.event.startTime).getTime() : 0

      // Put future events before past events
      const isFutureA = timeA >= now
      const isFutureB = timeB >= now
      if (isFutureA && !isFutureB) return -1
      if (!isFutureA && isFutureB) return 1

      return timeA - timeB
    })

    return sorted.slice(0, limit)
  }, [data, limit])

  const getDateInfo = (isoString?: string | null) => {
    if (!isoString) return { month: 'TH--', day: '--', isPast: false }
    const date = new Date(isoString)
    const isPast = date.getTime() < Date.now()
    return {
      month: 'TH' + (date.getMonth() + 1),
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
          <h3 className="font-bold text-plum-900 flex items-center gap-1.5">
            <CalendarDays size={16} className="text-brand-600" />
            Sự kiện sắp diễn ra
          </h3>
          <Link
            to="/app/events"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Tất cả
          </Link>
        </div>
        <div className="py-4 text-center text-xs text-plum-400">
          <p>Chưa có sự kiện nào sắp tới</p>
        </div>
      </Card>
    )
  }

  return (
    <Card hover={false} className={cn('p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-plum-900 flex items-center gap-1.5">
          <CalendarDays size={16} className="text-brand-600" />
          Sự kiện sắp diễn ra
        </h3>
        <Link
          to="/app/events"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      <ul className="space-y-3.5">
        {events.map((post) => {
          const event = post.event!
          const dateInfo = getDateInfo(event.startTime)
          const eventTitle =
            event.title || post.text?.split('\n')[0]?.replace(/^#+\s*/, '') || 'Sự kiện cộng đồng'

          return (
            <li
              key={post.id}
              className="group flex items-start gap-3 rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-plum-900/[0.03]"
            >
              <Link
                to={`/app/posts/${post.id}`}
                className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-plum-900/[0.04] py-1.5 text-center ring-1 ring-inset ring-plum-900/10 transition-colors group-hover:bg-brand-50 group-hover:ring-brand-200"
                title={`Xem chi tiết ${eventTitle}`}
              >
                <span className="text-[10px] font-bold uppercase text-brand-600">
                  {dateInfo.month}
                </span>
                <span className="text-base font-extrabold text-plum-900">
                  {dateInfo.day}
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/app/posts/${post.id}`}
                  className="block truncate text-sm font-semibold text-plum-900 group-hover:text-brand-600 transition-colors"
                  title={eventTitle}
                >
                  {eventTitle}
                </Link>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-plum-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} className="shrink-0" />
                    {compact(event.attendeeCount ?? 0)}
                    {event.capacity ? `/${compact(event.capacity)}` : ''} người
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
