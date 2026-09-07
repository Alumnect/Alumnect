import { Users, Loader2, Calendar } from 'lucide-react'
import { Modal, Avatar } from '@/components/ui'
import { useEventAttendees } from '../hooks/useEventRsvp'
import { Link } from 'react-router-dom'

interface EventAttendeesModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number | string | null | undefined
  eventTitle?: string
}

export function EventAttendeesModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: EventAttendeesModalProps) {
  const { data: attendees = [], isLoading, isError } = useEventAttendees(eventId ?? undefined)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Danh sách người tham gia"
      icon={<Users size={18} className="text-brand-500" />}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-4">
        {eventTitle && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {eventTitle}
          </p>
        )}

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : isError ? (
          <div className="rounded-xl bg-rose-50 p-4 text-center text-sm text-rose-600">
            Không thể tải danh sách người tham gia. Vui lòng thử lại sau.
          </div>
        ) : attendees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            Chưa có ai đăng ký tham gia sự kiện này. Hãy là người đầu tiên!
          </div>
        ) : (
          <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {attendees.map((attendee) => (
              <div
                key={attendee.userId}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:bg-slate-100/80"
              >
                <Link
                  to={`/app/profile?userId=${attendee.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:text-brand-600 group"
                >
                  <Avatar src={attendee.avatarUrl} name={attendee.fullName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-plum-900 group-hover:text-brand-600">
                      {attendee.fullName}
                    </p>
                    {attendee.headline && (
                      <p className="truncate text-xs text-slate-500">{attendee.headline}</p>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      attendee.role === 'ALUMNI'
                        ? 'bg-amber-100 text-amber-800'
                        : attendee.role === 'STUDENT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {attendee.role === 'ALUMNI' ? 'Cựu SV' : attendee.role === 'STUDENT' ? 'Sinh viên' : attendee.role}
                  </span>
                  {attendee.registeredAt && (
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      {new Date(attendee.registeredAt).toLocaleDateString('vi-VN')}
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
