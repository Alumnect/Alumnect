import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Download, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageViewerModal } from '@/components/ui'
import type { Message } from '../model/types'

interface MessageBubbleProps {
  message: Message
  isMe: boolean
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; fileName?: string } | null>(null)

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : ''

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasText = message.content && message.content.trim().length > 0

  return (
    <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
      {/* 1. Phần đính kèm Media / File (Không có khung màu cam bọc ngoài giống Messenger) */}
      {hasAttachments && (
        <div className={cn('flex flex-col gap-1.5', isMe ? 'items-end' : 'items-start')}>
          {message.attachments.map((att) => {
            if (att.mediaType === 'IMAGE') {
              return (
                <div
                  key={att.id}
                  className="group relative max-w-[280px] overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-xs transition-transform hover:scale-[1.01] sm:max-w-sm"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ url: att.url, fileName: att.fileName })}
                    className="block w-full text-left cursor-zoom-in"
                  >
                    <img
                      src={att.url}
                      alt={att.fileName || 'Hình ảnh'}
                      className="max-h-80 w-auto rounded-2xl object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                      <ZoomIn size={22} className="text-white drop-shadow-md" />
                    </div>
                  </button>
                  {!hasText && (
                    <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      {formattedTime}
                    </span>
                  )}
                </div>
              )
            }

            if (att.mediaType === 'VIDEO') {
              return (
                <div
                  key={att.id}
                  className="relative max-w-[320px] overflow-hidden rounded-2xl border border-black/10 bg-black shadow-xs sm:max-w-md"
                >
                  <video
                    src={att.url}
                    controls
                    className="max-h-80 w-full rounded-2xl"
                  />
                  {!hasText && (
                    <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      {formattedTime}
                    </span>
                  )}
                </div>
              )
            }

            // Tệp tài liệu thông thường (PDF, Word, TXT...)
            return (
              <a
                key={att.id}
                href={att.url}
                download={att.fileName || 'tai-lieu'}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex max-w-[280px] items-center gap-3 rounded-2xl border border-plum-900/10 bg-white p-3 text-xs shadow-xs transition-all hover:bg-plum-900/[0.02] hover:shadow-sm sm:max-w-sm',
                  isMe ? 'rounded-br-xs' : 'rounded-bl-xs'
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-plum-900">{att.fileName || 'Tài liệu đính kèm'}</p>
                  <p className="text-[11px] text-plum-400">
                    {formatFileSize(att.fileSize)}
                    {!hasText && ` • ${formattedTime}`}
                  </p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-plum-400 hover:text-brand-600">
                  <Download size={16} />
                </span>
              </a>
            )
          })}
        </div>
      )}

      {/* 2. Bong bóng văn bản (chỉ hiện khi thực sự có chữ) */}
      {hasText && (
        <div
          className={cn(
            'max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs sm:max-w-[65%]',
            isMe
              ? 'rounded-br-xs bg-brand-600 text-white'
              : 'rounded-bl-xs border border-plum-900/10 bg-white text-plum-900'
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
          <div className={cn('mt-1 flex items-center justify-end text-[10px]', isMe ? 'text-white/75' : 'text-plum-400')}>
            <span>{formattedTime}</span>
          </div>
        </div>
      )}

      {/* Lightbox xem ảnh trực tiếp toàn màn hình giống Facebook Messenger */}
      {previewImage && (
        <ImageViewerModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          src={previewImage.url}
          fileName={previewImage.fileName}
          time={formattedTime}
        />
      )}
    </div>
  )
}
