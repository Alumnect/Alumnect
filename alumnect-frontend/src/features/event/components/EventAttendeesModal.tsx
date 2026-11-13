import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
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
      return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
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
      title={t('event.attendeesListTitle')}
      icon={<Users size={18} className="text-primary-solid" />}
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-4">
        {/* Event Header & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="min-w-0 flex-1">
            {eventTitle && (
              <h4 className="truncate text-sm font-bold text-text" title={eventTitle}>
                {eventTitle}
              </h4>
            )}
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-subtle">
              <UserCheck size={13} className="text-primary-solid" />
              <span>
                {capacity
                  ? t('event.registeredCountWithCapacity', { registered: attendees.length, capacity: compact(capacity) })
                  : t('event.registeredCount', { count: attendees.length })}
              </span>
            </p>
          </div>

          {status === 'CANCELLED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
              <Ban size={11} /> {t('event.eventCancelledBadge')}
            </span>
          )}
        </div>

        {/* Search Bar & Role Filter Pills */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              aria-label={t('event.searchAttendeePlaceholder')}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('event.searchAttendeePlaceholder')}
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-8 text-xs sm:text-sm text-text placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-hidden focus:ring-1 focus:ring-primary transition"
            />
            {search && (
              <button
                aria-label={t('common.close')}
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-muted"
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
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                roleFilter === 'ALL'
                  ? 'bg-primary-solid text-on-primary shadow-xs'
                  : 'bg-surface-2 text-text-muted hover:bg-slate-200/70'
              )}
            >
              {t('event.roleAll', { count: attendees.length })}
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('STUDENT')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition',
                roleFilter === 'STUDENT'
                  ? 'bg-info text-text-inverse shadow-xs'
                  : 'bg-info-soft text-info hover:bg-info-border/60'
              )}
            >
              <GraduationCap size={12} />
              {t('event.roleStudentCount', { count: studentCount })}
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('ALUMNI')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition',
                roleFilter === 'ALUMNI'
                  ? 'bg-warning text-text-inverse shadow-xs'
                  : 'bg-warning-soft text-warning hover:bg-warning-border/60'
              )}
            >
              <Sparkles size={11} />
              {t('event.roleAlumniCount', { count: alumniCount })}
            </button>
          </div>
        </div>

        {/* Attendees List Area */}
        {isLoading ? (
          <div className="flex h-52 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary-solid" />
              <p className="text-xs font-medium text-text-subtle">{t('event.loadingAttendees')}</p>
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-danger-border bg-danger-soft p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-danger">{t('event.loadAttendeesError')}</p>
            <p className="text-xs text-danger">{t('event.loadAttendeesErrorDesc')}</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()} className="mt-2 text-xs">
              {t('common.tryAgain')}
            </Button>
          </div>
        ) : attendees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-solid">
              <Users size={22} />
            </div>
            <h5 className="text-sm font-bold text-text">
              {status === 'CANCELLED' ? t('event.noAttendeesBeforeCancel') : t('event.noAttendeesYet')}
            </h5>
            <p className="mt-1 text-xs text-text-subtle max-w-xs mx-auto">
              {status === 'CANCELLED'
                ? t('event.noAttendeesBeforeCancelDesc')
                : t('event.noAttendeesYetDesc')}
            </p>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-sm font-semibold text-text">{t('event.noAttendeesMatch')}</p>
            <p className="mt-1 text-xs text-text-subtle">
              {t('event.noAttendeesMatchDesc')}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClearFilters}
              className="mt-3 text-xs"
            >
              {t('common.clearFilter')}
            </Button>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredAttendees.map((attendee) => (
              <div
                key={attendee.userId}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface-2 p-2.5 transition hover:border-primary-soft-border hover:bg-brand-50/20"
              >
                <Link
                  to={`/app/profile?userId=${attendee.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:text-primary-solid"
                >
                  <Avatar
                    src={attendee.avatarUrl}
                    name={attendee.fullName}
                    size={38}
                    className="shrink-0 group-hover:ring-2 group-hover:ring-brand-400 group-hover:ring-offset-1 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text group-hover:text-primary-solid transition-colors">
                      {attendee.fullName}
                    </p>
                    {attendee.headline ? (
                      <p className="truncate text-xs text-text-subtle">{attendee.headline}</p>
                    ) : (
                      <p className="truncate text-xs text-text-subtle italic">{t('event.alumnectMember')}</p>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide shadow-2xs',
                      attendee.role === 'ALUMNI'
                        ? 'bg-warning-soft text-warning'
                        : attendee.role === 'STUDENT'
                        ? 'bg-info-soft text-info'
                        : 'bg-surface-2 text-text-muted'
                    )}
                  >
                    {attendee.role === 'ALUMNI'
                      ? t('event.roleAlumniShort')
                      : attendee.role === 'STUDENT'
                      ? t('event.roleStudentShort')
                      : attendee.role}
                  </span>
                  {attendee.registeredAt && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-text-subtle">
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
