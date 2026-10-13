import { useNavigate } from 'react-router-dom'
import { X, ClipboardCheck, CalendarDays, Wallet, Link2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton, Button } from '@/components/ui'
import { useTaskDetail } from '../hooks/useMentoringTasks'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_STATUS_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  formatVnd,
} from '../model/mentoringFlowLabels'

interface MentoringTaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId?: number | null
}

/**
 * Modal "Xem Task" trong Chat for Task (UC105 & UC106): hiển thị Mentoring Task đã kích hoạt sau thanh toán,
 * kèm liên kết truy ngược Request → Deal → Chat for Task và điều hướng sang trang quản lý toàn diện UC106 & UC107.
 */
export function MentoringTaskDetailModal({ isOpen, onClose, taskId }: MentoringTaskDetailModalProps) {
  const navigate = useNavigate()
  const { data: detail, isLoading, error } = useTaskDetail(taskId ?? undefined)

  if (!isOpen || !taskId) return null

  const formatDate = (value?: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '—')

  const overview = detail?.overview
  const deal = detail?.deal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 text-left space-y-5 max-h-[90vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-black text-plum-900 dark:text-[#f0f2f5]">Mentoring Task #{taskId}</h3>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              {overview ? MENTORING_TASK_STATUS_LABELS[overview.status] || overview.status : 'Đang tải...'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error || !detail || !overview ? (
          <p className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error?.message || 'Không thể tải thông tin Task.'}
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#b0b3b8]">Phạm vi công việc</p>
              <p className="mt-1 whitespace-pre-wrap text-plum-900 dark:text-[#f0f2f5]">{overview.taskScope}</p>
            </div>
            {deal && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#b0b3b8]">Kết quả kỳ vọng</p>
                <p className="mt-1 whitespace-pre-wrap text-plum-900 dark:text-[#f0f2f5]">{deal.expectedResult}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-plum-50/70 p-3 dark:bg-white/5">
                <p className="flex items-center gap-1 font-bold text-plum-500 dark:text-[#b0b3b8]">
                  <Wallet className="h-3.5 w-3.5" /> Giá đã thanh toán
                </p>
                <p className="mt-1 font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">{formatVnd(overview.agreedPrice)}</p>
              </div>
              <div className="rounded-2xl bg-plum-50/70 p-3 dark:bg-white/5">
                <p className="flex items-center gap-1 font-bold text-plum-500 dark:text-[#b0b3b8]">
                  <CalendarDays className="h-3.5 w-3.5" /> Deadline
                </p>
                <p className="mt-1 font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">{formatDate(overview.deadline)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                {MENTORING_TASK_TYPE_LABELS[overview.taskType] || overview.taskType}
              </span>
              <span className="rounded-full bg-plum-100 px-2.5 py-1 text-plum-700 dark:bg-white/10 dark:text-plum-200">
                {MENTORING_WORKING_MODE_LABELS[overview.workingMode] || overview.workingMode}
              </span>
              <span className="rounded-full bg-plum-100 px-2.5 py-1 text-plum-700 dark:bg-white/10 dark:text-plum-200">
                {MENTORING_PARTICIPATION_LABELS[overview.participationType] || overview.participationType}
              </span>
            </div>
            <div className="rounded-2xl border border-plum-900/[0.08] p-3 text-xs text-plum-600 dark:border-white/10 dark:text-[#b0b3b8] space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-plum-800 dark:text-[#e4e6eb]">
                <Link2 className="h-3.5 w-3.5" /> Truy vết nghiệp vụ
              </p>
              <p>Request #{detail.requestId ?? '—'}{detail.requestTitle ? ` · ${detail.requestTitle}` : ''}</p>
              <p>Deal #{detail.deal.id} → Task #{overview.id} · Chat for Task #{detail.conversationId ?? '—'}</p>
              <p>Kích hoạt lúc {formatDate(overview.startedAt)}</p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  onClose()
                  navigate(`/app/mentoring/tasks/${overview.id}`)
                }}
                className="w-full rounded-2xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold gap-2 py-2.5 shadow-sm shadow-teal-600/20"
              >
                <span>Mở trang chi tiết & Quản lý Work Log</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
