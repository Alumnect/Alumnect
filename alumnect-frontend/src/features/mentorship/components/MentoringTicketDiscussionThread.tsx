import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  User,
  GraduationCap,
  Scale,
  Clock,
  Paperclip,
  CheckCircle2,
  Eye,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useTicketMessages, useSendTicketMessage } from '../hooks/useMentoringTickets'
import { useAdminTicketMessages, useSendAdminTicketMessage } from '@/features/admin/hooks/useAdmin'
import type { MentoringTicketMessage, TicketEvidencePayload } from '../model/mentoringTaskTypes'

interface MentoringTicketDiscussionThreadProps {
  ticketId: number
  ticketStatus: string
  currentRole: 'ADMIN' | 'STUDENT' | 'MENTOR'
  studentName?: string
  mentorName?: string
  totalAmount?: number | null
}

export function MentoringTicketDiscussionThread({
  ticketId,
  ticketStatus,
  currentRole,
  studentName = 'Học viên',
  mentorName = 'Cố vấn',
  totalAmount = 0,
}: MentoringTicketDiscussionThreadProps) {
  const [content, setContent] = useState('')
  const [messageType, setMessageType] = useState<'TEXT' | 'MEDIATION_OFFER' | 'DEADLINE_REQUEST'>('TEXT')
  const [proposedMentorAmount, setProposedMentorAmount] = useState<number | ''>('')
  const [proposedStudentRefund, setProposedStudentRefund] = useState<number | ''>('')
  const [deadlineDays, setDeadlineDays] = useState<number>(2)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentTitle, setAttachmentTitle] = useState('')
  const [showAttachInput, setShowAttachInput] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Query dữ liệu: dùng hook admin hoặc user tùy vai trò
  const adminQuery = useAdminTicketMessages(currentRole === 'ADMIN' ? ticketId : null)
  const userQuery = useTicketMessages(currentRole !== 'ADMIN' ? ticketId : undefined)

  const messages: MentoringTicketMessage[] = (currentRole === 'ADMIN' ? adminQuery.data : userQuery.data) ?? []
  const isLoading = currentRole === 'ADMIN' ? adminQuery.isLoading : userQuery.isLoading

  const adminSendMutation = useSendAdminTicketMessage(currentRole === 'ADMIN' ? ticketId : null)
  const userSendMutation = useSendTicketMessage(currentRole !== 'ADMIN' ? ticketId : undefined)
  const isSending = adminSendMutation.isPending || userSendMutation.isPending

  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(ticketStatus)

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const formatVnd = (amt?: number | null) => {
    if (amt === null || amt === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt)
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung tin nhắn')
      return
    }

    if (messageType === 'MEDIATION_OFFER') {
      if (proposedMentorAmount === '' || proposedStudentRefund === '') {
        toast.error('Vui lòng nhập đầy đủ số tiền thù lao Mentor và hoàn trả Student')
        return
      }
    }

    const attachments: TicketEvidencePayload[] = []
    if (attachmentUrl.trim()) {
      attachments.push({
        title: attachmentTitle.trim() || 'Tài liệu trao đổi đính kèm',
        fileUrl: attachmentUrl.trim(),
        fileType: /\.(png|jpe?g|webp|gif)$/i.test(attachmentUrl.trim()) ? 'image/jpeg' : 'application/pdf',
      })
    }

    const deadline = messageType === 'DEADLINE_REQUEST'
      ? new Date(Date.now() + deadlineDays * 24 * 3600 * 1000).toISOString()
      : undefined

    const payload = {
      content: content.trim(),
      messageType,
      attachments: attachments.length > 0 ? attachments : undefined,
      proposedMentorAmount: typeof proposedMentorAmount === 'number' ? proposedMentorAmount : undefined,
      proposedStudentRefund: typeof proposedStudentRefund === 'number' ? proposedStudentRefund : undefined,
      deadline,
    }

    try {
      if (currentRole === 'ADMIN') {
        await adminSendMutation.mutateAsync(payload)
      } else {
        await userSendMutation.mutateAsync(payload)
      }
      setContent('')
      setAttachmentUrl('')
      setAttachmentTitle('')
      setShowAttachInput(false)
      if (messageType === 'MEDIATION_OFFER') {
        setProposedMentorAmount('')
        setProposedStudentRefund('')
      }
      setMessageType('TEXT')
      toast.success('Đã gửi tin nhắn trao đổi thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gửi tin nhắn thất bại')
    }
  }

  return (
    <div className="flex flex-col h-[560px] bg-surface-2 rounded-xl border border-border overflow-hidden">
      {/* 1. Header trao đổi */}
      <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-info-soft text-info flex items-center justify-center">
            <MessageSquare size={17} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text flex items-center gap-2">
              Kênh Trao Đổi & Hòa Giải 3 Bên
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-info border border-info">
                Audit Trail
              </span>
            </h4>
            <p className="text-xs text-text-subtle">
              Trao đổi minh bạch giữa Học viên, Cố vấn và Ban Quản Trị để tìm tiếng nói chung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-info-soft text-info text-xs font-medium border border-info">
            <User size={11} /> {studentName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-soft text-success text-xs font-medium border border-success-border">
            <GraduationCap size={11} /> {mentorName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-info-soft text-info text-xs font-medium border border-info">
            <ShieldCheck size={11} /> Admin
          </span>
        </div>
      </div>

      {/* 2. Message History Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-text-subtle gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-info" />
            <p className="text-xs">Đang tải lịch sử trao đổi...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-surface rounded-xl border border-dashed border-border-strong">
            <div className="h-12 w-12 rounded-full bg-info-soft text-info flex items-center justify-center mb-2">
              <MessageSquare size={22} />
            </div>
            <p className="text-sm font-bold text-text">Chưa có tin nhắn nào</p>
            <p className="text-xs text-text-subtle mt-1 max-w-sm">
              Đây là kênh trao đổi chính thức có lưu vết. Hãy gửi tin nhắn làm rõ vấn đề hoặc đưa ra đề xuất phân bổ tiền hòa giải.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdminMsg = msg.senderRole === 'ADMIN'
            const isStudentMsg = msg.senderRole === 'STUDENT'
            const isOffer = msg.messageType === 'MEDIATION_OFFER'
            const isDeadline = msg.messageType === 'DEADLINE_REQUEST'

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isAdminMsg
                    ? 'bg-info-soft border-info shadow-2xs'
                    : isStudentMsg
                    ? 'bg-info-soft border-info'
                    : 'bg-success-soft border-success-border'
                }`}
              >
                {/* Header message: Sender badge + timestamp */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-cream-300/60 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                        isAdminMsg ? 'bg-info' : isStudentMsg ? 'bg-info' : 'bg-success'
                      }`}
                    >
                      {isAdminMsg ? 'AD' : isStudentMsg ? 'HV' : 'CV'}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-text">
                        {msg.senderName}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[11px] font-semibold ${
                          isAdminMsg
                            ? 'bg-info-soft text-info'
                            : isStudentMsg
                            ? 'bg-info-soft text-info'
                            : 'bg-success-soft text-success'
                        }`}
                      >
                        {isAdminMsg ? 'Ban Quản Trị' : isStudentMsg ? 'Bên tạo yêu cầu' : 'Bên thực hiện (Mentor)'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-text-subtle whitespace-nowrap">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>

                {/* Offer Card nếu là MEDIATION_OFFER */}
                {isOffer && (
                  <div className="mb-2.5 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-violet-500/10 dark:from-violet-600/60 dark:to-violet-600/60 border border-violet-300 dark:border-violet-500">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Scale className="h-4 w-4 text-info" />
                      <span className="text-xs font-bold text-info uppercase tracking-wide">
                        Phương án hòa giải phân bổ tiền đề xuất
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-surface/80 p-2 rounded border border-info">
                        <span className="text-xs text-text-subtle block">Mentor nhận thù lao:</span>
                        <strong className="text-sm text-success font-bold">
                          {formatVnd(msg.proposedMentorAmount)}
                        </strong>
                      </div>
                      <div className="bg-surface/80 p-2 rounded border border-info">
                        <span className="text-xs text-text-subtle block">Bên tạo yêu cầu được hoàn:</span>
                        <strong className="text-sm text-info font-bold">
                          {formatVnd(msg.proposedStudentRefund)}
                        </strong>
                      </div>
                    </div>
                    {msg.deadline && (
                      <p className="text-xs text-info mt-2 flex items-center gap-1 font-medium">
                        <Clock size={12} /> Hạn chót phản hồi: <strong>{formatDateTime(msg.deadline)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Deadline Card nếu là DEADLINE_REQUEST */}
                {isDeadline && msg.deadline && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-warning-soft border border-warning-border flex items-center gap-2 text-xs text-warning">
                    <Clock className="h-4 w-4 text-warning shrink-0" />
                    <span>
                      Yêu cầu phản hồi / bổ sung hồ sơ trước: <strong>{formatDateTime(msg.deadline)}</strong>
                    </span>
                  </div>
                )}

                {/* Message Body Content */}
                <p className="text-xs text-text whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Attachments nếu có */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-cream-300/50 dark:border-white/10 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) => {
                      const isImg = (att.fileType?.startsWith('image') ?? false) || /\.(png|jpe?g|webp|gif)$/i.test(att.fileUrl)
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs shadow-2xs hover:border-plum-400 transition-colors"
                        >
                          {isImg ? (
                            <Eye size={12} className="text-info" />
                          ) : (
                            <FileText size={12} className="text-info" />
                          )}
                          <span className="font-medium text-xs text-text-muted max-w-[140px] truncate">
                            {att.title || att.fileName || 'Tệp đính kèm'}
                          </span>
                          {isImg ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(att.fileUrl)}
                              className="text-xs font-semibold text-info hover:underline ml-1"
                            >
                              Xem ảnh
                            </button>
                          ) : (
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-info hover:underline ml-1"
                            >
                              Mở
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Controls (Nếu vé đã đóng -> Chế độ Read-only) */}
      {isClosed ? (
        <div className="p-3 bg-surface-3 dark:bg-surface border-t border-border text-center shrink-0">
          <p className="text-xs text-text-subtle font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} className="text-success" />
            Vé đã được giải quyết hoặc kết thúc ({ticketStatus}). Kênh trao đổi được lưu trữ dưới dạng Chỉ đọc (Read-only).
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 bg-surface border-t border-border space-y-2.5 shrink-0 shadow-xs">
          {/* Action Tabs: Loại tin nhắn */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1 bg-surface-3 dark:bg-surface-2 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setMessageType('TEXT')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                  messageType === 'TEXT'
                    ? 'bg-surface text-text shadow-2xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Trao đổi
              </button>
              <button
                type="button"
                onClick={() => setMessageType('MEDIATION_OFFER')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors ${
                  messageType === 'MEDIATION_OFFER'
                    ? 'bg-info text-text-inverse shadow-2xs'
                    : 'text-info hover:text-info'
                }`}
              >
                <Scale size={12} /> Đề xuất hòa giải
              </button>
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setMessageType('DEADLINE_REQUEST')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors ${
                    messageType === 'DEADLINE_REQUEST'
                      ? 'bg-warning text-text-inverse shadow-2xs'
                      : 'text-warning hover:text-warning'
                  }`}
                >
                  <Clock size={12} /> Hạn chót phản hồi
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAttachInput(!showAttachInput)}
              className="text-xs text-text-muted hover:text-info flex items-center gap-1 font-medium transition-colors"
            >
              <Paperclip size={13} />
              {showAttachInput ? 'Đóng đính kèm' : 'Đính kèm tệp / link'}
            </button>
          </div>

          {/* Form phụ nếu chọn Đề xuất hòa giải */}
          {messageType === 'MEDIATION_OFFER' && (
            <div className="p-3 rounded-lg bg-info-soft border border-info space-y-2 text-xs">
              <div className="flex items-center justify-between text-xs text-info font-bold">
                <span>Phân bổ số tiền thỏa thuận:</span>
                {totalAmount && totalAmount > 0 && (
                  <span className="font-normal text-text-subtle">
                    Tổng quỹ bảo đảm: <strong>{formatVnd(totalAmount)}</strong>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-0.5">
                    Thù lao đề xuất cho Mentor (VND):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={proposedMentorAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value)
                      setProposedMentorAmount(val)
                      if (typeof val === 'number' && totalAmount && totalAmount >= val) {
                        setProposedStudentRefund(totalAmount - val)
                      }
                    }}
                    placeholder="ví dụ: 500000"
                    className="w-full px-2.5 py-1.5 rounded-md border border-border-strong bg-surface text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-0.5">
                    Hoàn tiền cho Bên tạo yêu cầu (VND):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={proposedStudentRefund}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value)
                      setProposedStudentRefund(val)
                      if (typeof val === 'number' && totalAmount && totalAmount >= val) {
                        setProposedMentorAmount(totalAmount - val)
                      }
                    }}
                    placeholder="ví dụ: 1000000"
                    className="w-full px-2.5 py-1.5 rounded-md border border-border-strong bg-surface text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form phụ nếu Admin chọn Hạn chót phản hồi */}
          {messageType === 'DEADLINE_REQUEST' && (
            <div className="p-2.5 rounded-lg bg-warning-soft border border-warning-border flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-warning">
                Thời hạn yêu cầu phản hồi:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDeadlineDays(days)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                      deadlineDays === days
                        ? 'bg-warning text-text-inverse border-warning'
                        : 'bg-surface text-text-muted border-border-strong'
                    }`}
                  >
                    {days} ngày
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form đính kèm file nếu bật */}
          {showAttachInput && (
            <div className="p-2.5 rounded-lg bg-surface-2 border border-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                value={attachmentTitle}
                onChange={(e) => setAttachmentTitle(e.target.value)}
                placeholder="Tiêu đề tài liệu/ảnh chứng từ..."
                className="px-2.5 py-1.5 rounded-md border border-border-strong bg-surface text-xs"
              />
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://... (URL ảnh chụp màn hình hoặc file)"
                className="px-2.5 py-1.5 rounded-md border border-border-strong bg-surface text-xs"
              />
            </div>
          )}

          {/* Ô nhập nội dung và nút gửi */}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                messageType === 'MEDIATION_OFFER'
                  ? 'Nêu căn cứ và giải thích cho đề xuất hòa giải phân bổ tiền này...'
                  : messageType === 'DEADLINE_REQUEST'
                  ? 'Nêu rõ thông tin hoặc bằng chứng cần các bên bổ sung trước thời hạn...'
                  : 'Nhập nội dung trao đổi, làm rõ hoặc giải trình...'
              }
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-border-strong bg-surface focus:outline-none focus:ring-2 focus:ring-info resize-none"
            />
            <Button
              type="submit"
              disabled={isSending || !content.trim()}
              className="h-10 px-4 bg-primary-solid hover:bg-primary-hover text-on-primary font-semibold rounded-xl shrink-0 shadow-sm flex items-center gap-1.5 text-xs"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Gửi</span>
            </Button>
          </div>
        </form>
      )}

      {/* Lightbox Xem ảnh phóng to */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-plum-900/80 backdrop-blur-xs dark:bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Evidence zoom"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}
