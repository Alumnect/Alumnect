import { useState, useEffect } from 'react'
import { Check, Loader2, Users, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useToggleRsvp, useRsvpStatus } from '../hooks/useEventRsvp'
import { EventAttendeesModal } from './EventAttendeesModal'
import { CancelRsvpModal } from './CancelRsvpModal'
import { compact, cn } from '@/lib/utils'

interface EventRsvpButtonProps {
  eventId: number | string | null | undefined
  eventTitle?: string
  initialRegistered?: boolean
  initialAttendeeCount?: number
  capacity?: number | null
  startTime?: string | null
  endTime?: string | null
  status?: string | null
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
  endTime,
  status,
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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const toggleRsvp = useToggleRsvp()

  // Sync with server data or initial props
  useEffect(() => {
    if (toggleRsvp.isPending) return
    if (serverRsvp) {
      setIsRegistered(serverRsvp.registered)
      setAttendeeCount(serverRsvp.attendeeCount)
    } else {
      setIsRegistered(initialRegistered)
      setAttendeeCount(initialAttendeeCount)
    }
  }, [serverRsvp, initialRegistered, initialAttendeeCount, toggleRsvp.isPending])

  // Business logic validations:
  const hasStarted = startTime ? new Date(startTime).getTime() <= Date.now() : false
  const isPast = endTime
    ? new Date(endTime).getTime() < Date.now()
    : hasStarted
  const isFull = capacity ? attendeeCount >= capacity : false

  const executeCancelRsvp = () => {
    if (!eventId) return
    const nextCount = Math.max(0, attendeeCount - 1)

    setIsRegistered(false)
    setAttendeeCount(nextCount)
    setIsCancelModalOpen(false)

    toggleRsvp.mutate(
      { eventId, register: false },
      {
        onSuccess: (res) => {
          setIsRegistered(res.registered)
          setAttendeeCount(res.attendeeCount)
          const msg = res.message || 'Đã hủy đăng ký tham gia sự kiện thành công!'
          toast.success(msg)
        },
        onError: (err: any) => {
          setIsRegistered(true)
          setAttendeeCount(attendeeCount)
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            'Hủy đăng ký không thành công. Vui lòng thử lại.'
          toast.error(errorMsg)
        },
      }
    )
  }

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

    if (status === 'CANCELLED') {
      toast.warning('Sự kiện này đã bị ban tổ chức hủy.')
      return
    }

    if (isPast) {
      toast.warning('Sự kiện đã kết thúc, không thể thay đổi đăng ký.')
      return
    }

    if (hasStarted) {
      toast.warning('Sự kiện đã bắt đầu, không thể đăng ký hoặc hủy tham gia.')
      return
    }

    // Nếu đã đăng ký, mở modal xác nhận hủy tham dự
    if (isRegistered) {
      setIsCancelModalOpen(true)
      return
    }

    if (isFull) {
      toast.warning('Sự kiện đã đủ số lượng người tham gia.')
      return
    }

    // Luồng đăng ký tham gia mới
    const nextCount = attendeeCount + 1
    setIsRegistered(true)
    setAttendeeCount(nextCount)

    toggleRsvp.mutate(
      { eventId, register: true },
      {
        onSuccess: (res) => {
          setIsRegistered(res.registered)
          setAttendeeCount(res.attendeeCount)
          const msg = res.message || 'Đăng ký tham gia sự kiện thành công!'
          toast.success(msg)
        },
        onError: (err: any) => {
          setIsRegistered(false)
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

  const sizeClasses =
    size === 'sm'
      ? 'h-8 px-3 text-xs gap-1.5 rounded-xl font-semibold'
      : 'h-9 px-4 text-sm gap-2 rounded-xl font-semibold'
  const iconSize = size === 'sm' ? 13 : 14

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
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

      {status === 'CANCELLED' ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600',
            sizeClasses
          )}
        >
          Đã hủy
        </span>
      ) : isPast ? (
        <Button
          size={size}
          variant="secondary"
          disabled
          className={cn(
            'cursor-not-allowed opacity-60 bg-slate-100 text-slate-400 border-none',
            sizeClasses
          )}
        >
          Đã kết thúc
        </Button>
      ) : hasStarted ? (
        isRegistered ? (
          <Button
            size={size}
            variant="secondary"
            disabled
            className={cn(
              'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700',
              sizeClasses
            )}
          >
            <Check size={iconSize} className="text-emerald-600" />
            <span>Đã đăng ký</span>
          </Button>
        ) : (
          <Button
            size={size}
            variant="secondary"
            disabled
            className={cn(
              'cursor-not-allowed opacity-75 bg-slate-100 text-slate-500 border-slate-200',
              sizeClasses
            )}
          >
            Đã bắt đầu
          </Button>
        )
      ) : isRegistered ? (
        <Button
          size={size}
          variant="secondary"
          onClick={handleRsvpClick}
          disabled={toggleRsvp.isPending}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'transition-all',
            sizeClasses,
            isHovered
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
          )}
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={iconSize} className="animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : isHovered ? (
            <span>Hủy đăng ký</span>
          ) : (
            <>
              <Check size={iconSize} className="text-emerald-600" />
              <span>Đã đăng ký</span>
            </>
          )}
        </Button>
      ) : isFull ? (
        <Button
          size={size}
          variant="secondary"
          disabled
          className={cn(
            'cursor-not-allowed opacity-80 bg-amber-50 text-amber-700 border-amber-200',
            sizeClasses
          )}
        >
          Hết chỗ
        </Button>
      ) : (
        <Button
          size={size}
          variant="primary"
          onClick={handleRsvpClick}
          disabled={toggleRsvp.isPending}
          className={cn('shadow-sm transition-all hover:scale-105 active:scale-95', sizeClasses)}
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={iconSize} className="animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <CalendarCheck size={iconSize} />
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
          capacity={capacity}
          status={status}
        />
      )}

      {eventId && (
        <CancelRsvpModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={executeCancelRsvp}
          isPending={toggleRsvp.isPending}
          eventTitle={eventTitle}
        />
      )}
    </div>
  )
}

