import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { Container, Button, EmptyState } from '@/components/ui'
import {
  MentoringTermsGate,
  MentoringTaskBadge,
  MentoringTaskStageBadge,
  MentoringTaskStageProgressBar,
  MentoringTaskOverviewCard,
  MentoringTaskParticipantsCard,
  MentoringTaskDealSection,
  MentoringTaskPaymentCard,
  MentoringWorkLogList,
  MentoringWorkLogModal,
  MentoringTaskHistoryTimeline,
  useTaskDetail,
  type MentoringWorkLog,
} from '@/features/mentorship'

/**
 * Trang chi tiết toàn diện Mentoring Task (UC106) & Quản lý Work Log (UC107).
 */
function MentoringTaskDetailContent() {
  const { id } = useParams<{ id: string }>()
  const taskId = id ? parseInt(id, 10) : undefined
  const navigate = useNavigate()

  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false)
  const [selectedEditingLog, setSelectedEditingLog] = useState<MentoringWorkLog | null>(null)

  const { data: taskDetail, isLoading, isError, error, refetch, isFetching } = useTaskDetail(taskId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-40 rounded-3xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-3xl bg-muted animate-pulse" />
            <div className="h-64 rounded-3xl bg-muted animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 rounded-3xl bg-muted animate-pulse" />
            <div className="h-48 rounded-3xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !taskDetail) {
    return (
      <EmptyState
        title="Không tìm thấy nhiệm vụ"
        description={
          error?.message ||
          'Nhiệm vụ không tồn tại hoặc bạn không có quyền truy cập vào thông tin nhiệm vụ này.'
        }
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/app/mentoring/tasks')}
              className="rounded-2xl"
            >
              Quay lại danh sách
            </Button>
            <Button onClick={() => refetch()} className="rounded-2xl bg-teal-600 text-white">
              Thử lại
            </Button>
          </div>
        }
      />
    )
  }

  const detail = ((taskDetail as any)?.data ?? taskDetail) as Partial<typeof taskDetail> & Record<string, any>
  const overview = detail?.overview ?? {
    id: detail?.id ?? taskId ?? 0,
    taskTitle: detail?.taskTitle || 'Nhiệm vụ Mentoring',
    taskScope: detail?.taskScope || '',
    agreedPrice: detail?.agreedPrice || 0,
    status: detail?.status || 'PREPARATION',
    uiStage: detail?.uiStage || 'PREPARATION',
    progressPercentage: detail?.progressPercentage || 15,
    workingMode: detail?.workingMode || 'ONLINE',
    participationType: detail?.participationType || 'INDIVIDUAL',
    taskType: detail?.taskType || 'OTHER',
    startedAt: detail?.startedAt,
    deadline: detail?.deadline,
    completedAt: detail?.completedAt,
    daysRemaining: detail?.daysRemaining || 0,
    isOverdue: detail?.isOverdue || false,
    totalWorkLogs: detail?.totalWorkLogs || 0,
    confirmedWorkLogs: detail?.confirmedWorkLogs || 0,
    pendingWorkLogs: detail?.pendingWorkLogs || 0,
  }
  const deal = detail?.deal ?? null
  const student = detail?.student ?? null
  const mentor = detail?.mentor ?? null
  const conversationId = detail?.conversationId ?? null
  const payment = detail?.payment ?? null
  const workLogs = detail?.workLogs ?? []
  const history = detail?.history ?? []
  const permissions = detail?.permissions ?? {
    canAddWorkLog: false,
    canEditWorkLog: false,
    canConfirmWorkLog: false,
    isReadOnly: false,
    isStudent: false,
    isMentor: false,
    isDisputed: false,
  }

  const handleOpenAddLog = () => {
    setSelectedEditingLog(null)
    setIsWorkLogModalOpen(true)
  }

  const handleOpenEditLog = (log: MentoringWorkLog) => {
    setSelectedEditingLog(log)
    setIsWorkLogModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsWorkLogModalOpen(false)
    setSelectedEditingLog(null)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/app/mentoring/tasks')}
          className="group inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card border border-border/80 shadow-2xs group-hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>Danh sách nhiệm vụ Mentoring</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-2xl border-border bg-card/60 backdrop-blur-xs text-xs font-semibold gap-2 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Cập nhật</span>
          </Button>

          {conversationId && (
            <Button
              size="sm"
              onClick={() => navigate(`/app/mentoring/chats/${conversationId}`)}
              className="rounded-2xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold gap-1.5 shadow-sm shadow-teal-600/20"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Mở Chat for Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Task Header Card */}
      <div className="rounded-3xl border border-teal-200/50 bg-gradient-to-r from-teal-50/70 via-card to-sky-50/50 p-6 sm:p-8 shadow-xs dark:border-white/10 dark:from-teal-950/20 dark:via-[#242526] dark:to-sky-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-950/70 px-2.5 py-0.5 rounded-lg">
                Task #{overview.id}
              </span>
              <MentoringTaskStageBadge stage={overview.uiStage} />
              <MentoringTaskBadge status={overview.status} />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-plum-900 dark:text-[#f0f2f5] tracking-tight">
              {overview.taskTitle}
            </h1>
          </div>
        </div>

        {/* Stage Progress Bar Component */}
        <div className="pt-2">
          <MentoringTaskStageProgressBar
            currentStage={overview.uiStage}
            progressPercentage={overview.progressPercentage}
          />
        </div>
      </div>

      {/* Alert Notices (Read-Only / Disputed) */}
      {permissions.isReadOnly && overview.status === 'COMPLETED' && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-300 bg-teal-50/80 p-4 text-xs font-medium text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
          <div className="leading-relaxed">
            Nhiệm vụ này đã được <strong>hoàn thành thành công</strong>. Toàn bộ hồ sơ công việc, thỏa thuận và Work Log được bảo lưu ở chế độ chỉ đọc (Read-only).
          </div>
        </div>
      )}

      {permissions.isDisputed && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50/80 p-4 text-xs font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="leading-relaxed">
            Nhiệm vụ đang ở trạng thái <strong>Khiếu nại / Tranh chấp (Disputed)</strong>. Các thao tác ghi nhận Work Log mới tạm thời bị khóa nhằm phục vụ đối soát và giải quyết tranh chấp.
          </div>
        </div>
      )}

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Task Overview, Work Logs, Task History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Task Overview */}
          <MentoringTaskOverviewCard overview={overview} />

          {/* Section 2: Work Logs (UC107 & UC108) */}
          <MentoringWorkLogList
            taskId={overview.id}
            workLogs={workLogs}
            canAddWorkLog={permissions.canAddWorkLog}
            canConfirmWorkLog={permissions.canConfirmWorkLog}
            isStudent={permissions.isStudent}
            onAddWorkLog={handleOpenAddLog}
            onEditWorkLog={handleOpenEditLog}
          />

          {/* Section 3: Task History (Audit Trail) */}
          <MentoringTaskHistoryTimeline history={history} />
        </div>

        {/* Right Column (1/3): Participants, Deal Summary, Payment */}
        <div className="space-y-8">
          {/* Participants */}
          {(student || mentor) && (
            <MentoringTaskParticipantsCard student={student} mentor={mentor} />
          )}

          {/* Deal Summary */}
          {deal && <MentoringTaskDealSection deal={deal} conversationId={conversationId} />}

          {/* Payment Summary */}
          {payment && (
            <MentoringTaskPaymentCard
              payment={payment}
              agreedPrice={deal?.agreedPrice ?? overview?.agreedPrice}
            />
          )}
        </div>
      </div>

      {/* Modal Add / Edit Work Log (UC107) */}
      <MentoringWorkLogModal
        isOpen={isWorkLogModalOpen}
        onClose={handleCloseModal}
        taskId={overview.id}
        editingLog={selectedEditingLog}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

/**
 * Trang chi tiết nhiệm vụ Mentoring Task (UC106).
 */
export function MentoringTaskDetailPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringTaskDetailContent />
      </MentoringTermsGate>
    </Container>
  )
}

export default MentoringTaskDetailPage
