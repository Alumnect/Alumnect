import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Send,
} from 'lucide-react'
import { Button, DialogFrame } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import {
  useSettlementSnapshot,
  useSubmitSettlementTicket,
} from '../hooks/useMentoringTickets'

interface MentoringSubmitSettlementTicketModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  onSuccess?: () => void
}

export function MentoringSubmitSettlementTicketModal({
  isOpen,
  onClose,
  taskId,
  onSuccess,
}: MentoringSubmitSettlementTicketModalProps) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: snapshot, isLoading: isLoadingSnapshot, isError } = useSettlementSnapshot(taskId, isOpen)
  const submitTicketMutation = useSubmitSettlementTicket(taskId)

  if (!isOpen) return null

  const formatVnd = (amt?: number) => {
    if (typeof amt !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + 'đ'
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return format(parseISO(iso), 'dd/MM/yyyy HH:mm')
    } catch {
      return iso
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!snapshot || !snapshot.settlementProposalId) {
      setErrorMsg(t('mentoring.settlementInfoNotFound'))
      return
    }

    try {
      await submitTicketMutation.mutateAsync({
        proposalId: snapshot.settlementProposalId,
        note: note.trim() || undefined,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          t('mentoring.settlementTicketSendError')
      )
    }
  }

  const total = snapshot ? snapshot.totalBudget || snapshot.mentorAmount + snapshot.studentRefund : 0
  const mentorPercent = total > 0 && snapshot ? Math.round((snapshot.mentorAmount / total) * 100) : 0
  const studentPercent = 100 - mentorPercent

  if (typeof document === 'undefined') return null

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-lg"
      className="overflow-hidden flex flex-col"
    >
        {/* Header */}
        <div className="bg-surface-2 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info text-text-inverse shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">{t('mentoring.submitSettlementTicketTitle')}</h3>
              <p className="text-xs text-text-subtle">{t('mentoring.submitSettlementTicketSubtitle')}</p>
            </div>
          </div>
          <button aria-label={t('common.close')}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text-muted hover:bg-surface-3 dark:hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-surface text-text">
          {isLoadingSnapshot ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-subtle">
              <Loader2 className="w-8 h-8 animate-spin text-info" />
              <p className="text-sm">{t('mentoring.loadingSettlementSnapshot')}</p>
            </div>
          ) : isError || !snapshot ? (
            <div className="p-4 rounded-xl border border-danger-border bg-danger-soft text-danger text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('mentoring.cannotLoadSettlementSnapshot')}</p>
                <p className="text-xs mt-0.5">{t('mentoring.ensureBothAgreedNotice')}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl border border-danger-border bg-danger-soft text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Settlement Snapshot Box */}
              <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                    {t('mentoring.settlementAgreedReport')}
                  </span>
                  <span className="text-xs text-text-subtle">
                    {t('mentoring.agreedTime', { time: formatDt(snapshot.agreedAt) })}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-text-subtle">{t('mentoring.taskLabel')}</span>
                  <span className="font-semibold text-text">{snapshot.taskTitle}</span>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-info">
                      Mentor ({mentorPercent}%): {formatVnd(snapshot.mentorAmount)}
                    </span>
                    <span className="text-info">
                      {t('mentoring.requesterSplitLabel', { percent: studentPercent, amount: formatVnd(snapshot.studentRefund) })}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-info-soft rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-info transition duration-300"
                      style={{ width: `${mentorPercent}%` }}
                    />
                    <div
                      className="h-full bg-info transition duration-300"
                      style={{ width: `${studentPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-text-subtle">
                    {t('mentoring.totalBudgetLabel')}<strong>{formatVnd(total)}</strong>
                  </div>
                </div>

                {/* Lý do thỏa thuận */}
                <div className="p-3 rounded-lg bg-surface border border-border text-xs text-text space-y-1">
                  <span className="font-medium text-text-subtle block">{t('mentoring.unifiedReasonLabel')}</span>
                  <p className="italic">&ldquo;{snapshot.reason}&rdquo;</p>
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  {t('mentoring.extraNoteToAdminOptional')}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder={t('mentoring.extraNotePlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                />
                <div className="text-right text-xs text-text-subtle">
                  {t('mentoring.charCount', { count: note.length, defaultValue: `${note.length}/1000 ký tự` })}
                </div>
              </div>

              {/* Important Alert */}
              <div className="p-3.5 rounded-xl border border-warning-border bg-warning-soft text-warning text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-warning mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{t('mentoring.importantNoticeBeforeSubmit')}</p>
                  <p className="text-xs leading-relaxed text-warning">
                    {t('mentoring.settlementImportantNoticeDesc')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitTicketMutation.isPending}
                >
                  {t('common.cancel', 'Hủy bỏ')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitTicketMutation.isPending || !snapshot}
                  className="bg-primary-solid hover:bg-primary-hover text-on-primary font-semibold"
                >
                  {submitTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('mentoring.sendingTicket', 'Đang gửi Ticket...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('mentoring.confirmSendTicketToAdmin', 'Xác nhận gửi Ticket tới Admin')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogFrame>
}
