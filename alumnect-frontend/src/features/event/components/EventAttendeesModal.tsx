import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Loader2,
  Calendar,
  Search,
  X,
  GraduationCap,
  Sparkles,
  Ban,
  UserCheck,
} from 'lucide-react'
import { Modal, Avatar, Button } from '@/components/ui'
import { useEventAttendees } from '../hooks/useEventRsvp'
import { compact, cn } from '@/lib/utils'

interface EventAttendeesModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number | string | null | undefined
  eventTitle?: string
  capacity?: number | null
  status?: string | null
}

type RoleFilter = 'ALL' | 'STUDENT' | 'ALUMNI'

export function EventAttendeesModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  capacity,
  status,
}: EventAttendeesModalProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

  // Fetch attendees
  const { data: attendees = [], isLoading, isError, refetch } = useEventAttendees(
    isOpen && eventId ? eventId : undefined
  )

  // Sub-counts
  const studentCount = useMemo(
    () => attendees.filter((a) => a.role === 'STUDENT').length,
    [attendees]
  )
  const alumniCount = useMemo(
    () => attendees.filter((a) => a.role === 'ALUMNI').length,
    [attendees]
  )

  // Filtered attendees for immediate response
  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      // Role match
      if (roleFilter === 'STUDENT' && attendee.role !== 'STUDENT') return false
      if (roleFilter === 'ALUMNI' && attendee.role !== 'ALUMNI') return false

      // Search match
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const nameMatch = attendee.fullName?.toLowerCase().includes(q)
        const headlineMatch = attendee.headline?.toLowerCase().includes(q)
        return Boolean(nameMatch || headlineMatch)
      }

      return true
    })
  }, [attendees, roleFilter, search])

  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setRoleFilter('ALL')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Danh sách người tham gia"
      icon={<Users size={18} className="text-brand-500" />}
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-4">
        {/* Event Header & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum-900/10 pb-3">
          <div className="min-w-0 flex-1">
            {eventTitle && (
              <h4 className="truncate text-sm font-bold text-plum-900" title={eventTitle}>
                {eventTitle}
              </h4>
            )}
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-plum-500">
              <UserCheck size={13} className="text-brand-600" />
              <span>
                <strong className="text-plum-900">{attendees.length}</strong>
                {capacity ? ` / ${compact(capacity)}` : ''} người đã đăng ký
              </span>
            </p>
          </div>

          {status === 'CANCELLED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
              <Ban size={11} /> Sự kiện đã hủy
            </span>
          )}
        </div>



        {/* Search Bar & Role Filter Pills */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, chức danh..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs sm:text-sm text-plum-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                roleFilter === 'ALL'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              )}
            >
              Tất cả ({attendees.length})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('STUDENT')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                roleFilter === 'STUDENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100/80'
              )}
            >
              <GraduationCap size={12} />
              Sinh viên ({studentCount})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('ALUMNI')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                roleFilter === 'ALUMNI'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80'
              )}
            >
              <Sparkles size={11} />
              Cựu sinh viên ({alumniCount})
            </button>
          </div>
        </div>

        {/* Attendees List Area */}
        {isLoading ? (
          <div className="flex h-52 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              <p className="text-xs font-medium text-slate-500">Đang tải danh sách...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-rose-700">Không thể tải danh sách người tham gia</p>
            <p className="text-xs text-rose-500">Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()} className="mt-2 text-xs">
              Thử lại
            </Button>
          </div>
        ) : attendees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Users size={22} />
            </div>
            <h5 className="text-sm font-bold text-plum-900">
              {status === 'CANCELLED' ? 'Không có người đăng ký trước khi hủy' : 'Chưa có ai đăng ký tham gia'}
            </h5>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              {status === 'CANCELLED'
                ? 'Sự kiện chưa ghi nhận lượt giữ chỗ nào trước thời điểm bị hủy.'
                : 'Hãy là người đầu tiên đăng ký tham gia sự kiện này!'}
            </p>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm font-semibold text-plum-900">Không tìm thấy người tham gia phù hợp</p>
            <p className="mt-1 text-xs text-slate-500">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc vai trò khác.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClearFilters}
              className="mt-3 text-xs"
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredAttendees.map((attendee) => (
              <div
                key={attendee.userId}
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-xs"
              >
                <Link
                  to={`/app/profile?userId=${attendee.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:text-brand-600"
                >
                  <Avatar
                    src={attendee.avatarUrl}
                    name={attendee.fullName}
                    size={38}
                    className="shrink-0 group-hover:ring-2 group-hover:ring-brand-400 group-hover:ring-offset-1 transition-all"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-plum-900 group-hover:text-brand-600 transition-colors">
                      {attendee.fullName}
                    </p>
                    {attendee.headline ? (
                      <p className="truncate text-xs text-slate-500">{attendee.headline}</p>
                    ) : (
                      <p className="truncate text-xs text-slate-400 italic">Thành viên Alumnect</p>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide shadow-2xs',
                      attendee.role === 'ALUMNI'
                        ? 'bg-amber-100 text-amber-800'
                        : attendee.role === 'STUDENT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {attendee.role === 'ALUMNI'
                      ? 'Cựu SV'
                      : attendee.role === 'STUDENT'
                      ? 'Sinh viên'
                      : attendee.role}
                  </span>
                  {attendee.registeredAt && (
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      {formatDate(attendee.registeredAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
