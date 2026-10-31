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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
          const msg = res.message || t('event.cancelRsvpSuccess')
          toast.success(msg)
        },
        onError: (err: any) => {
          setIsRegistered(true)
          setAttendeeCount(attendeeCount)
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            t('event.cancelRsvpError')
          toast.error(errorMsg)
        },
      }
    )
  }

  const handleRsvpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      promptLogin(t('event.promptLoginRsvp'))
      return
    }

    if (user?.role === 'ADMIN') {
      toast.warning(t('event.roleNotEligibleRsvp'))
      return
    }

    if (!eventId) {
      toast.error(t('event.eventNotFound'))
      return
    }

    if (status === 'CANCELLED') {
      toast.warning(t('event.eventAlreadyCancelled'))
      return
    }

    if (isPast) {
      toast.warning(t('event.eventAlreadyEnded'))
      return
    }

    if (hasStarted) {
      toast.warning(t('event.eventAlreadyStarted'))
      return
    }

    // Nếu đã đăng ký, mở modal xác nhận hủy tham dự
    if (isRegistered) {
      setIsCancelModalOpen(true)
      return
    }

    if (isFull) {
      toast.warning(t('event.eventCapacityFull'))
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
          const msg = res.message || t('event.rsvpSuccess')
          toast.success(msg)
        },
        onError: (err: any) => {
          setIsRegistered(false)
          setAttendeeCount(attendeeCount)
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            t('event.rsvpFailed')
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
          title={t('event.viewAttendeesTooltip')}
        >
          <Users size={13} className="text-text-subtle" />
          <span>
            {capacity
              ? t('event.attendeesCountWithCapacity', { current: attendeeCount, capacity: compact(capacity) })
              : t('event.attendeesCountOnly', { current: attendeeCount })}
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
          {t('event.cancelled')}
        </span>
      ) : isPast ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-xl bg-border text-text-muted font-semibold border border-border select-none',
            sizeClasses
          )}
        >
          {t('event.ended')}
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
            <span>{t('event.registered')}</span>
          </Button>
        ) : (
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-xl bg-border text-text-muted font-semibold border border-border select-none',
              sizeClasses
            )}
          >
            {t('event.started')}
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
            'transition',
            sizeClasses,
            isHovered
              ? 'border-danger-border bg-danger-soft text-danger hover:border-danger'
              : 'border-success-border bg-success-soft text-success hover:border-success'
          )}
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={iconSize} className="animate-spin" />
              <span>{t('common.processing')}</span>
            </>
          ) : isHovered ? (
            <span>{t('event.cancelRsvp')}</span>
          ) : (
            <>
              <Check size={iconSize} />
              <span>{t('event.registered')}</span>
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
          {t('event.full')}
        </Button>
      ) : (
        <Button
          size={size}
          variant="primary"
          onClick={handleRsvpClick}
          disabled={toggleRsvp.isPending}
          className={cn('transition active:scale-95', sizeClasses)}
        >
          {toggleRsvp.isPending ? (
            <>
              <Loader2 size={iconSize} className="animate-spin" />
              <span>{t('common.processing')}</span>
            </>
          ) : (
            <>
              <CalendarCheck size={iconSize} />
              <span>{t('event.join')}</span>
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

