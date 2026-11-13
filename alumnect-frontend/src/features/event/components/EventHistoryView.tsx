import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Radio,
} from 'lucide-react'
import { Card, Avatar, SmartImage, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { EventRsvpButton } from './EventRsvpButton'
import { EventAttendeesModal } from './EventAttendeesModal'
import { useEventHistory } from '../hooks/useEventHistory'
import type { EventHistoryFilter, EventHistoryItem } from '../model/event'
import { compact, cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function EventHistoryView() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<EventHistoryFilter>('all')

  const filterOptions = useMemo<{ key: EventHistoryFilter; label: string }[]>(() => [
    { key: 'all', label: t('event.filterAll') },
    { key: 'upcoming', label: t('event.filterUpcoming') },
    { key: 'past', label: t('event.filterPast') },
    { key: 'cancelled', label: t('event.filterCancelled') },
  ], [t])
  const [attendeeModalTarget, setAttendeeModalTarget] = useState<{
    id: string | number
    title?: string
    capacity?: number | null
    status?: string | null
  } | null>(null)
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useEventHistory(filter)

  const items = useMemo(() => {
    return data?.pages.flatMap((p) => p.content) || []
  }, [data])

  const getEventDateInfo = (isoString?: string | null) => {
    if (!isoString) return { month: 'TH--', day: '--', dateStr: t('event.unknownDate'), timeStr: '' }
    const date = new Date(isoString)
    const month = (i18n.language === 'vi' ? 'TH' : 'M') + (date.getMonth() + 1)
    return {
      month,
      day: date.getDate().toString().padStart(2, '0'),
      dateStr: date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }),
      timeStr: date.toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const formatRegisteredAt = (isoString?: string | null) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const renderAttendanceBadge = (item: EventHistoryItem) => {
    switch (item.attendanceState) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
            <Clock size={13} className="text-sky-400 shrink-0" />
            <span>{t('event.upcoming')}</span>
          </span>
        )
      case 'ONGOING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-sm">
            <Radio size={13} className="animate-pulse text-amber-400 shrink-0" />
            <span>{t('event.ongoing')}</span>
          </span>
        )
      case 'PAST':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>{t('event.past')}</span>
          </span>
        )
      case 'REGISTRATION_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-400/30 backdrop-blur-md shadow-sm">
            <XCircle size={13} className="text-rose-400 shrink-0" />
            <span>{t('event.regCancelled')}</span>
          </span>
        )
      case 'EVENT_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-500/35 backdrop-blur-md shadow-sm">
            <Ban size={13} className="text-rose-400 shrink-0" />
            <span>{t('event.cancelled')}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 border border-white/15 backdrop-blur-md shadow-sm">
            <span>{item.registrationStatus}</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition',
              filter === opt.key
                ? 'bg-primary-solid text-on-primary shadow-sm'
                : 'bg-surface-2 text-text-muted hover:bg-surface-3'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-solid" />
            <p className="text-sm font-medium text-text-subtle">{t('event.loadingHistory')}</p>
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title={t('event.loadHistoryError')}
          description={t('event.loadHistoryErrorDesc')}
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={28} className="text-primary-solid" />}
          title={
            filter === 'all'
              ? t('event.noHistoryAll')
              : filter === 'upcoming'
              ? t('event.noHistoryUpcoming')
              : filter === 'past'
              ? t('event.noHistoryPast')
              : t('event.noHistoryCancelled')
          }
          description={
            filter === 'all'
              ? t('event.noHistoryAllDesc')
              : t('event.noHistoryOtherDesc')
          }
          action={
            filter !== 'all' ? (
              <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                {t('event.viewAllHistory')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.06}>
          {items.map((item) => {
            const cover =
              item.coverUrl ||
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
            const dateInfo = getEventDateInfo(item.startTime)
            const postLink = item.postId ? `/app/posts/${item.postId}` : null

            return (
              <StaggerItem key={item.registrationId}>
                <Card
                  hover={false}
                  className="group h-full flex flex-col overflow-hidden transition"
                >
                  {/* Event Cover & Date Badge */}
                  <div className="relative h-44 shrink-0 overflow-hidden bg-surface-2">
                    {postLink ? (
                      <Link to={postLink} className="block h-full w-full">
                        <SmartImage
                          src={cover}
                          alt={item.title || t('event.titleFallback', 'Sự kiện')}
                          className="h-full w-full"
                          imgClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/20 to-transparent" />
                      </Link>
                    ) : (
                      <>
                        <SmartImage
                          src={cover}
                          alt={item.title || t('event.titleFallback', 'Sự kiện')}
                          className="h-full w-full"
                          imgClassName="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/20 to-transparent" />
                      </>
                    )}

                    {/* Date badge */}
                    <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl glass-strong py-1.5 text-center shadow-sm">
                      <span className="text-xs font-bold uppercase text-warning">
                        {dateInfo.month}
                      </span>
                      <span className="text-xl font-extrabold text-text">{dateInfo.day}</span>
                    </div>

                    {/* Attendance status badge */}
                    <div className="absolute right-3 top-3">
                      {renderAttendanceBadge(item)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col justify-between flex-1 p-5">
                    <div>
                      {postLink ? (
                        <Link to={postLink} className="block group/title">
                          <h3 className="text-base font-bold text-text line-clamp-2 transition-colors group-hover/title:text-brand-600 group-hover/title:underline">
                            {item.title || t('event.unnamedEvent')}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-base font-bold text-text line-clamp-2">
                          {item.title || t('event.unnamedEvent')}
                        </h3>
                      )}

                      {item.location && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle truncate">
                          <MapPin size={13} className="shrink-0 text-text-subtle" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-text-subtle">
                        <Clock size={13} className="shrink-0 text-text-subtle" />
                        <span>
                          {dateInfo.dateStr} {dateInfo.timeStr && `· ${dateInfo.timeStr}`}
                        </span>
                      </p>

                      {item.registeredAt && (
                        <p className="mt-2 text-xs text-text-subtle">
                          {t('event.registeredAt', { date: formatRegisteredAt(item.registeredAt) })}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Organizer & Action */}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                      {/* Organizer */}
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Link
                          to={
                            item.organizerId
                              ? `/app/profile?userId=${item.organizerId}`
                              : '/app/profile'
                          }
                          className="flex items-center gap-2 min-w-0 hover:text-primary-solid transition-colors group/author"
                          title={item.organizerName || t('event.organizerDefault')}
                        >
                          <Avatar
                            src={item.organizerAvatar || undefined}
                            name={item.organizerName || t('event.organizerDefault')}
                            size={26}
                          />
                          <span className="text-xs font-medium text-text truncate group-hover/author:underline group-hover/author:text-brand-600">
                            {item.organizerName || t('event.organizerDefault')}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setAttendeeModalTarget({
                              id: item.eventId,
                              title: item.title,
                              capacity: item.capacity,
                              status: item.eventStatus,
                            })
                          }}
                          className="shrink-0 hidden sm:inline-flex items-center gap-1 text-xs text-text-subtle hover:text-primary-solid hover:bg-primary-soft py-0.5 px-1.5 rounded transition-colors"
                          title={t('event.viewAttendeesTooltip')}
                        >
                          <Users size={11} className="text-primary-solid" />
                          <span>
                            {item.attendeeCount}
                            {item.capacity ? ` / ${compact(item.capacity)}` : ''}
                          </span>
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">

                        {/* If upcoming & active, allow cancelling RSVP or viewing attendees */}
                        {item.eventStatus !== 'CANCELLED' && (
                          <EventRsvpButton
                            eventId={item.eventId}
                            eventTitle={item.title}
                            initialRegistered={item.registrationStatus === 'REGISTERED'}
                            initialAttendeeCount={item.attendeeCount}
                            capacity={item.capacity}
                            startTime={item.startTime}
                            endTime={item.endTime}
                            status={item.eventStatus}
                            size="sm"
                            showCount={false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <Reveal>
          <div className="mt-8 flex justify-center pb-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? t('common.loading') : t('event.loadMoreHistory')}
            </Button>
          </div>
        </Reveal>
      )}

      {attendeeModalTarget && (
        <EventAttendeesModal
          isOpen={Boolean(attendeeModalTarget)}
          onClose={() => setAttendeeModalTarget(null)}
          eventId={attendeeModalTarget.id}
          eventTitle={attendeeModalTarget.title}
          capacity={attendeeModalTarget.capacity}
          status={attendeeModalTarget.status}
        />
      )}
    </div>
  )
}
