import { useState, useRef } from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'
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
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    } catch (err: any) {
      toast.error(err?.message || 'Tải tệp lên thất bại. Vui lòng thử lại.')
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
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-plum-900/10 bg-white/80 p-3 backdrop-blur-md">
      {/* Danh sách tệp đính kèm chờ gửi */}
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/80 px-2.5 py-1 text-xs text-brand-700 shadow-xs"
            >
              {att.mediaType === 'IMAGE' ? (
                <ImageIcon size={14} className="text-brand-500" />
              ) : (
                <Paperclip size={14} className="text-brand-500" />
              )}
              <span className="max-w-[140px] truncate font-medium">{att.fileName}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="ml-1 rounded-full p-0.5 hover:bg-brand-200 text-brand-500 transition-colors"
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
          aria-label="Đính kèm tệp"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-plum-900/10 bg-plum-900/[0.03] text-plum-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-brand-500" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        {/* Khung nhập văn bản */}
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={isSending || disabled}
          className="h-11 flex-1 rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 text-sm text-plum-900 placeholder:text-plum-400 transition-colors focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50"
        />

        {/* Nút gửi */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || isSending || isUploading || disabled}
          aria-label="Gửi tin nhắn"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-brand-700 disabled:opacity-40 disabled:hover:scale-100"
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
