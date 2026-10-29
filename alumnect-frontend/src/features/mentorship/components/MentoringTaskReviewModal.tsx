import { useState } from 'react'
import {
  CheckCircle2,
  X,
  FileCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  User,
  Clock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, DialogFrame } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import { useRespondTaskCompletion } from '../hooks/useMentoringTaskCompletion'
import type { MentoringTaskCompletion } from '../model/mentoringTaskTypes'

interface MentoringTaskReviewModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  completion: MentoringTaskCompletion
  onSuccess?: () => void
}

export function MentoringTaskReviewModal({
  isOpen,
  onClose,
  taskId,
  completion,
  onSuccess,
}: MentoringTaskReviewModalProps) {
  const { t } = useTranslation()
  const [feedbackNote, setFeedbackNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | null>(null)

  const respondMutation = useRespondTaskCompletion(taskId)

  if (!isOpen) return null

  const formattedDate = (() => {
    try {
      return format(parseISO(completion.createdAt), 'dd/MM/yyyy HH:mm')
    } catch {
      return completion.createdAt
    }
  })()

  const handleAction = async (accept: boolean) => {
    setErrorMsg(null)
    setActionType(accept ? 'ACCEPT' : 'REJECT')

    if (!accept && (!feedbackNote || !feedbackNote.trim())) {
      setErrorMsg(t('mentoring.revisionReasonRequired'))
      return
    }

    try {
      await respondMutation.mutateAsync({
        completionId: completion.id,
        payload: {
          accept,
          feedbackNote: feedbackNote.trim() || undefined,
        },
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          t('mentoring.reviewResponseError')
      )
    } finally {
      setActionType(null)
    }
  }

  if (typeof document === 'undefined') return null

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-xl"
      className="overflow-hidden flex flex-col"
    >
        {/* Header */}
        <div className="bg-surface-2 flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info text-text-inverse shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                {t('mentoring.reviewTaskCompletionTitle')}
              </h3>
              <p className="text-xs text-text-subtle mt-0.5">
                {t('mentoring.reviewTaskCompletionSubtitle')}
              </p>
            </div>
          </div>
          <button aria-label={t('common.close')}
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-subtle hover:text-text-muted rounded-lg hover:bg-surface-3 dark:hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-surface text-text">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger-soft border border-danger-border rounded-xl text-danger text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Timestamp Info */}
          <div className="flex items-center justify-between p-3.5 bg-surface-2 border border-border rounded-xl text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-info-soft text-info flex items-center justify-center font-semibold text-xs overflow-hidden">
                {completion.submittedBy?.avatarUrl ? (
                  <img src={completion.submittedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <span className="font-semibold text-text">{completion.submittedBy?.fullName || 'Mentor'}</span>
                <span className="text-xs text-text-subtle ml-1.5">{t('mentoring.mentorAdvisorRole')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-text-subtle">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-1.5">
            <h4 className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-info" />
              {t('mentoring.mentorResultSummaryTitle')}
            </h4>
            <p className="text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
              {completion.finalSummary}
            </p>
          </div>

          {/* Deliverables Card */}
          {completion.deliverables && (
            <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-xs font-semibold text-text">
                {t('mentoring.deliverablesCardTitle')}
              </h4>
              <p className="text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
                {completion.deliverables}
              </p>
            </div>
          )}

          {/* Attachments */}
          {completion.attachmentUrls && completion.attachmentUrls.length > 0 && (
            <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-text">
                {t('mentoring.attachmentsCardTitle')}
              </h4>
              <div className="space-y-1.5">
                {completion.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-surface hover:bg-info-soft text-xs text-info hover:text-info rounded-lg transition-colors border border-border"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Feedback note input */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              {t('mentoring.studentReviewInputLabel')}
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder={t('mentoring.studentReviewInputPlaceholder')}
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={respondMutation.isPending}
              onClick={() => handleAction(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs text-warning border-warning-border hover:bg-warning-soft rounded-xl flex items-center justify-center gap-1.5 font-semibold"
            >
              {actionType === 'REJECT' && respondMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              {t('mentoring.requestRevisionBtn')}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={respondMutation.isPending}
              >
                {t('common.close')}
              </Button>
              <Button
                type="button"
                disabled={respondMutation.isPending}
                onClick={() => handleAction(true)}
                className="px-5 py-2 text-xs font-semibold text-on-primary bg-primary-solid hover:bg-primary-hover rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
              >
                {actionType === 'ACCEPT' && respondMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('mentoring.processing')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t('mentoring.confirmTaskCompleteBtn')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogFrame>
}
