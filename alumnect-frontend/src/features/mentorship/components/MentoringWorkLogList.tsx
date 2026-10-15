import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  FileText,
  Paperclip,
  Plus,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  File,
  Image as ImageIcon,
  ExternalLink,
  RotateCcw,
  Loader2,
  X,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react'
import { Button, toast } from '@/components/ui'
import { Avatar } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { useConfirmWorkLog, useRejectWorkLog } from '../hooks/useMentoringTasks'
import type { MentoringWorkLog } from '../model/mentoringTaskTypes'

interface MentoringWorkLogListProps {
  taskId?: number
  workLogs: MentoringWorkLog[]
  canAddWorkLog?: boolean
  canConfirmWorkLog?: boolean
  isStudent?: boolean
  onAddWorkLog: () => void
  onEditWorkLog: (log: MentoringWorkLog) => void
}

export function MentoringWorkLogList({
  taskId = 0,
  workLogs,
  canAddWorkLog = false,
  canConfirmWorkLog = false,
  isStudent = false,
  onAddWorkLog,
  onEditWorkLog,
}: MentoringWorkLogListProps) {
  const [confirmingLog, setConfirmingLog] = useState<MentoringWorkLog | null>(null)
  const [rejectingLog, setRejectingLog] = useState<MentoringWorkLog | null>(null)
  const [expandedHistoryLogId, setExpandedHistoryLogId] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const confirmMutation = useConfirmWorkLog(taskId)
  const rejectMutation = useRejectWorkLog(taskId)

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const renderStatusBadge = (log: MentoringWorkLog) => {
    switch (log.status) {
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-400/40 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Chờ học viên xác nhận</span>
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-100/80 px-3 py-0.5 text-xs font-bold text-mint-800 ring-1 ring-mint-400/40 dark:bg-mint-950/40 dark:text-mint-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" />
            <span>Đã xác nhận nghiệm thu</span>
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-100/80 px-3 py-0.5 text-xs font-bold text-coral-800 ring-1 ring-coral-400/40 dark:bg-coral-950/40 dark:text-coral-300">
            <AlertCircle className="h-3.5 w-3.5 text-coral-600" />
            <span>Yêu cầu điều chỉnh</span>
          </span>
        )
    }
  }

  const handleConfirmSubmit = () => {
    if (!confirmingLog) return
    setActionError(null)

    confirmMutation.mutate(
      {
        workLogId: confirmingLog.id,
        payload: feedbackText.trim() ? { studentFeedback: feedbackText.trim() } : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã xác nhận nghiệm thu Work Log thành công!')
          setConfirmingLog(null)
          setFeedbackText('')
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Không thể xác nhận Work Log.'
          setActionError(msg)
          toast.error(msg)
        },
      }
    )
  }

  const handleRejectSubmit = () => {
    if (!rejectingLog) return
    const trimmed = feedbackText.trim()
    if (trimmed.length < 5) {
      setActionError('Vui lòng nhập lý do điều chỉnh tối thiểu 5 ký tự.')
      return
    }
    setActionError(null)

    rejectMutation.mutate(
      {
        workLogId: rejectingLog.id,
        payload: { studentFeedback: trimmed, reason: trimmed },
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu điều chỉnh tới Mentor!')
          setRejectingLog(null)
          setFeedbackText('')
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Không thể gửi yêu cầu điều chỉnh.'
          setActionError(msg)
          toast.error(msg)
        },
      }
    )
  }

  return (
    <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-plum-900 dark:text-white">
              Nhật ký công việc (Work Logs)
            </h4>
            <p className="text-xs text-plum-400 dark:text-[#8f9399]">
              {workLogs.length} bản ghi đã ghi nhận ({workLogs.filter((w) => w.status === 'PENDING_CONFIRMATION').length} chờ xác nhận)
            </p>
          </div>
        </div>

        {canAddWorkLog && (
          <Button
            size="sm"
            onClick={onAddWorkLog}
            leftIcon={<Plus className="h-4 w-4" />}
            className="rounded-xl shadow-xs"
          >
            Thêm Work Log
          </Button>
        )}
      </div>

      {/* Work Logs List or Empty State */}
      {workLogs.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-plum-900/[0.04] text-plum-400 dark:bg-white/5 dark:text-[#8f9399]">
            <FileText className="h-7 w-7" />
          </div>
          <h5 className="mt-4 text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
            Chưa có Work Log nào được ghi nhận
          </h5>
          <p className="mt-1 text-xs text-plum-400 dark:text-[#8f9399] max-w-sm mx-auto">
            {canAddWorkLog
              ? 'Hãy tạo Work Log đầu tiên để ghi lại tiến độ công việc và gửi cho học viên xác nhận nghiệm thu.'
              : 'Mentor sẽ sớm cập nhật nhật ký công việc tại đây để bạn tiện theo dõi và nghiệm thu.'}
          </p>
          {canAddWorkLog && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onAddWorkLog}
              leftIcon={<Plus className="h-4 w-4" />}
              className="mt-4 rounded-xl"
            >
              Tạo Work Log ngay
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {workLogs.map((log, index) => {
            const isLatest = index === 0
            const logNumber = workLogs.length - index
            const isHistoryOpen = expandedHistoryLogId === log.id

            // Student review eligibility check:
            const canStudentReview =
              log.canConfirm === true ||
              log.canReject === true ||
              ((isStudent || canConfirmWorkLog) && log.status === 'PENDING_CONFIRMATION')

            const hasAuditTrail =
              (log.feedbacks && log.feedbacks.length > 0) ||
              (log.revisions && log.revisions.length > 1)

            return (
              <div
                key={log.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all duration-200',
                  log.status === 'PENDING_CONFIRMATION'
                    ? 'border-amber-400/40 bg-amber-50/20 dark:border-amber-500/30 dark:bg-amber-950/10'
                    : log.status === 'CONFIRMED'
                    ? 'border-mint-300/60 bg-mint-50/10 dark:border-mint-800/40 dark:bg-mint-950/10'
                    : 'border-coral-300/60 bg-coral-50/15 dark:border-coral-800/40 dark:bg-coral-950/10'
                )}
              >
                {/* Log Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-plum-900/[0.05] dark:border-white/[0.05]">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-plum-900/[0.06] px-2.5 py-1 text-xs font-mono font-bold text-plum-700 dark:bg-white/10 dark:text-[#e4e6eb]">
                      Log #{logNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-plum-600 dark:text-[#e4e6eb]">
                      <Calendar className="h-3.5 w-3.5 text-brand-500" />
                      Ngày thực hiện: {formatDate(log.logDate)}
                    </span>
                    {log.revisionNumber && log.revisionNumber > 1 && (
                      <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-500 dark:bg-violet-600/40 dark:text-violet-300">
                        Phiên bản v{log.revisionNumber}
                      </span>
                    )}
                    {isLatest && (
                      <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-brand-700 dark:bg-brand-700/40 dark:text-brand-300">
                        Mới nhất
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(log)}

                    {log.canEdit && (
                      <button
                        type="button"
                        onClick={() => onEditWorkLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-plum-900/[0.08] px-2.5 py-1 text-xs font-bold text-plum-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:text-[#b0b3b8] dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
                        title="Chỉnh sửa nhật ký công việc"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Sửa</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Log Content Grid */}
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                      Mô tả tóm tắt
                    </span>
                    <p className="mt-1 font-bold text-plum-900 dark:text-white leading-relaxed">
                      {log.description}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-plum-900/[0.06] bg-cream-100/70 p-4 dark:border-white/10 dark:bg-[#18191a]">
                    <span className="block text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
                      Nội dung công việc hoàn thành
                    </span>
                    <p className="mt-1.5 whitespace-pre-line text-sm font-medium text-plum-800 dark:text-[#e4e6eb] leading-relaxed">
                      {log.workCompleted}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-plum-900/[0.06] bg-cream-100/70 p-4 dark:border-white/10 dark:bg-[#18191a]">
                    <span className="block text-xs font-bold uppercase tracking-wider text-plum-500 dark:text-[#8f9399]">
                      Kết quả & Sản phẩm đạt được
                    </span>
                    <p className="mt-1.5 whitespace-pre-line text-sm font-medium text-plum-800 dark:text-[#e4e6eb] leading-relaxed">
                      {log.result}
                    </p>
                  </div>

                  {log.nextAction && (
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                        Hành động tiếp theo
                      </span>
                      <p className="mt-1 text-xs text-plum-600 dark:text-[#8f9399] leading-relaxed">
                        {log.nextAction}
                      </p>
                    </div>
                  )}

                  {/* Attachments Section */}
                  {log.attachments && log.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
                        <Paperclip className="h-3.5 w-3.5" />
                        Tài liệu minh chứng đính kèm ({log.attachments.length})
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.attachments.map((att) => {
                          const isImage = att.mediaType === 'IMAGE' || att.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i)

                          return (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-2 rounded-xl border border-plum-900/[0.08] bg-white px-3 py-2 text-xs font-bold text-plum-700 shadow-2xs transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:bg-[#18191a] dark:text-[#e4e6eb] dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                            >
                              {isImage ? (
                                <ImageIcon className="h-4 w-4 text-brand-500 shrink-0" />
                              ) : (
                                <File className="h-4 w-4 text-violet-500 shrink-0" />
                              )}
                              <span className="truncate max-w-[180px]">{att.fileName}</span>
                              {att.fileSize && (
                                <span className="text-[11px] text-plum-400 dark:text-[#8f9399]">
                                  ({formatFileSize(att.fileSize)})
                                </span>
                              )}
                              <ExternalLink className="h-3 w-3 text-plum-400 opacity-60 group-hover:opacity-100" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Confirmed Notice / Evidence preservation */}
                  {log.status === 'CONFIRMED' && (
                    <div className="rounded-2xl border border-mint-300/60 bg-mint-50/70 p-4 text-xs text-mint-900 dark:border-mint-700/60 dark:bg-mint-950/40 dark:text-mint-200 flex items-start gap-3">
                      <ShieldCheck className="h-4 w-4 text-mint-600 dark:text-mint-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-mint-900 dark:text-mint-100">
                          Đã xác nhận nghiệm thu bởi {log.confirmedByName || 'Học viên'} {log.confirmedAt ? `lúc ${formatDateTime(log.confirmedAt)}` : ''}
                        </div>
                        {log.studentFeedback && (
                          <p className="mt-1.5 text-mint-800 dark:text-mint-200 whitespace-pre-line font-medium">
                            "{log.studentFeedback}"
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-mint-700/80 dark:text-mint-400/80">
                          Bản ghi này đã trở thành bằng chứng nghiệm thu được bảo vệ, Mentor không thể chỉnh sửa hoặc xóa bỏ.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clarification requested notice */}
                  {log.status === 'REJECTED' && (
                    <div className="rounded-2xl border border-coral-300/60 bg-coral-50/70 p-4 text-xs text-coral-900 dark:border-coral-700/60 dark:bg-coral-950/40 dark:text-coral-200 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-coral-600 dark:text-coral-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between text-coral-900 dark:text-coral-100">
                          <span>Yêu cầu điều chỉnh từ học viên</span>
                          <span className="text-[11px] font-normal text-coral-700/80 dark:text-coral-400/80">
                            Đang chờ Mentor bổ sung & gửi lại
                          </span>
                        </div>
                        {log.studentFeedback && (
                          <p className="mt-2 font-medium text-coral-900 dark:text-coral-100 whitespace-pre-line bg-white/80 dark:bg-black/30 p-3 rounded-xl border border-coral-200/60 dark:border-coral-800/40">
                            "{log.studentFeedback}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail / History toggler if feedbacks or revisions exist */}
                  {hasAuditTrail && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryLogId(isHistoryOpen ? null : log.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-plum-600 hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:text-brand-400 transition-colors"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Lịch sử phản hồi & các phiên bản sửa đổi ({log.feedbacks?.length || 0})</span>
                        {isHistoryOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {isHistoryOpen && (
                        <div className="mt-2.5 space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-xs">
                          {log.feedbacks?.map((fb) => (
                            <div key={fb.id} className="border-b border-border/50 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  {fb.action === 'CONFIRMED' ? 'Xác nhận nghiệm thu' : 'Yêu cầu điều chỉnh (v' + fb.revisionNumber + ')'}
                                </span>
                                <span>{formatDateTime(fb.createdAt)}</span>
                              </div>
                              {fb.reason && (
                                <p className="mt-1 text-foreground/90 italic">
                                  "{fb.reason}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* UC108: Student Action Bar (Visible if student can review this pending work log) */}
                {canStudentReview && (
                  <div className="mt-4 rounded-2xl border border-mint-300/80 bg-linear-to-r from-mint-50/90 via-mint-50/50 to-mint-50/90 p-4 shadow-2xs dark:border-mint-700/60 dark:from-mint-950/40 dark:via-[#1c2e2e] dark:to-mint-950/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h6 className="text-xs font-bold text-mint-900 dark:text-mint-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-mint-600 dark:text-mint-400 shrink-0" />
                          Học viên xác nhận nghiệm thu phần công việc này
                        </h6>
                        <p className="text-[11px] text-mint-700/90 dark:text-mint-300/90 mt-0.5">
                          Kiểm tra nội dung hoàn thành và tài liệu minh chứng để xác nhận nghiệm thu hoặc yêu cầu Mentor điều chỉnh.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingLog(log)
                            setConfirmingLog(null)
                            setFeedbackText('')
                            setActionError(null)
                          }}
                          className="rounded-xl border-coral-300 text-coral-700 hover:bg-coral-50 hover:border-coral-400 text-xs font-bold dark:border-coral-800 dark:text-coral-300 dark:hover:bg-coral-950/40"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1 text-coral-600" />
                          Yêu cầu điều chỉnh
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => {
                            setConfirmingLog(log)
                            setRejectingLog(null)
                            setFeedbackText('')
                            setActionError(null)
                          }}
                          className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs shadow-brand-600/30"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Xác nhận nghiệm thu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="mt-4 flex items-center justify-between border-t border-plum-900/[0.04] pt-3 text-[11px] text-plum-400 dark:border-white/[0.04] dark:text-[#8f9399]">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={log.mentorAvatar || undefined}
                      name={log.mentorName}
                      className="h-5 w-5 rounded-full"
                    />
                    <span>Ghi nhận bởi {log.mentorName}</span>
                  </div>
                  <span>Cập nhật: {formatDateTime(log.updatedAt || log.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingLog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-2xl space-y-4 dark:border-white/10 dark:bg-[#1f2022]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-plum-900/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-plum-900 dark:text-white">
                  Xác nhận nghiệm thu công việc
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingLog(null)}
                className="rounded-xl p-1.5 text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-3.5 text-mint-950 dark:border-mint-500/30 dark:bg-mint-500/10 dark:text-mint-200 leading-relaxed font-medium">
                Bạn xác nhận nội dung công việc Mentor đã ghi nhận là chính xác. <strong className="font-bold text-mint-900 dark:text-mint-100">Thao tác này không đồng nghĩa với việc xác nhận hoàn thành toàn bộ Mentoring Task.</strong>
              </div>

              <div className="rounded-2xl border border-plum-900/[0.06] bg-cream-100/80 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
                <p className="text-[11px] font-bold text-plum-400 dark:text-[#8f9399]">
                  Nhật ký công việc ngày <strong className="text-plum-800 dark:text-[#e4e6eb]">{formatDate(confirmingLog.logDate)}</strong>:
                </p>
                <p className="mt-1 font-bold text-plum-900 dark:text-white">
                  "{confirmingLog.description}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 dark:text-[#e4e6eb] mb-1.5">
                  Nhận xét phản hồi gửi Mentor (Tùy chọn):
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Ví dụ: Nội dung hoàn thành đúng hạn, hướng dẫn rất nhiệt tình và rõ ràng..."
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-2xl border border-plum-300 bg-cream-100 p-3 text-xs text-plum-900 placeholder:text-plum-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden dark:border-white/15 dark:bg-[#18191a] dark:text-[#e4e6eb] dark:placeholder:text-[#8f9399] transition-all"
                />
              </div>

              {actionError && (
                <div className="flex items-center gap-2 rounded-2xl border border-coral-200 bg-coral-50 p-3 text-xs font-bold text-coral-700 dark:border-coral-900/50 dark:bg-coral-950/40 dark:text-coral-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-plum-900/[0.06] dark:border-white/[0.06]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingLog(null)}
                disabled={confirmMutation.isPending}
                className="rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSubmit}
                disabled={confirmMutation.isPending}
                className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs shadow-brand-600/30"
              >
                {confirmMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Xác nhận nghiệm thu
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rejection / Adjustment Request Modal */}
      {rejectingLog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-2xl space-y-4 dark:border-white/10 dark:bg-[#1f2022]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-plum-900/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-100 text-coral-700 dark:bg-coral-950/50 dark:text-coral-300">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-plum-900 dark:text-white">
                  Yêu cầu Mentor điều chỉnh Work Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingLog(null)}
                className="rounded-xl p-1.5 text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 leading-relaxed font-medium">
                Vui lòng chỉ rõ lý do hoặc những phần kết quả cần bổ sung/chỉnh sửa để Mentor nắm bắt và cập nhật lại Work Log này.
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 dark:text-[#e4e6eb] mb-1.5">
                  Lý do / Hướng dẫn điều chỉnh <span className="text-coral-500">* (tối thiểu 5 ký tự)</span>:
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => {
                    setFeedbackText(e.target.value)
                    if (actionError) setActionError(null)
                  }}
                  placeholder="Ví dụ: Cần đính kèm thêm slide tài liệu hướng dẫn và cập nhật kết quả kiểm thử chức năng..."
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-2xl border border-plum-300 bg-cream-100 p-3 text-xs text-plum-900 placeholder:text-plum-400 focus:bg-white focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20 focus:outline-hidden dark:border-white/15 dark:bg-[#18191a] dark:text-[#e4e6eb] dark:placeholder:text-[#8f9399] transition-all"
                />
                <span className="mt-1 block text-right text-[11px] text-plum-400 dark:text-[#8f9399]">
                  {feedbackText.length}/2000 ký tự
                </span>
              </div>

              {actionError && (
                <div className="flex items-center gap-2 rounded-2xl border border-coral-200 bg-coral-50 p-3 text-xs font-bold text-coral-700 dark:border-coral-900/50 dark:bg-coral-950/40 dark:text-coral-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-plum-900/[0.06] dark:border-white/[0.06]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingLog(null)}
                disabled={rejectMutation.isPending}
                className="rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending || feedbackText.trim().length < 5}
                className="rounded-xl bg-coral-600 hover:bg-coral-700 text-white font-bold shadow-xs shadow-coral-600/30"
              >
                {rejectMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Gửi yêu cầu điều chỉnh
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
