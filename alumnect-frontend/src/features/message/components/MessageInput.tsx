import { useState, useRef } from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, Send, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/components/ui'
import { chatApi } from '../api/chatApi'
import type { MediaType } from '../model/types'

interface PendingAttachment {
  mediaType: MediaType
  url: string
  fileName: string
  fileSize: number
}

interface MessageInputProps {
  onSendMessage: (content: string, attachments: PendingAttachment[]) => Promise<void>
  disabled?: boolean
  leftActions?: React.ReactNode
}

export function MessageInput({ onSendMessage, disabled, leftActions }: MessageInputProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messageInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploaded = await chatApi.uploadAttachment(file)
        setAttachments((prev) => [...prev, uploaded])
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('messages.uploadFailed', 'Tải tệp lên thất bại. Vui lòng thử lại.'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed && attachments.length === 0) return
    if (isSending || isUploading || disabled) return

    setIsSending(true)
    try {
      await onSendMessage(trimmed, attachments)
      setContent('')
      setAttachments([])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('messages.sendError', 'Không thể gửi tin nhắn. Vui lòng thử lại.'))
    } finally {
      setIsSending(false)
      window.setTimeout(() => messageInputRef.current?.focus(), 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-surface p-3">
      {/* Danh sách tệp đính kèm chờ gửi */}
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-xl border border-primary-soft-border bg-primary-soft px-2.5 py-1 text-xs text-primary-solid shadow-xs"
            >
              {att.mediaType === 'IMAGE' ? (
                <ImageIcon size={14} className="text-primary-solid" />
              ) : (
                <Paperclip size={14} className="text-primary-solid" />
              )}
              <span className="max-w-[140px] truncate font-medium">{att.fileName}</span>
              <button aria-label={t('common.close', 'Đóng')}
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="ml-1 rounded-full p-0.5 hover:bg-brand-200 text-primary-solid transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Thanh nhập liệu */}
      <div className="flex items-center gap-2">
        {/* Nút tải tệp/ảnh */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.md,.txt"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isSending || disabled}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending || disabled}
          aria-label={t('messages.attachFile', 'Đính kèm tệp')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-primary-solid" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        {/* Tiện ích mở rộng nghiệp vụ (ví dụ: Deal lại, tạo Deal Ticket) */}
        {leftActions}

        {/* Khung nhập văn bản */}
        <input
          aria-label={t('messages.typeMessage', 'Nhập tin nhắn...')}
          ref={messageInputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('messages.typeMessage', 'Nhập tin nhắn...')}
          disabled={isSending || disabled}
          className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-5 text-[15px] text-text placeholder:text-text-subtle transition-colors focus:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
        />

        {/* Nút gửi */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || isSending || isUploading || disabled}
          aria-label={t('messages.sendMessage', 'Gửi tin nhắn')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-solid text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {isSending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  )
}
