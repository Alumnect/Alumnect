import { useState, useEffect } from 'react'
import { Check, Loader2, Users, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useToggleRsvp, useRsvpStatus } from '../hooks/useEventRsvp'
import { EventAttendeesModal } from './EventAttendeesModal'
import { compact } from '@/lib/utils'

interface EventRsvpButtonProps {
  eventId: number | string | null | undefined
  eventTitle?: string
  initialRegistered?: boolean
  initialAttendeeCount?: number
  capacity?: number | null
  startTime?: string | null
  size?: 'sm' | 'md'
  showCount?: boolean
  className?: string
}

export function EventRsvpButton({
  eventId,
  eventTitle,
  initialRegistered = false,
  initialAttendeeCount = 0,
  capacity,
  startTime,
  size = 'sm',
  showCount = true,
  className = '',
}: EventRsvpButtonProps) {
  const { user, isAuthenticated } = useAuthStore()
  const promptLogin = useLoginPrompt((s) => s.open)

  // Fetch backend RSVP status if logged in
  const { data: serverRsvp } = useRsvpStatus(eventId ?? undefined)

  const [isRegistered, setIsRegistered] = useState(initialRegistered)
  const [attendeeCount, setAttendeeCount] = useState(initialAttendeeCount)
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Sync with server data when available
  useEffect(() => {
    if (serverRsvp) {
      setIsRegistered(serverRsvp.registered)
      setAttendeeCount(serverRsvp.attendeeCount)
    }
  }, [serverRsvp])

  useEffect(() => {
    setIsRegistered(initialRegistered)
  }, [initialRegistered])

  useEffect(() => {
    setAttendeeCount(initialAttendeeCount)
  }, [initialAttendeeCount])

  const toggleRsvp = useToggleRsvp()

  // Business logic validations
  const isPast = startTime ? new Date(startTime).getTime() < Date.now() : false
  const isFull = capacity ? attendeeCount >= capacity : false

  const handleRsvpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      promptLogin('Đăng nhập để đăng ký tham gia sự kiện.')
      return
    }

    if (user?.role === 'ADMIN') {
      toast.warning('Chỉ tài khoản sinh viên và cựu sinh viên mới được đăng ký tham gia.')
      return
    }

    if (!eventId) {
      toast.error('Không tìm thấy thông tin sự kiện.')
      return
    }

    if (isPast) {
      toast.warning('Sự kiện đã kết thúc hoặc đang diễn ra, không thể thay đổi đăng ký.')
      return
    }

    if (!isRegistered && isFull) {
      toast.warning('Sự kiện đã đủ số lượng người tham gia.')
      return
    }

    const nextRegistered = !isRegistered
    const nextCount = nextRegistered ? attendeeCount + 1 : Math.max(0, attendeeCount - 1)

    // Optimistic UI update
    setIsRegistered(nextRegistered)
    setAttendeeCount(nextCount)

    toggleRsvp.mutate(
      { eventId, register: nextRegistered },
      {
        onSuccess: (res) => {
          setIsRegistered(res.registered)
          setAttendeeCount(res.attendeeCount)
          const msg =
            res.message ||
            (nextRegistered
              ? 'Đăng ký tham gia sự kiện thành công!'
              : 'Đã hủy đăng ký tham gia sự kiện.')
          toast.success(msg)
        },
        onError: (err: any) => {
          // Rollback on error
          setIsRegistered(!nextRegistered)
          setAttendeeCount(attendeeCount)
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            'Thao tác không thành công. Vui lòng thử lại.'
          toast.error(errorMsg)
        },
      }
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showCount && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (eventId) setIsAttendeesOpen(true)
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
          title="Bấm để xem danh sách người tham gia"
        >
          <Users size={13} className="text-slate-400" />
          <span>
            {attendeeCount}
            {capacity ? ` / ${compact(capacity)}` : ''} người tham gia
          </span>
        </button>
      )}

      {isPast ? (
        <Button
          size={size}
          variant="secondary"
          disabled
          className="cursor-not-allowed opacity-60 text-xs font-medium bg-slate-100 text-slate-400 border-none"
        >
          Đã kết thúc
        </Button>
      ) : isRegistered ? (
        <Button
          size={size}
          variant={isHovered ? 'secondary' : 'secondary'}
          onClick={handleRsvpClick}
          disabled={toggleRsvp.isPending}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`transition-all font-semibold ${
            isHovered
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : isHovered ? (
            <span>Hủy đăng ký</span>
          ) : (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Đã đăng ký</span>
            </>
          )}
        </Button>
      ) : isFull ? (
        <Button
          size={size}
          variant="secondary"
          disabled
          className="cursor-not-allowed opacity-75 text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200"
        >
          Hết chỗ
        </Button>
      ) : (
        <Button
          size={size}
          variant="primary"
          onClick={handleRsvpClick}
          disabled={toggleRsvp.isPending}
          className="shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <CalendarCheck size={14} />
              <span>Tham gia</span>
            </>
          )}
        </Button>
      )}

      {eventId && (
        <EventAttendeesModal
          isOpen={isAttendeesOpen}
          onClose={() => setIsAttendeesOpen(false)}
          eventId={eventId}
          eventTitle={eventTitle}
        />
      )}
    </div>
  )
}

