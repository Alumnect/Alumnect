import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  X,
  AlertCircle,
  Loader2,
  Send,
  ExternalLink,
  ShieldAlert,
  Paperclip,
  CheckCircle2,
  ImagePlus,
  Trash2,
} from 'lucide-react'
import { Button, DialogFrame } from '@/components/ui'
import { useTicketEvidences, useAddTicketEvidence } from '../hooks/useMentoringTickets'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import type { MentoringDisputeTicket } from '../model/mentoringTaskTypes'

/** Bằng chứng tải lên: ảnh hoặc PDF, tối đa 10 MB */
const EVIDENCE_ACCEPT = 'image/*,application/pdf'
const EVIDENCE_MAX_SIZE = 10 * 1024 * 1024

interface UploadedEvidenceFile {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType?: string
}
import { MENTORING_TICKET_STATUS_LABELS } from '../model/mentoringFlowLabels'

/** Mã lý do khiếu nại (do form tạo ticket lưu) → khóa dịch. Lý do tự nhập (OTHER) giữ nguyên nội dung. */
const DISPUTE_REASON_KEYS: Record<string, string> = {
  SUBSTANDARD_DELIVERABLE: 'mentoring.reasonSubstandard',
  MISSED_DEADLINE: 'mentoring.reasonMissedDeadline',
  UNRESPONSIVE: 'mentoring.reasonUnresponsive',
  UNREASONABLE_DEMAND: 'mentoring.reasonUnreasonableDemand',
  DISAGREE_SETTLEMENT: 'mentoring.reasonDisagreeSettlement',
  STUDENT_UNRESPONSIVE: 'mentoring.reasonStudentUnresponsive',
  OUT_OF_SCOPE_DEMAND: 'mentoring.reasonOutOfScopeDemand',
  UNPAID_ADDITIONAL_FEE: 'mentoring.reasonUnpaidAdditionalFee',
  STUDENT_MISCONDUCT: 'mentoring.reasonStudentMisconduct',
  OTHER: 'mentoring.reasonOther',
}

interface MentoringAddEvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  ticket: MentoringDisputeTicket | null
  isStudent?: boolean
  onSuccess?: () => void
}

export function MentoringAddEvidenceModal({
  isOpen,
  onClose,
  taskId,
  ticket,
  isStudent: _isStudent,
  onSuccess,
}: MentoringAddEvidenceModalProps) {
  const { t } = useTranslation()
  const disputeReasonLabel = (code: string) => (DISPUTE_REASON_KEYS[code] ? t(DISPUTE_REASON_KEYS[code]) : code)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState<UploadedEvidenceFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const ticketId = ticket?.id
  const { data: evidences = [], isLoading: isLoadingEvidences } = useTicketEvidences(
    ticketId,
    isOpen && !!ticketId
  )

  const addEvidenceMutation = useAddTicketEvidence(taskId, ticketId || 0)

  if (!isOpen || !ticket) return null

  const isTicketClosed = ticket.status === 'RESOLVED' || ticket.status === 'REJECTED' || ticket.status === 'CANCELLED'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!title.trim()) {
      setErrorMsg(t('mentoring.evidenceTitleRequired'))
      return
    }

    if (!uploadedFile) {
      setErrorMsg(t('mentoring.evidenceFileRequired'))
      return
    }

    try {
      await addEvidenceMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileType: uploadedFile.fileType,
      })

      setSuccessMsg(t('mentoring.evidenceSubmittedSuccess'))
      setTitle('')
      setDescription('')
      setUploadedFile(null)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('mentoring.cannotSubmitEvidence')
      setErrorMsg(msg)
    }
  }

  // Chọn ảnh/PDF từ máy → tải lên kho tệp ngay, nộp bằng chứng dùng đường dẫn trả về
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrorMsg(null)
    setSuccessMsg(null)

    if (file.size > EVIDENCE_MAX_SIZE) {
      setErrorMsg(t('mentoring.evidenceFileTooLarge', { name: file.name }))
      return
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg(t('mentoring.evidenceFileInvalidType', { name: file.name }))
      return
    }

    setIsUploading(true)
    try {
      const res = await mentoringTaskApi.uploadWorkLogAttachment(file, 'mentoring_disputes')
      setUploadedFile({ fileUrl: res.fileUrl, fileName: file.name, fileSize: file.size, fileType: file.type || undefined })
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string }
      setErrorMsg(e2?.response?.data?.message || e2?.message || t('mentoring.uploadFileError'))
    } finally {
      setIsUploading(false)
    }
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  if (typeof document === 'undefined') return null

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-2xl"
      className="overflow-hidden flex flex-col"
    >
        {/* Header */}
        <div className="bg-surface-2 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning-soft text-warning rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text">
                  {t('mentoring.evidenceModalTitle')}
                </h3>
                <span className="text-xs px-2 py-0.5 tabular-nums font-medium rounded bg-warning-soft text-warning">
                  {ticket.ticketCode}
                </span>
              </div>
              <p className="text-xs text-text-subtle">
                {t('mentoring.evidenceModalSubtitle')}
              </p>
            </div>
          </div>
          <button aria-label={t('common.close')}
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-subtle hover:text-text-muted rounded-lg hover:bg-surface-3 dark:hover:bg-surface-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ticket Information Card */}
          <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle">
                {t('mentoring.disputeTitleLabel')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-soft text-warning">
                {MENTORING_TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-text">
              {ticket.title}
            </p>
            {ticket.disputeReason && (
              <p className="text-xs text-text-muted">
                <span className="font-medium text-text-muted">{t('mentoring.reasonLabel')} </span>
                {disputeReasonLabel(ticket.disputeReason)}
              </p>
            )}
          </div>

          {/* Existing Evidences Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                {t('mentoring.submittedEvidenceCount', { count: evidences.length })}
              </h4>
            </div>

            {isLoadingEvidences ? (
              <div className="py-6 flex items-center justify-center text-sm text-text-subtle">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('mentoring.loadingEvidenceList')}
              </div>
            ) : evidences.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-text-subtle">
                {t('mentoring.noEvidenceUploadedYet')}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-surface rounded-xl border border-border hover:border-border-strong transition space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-text truncate">
                          {ev.title}
                        </span>
                        {ev.uploadedBy?.role && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-surface-3 text-text-muted font-medium">
                            {ev.uploadedBy.role === 'MENTOR' ? t('mentoring.roleMentor') : t('mentoring.roleStudent')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-subtle whitespace-nowrap">
                        {formatDate(ev.createdAt)}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-text-muted line-clamp-2">
                        {ev.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-xs text-text-subtle truncate">
                        {t('mentoring.senderFullName', { name: ev.uploadedBy?.fullName || 'N/A' })}
                      </span>
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {ev.fileName || t('mentoring.viewAttachedFile')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Submit Evidence (UC113) */}
          {isTicketClosed ? (
            <div className="p-3.5 bg-surface-3 dark:bg-surface-2 text-text-muted rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-text-subtle flex-shrink-0" />
              <span>{t('mentoring.ticketClosedCannotAddEvidence')}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-warning-soft rounded-xl border border-warning-border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-warning flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  {t('mentoring.submitNewEvidenceHeading')}
                </h4>
              </div>

              {errorMsg && (
                <div className="p-3 bg-danger-soft border border-danger-border text-danger rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-success-soft border border-success-border text-success rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    {t('mentoring.evidenceTitleField')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('mentoring.evidenceTitlePlaceholder')}
                    className="w-full text-xs px-3 py-2 bg-surface border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    {t('mentoring.evidenceDescField')}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('mentoring.evidenceDescPlaceholder')}
                    className="w-full text-xs px-3 py-2 bg-surface border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    {t('mentoring.evidenceFileField')} <span className="text-danger">*</span>
                  </label>
                  {uploadedFile ? (
                    <div className="p-2 rounded-lg bg-surface border border-border-strong flex items-center justify-between gap-2 text-xs">
                      <a
                        href={uploadedFile.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 min-w-0 hover:underline"
                      >
                        {uploadedFile.fileType?.startsWith('image/') ? (
                          <img src={uploadedFile.fileUrl} alt={uploadedFile.fileName} className="w-10 h-10 rounded-md object-cover border border-border shrink-0" />
                        ) : (
                          <span className="w-10 h-10 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-info" />
                          </span>
                        )}
                        <span className="font-medium text-text truncate">{uploadedFile.fileName}</span>
                      </a>
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={() => setUploadedFile(null)}
                        className="text-text-subtle hover:text-danger p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-dashed border-border-strong bg-surface text-xs font-medium text-text-muted transition ${
                        isUploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-primary hover:text-primary'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t('mentoring.uploadingEvidence')}
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-3.5 h-3.5" />
                          {t('mentoring.uploadEvidenceBtn')}
                        </>
                      )}
                      <input
                        type="file"
                        accept={EVIDENCE_ACCEPT}
                        disabled={isUploading}
                        onChange={handleUploadFile}
                        className="sr-only"
                      />
                    </label>
                  )}
                  <p className="mt-1 text-xs text-text-subtle">{t('mentoring.uploadEvidenceHintSingle')}</p>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={addEvidenceMutation.isPending || isUploading}
                    className="text-xs bg-primary-solid hover:bg-primary-hover text-on-primary font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    {addEvidenceMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('mentoring.submittingEvidence')}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t('mentoring.submitEvidenceBtn')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-surface-2 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-subtle">
            {t('mentoring.evidencePublicNotice')}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs px-4 py-1.5"
          >
            {t('common.close')}
          </Button>
        </div>
      </DialogFrame>
}
