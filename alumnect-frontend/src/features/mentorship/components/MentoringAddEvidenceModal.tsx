import React, { useState } from 'react'
import {
  FileText,
  X,
  AlertCircle,
  Loader2,
  Send,
  Link as LinkIcon,
  ExternalLink,
  ShieldAlert,
  Paperclip,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useTicketEvidences, useAddTicketEvidence } from '../hooks/useMentoringTickets'
import type { MentoringDisputeTicket } from '../model/mentoringTaskTypes'

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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
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
      setErrorMsg('Vui lòng nhập tiêu đề bằng chứng (ví dụ: Ảnh chụp màn hình trao đổi).')
      return
    }

    if (!fileUrl.trim()) {
      setErrorMsg('Vui lòng cung cấp đường dẫn hoặc URL tệp bằng chứng.')
      return
    }

    try {
      new URL(fileUrl.trim())
    } catch {
      setErrorMsg('Đường dẫn tệp phải là một URL hợp lệ (ví dụ: https://...).')
      return
    }

    try {
      await addEvidenceMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || undefined,
      })

      setSuccessMsg('Đã nộp bổ sung bằng chứng thành công!')
      setTitle('')
      setDescription('')
      setFileUrl('')
      setFileName('')

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể gửi bằng chứng. Vui lòng thử lại.'
      setErrorMsg(msg)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bằng chứng tranh chấp
                </h3>
                <span className="text-xs px-2 py-0.5 font-mono font-medium rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  {ticket.ticketCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                UC113 — Bổ sung tài liệu & chứng từ phục vụ Ban Quản Trị phân xử
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ticket Information Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tiêu đề khiếu nại
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {ticket.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {ticket.title}
            </p>
            {ticket.disputeReason && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Lý do: </span>
                {ticket.disputeReason}
              </p>
            )}
          </div>

          {/* Existing Evidences Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Danh sách bằng chứng đã nộp ({evidences.length})
              </h4>
            </div>

            {isLoadingEvidences ? (
              <div className="py-6 flex items-center justify-center text-sm text-slate-400">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tải danh sách bằng chứng...
              </div>
            ) : evidences.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Chưa có bằng chứng nào được tải lên cho Ticket này.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/70 hover:border-slate-300 transition space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {ev.title}
                        </span>
                        {ev.uploadedBy?.role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {ev.uploadedBy.role === 'MENTOR' ? 'Mentor' : 'Học viên'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(ev.createdAt)}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {ev.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 truncate">
                        Người gửi: {ev.uploadedBy?.fullName || 'N/A'}
                      </span>
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {ev.fileName || 'Xem tệp đính kèm'}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Submit Evidence (UC113) */}
          {isTicketClosed ? (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Ticket này đã kết thúc xử lý. Không thể gửi thêm bằng chứng mới.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Gửi thêm bằng chứng mới
                </h4>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu đề bằng chứng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Ảnh chụp màn hình thỏa thuận bàn giao, Logs tiến độ..."
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mô tả / Giải thích nội dung bằng chứng
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nêu rõ bằng chứng này minh họa cho vấn đề gì để BQT nắm bắt nhanh nhất..."
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Đường dẫn URL tệp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tên tệp hiển thị (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="VD: hop-dong-ban-giao.pdf"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={addEvidenceMutation.isPending}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    {addEvidenceMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang nộp...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Nộp bằng chứng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Bằng chứng tải lên sẽ được hiển thị cho cả hai bên và Ban Quản Trị.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs px-4 py-1.5"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
