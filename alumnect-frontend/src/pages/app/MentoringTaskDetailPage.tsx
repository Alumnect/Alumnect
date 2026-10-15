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

  if (isError || !taskDetail || !taskDetail.overview) {
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
            <Button onClick={() => refetch()} className="rounded-2xl">
              Thử lại
            </Button>
          </div>
        }
      />
    )
  }

  const detail = taskDetail
  const overview = detail.overview
  const deal = detail.deal ?? null
  const student = detail.student ?? null
  const mentor = detail.mentor ?? null
  const conversationId = detail.conversationId ?? null
  const payment = detail.payment ?? null
  const workLogs = detail.workLogs ?? []
  const history = detail.history ?? []
  const permissions = detail.permissions ?? {
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

  const overdue = Boolean(overview.overdue ?? overview.isOverdue)

  return (
    <div className="space-y-6 pb-12">
      {/* Điều hướng & thao tác chính */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/mentoring/tasks')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted transition hover:text-primary-solid"
        >
          <ArrowLeft className="h-4 w-4" />
          Nhiệm vụ của tôi
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
            className="h-9 rounded-xl text-xs"
          >
            Cập nhật
          </Button>
          {conversationId && (
            <Button
              size="sm"
              onClick={() => navigate(`/app/mentoring/chats/${conversationId}`)}
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              className="h-9 rounded-xl text-xs"
            >
              Mở trao đổi
            </Button>
          )}
        </div>
      </div>

      {/* Tiêu đề Task & tiến độ */}
      <header className="rounded-3xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-surface-3 px-2 py-0.5 font-mono text-xs font-semibold text-text-muted">
            Task #{overview.id}
          </span>
          <MentoringTaskBadge status={overview.status} />
          {overdue && (
            <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
              Quá hạn
            </span>
          )}
        </div>
        <h1 className="mt-2 break-words font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          {overview.taskTitle}
        </h1>
        <div className="mt-5">
          <MentoringTaskStageProgressBar currentStage={overview.uiStage} progressPercentage={overview.progressPercentage} />
        </div>
      </header>

      {permissions.isReadOnly && overview.status === 'COMPLETED' && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Task đã hoàn thành. Toàn bộ thông tin và Work Log được lưu ở chế độ chỉ xem.
        </div>
      )}
      {permissions.isDisputed && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Task đang được Ban Quản Trị phân xử khiếu nại. Work Log mới tạm thời bị khóa.
        </div>
      )}

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: thông tin công việc, Work Log, lịch sử */}
        <div className="space-y-6 lg:col-span-2">
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

        {/* Cột phải: người tham gia, thỏa thuận, thanh toán */}
        <div className="space-y-6">
          {/* Participants */}
          {(student || mentor) && (
            <MentoringTaskParticipantsCard student={student} mentor={mentor} />
          )}

          {/* Deal Summary */}
          {deal && <MentoringTaskDealSection deal={deal} conversationId={conversationId} />}

          {/* Payment Summary */}
          {payment && <MentoringTaskPaymentCard payment={payment} />}
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
