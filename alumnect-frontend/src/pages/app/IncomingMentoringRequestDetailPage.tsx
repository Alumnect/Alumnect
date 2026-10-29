import { useState, type ReactNode } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Coins,
  Download,
  Laptop,
  MessageSquare,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react'
import { Avatar, Button, ButtonLink, Container, EmptyState, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  RequestTypeBadge,
  IncomingRequestResponseModal,
  useIncomingMentoringRequestDetail,
  useAcceptIncomingRequest,
  useDeclineIncomingRequest,
  TASK_TYPE_OPTIONS,
  WORKING_MODE_LABELS,
  PARTICIPATION_TYPE_LABELS,
} from '@/features/mentorship'
import { MentorResponseStatusBadge, RequestStatusBadge } from '@/features/mentorship/components/RequestStatusBadge'
import { MentoringBadge } from '@/features/mentorship/components/MentoringUi'
import { formatVnd } from '@/features/mentorship/model/mentoringFlowLabels'
import { cn } from '@/lib/utils'

const CARD = 'rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6'

function formatDateTime(value?: string | null, lang: string = 'vi') {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBudget(min?: number | null, max?: number | null, t?: (key: string) => string) {
  if (min == null && max == null) return t ? t('mentoring.negotiable') : 'Thỏa thuận'
  if (min != null && max != null && min !== max) return `${formatVnd(min)} – ${formatVnd(max)}`
  const value = max ?? min ?? 0
  return value === 0 ? (t ? t('mentoring.freeBudget') : 'Miễn phí') : formatVnd(value)
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3.5 py-3 dark:bg-white/[0.04]">
      <dt className="flex items-center gap-1.5 text-xs text-text-subtle [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-text">{value}</dd>
    </div>
  )
}

/**
 * Chi tiết một yêu cầu gửi đến Mentor (UC103).
 * Bố cục: nội dung yêu cầu bên trái; khung "Phản hồi của bạn" cố định bên phải để Mentor thao tác ngay.
 */
function IncomingMentoringRequestDetailContent() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const requestId = id ? Number(id) : undefined
  const [modalType, setModalType] = useState<'ACCEPT' | 'DECLINE' | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useIncomingMentoringRequestDetail(requestId)
  const acceptMutation = useAcceptIncomingRequest()
  const declineMutation = useDeclineIncomingRequest()

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Skeleton className="h-72 w-full rounded-2xl lg:col-span-8" />
          <Skeleton className="h-56 w-full rounded-2xl lg:col-span-4" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    const errorMsg = (error as Error)?.message || t('mentoring.requestNotFound')
    const isForbidden = errorMsg.includes('không có quyền') || errorMsg.includes('Forbidden')
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6" />}
        title={isForbidden ? t('mentoring.cannotViewRequest') : t('mentoring.requestNotFoundTitle')}
        description={isForbidden ? t('mentoring.requestNotSentToYou') : errorMsg}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to="/app/mentoring/incoming-requests" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              {t('mentoring.backToList')}
            </ButtonLink>
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {t('common.retry')}
            </Button>
          </div>
        }
      />
    )
  }

  const { responseStatus, canRespond, canMessage, attachments } = data
  const taskLabel = TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType)?.label || data.taskType || t('mentoring.undetermined')

  const handleModalSubmit = async (responseNote?: string) => {
    if (!requestId || !modalType) return
    if (modalType === 'ACCEPT') {
      const accepted = await acceptMutation.mutateAsync({ requestId, payload: { responseNote } })
      setModalType(null)
      // Đồng ý → mở ngay Chat for Task của Request + Học viên + Mentor
      if (accepted?.conversationId) navigate(`/app/mentoring/chats/${accepted.conversationId}`)
      return
    }
    await declineMutation.mutateAsync({ requestId, payload: { responseNote } })
    setModalType(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/app/mentoring/incoming-requests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary-solid"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('mentoring.incomingRequestsNav')}
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
        >
          {t('mentoring.refreshBtn')}
        </Button>
      </div>

      <header className={CARD}>
        <div className="flex flex-wrap items-center gap-1.5">
          <MentorResponseStatusBadge status={responseStatus} />
          <RequestTypeBadge type={data.requestType} />
          {data.requestStatus !== 'OPEN' && <RequestStatusBadge status={data.requestStatus} />}
          {data.sameIndustry && <MentoringBadge tone="navy">{t('mentoring.sameIndustryBadge')}</MentoringBadge>}
          {data.sameFormat && <MentoringBadge tone="mint">{t('mentoring.sameFormatBadge')}</MentoringBadge>}
        </div>
        <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-text sm:text-2xl">{data.title}</h1>
        <p className="mt-2 text-xs text-text-subtle">
          {t('mentoring.receivedTimeAt', { time: formatDateTime(data.distributedAt || data.createdAt, i18n.language) })}
          {data.industryName ? t('mentoring.industryWithDot', { industry: data.industryName }) : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Khung phản hồi: hiện trước trên di động, cố định bên phải trên màn hình rộng */}
        <aside className="space-y-5 lg:order-2 lg:col-span-4">
          <section className={cn(CARD, 'lg:sticky lg:top-4')}>
            <h2 className="font-display text-base font-bold text-text">{t('mentoring.yourResponseHeading')}</h2>

            {responseStatus === 'WAITING' && canRespond && (
              <div className="mt-3 space-y-3">
                <p className="text-sm leading-relaxed text-text-muted">
                  {t('mentoring.acceptExchangePrompt', { name: data.studentName })}
                </p>
                <Button className="w-full" onClick={() => setModalType('ACCEPT')} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                  {t('mentoring.agreeToDiscussBtn')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setModalType('DECLINE')}
                  leftIcon={<XCircle className="h-4 w-4" />}
                  className="w-full border border-danger-border text-danger hover:bg-danger-soft hover:text-danger"
                >
                  {t('mentoring.declineExchangeBtn')}
                </Button>
              </div>
            )}

            {responseStatus === 'WAITING' && !canRespond && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {t('mentoring.cannotRespondNotice')}
                </span>
              </div>
            )}

            {responseStatus === 'ACCEPTED' && (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-success-soft p-3 text-xs leading-relaxed text-success">
                  <p className="font-semibold">{t('mentoring.youAgreedToDiscuss', { time: formatDateTime(data.respondedAt, i18n.language) })}</p>
                  {data.responseNote && <p className="mt-1">“{data.responseNote}”</p>}
                </div>
                {data.otherMentorSelected && (
                  <p className="rounded-xl bg-warning-soft p-3 text-xs text-warning">
                    {t('mentoring.otherMentorSelectedNotice')}
                  </p>
                )}
                {canMessage && data.conversationId && (
                  <ButtonLink
                    to={`/app/mentoring/chats/${data.conversationId}`}
                    leftIcon={<MessageSquare className="h-4 w-4" />}
                    className="w-full"
                  >
                    {t('mentoring.openChatBtn')}
                  </ButtonLink>
                )}
              </div>
            )}

            {responseStatus === 'DECLINED' && (
              <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs leading-relaxed text-danger">
                <p className="font-semibold">{t('mentoring.youDeclinedRequest', { time: formatDateTime(data.respondedAt, i18n.language) })}</p>
                {data.responseNote && <p className="mt-1">{t('mentoring.declineReasonPrefix', { reason: data.responseNote })}</p>}
              </div>
            )}

            {responseStatus === 'EXPIRED' && (
              <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs text-text-muted dark:bg-white/[0.04]">
                {t('mentoring.requestExpiredNotice')}
              </p>
            )}
          </section>

          <section className={CARD}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">{t('mentoring.senderHeading')}</h2>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={data.studentAvatar || undefined} name={data.studentName} size={44} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{data.studentName}</p>
                {data.studentHeadline && <p className="line-clamp-2 text-xs text-text-subtle">{data.studentHeadline}</p>}
              </div>
            </div>
          </section>
        </aside>

        <section className={cn(CARD, 'lg:order-1 lg:col-span-8')}>
          <h2 className="font-display text-base font-bold text-text">{t('mentoring.requestContentHeading')}</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text">
            {data.description}
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Fact icon={<Coins />} label={t('mentoring.budgetLabel')} value={formatBudget(data.budgetMin, data.budgetMax, t)} />
            <Fact icon={<Briefcase />} label={t('mentoring.taskTypeFact')} value={taskLabel} />
            <Fact
              icon={<Laptop />}
              label={t('mentoring.workingModeFact')}
              value={data.workingMode ? WORKING_MODE_LABELS[data.workingMode] : t('mentoring.flexibleWorkingMode')}
            />
            <Fact
              icon={<Users />}
              label={t('mentoring.participationTypeFact')}
              value={data.participationType ? PARTICIPATION_TYPE_LABELS[data.participationType] : t('mentoring.individualParticipation')}
            />
            {data.expectedDeadline && (
              <Fact icon={<CalendarClock />} label={t('mentoring.expectedDeadlineFact')} value={formatDateTime(data.expectedDeadline, i18n.language)} />
            )}
          </dl>

          {attachments && attachments.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
                <Paperclip className="h-4 w-4 text-text-subtle" />
                {t('mentoring.attachedDocumentsHeading', { count: attachments.length })}
              </h3>
              <ul className="mt-2.5 space-y-2">
                {attachments.map((file, idx) => (
                  <li key={idx}>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-brand-500/40 hover:bg-surface-2 dark:hover:bg-white/[0.04]"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm text-text">
                        <span className="truncate font-medium">{file.fileName || t('mentoring.defaultDocumentTitle', { index: idx + 1 })}</span>
                        {file.fileSize ? <span className="shrink-0 text-xs text-text-subtle">{formatFileSize(file.fileSize)}</span> : null}
                      </span>
                      <Download className="h-4 w-4 shrink-0 text-text-subtle" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {modalType && (
        <IncomingRequestResponseModal
          isOpen
          onClose={() => setModalType(null)}
          type={modalType}
          requestTitle={data.title}
          studentName={data.studentName}
          isLoading={acceptMutation.isPending || declineMutation.isPending}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}

export default function IncomingMentoringRequestDetailPage() {
  return (
    <MentoringTermsGate>
      <Container className="py-2 sm:py-4">
        <IncomingMentoringRequestDetailContent />
      </Container>
    </MentoringTermsGate>
  )
}

