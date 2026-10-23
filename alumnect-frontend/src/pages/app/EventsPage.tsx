import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users, Clock, Loader2, Bookmark, Ban, Search, X } from 'lucide-react'
import { PageHeader, Card, Avatar, SmartImage, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { useFeed, useToggleSavePost } from '@/features/feed'
import { EventRsvpButton, CancelEventModal, useCancelEvent, EventHistoryView, EventAttendeesModal } from '@/features/event'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { compact, cn } from '@/lib/utils'

const TABS = ['Sắp diễn ra', 'Trong tháng này', 'Lịch sử tham gia']

export function EventsPage() {
  const [tab, setTab] = useState('Sắp diễn ra')
  const [keyword, setKeyword] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [cancelEventTarget, setCancelEventTarget] = useState<{ id: string | number; title?: string } | null>(null)
  const [attendeeModalTarget, setAttendeeModalTarget] = useState<{
    id: string | number
    title?: string
    capacity?: number | null
    status?: string | null
  } | null>(null)

  const currentUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const promptLogin = useLoginPrompt((s) => s.open)
  const toggleSave = useToggleSavePost()
  const cancelEventMutation = useCancelEvent()

  const currentEventFilter = tab === 'Sắp diễn ra' ? 'upcoming' : tab === 'Trong tháng này' ? 'this_month' : undefined

  // Lấy danh sách sự kiện đã được Backend lọc trực tiếp từ Database (chỉ lấy sự kiện hợp lệ, chưa kết thúc, chưa hủy)
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed('event', '', 12, currentEventFilter)
  const filteredEvents = useMemo(() => {
    const events = data?.pages.flatMap((page) => page.items).filter((post) => Boolean(post.event && post.event.startTime)) || []
    if (!keyword.trim()) return events
    const q = keyword.trim().toLowerCase()
    return events.filter((post) => {
      const e = post.event
      return (
        (e?.title && e.title.toLowerCase().includes(q)) ||
        (e?.location && e.location.toLowerCase().includes(q)) ||
        (post.text && post.text.toLowerCase().includes(q)) ||
        (post.author && post.author.toLowerCase().includes(q))
      )
    })
  }, [data, keyword])

  const getEventDateInfo = (isoString?: string | null) => {
    if (!isoString) return { month: 'TH--', day: '--', dateStr: 'Chưa xác định', timeStr: '' }
    const date = new Date(isoString)
    const month = 'TH' + (date.getMonth() + 1)
    return {
      month,
      day: date.getDate().toString().padStart(2, '0'),
      dateStr: date.toLocaleDateString('vi-VN', { dateStyle: 'medium' }),
      timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<CalendarDays size={20} />}
        title="Sự kiện & Họp mặt"
        subtitle="Tham gia các buổi giao lưu, hội thảo và ngày hội cựu sinh viên FPTU."
      />

      {/* Khung tìm kiếm sự kiện & lọc tab thời gian */}
      <Card hover={false} className="mb-6 p-4 space-y-3.5">
        {/* Ô tìm kiếm sự kiện */}
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm sự kiện theo tên, địa điểm hoặc từ khóa..."
            className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle transition-colors hover:bg-border hover:text-text-muted cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Cụm Tabs thời gian */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pt-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer',
                tab === t
                  ? 'bg-primary-solid text-on-primary shadow-raised'
                  : 'bg-surface-2 text-text-muted hover:bg-surface-3',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'Lịch sử tham gia' ? (
        !isAuthenticated ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="Đăng nhập để xem lịch sử"
            description="Vui lòng đăng nhập với tài khoản Sinh viên hoặc Cựu sinh viên để xem lịch sử các sự kiện bạn đã tham gia."
            action={
              <Button size="sm" variant="primary" onClick={() => promptLogin('Đăng nhập để xem lịch sử tham gia sự kiện.')}>
                Đăng nhập ngay
              </Button>
            }
          />
        ) : currentUser?.role === 'ADMIN' ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="Không áp dụng cho Quản trị viên"
            description="Tài khoản Quản trị viên không tham gia vào các sự kiện cộng đồng."
            action={
              <Button size="sm" variant="secondary" onClick={() => setTab('Sắp diễn ra')}>
                Quay lại danh sách sự kiện
              </Button>
            }
          />
        ) : (
          <EventHistoryView />
        )
      ) : (
        <>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-solid" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title="Không tải được danh sách sự kiện"
              description="Đã xảy ra lỗi khi kết nối tới máy chủ."
              action={<Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Thử lại</Button>}
            />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title={keyword ? `Không tìm thấy sự kiện nào khớp "${keyword.trim()}"` : 'Chưa có sự kiện nào ở mục này'}
              description={keyword ? 'Thử tìm với từ khóa khác hoặc xóa ô tìm kiếm để xem tất cả sự kiện.' : 'Hãy thử chọn tab khác hoặc quay lại sau để xem các sự kiện mới.'}
              action={
                keyword ? (
                  <Button size="sm" variant="secondary" onClick={() => setKeyword('')}>
                    Xóa tìm kiếm
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setTab('Sắp diễn ra')}>
                    Xem tất cả sự kiện
                  </Button>
                )
              }
            />
          ) : (
          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {filteredEvents.map((post) => {
              const event = post.event!
              const cover = post.images && post.images.length > 0 ? post.images[0] : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
              const dateInfo = getEventDateInfo(event.startTime)
              
              return (
                <StaggerItem key={post.id}>
                  <Card hover={false} className="group h-full flex flex-col overflow-hidden transition-shadow duration-200">
                    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
                      <Link to={`/app/posts/${post.id}`} className="block h-full w-full">
                        <SmartImage src={cover} alt={event.title || 'Sự kiện'} className="h-full w-full" imgClassName="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/85 to-transparent" />
                        <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl glass-strong py-1.5 text-center">
                          <span className="text-xs font-bold uppercase text-warning">{dateInfo.month}</span>
                          <span className="text-xl font-extrabold text-text">{dateInfo.day}</span>
                        </div>
                        {event.status === 'CANCELLED' && (
                          <div className="absolute left-20 top-3 flex items-center gap-1 rounded-xl bg-danger-soft px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-xs">
                            <Ban size={13} /> Đã hủy
                          </div>
                        )}
                      </Link>

                      {/* Nút Bookmark lưu sự kiện */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!isAuthenticated) {
                            promptLogin('Đăng nhập để lưu sự kiện.')
                            return
                          }
                          const isSaved = saved[post.id] ?? post.saved
                          const next = !isSaved
                          setSaved((s) => ({ ...s, [post.id]: next }))
                          toggleSave.mutate(
                            { postId: post.id, save: next },
                            {
                              onSuccess: (res) => {
                                setSaved((s) => ({ ...s, [post.id]: res.saved }))
                              },
                              onError: () => {
                                setSaved((s) => ({ ...s, [post.id]: !next }))
                              },
                            }
                          )
                        }}
                        className={cn(
                          'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl shadow-sm transition hover:scale-105 active:scale-95 z-10',
                          (saved[post.id] ?? post.saved)
                            ? 'bg-surface text-primary-solid shadow-orange-500/20'
                            : 'bg-black/35 text-white/90 hover:bg-black/55 hover:text-white backdrop-blur-xs'
                        )}
                        aria-label="Lưu sự kiện"
                        title={(saved[post.id] ?? post.saved) ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}
                      >
                        <Bookmark size={17} className={(saved[post.id] ?? post.saved) ? 'fill-[#F27024]' : ''} />
                      </button>
                    </div>
                    <div className="flex flex-col justify-between flex-1 p-5">
                      <Link to={`/app/posts/${post.id}`} className="block">
                        <h2 className="text-lg font-bold text-text line-clamp-2 hover:underline hover:text-primary-solid transition-colors">{event.title || 'Sự kiện chưa đặt tên'}</h2>
                        {event.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-text-subtle truncate">
                            <MapPin size={14} className="shrink-0" /> {event.location}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-subtle">
                          <Clock size={14} className="shrink-0" /> {dateInfo.dateStr} {dateInfo.timeStr && `· ${dateInfo.timeStr}`}
                        </p>
                        {post.text && (
                          <p className="mt-3 text-sm text-text-muted line-clamp-3">
                            {post.text}
                          </p>
                        )}
                      </Link>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                          <Link
                            to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 min-w-0 hover:text-primary-solid transition-colors group/author"
                          >
                            <div className="shrink-0">
                              <Avatar src={post.avatar} name={post.author} size={24} />
                            </div>
                            <span className="text-[13px] font-medium text-text truncate group-hover/author:underline group-hover/author:text-brand-600" title={post.author}>
                              {post.author}
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setAttendeeModalTarget({
                                id: event.id ?? post.eventId ?? post.id,
                                title: event.title,
                                capacity: event.capacity,
                                status: event.status,
                              })
                            }}
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-text-subtle hover:bg-primary-soft hover:text-primary-solid transition-colors"
                            title="Bấm để xem danh sách người tham gia"
                          >
                            <Users size={12} className="text-primary-solid" />
                            <span>
                              {event.attendeeCount ?? 0}
                              {event.capacity ? ` / ${compact(event.capacity)}` : ''}
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {Boolean(currentUser?.id && post.authorId && String(currentUser.id) === String(post.authorId)) &&
                            event.status !== 'CANCELLED' &&
                            !((event.endTime && new Date(event.endTime).getTime() < Date.now()) || (!event.endTime && event.startTime && new Date(event.startTime).getTime() < Date.now())) && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setCancelEventTarget({
                                    id: event.id ?? post.eventId ?? post.id,
                                    title: event.title,
                                  })
                                }}
                                className="h-8 px-3 text-xs gap-1.5 rounded-xl font-semibold border-danger-border text-danger hover:bg-danger-soft hover:border-danger-border"
                                title="Hủy tổ chức sự kiện này"
                              >
                                <Ban size={13} /> Hủy sự kiện
                              </Button>
                            )}
                          <EventRsvpButton
                            eventId={event.id ?? post.eventId}
                            eventTitle={event.title}
                            initialRegistered={event.isRegistered ?? false}
                            initialAttendeeCount={event.attendeeCount ?? 0}
                            capacity={event.capacity}
                            startTime={event.startTime}
                            endTime={event.endTime}
                            status={event.status}
                            size="sm"
                            showCount={false}
                            className="shrink-0"
                          />
                        </div>
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
                  {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm sự kiện'}
                </Button>
              </div>
            </Reveal>
          )}
        </>
      )}

      {cancelEventTarget && (
        <CancelEventModal
          isOpen={Boolean(cancelEventTarget)}
          onClose={() => setCancelEventTarget(null)}
          onConfirm={() => {
            if (!cancelEventTarget.id) return
            cancelEventMutation.mutate(
              { eventId: cancelEventTarget.id },
              {
                onSuccess: (res) => {
                  toast.success(res.message || 'Đã hủy sự kiện thành công!')
                  setCancelEventTarget(null)
                },
                onError: (err: any) => {
                  toast.error(
                    err.response?.data?.message ||
                      err.message ||
                      'Không thể hủy sự kiện. Vui lòng thử lại.'
                  )
                },
              }
            )
          }}
          isPending={cancelEventMutation.isPending}
          eventTitle={cancelEventTarget.title}
        />
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

