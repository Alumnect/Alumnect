import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  ChevronDown,
  Coins,
  Download,
  Laptop,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from 'lucide-react'
import { Avatar, Button, ButtonLink, ConfirmModal, Container, EmptyState, Skeleton, toast } from '@/components/ui'
import { mentoringRequestApi } from '@/features/mentorship/api/mentoringRequestApi'
import {
  MentoringTermsGate,
  RequestTypeBadge,
  RequestStatusBadge,
  MentorResponseCard,
  RequestResponseSummaryCard,
  useMentoringRequestDetail,
  TASK_TYPE_OPTIONS,
  WORKING_MODE_LABELS,
  PARTICIPATION_TYPE_LABELS,
} from '@/features/mentorship'
import { formatVnd } from '@/features/mentorship/model/mentoringFlowLabels'
import { cn } from '@/lib/utils'

const CARD = 'rounded-2xl border border-plum-900/[0.08] bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#242526] sm:p-6'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Thỏa thuận'
  if (min != null && max != null && min !== max) return `${formatVnd(min)} – ${formatVnd(max)}`
  const value = max ?? min ?? 0
  return value === 0 ? 'Miễn phí' : formatVnd(value)
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-cream-100 px-3.5 py-3 dark:bg-white/[0.04]">
      <dt className="flex items-center gap-1.5 text-xs text-plum-500 dark:text-[#b0b3b8] [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-plum-900 dark:text-white">{value}</dd>
    </div>
  )
}

/**
 * Chi tiết yêu cầu Mentoring của người học và phản hồi của Mentor (UC102).
 * Phản hồi của Mentor đặt lên đầu vì đó là việc người học cần xem và thao tác.
 */
function MentoringRequestDetailContent() {
  const { id } = useParams<{ id: string }>()
  const requestId = id ? Number(id) : undefined
  const [showOtherMentors, setShowOtherMentors] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch, isFetching } = useMentoringRequestDetail(requestId)

  const cancelMutation = useMutation({
    mutationFn: () => mentoringRequestApi.cancelRequest(requestId!),
    onSuccess: () => {
      toast.success('Đã hủy yêu cầu')
      setConfirmCancel(false)
      queryClient.invalidateQueries({ queryKey: ['mentoring'] })
      refetch()
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể hủy yêu cầu'),
  })

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
    const errorMsg = (error as Error)?.message || 'Không tìm thấy yêu cầu Mentoring.'
    const isForbidden = errorMsg.includes('không có quyền') || errorMsg.includes('Forbidden')
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6" />}
        title={isForbidden ? 'Bạn không xem được yêu cầu này' : 'Không tìm thấy yêu cầu'}
        description={isForbidden ? 'Yêu cầu này thuộc về người dùng khác.' : errorMsg}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to="/app/mentoring/requests" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Về danh sách
            </ButtonLink>
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Thử lại
            </Button>
          </div>
        }
      />
    )
  }

  const isDirect = data.requestType === 'DIRECT'
  const taskLabel = TASK_TYPE_OPTIONS.find((t) => t.value === data.taskType)?.label ?? data.taskType
  const mentorResponses = data.mentorResponses ?? []
  // Yêu cầu chung gửi tới mọi Mentor: danh sách chính gồm Mentor cùng ngành, đã đồng ý hoặc được chọn;
  // các Mentor còn lại (khác ngành, chưa phản hồi) nằm trong mục xổ xuống
  const primaryResponses = isDirect
    ? mentorResponses
    : mentorResponses.filter((r) => r.selected || r.sameIndustry || r.responseStatus === 'ACCEPTED')
  const otherResponses = isDirect ? [] : mentorResponses.filter((r) => !primaryResponses.includes(r))
  const activeMembers = data.group?.members.filter((m) => m.status === 'ACTIVE') ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/app/mentoring/requests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum-600 transition-colors hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Yêu cầu của tôi
        </Link>
        <div className="flex items-center gap-2">
          {data.canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              leftIcon={<XCircle className="h-4 w-4" />}
              className="border border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 dark:border-coral-700/40 dark:text-coral-300 dark:hover:bg-coral-900/30"
            >
              Hủy yêu cầu
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <header className={CARD}>
        <div className="flex flex-wrap items-center gap-1.5">
          <RequestStatusBadge status={data.status} />
          <RequestTypeBadge type={data.requestType} />
        </div>
        <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-plum-900 dark:text-white sm:text-2xl">{data.title}</h1>
        <p className="mt-2 text-xs text-plum-500 dark:text-[#b0b3b8]">
          Tạo lúc {formatDateTime(data.createdAt)}
          {data.industryName ? ` · Ngành ${data.industryName}` : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <section className="space-y-3">
            <div>
              <h2 className="font-display text-base font-bold text-plum-900 dark:text-white">
                Phản hồi từ Mentor ({mentorResponses.length})
              </h2>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
                {isDirect
                  ? 'Yêu cầu được gửi riêng cho Mentor bạn chọn.'
                  : 'Yêu cầu được gửi tới mọi Mentor; Mentor cùng ngành được xếp lên trước.'}
              </p>
            </div>

            {mentorResponses.length === 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="Chưa có Mentor nhận yêu cầu"
                description="Hệ thống sẽ thông báo khi có Mentor phù hợp. Bạn cũng có thể chủ động tìm và gửi yêu cầu trực tiếp."
                action={
                  <ButtonLink to="/app/mentoring/discover" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                    Khám phá Mentor
                  </ButtonLink>
                }
              />
            ) : (
              <>
                {primaryResponses.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-plum-900/15 px-4 py-5 text-center text-sm text-plum-500 dark:border-white/15 dark:text-[#b0b3b8]">
                    Chưa có Mentor cùng ngành hoặc Mentor nào đồng ý. Xem danh sách Mentor khác bên dưới.
                  </p>
                )}
                {primaryResponses.map((response) => (
                  <MentorResponseCard key={`${response.mentorProfileId}-${response.distributedAt}`} response={response} />
                ))}

                {otherResponses.length > 0 && (
                  <div className="rounded-2xl border border-plum-900/[0.08] bg-white dark:border-white/10 dark:bg-[#242526]">
                    <button
                      type="button"
                      onClick={() => setShowOtherMentors((v) => !v)}
                      aria-expanded={showOtherMentors}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-plum-900 dark:text-white">
                          Mentor khác đã nhận yêu cầu ({otherResponses.length})
                        </span>
                        <span className="block text-xs text-plum-500 dark:text-[#b0b3b8]">
                          Khác ngành, chưa phản hồi. Mentor nào đồng ý sẽ được đưa lên danh sách chính.
                        </span>
                      </span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-plum-400 transition-transform', showOtherMentors && 'rotate-180')} />
                    </button>
                    {showOtherMentors && (
                      <div className="space-y-3 border-t border-plum-900/[0.06] p-3 dark:border-white/10">
                        {otherResponses.map((response) => (
                          <MentorResponseCard key={`${response.mentorProfileId}-${response.distributedAt}`} response={response} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <section className={CARD}>
            <h2 className="font-display text-base font-bold text-plum-900 dark:text-white">Nội dung yêu cầu</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-plum-800 dark:text-[#e4e6eb]">
              {data.description}
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Fact icon={<Briefcase />} label="Nhu cầu hỗ trợ" value={taskLabel} />
              <Fact icon={<Coins />} label="Ngân sách" value={formatBudget(data.budgetMin, data.budgetMax)} />
              <Fact
                icon={<Laptop />}
                label="Hình thức làm việc"
                value={data.workingMode ? WORKING_MODE_LABELS[data.workingMode] : 'Linh hoạt'}
              />
              <Fact
                icon={<Users />}
                label="Hình thức tham gia"
                value={data.participationType ? PARTICIPATION_TYPE_LABELS[data.participationType] : 'Cá nhân'}
              />
              {data.expectedDeadline && (
                <Fact icon={<CalendarClock />} label="Hạn chót mong muốn" value={formatDateTime(data.expectedDeadline)} />
              )}
            </dl>

            {data.attachments && data.attachments.length > 0 && (
              <div className="mt-5 border-t border-plum-900/[0.06] pt-4 dark:border-white/10">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-plum-800 dark:text-[#e4e6eb]">
                  <Paperclip className="h-4 w-4 text-plum-400" />
                  Tài liệu đính kèm ({data.attachments.length})
                </h3>
                <ul className="mt-2.5 space-y-2">
                  {data.attachments.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-cream-300 px-3 py-2.5 transition-colors hover:border-brand-500/40 hover:bg-cream-100 dark:border-white/10 dark:hover:bg-white/[0.04]"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm text-plum-800 dark:text-[#e4e6eb]">
                          <span className="truncate font-medium">{file.fileName}</span>
                          {file.fileSize ? <span className="shrink-0 text-xs text-plum-400">{formatFileSize(file.fileSize)}</span> : null}
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-plum-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <RequestResponseSummaryCard
            requestType={data.requestType}
            summary={data.responseSummary}
            targetMentorName={data.targetMentorName}
            directMentorStatus={data.directMentorResponseStatus}
          />

          {data.group && (
            <section className={CARD}>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-plum-900 dark:text-white">
                <Users className="h-4 w-4 text-brand-600" />
                {data.group.name}
              </h2>
              <p className="mt-1 text-xs text-plum-500 dark:text-[#b0b3b8]">
                {activeMembers.length}/{data.group.maxMembers} thành viên · cùng tham gia trao đổi với Mentor
              </p>
              <div className="mt-3 flex -space-x-2">
                {activeMembers.slice(0, 8).map((member) => (
                  <span key={member.userId} title={`${member.fullName}${member.leader ? ' · Trưởng nhóm' : ''}`}>
                    <Avatar
                      src={member.avatarUrl || undefined}
                      name={member.fullName}
                      size={32}
                      className="ring-2 ring-white dark:ring-[#242526]"
                    />
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className={CARD}>
            <h2 className="text-sm font-semibold text-plum-900 dark:text-white">Lưu ý</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
              <li>• Mentor "đồng ý" chỉ là đồng ý trao đổi, chưa phải thỏa thuận.</li>
              <li>• Task được tạo sau khi hai bên chốt thỏa thuận và bạn thanh toán.</li>
              <li>• Chưa có phản hồi sau 48 giờ? Hãy tìm Mentor khác hoặc tạo yêu cầu mới.</li>
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ButtonLink to="/app/mentoring/discover" variant="outline" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                Tìm Mentor
              </ButtonLink>
              <ButtonLink to="/app/mentoring/requests/create" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Yêu cầu mới
              </ButtonLink>
            </div>
          </section>
        </aside>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Hủy yêu cầu này?"
        message="Các trao đổi với Mentor sẽ chuyển sang chỉ đọc và Mentor không thể phản hồi thêm."
        confirmText="Hủy yêu cầu"
        cancelText="Giữ lại"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}

/**
 * Trang Chi tiết Yêu cầu Mentoring & Xem phản hồi từ Mentor (UC102 — View Mentoring Request Responses).
 * Tích hợp bảo vệ bởi MentoringTermsGate và AppShell.
 */
export function MentoringRequestDetailPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringRequestDetailContent />
      </MentoringTermsGate>
    </Container>
  )
}
