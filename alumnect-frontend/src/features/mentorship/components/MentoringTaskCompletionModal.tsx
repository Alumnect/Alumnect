import { useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  X,
  FileCheck2,
  AlertCircle,
  Loader2,
  Link2,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, DialogFrame } from '@/components/ui'
import { useSubmitTaskCompletion } from '../hooks/useMentoringTaskCompletion'

interface MentoringTaskCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  taskTitle?: string
  onSuccess?: () => void
}

export function MentoringTaskCompletionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onSuccess,
}: MentoringTaskCompletionModalProps) {
  const { t } = useTranslation()
  const [finalSummary, setFinalSummary] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [attachmentUrls, setAttachmentUrls] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const submitMutation = useSubmitTaskCompletion(taskId)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!finalSummary.trim()) {
      setErrorMsg(t('mentoring.summaryRequired'))
      return
    }

    if (finalSummary.trim().length < 10) {
      setErrorMsg(t('mentoring.summaryMinLength'))
      return
    }

    const urls = attachmentUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    try {
      await submitMutation.mutateAsync({
        finalSummary: finalSummary.trim(),
        deliverables: deliverables.trim() || undefined,
        attachmentUrls: urls.length > 0 ? urls : undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          t('mentoring.submitCompletionError')
      )
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
            <div className="p-2.5 rounded-xl bg-success text-text-inverse shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                {t('mentoring.submitTaskCompletionTitle')}
              </h3>
              <p className="text-xs text-text-subtle mt-0.5">
                {taskTitle ? t('mentoring.submitTaskSubtitleFormat', { title: taskTitle }) : t('mentoring.submitTaskDefaultSubtitle')}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 bg-surface text-text">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger-soft border border-danger-border rounded-xl text-danger text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 bg-info-soft border border-info rounded-xl text-xs text-info leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{t('mentoring.acceptanceProcessTitle')}</span> {t('mentoring.acceptanceProcessDesc')}
            </div>
          </div>

          {/* Field: Final Summary */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              {t('mentoring.finalSummaryLabel')} <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={finalSummary}
              onChange={(e) => setFinalSummary(e.target.value)}
              placeholder={t('mentoring.finalSummaryPlaceholder')}
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none shadow-sm"
            />
            <p className="text-xs text-text-subtle mt-1">
              {t('mentoring.finalSummaryHelp')}
            </p>
          </div>

          {/* Field: Deliverables */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              {t('mentoring.deliverablesLabel')}
            </label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder={t('mentoring.deliverablesPlaceholder')}
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none shadow-sm"
            />
          </div>

          {/* Field: Attachment URLs */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-info" />
              {t('mentoring.attachmentUrlsLabel')}
            </label>
            <textarea
              rows={2}
              value={attachmentUrls}
              onChange={(e) => setAttachmentUrls(e.target.value)}
              placeholder="https://drive.google.com/file/...&#10;https://github.com/..."
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none font-mono text-xs shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-on-primary bg-primary-solid hover:bg-primary-hover rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('mentoring.submittingBtn')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('mentoring.submitDeliverablesBtn')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogFrame>
}
