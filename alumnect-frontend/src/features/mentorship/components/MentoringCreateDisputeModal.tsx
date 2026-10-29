import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Send,
  Plus,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, SelectDropdown, DialogFrame } from '@/components/ui'
import { useCreateDisputeTicket } from '../hooks/useMentoringTickets'
import type { TicketEvidencePayload } from '../model/mentoringTaskTypes'

interface MentoringCreateDisputeModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  taskTitle?: string
  /**
   * True nếu người mở khiếu nại là Bên tạo yêu cầu (Requester - có thể là Học viên hoặc Mentor khác thuê hướng dẫn)
   * False nếu là Bên thực hiện (Performer / Mentor được thuê)
   */
  isRequester?: boolean
  /** Alias cho isRequester để đảm bảo tương thích ngược */
  isStudent?: boolean
  onSuccess?: () => void
}

/** Danh mục lý do dành cho Bên tạo yêu cầu (Requester - Học viên hoặc Mentor thuê hướng dẫn) */
const REQUESTER_DISPUTE_REASONS = [
  { value: 'SUBSTANDARD_DELIVERABLE', labelKey: 'mentoring.reasonSubstandard' },
  { value: 'MISSED_DEADLINE', labelKey: 'mentoring.reasonMissedDeadline' },
  { value: 'UNRESPONSIVE', labelKey: 'mentoring.reasonUnresponsive' },
  { value: 'UNREASONABLE_DEMAND', labelKey: 'mentoring.reasonUnreasonableDemand' },
  { value: 'DISAGREE_SETTLEMENT', labelKey: 'mentoring.reasonDisagreeSettlement' },
  { value: 'OTHER', labelKey: 'mentoring.reasonOther' },
]

/** Danh mục lý do dành cho Bên thực hiện (Performer - Mentor nhận hướng dẫn / thực hiện Task) */
const PERFORMER_DISPUTE_REASONS = [
  { value: 'STUDENT_UNRESPONSIVE', labelKey: 'mentoring.reasonStudentUnresponsive' },
  { value: 'OUT_OF_SCOPE_DEMAND', labelKey: 'mentoring.reasonOutOfScopeDemand' },
  { value: 'UNPAID_ADDITIONAL_FEE', labelKey: 'mentoring.reasonUnpaidAdditionalFee' },
  { value: 'DISAGREE_SETTLEMENT', labelKey: 'mentoring.reasonDisagreeSettlement' },
  { value: 'STUDENT_MISCONDUCT', labelKey: 'mentoring.reasonStudentMisconduct' },
  { value: 'OTHER', labelKey: 'mentoring.reasonOther' },
]

export function MentoringCreateDisputeModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  isRequester,
  isStudent = false,
  onSuccess,
}: MentoringCreateDisputeModalProps) {
  const { t } = useTranslation()
  // Xác định vai trò: ưu tiên isRequester, fallback sang isStudent
  const isRequesterRole = isRequester !== undefined ? isRequester : isStudent
  const disputeReasons = isRequesterRole ? REQUESTER_DISPUTE_REASONS : PERFORMER_DISPUTE_REASONS
  const [title, setTitle] = useState('')
  const [disputeReason, setDisputeReason] = useState(disputeReasons[0].value)
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [desiredSolution, setDesiredSolution] = useState('')
  const [evidences, setEvidences] = useState<TicketEvidencePayload[]>([])
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('')
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDisputeReason(isRequesterRole ? REQUESTER_DISPUTE_REASONS[0].value : PERFORMER_DISPUTE_REASONS[0].value)
      setTitle('')
      setCustomReason('')
      setDescription('')
      setDesiredSolution('')
      setEvidences([])
      setErrorMsg(null)
    }
  }, [isOpen, isRequesterRole])

  const createDisputeMutation = useCreateDisputeTicket(taskId)

  if (!isOpen) return null

  const handleAddEvidence = () => {
    if (!newEvidenceUrl.trim()) return
    setEvidences([
      ...evidences,
      {
        title: newEvidenceTitle.trim() || t('mentoring.defaultEvidenceTitle'),
        fileUrl: newEvidenceUrl.trim(),
      },
    ])
    setNewEvidenceTitle('')
    setNewEvidenceUrl('')
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg(t('mentoring.disputeTitleRequired'))
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg(t('mentoring.disputeDescMinLength'))
      return
    }

    if (!desiredSolution.trim()) {
      setErrorMsg(t('mentoring.desiredResolutionRequired'))
      return
    }

    const finalReason = disputeReason === 'OTHER' && customReason.trim()
      ? customReason.trim()
      : disputeReason

    try {
      await createDisputeMutation.mutateAsync({
        title: title.trim(),
        disputeReason: finalReason,
        description: description.trim(),
        desiredSolution: desiredSolution.trim(),
        initialEvidences: evidences.length > 0 ? evidences : undefined,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        t('mentoring.createDisputeError')
      )
    }
  }

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
            <div className="p-2.5 rounded-xl bg-danger text-text-inverse shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">{t('mentoring.disputeModalTitle')}</h3>
              <p className="text-xs text-text-subtle">{t('mentoring.disputeModalSubtitle')}</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl border border-danger-border bg-danger-soft text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border text-xs">
              <span className="text-text-subtle">
                {t('mentoring.disputeRoleLabel')}
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                isRequesterRole 
                  ? 'bg-info-soft text-info' 
                  : 'bg-primary-soft text-primary-solid'
              }`}>
                {isRequesterRole ? t('mentoring.requesterRole') : t('mentoring.mentorRole')}
              </span>
            </div>

            {taskTitle && (
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-xs">
                <span className="text-text-subtle">{t('mentoring.disputeTaskLabel')}{' '}</span>
                <span className="font-semibold text-text">{taskTitle}</span>
              </div>
            )}

            {/* Tiêu đề */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {t('mentoring.disputeTitleLabel')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder={
                  isRequesterRole
                    ? t('mentoring.disputeTitlePlaceholderStudent')
                    : t('mentoring.disputeTitlePlaceholderMentor')
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition"
              />
            </div>

            {/* Lý do tranh chấp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {t('mentoring.disputeReasonLabel', {
                  role: isRequesterRole ? t('mentoring.requesterRole') : t('mentoring.mentorRole')
                })} <span className="text-danger">*</span>
              </label>
              <SelectDropdown
                value={disputeReason}
                onChange={(val) => setDisputeReason(String(val))}
                options={disputeReasons.map((r) => ({ value: r.value, label: t(r.labelKey) }))}
                placeholder={t('mentoring.selectReasonPlaceholder')}
                panelClassName="sm:max-w-none"
              />
              {disputeReason === 'OTHER' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('mentoring.enterSpecificReason')}
                  className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition"
                />
              )}
            </div>

            {/* Chi tiết nội dung */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {t('mentoring.disputeDescLabel')} <span className="text-danger">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                rows={4}
                placeholder={t('mentoring.disputeDescPlaceholder')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition resize-none"
              />
              <div className="text-right text-xs text-text-subtle">
                {t('mentoring.charCountLimit', { current: description.length, max: 3000 })}
              </div>
            </div>

            {/* Phương án mong muốn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {t('mentoring.desiredResolutionLabel')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={desiredSolution}
                onChange={(e) => setDesiredSolution(e.target.value)}
                maxLength={255}
                placeholder={
                  isRequesterRole
                    ? t('mentoring.desiredResolutionPlaceholderStudent')
                    : t('mentoring.desiredResolutionPlaceholderMentor')
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition"
              />
            </div>

            {/* Bằng chứng ban đầu (Evidence) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-surface-2">
              <span className="text-xs font-semibold text-text block">
                {t('mentoring.initialEvidence')}
              </span>

              {evidences.length > 0 && (
                <div className="space-y-2 mb-2">
                  {evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <LinkIcon className="w-3.5 h-3.5 text-info shrink-0" />
                        <span className="font-medium text-text truncate">{ev.title}</span>
                      </div>
                      <button aria-label={t('common.delete')}
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="text-text-subtle hover:text-danger p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  placeholder={t('mentoring.evidenceTitlePlaceholder')}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text"
                />
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder={t('mentoring.evidenceUrlPlaceholder')}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvidence}
                disabled={!newEvidenceUrl.trim()}
                className="h-7 text-xs w-full"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('mentoring.addEvidenceToList')}
              </Button>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 rounded-xl border border-warning-border bg-warning-soft text-warning text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{t('mentoring.disputeWarningTitle')}</p>
                <p className="text-xs leading-relaxed text-warning">
                  {t('mentoring.disputeWarningDesc')}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createDisputeMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createDisputeMutation.isPending}
                className="bg-danger hover:opacity-90 text-text-inverse font-semibold"
              >
                {createDisputeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('mentoring.creatingDispute')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('mentoring.confirmOpenDispute')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogFrame>
}

