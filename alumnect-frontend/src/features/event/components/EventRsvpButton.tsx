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
      ? 'inline-flex h-9 items-center whitespace-nowrap px-3 text-sm gap-1.5 rounded-xl font-semibold'
      : 'inline-flex h-10 items-center whitespace-nowrap px-4 text-sm gap-2 rounded-xl font-semibold'
  const iconSize = size === 'sm' ? 14 : 16

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
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-text-subtle hover:bg-surface-2 hover:text-primary-solid transition-colors"
          title="Bấm để xem danh sách người tham gia"
        >
          <Users size={13} className="text-text-subtle" />
          <span>
            {attendeeCount}
            {capacity ? ` / ${compact(capacity)}` : ''} người tham gia
          </span>
        </button>
      )}

      {status === 'CANCELLED' ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-xl border border-danger-border bg-danger-soft text-danger',
            sizeClasses
          )}
        >
          Đã hủy
        </span>
      ) : isPast ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-xl bg-border text-text-muted font-semibold border border-border select-none',
            sizeClasses
          )}
        >
          Đã kết thúc
        </span>
      ) : hasStarted ? (
        isRegistered ? (
          <Button
            size={size}
            variant="secondary"
            disabled
            className={cn(
              'cursor-not-allowed border-success-border bg-success-soft text-success font-semibold',
              sizeClasses
            )}
          >
            <Check size={iconSize} />
            <span>Đã đăng ký</span>
          </Button>
        ) : (
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-xl bg-border text-text-muted font-semibold border border-border select-none',
              sizeClasses
            )}
          >
            Đã bắt đầu
          </span>
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
              ? 'border-danger-border bg-danger-soft text-danger hover:border-danger'
              : 'border-success-border bg-success-soft text-success hover:border-success'
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
              <Check size={iconSize} />
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
            'cursor-not-allowed opacity-80 bg-warning-soft text-warning border-warning-border',
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
          className={cn('transition-all active:scale-95', sizeClasses)}
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

