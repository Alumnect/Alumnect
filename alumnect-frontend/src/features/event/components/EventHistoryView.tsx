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
  ExternalLink,
} from 'lucide-react'
import { Card, Avatar, SmartImage, EmptyState, Badge } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { EventRsvpButton } from './EventRsvpButton'
import { EventAttendeesModal } from './EventAttendeesModal'
import { useEventHistory } from '../hooks/useEventHistory'
import type { EventHistoryFilter, EventHistoryItem } from '../model/event'
import { compact, cn } from '@/lib/utils'

const FILTER_OPTIONS: { key: EventHistoryFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp diễn ra' },
  { key: 'past', label: 'Đã tham gia' },
  { key: 'cancelled', label: 'Đã hủy' },
]

export function EventHistoryView() {
  const [filter, setFilter] = useState<EventHistoryFilter>('all')
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
    if (!isoString) return { month: 'TH--', day: '--', dateStr: 'Chưa xác định', timeStr: '' }
    const date = new Date(isoString)
    const month = 'TH' + (date.getMonth() + 1)
    return {
      month,
      day: date.getDate().toString().padStart(2, '0'),
      dateStr: date.toLocaleDateString('vi-VN', { dateStyle: 'medium' }),
      timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const formatRegisteredAt = (isoString?: string | null) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', {
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
          <Badge tone="aqua" icon={<Clock size={12} />} className="shadow-xs font-semibold">
            Sắp diễn ra
          </Badge>
        )
      case 'ONGOING':
        return (
          <Badge tone="gold" icon={<Radio size={12} className="animate-pulse" />} className="shadow-xs font-semibold">
            Đang diễn ra
          </Badge>
        )
      case 'PAST':
        return (
          <Badge tone="success" icon={<CheckCircle2 size={12} />} className="shadow-xs font-semibold">
            Đã tham gia
          </Badge>
        )
      case 'REGISTRATION_CANCELLED':
        return (
          <Badge tone="danger" icon={<XCircle size={12} />} className="shadow-xs font-semibold">
            Đã hủy đăng ký
          </Badge>
        )
      case 'EVENT_CANCELLED':
        return (
          <Badge tone="danger" icon={<Ban size={12} />} className="shadow-xs font-semibold">
            Sự kiện bị hủy
          </Badge>
        )
      default:
        return (
          <Badge tone="neutral" className="shadow-xs font-semibold">
            {item.registrationStatus}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-plum-900/10 pb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all',
              filter === opt.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
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
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-plum-500">Đang tải lịch sử tham gia...</p>
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="Không tải được lịch sử sự kiện"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau."
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={28} className="text-brand-500" />}
          title={
            filter === 'all'
              ? 'Bạn chưa tham gia sự kiện nào'
              : filter === 'upcoming'
              ? 'Không có sự kiện nào sắp tới'
              : filter === 'past'
              ? 'Chưa có sự kiện nào đã tham gia'
              : 'Không có sự kiện nào đã hủy'
          }
          description={
            filter === 'all'
              ? 'Hãy khám phá các sự kiện hấp dẫn và đăng ký tham gia ngay hôm nay!'
              : 'Hãy thử đổi bộ lọc để xem các sự kiện khác trong lịch sử.'
          }
          action={
            filter !== 'all' ? (
              <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                Xem tất cả lịch sử
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
                  className="group h-full flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow"
                >
                  {/* Event Cover & Date Badge */}
                  <div className="relative h-44 shrink-0 overflow-hidden bg-plum-100">
                    {postLink ? (
                      <Link to={postLink} className="block h-full w-full">
                        <SmartImage
                          src={cover}
                          alt={item.title || 'Sự kiện'}
                          className="h-full w-full"
                          imgClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/20 to-transparent" />
                      </Link>
                    ) : (
                      <>
                        <SmartImage
                          src={cover}
                          alt={item.title || 'Sự kiện'}
                          className="h-full w-full"
                          imgClassName="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/20 to-transparent" />
                      </>
                    )}

                    {/* Date badge */}
                    <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl glass-strong py-1.5 text-center shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-gold-600">
                        {dateInfo.month}
                      </span>
                      <span className="text-xl font-extrabold text-plum-900">{dateInfo.day}</span>
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
                          <h3 className="text-base font-bold text-plum-900 line-clamp-2 transition-colors group-hover/title:text-brand-600 group-hover/title:underline">
                            {item.title || 'Sự kiện chưa đặt tên'}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-base font-bold text-plum-900 line-clamp-2">
                          {item.title || 'Sự kiện chưa đặt tên'}
                        </h3>
                      )}

                      {item.location && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-plum-500 truncate">
                          <MapPin size={13} className="shrink-0 text-plum-400" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-plum-500">
                        <Clock size={13} className="shrink-0 text-plum-400" />
                        <span>
                          {dateInfo.dateStr} {dateInfo.timeStr && `· ${dateInfo.timeStr}`}
                        </span>
                      </p>

                      {item.registeredAt && (
                        <p className="mt-2 text-[11px] text-plum-400">
                          Đã đăng ký: {formatRegisteredAt(item.registeredAt)}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Organizer & Action */}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-plum-900/8 pt-4">
                      {/* Organizer */}
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Link
                          to={
                            item.organizerId
                              ? `/app/profile?userId=${item.organizerId}`
                              : '/app/profile'
                          }
                          className="flex items-center gap-2 min-w-0 hover:text-brand-600 transition-colors group/author"
                          title={item.organizerName || 'Ban tổ chức'}
                        >
                          <Avatar
                            src={item.organizerAvatar || undefined}
                            name={item.organizerName || 'Ban tổ chức'}
                            size={26}
                          />
                          <span className="text-xs font-medium text-plum-800 truncate group-hover/author:underline group-hover/author:text-brand-600">
                            {item.organizerName || 'Ban tổ chức'}
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
                          className="shrink-0 hidden sm:inline-flex items-center gap-1 text-[11px] text-plum-500 hover:text-brand-600 hover:bg-brand-50/50 py-0.5 px-1.5 rounded transition-colors"
                          title="Bấm để xem danh sách người tham gia"
                        >
                          <Users size={11} className="text-brand-500" />
                          <span>
                            {item.attendeeCount}
                            {item.capacity ? ` / ${compact(item.capacity)}` : ''}
                          </span>
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {postLink && (
                          <Link
                            to={postLink}
                            className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-semibold text-plum-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Xem bài viết chi tiết"
                          >
                            <ExternalLink size={13} className="mr-1" /> Chi tiết
                          </Link>
                        )}

                        {/* If upcoming & active, allow cancelling RSVP or viewing attendees */}
                        {item.eventStatus !== 'CANCELLED' && (
                          <EventRsvpButton
                            eventId={item.eventId}
                            eventTitle={item.title}
                            initialRegistered={item.registrationStatus === 'REGISTERED'}
                            initialAttendeeCount={item.attendeeCount}
                            capacity={item.capacity}
                            startTime={item.startTime}
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
              {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm lịch sử'}
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
