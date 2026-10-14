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
    <div className="flex flex-col h-[560px] bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* 1. Header trao đổi */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <MessageSquare size={17} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Kênh Trao Đổi & Hòa Giải 3 Bên (UC119)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Audit Trail
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trao đổi minh bạch giữa Học viên, Cố vấn và Ban Quản Trị để tìm tiếng nói chung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200">
            <User size={11} /> {studentName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
            <GraduationCap size={11} /> {mentorName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-medium border border-purple-200">
            <ShieldCheck size={11} /> Admin
          </span>
        </div>
      </div>

      {/* 2. Message History Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <p className="text-xs">Đang tải lịch sử trao đổi...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-2">
              <MessageSquare size={22} />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Chưa có tin nhắn nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
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
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-2xs'
                    : isStudentMsg
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                {/* Header message: Sender badge + timestamp */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        isAdminMsg ? 'bg-purple-600' : isStudentMsg ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                    >
                      {isAdminMsg ? 'AD' : isStudentMsg ? 'HV' : 'CV'}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {msg.senderName}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isAdminMsg
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : isStudentMsg
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {isAdminMsg ? 'Ban Quản Trị' : isStudentMsg ? 'Học viên' : 'Cố vấn'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>

                {/* Offer Card nếu là MEDIATION_OFFER */}
                {isOffer && (
                  <div className="mb-2.5 p-3 rounded-lg bg-gradient-to-r from-purple-100/90 to-indigo-100/90 dark:from-purple-950/60 dark:to-indigo-950/60 border border-purple-300 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Scale className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                        Phương án hòa giải phân bổ tiền đề xuất
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-purple-200 dark:border-purple-800">
                        <span className="text-[11px] text-slate-500 block">Mentor nhận thù lao:</span>
                        <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatVnd(msg.proposedMentorAmount)}
                        </strong>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-purple-200 dark:border-purple-800">
                        <span className="text-[11px] text-slate-500 block">Học viên được hoàn:</span>
                        <strong className="text-sm text-blue-600 dark:text-blue-400 font-bold">
                          {formatVnd(msg.proposedStudentRefund)}
                        </strong>
                      </div>
                    </div>
                    {msg.deadline && (
                      <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-2 flex items-center gap-1 font-medium">
                        <Clock size={12} /> Hạn chót phản hồi: <strong>{formatDateTime(msg.deadline)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Deadline Card nếu là DEADLINE_REQUEST */}
                {isDeadline && msg.deadline && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Yêu cầu phản hồi / bổ sung hồ sơ trước: <strong>{formatDateTime(msg.deadline)}</strong>
                    </span>
                  </div>
                )}

                {/* Message Body Content */}
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Attachments nếu có */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) => {
                      const isImg = (att.fileType?.startsWith('image') ?? false) || /\.(png|jpe?g|webp|gif)$/i.test(att.fileUrl)
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs hover:border-slate-400 transition-colors"
                        >
                          {isImg ? (
                            <Eye size={12} className="text-purple-600" />
                          ) : (
                            <FileText size={12} className="text-blue-600" />
                          )}
                          <span className="font-medium text-[11px] text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                            {att.title || att.fileName || 'Tệp đính kèm'}
                          </span>
                          {isImg ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(att.fileUrl)}
                              className="text-[11px] font-semibold text-purple-600 hover:underline ml-1"
                            >
                              Xem ảnh
                            </button>
                          ) : (
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:underline ml-1"
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
        <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Vé đã được giải quyết hoặc kết thúc ({ticketStatus}). Kênh trao đổi được lưu trữ dưới dạng Chỉ đọc (Read-only).
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0 shadow-xs">
          {/* Action Tabs: Loại tin nhắn */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMessageType('TEXT')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                  messageType === 'TEXT'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trao đổi
              </button>
              <button
                type="button"
                onClick={() => setMessageType('MEDIATION_OFFER')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors ${
                  messageType === 'MEDIATION_OFFER'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-700 hover:text-purple-900'
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
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <Clock size={12} /> Hạn chót phản hồi
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAttachInput(!showAttachInput)}
              className="text-xs text-slate-600 hover:text-purple-600 flex items-center gap-1 font-medium transition-colors"
            >
              <Paperclip size={13} />
              {showAttachInput ? 'Đóng đính kèm' : 'Đính kèm tệp / link'}
            </button>
          </div>

          {/* Form phụ nếu chọn Đề xuất hòa giải */}
          {messageType === 'MEDIATION_OFFER' && (
            <div className="p-3 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 font-bold">
                <span>Phân bổ số tiền thỏa thuận:</span>
                {totalAmount && totalAmount > 0 && (
                  <span className="font-normal text-slate-500">
                    Tổng quỹ bảo đảm: <strong>{formatVnd(totalAmount)}</strong>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Thù lao đề xuất cho Mentor (VND):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={proposedMentorAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value)
                      setProposedMentorAmount(val)
                      if (typeof val === 'number' && totalAmount && totalAmount >= val) {
                        setProposedStudentRefund(totalAmount - val)
                      }
                    }}
                    placeholder="ví dụ: 500000"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Hoàn tiền cho Học viên (VND):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={proposedStudentRefund}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value)
                      setProposedStudentRefund(val)
                      if (typeof val === 'number' && totalAmount && totalAmount >= val) {
                        setProposedMentorAmount(totalAmount - val)
                      }
                    }}
                    placeholder="ví dụ: 1000000"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form phụ nếu Admin chọn Hạn chót phản hồi */}
          {messageType === 'DEADLINE_REQUEST' && (
            <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
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
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 border-slate-300'
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
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                value={attachmentTitle}
                onChange={(e) => setAttachmentTitle(e.target.value)}
                placeholder="Tiêu đề tài liệu/ảnh chứng từ..."
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://... (URL ảnh chụp màn hình hoặc file)"
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
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
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <Button
              type="submit"
              disabled={isSending || !content.trim()}
              className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shrink-0 shadow-sm flex items-center gap-1.5 text-xs"
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
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
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
