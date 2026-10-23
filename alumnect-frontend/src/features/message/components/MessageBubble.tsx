import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Download, ZoomIn, Clock, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, ImageViewerModal } from '@/components/ui'
import type { Message } from '../model/types'
import { SharedPostBubbleCard } from './SharedPostBubbleCard'
import { SharedGroupBubbleCard } from './SharedGroupBubbleCard'
import { SharedGroupPostBubbleCard } from './SharedGroupPostBubbleCard'
import { parseAdjustmentMessage } from '@/features/mentorship/model/mentoringAdjustmentTypes'

interface MessageBubbleProps {
  message: Message
  isMe: boolean
  isGroup?: boolean
}

export function MessageBubble({ message, isMe, isGroup }: MessageBubbleProps) {
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

  const isSystemNotice = message.type
    ? message.type === 'SYSTEM'
    : !hasAttachments &&
      Boolean(
        message.content &&
          /^((\p{L}|\s)+) đã (tạo nhóm|thêm|xóa|rời|chuyển|đổi tên|cập nhật)/iu.test(
            message.content
          )
      )

  const adj = parseAdjustmentMessage(message.content)
  if (adj) {
    return (
      <div className={cn('my-2 flex w-full flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
        <div className="max-w-md overflow-hidden rounded-2xl border border-warning-border border-l-4 border-l-amber-500 bg-[#fdfaf5] p-3.5 text-xs text-text shadow-sm dark:bg-[#252422]">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-warning-border">
            <span className="font-heading font-black text-warning">
              TICKET YÊU CẦU ĐIỀU CHỈNH
            </span>
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning">
              v{adj.version}
            </span>
          </div>
          <div className="mt-2.5 rounded-xl border border-warning-border bg-warning-soft p-2.5 font-bold text-warning">
            "{adj.note}"
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-subtle">
            <span>{adj.senderName} yêu cầu điều chỉnh</span>
            {formattedTime && <span>{formattedTime}</span>}
          </div>
        </div>
      </div>
    )
  }

  if (isSystemNotice) {
    return (
      <div className="my-2 flex w-full flex-col items-center justify-center gap-1">
        {formattedTime && (
          <span className="text-xs font-medium text-text-subtle dark:text-text-subtle">{formattedTime}</span>
        )}
        <span className="rounded-full bg-surface-2 px-3.5 py-1 text-xs font-medium text-text-muted shadow-2xs">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex w-full gap-2 transition-opacity duration-200',
        isMe ? 'justify-end' : 'justify-start',
        isMe && message.status === 'sending' && 'opacity-70'
      )}
    >
      {/* Avatar người gửi nếu không phải là tin nhắn của mình */}
      {!isMe && (
        <div className="shrink-0 self-end mb-0.5">
          <Avatar src={message.senderAvatar || undefined} name={message.senderName} size={30} />
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[78%] sm:max-w-[65%]', isMe ? 'items-end' : 'items-start')}>
        {/* Tên người gửi trong nhóm */}
        {isGroup && !isMe && (
          <span className="text-xs font-semibold text-primary-solid px-1">
            {message.senderName}
          </span>
        )}

        {/* 1. Phần đính kèm Media / File */}
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
                      <span className={cn(
                        'pointer-events-none absolute bottom-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs',
                        isMe ? 'right-2' : 'left-2'
                      )}>
                        <span>{formattedTime}</span>
                        {isMe && message.status === 'sending' && <Clock size={10} className="animate-spin text-white/80" />}
                        {isMe && message.status === 'error' && <AlertCircle size={10} className="text-danger" />}
                        {isMe && (!message.status || message.status === 'sent') && <Check size={10} className="text-white/80" />}
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
                      <span className={cn(
                        'pointer-events-none absolute bottom-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs',
                        isMe ? 'right-3' : 'left-3'
                      )}>
                        <span>{formattedTime}</span>
                        {isMe && message.status === 'sending' && <Clock size={10} className="animate-spin text-white/80" />}
                        {isMe && message.status === 'error' && <AlertCircle size={10} className="text-danger" />}
                        {isMe && (!message.status || message.status === 'sent') && <Check size={10} className="text-white/80" />}
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
                    'flex max-w-[280px] items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-xs shadow-xs transition hover:bg-surface-2 sm:max-w-sm',
                    isMe ? 'rounded-br-xs' : 'rounded-bl-xs'
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">
                    <FileText size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-text">{att.fileName || 'Tài liệu đính kèm'}</p>
                    <p className="text-xs text-text-subtle">
                      {formatFileSize(att.fileSize)}
                      {!hasText && ` • ${formattedTime}`}
                    </p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-subtle hover:text-primary-solid">
                    <Download size={16} />
                  </span>
                </a>
              )
            })}
          </div>
        )}

        {/* 2. Bong bóng văn bản & bài viết chia sẻ */}
        {hasText && (() => {
          const POST_LINK_REGEX = /(?:https?:\/\/[^\s]+)?\/app\/posts\/(\d+)/
          const GROUP_POST_LINK_REGEX = /(?:https?:\/\/[^\s]+)?\/app\/groups\/(\d+)\?(?:[^\s]*&)?postId=(\d+)/
          const GROUP_LINK_REGEX = /(?:https?:\/\/[^\s]+)?\/app\/groups\/(\d+)(?:\?[^\s]*)?/

          const postMatch = message.content ? message.content.match(POST_LINK_REGEX) : null
          const groupPostMatch = !postMatch && message.content ? message.content.match(GROUP_POST_LINK_REGEX) : null
          const groupMatch = !postMatch && !groupPostMatch && message.content ? message.content.match(GROUP_LINK_REGEX) : null

          const sharedPostId = postMatch ? postMatch[1] : null
          const sharedGroupPost = groupPostMatch ? { groupId: groupPostMatch[1], postId: groupPostMatch[2] } : null
          const sharedGroupId = groupMatch ? groupMatch[1] : null

          const linkRegex = postMatch
            ? POST_LINK_REGEX
            : groupPostMatch
              ? GROUP_POST_LINK_REGEX
              : groupMatch
                ? GROUP_LINK_REGEX
                : null

          const noteText = message.content && linkRegex
            ? message.content.replace(linkRegex, '').trim()
            : message.content

          return (
            <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
              {noteText ? (
                <div
                  className={cn(
                    'w-fit rounded-2xl px-4 py-2.5 shadow-xs',
                    isMe
                      ? 'mentoring-chat-outgoing rounded-br-xs bg-primary-solid text-on-primary'
                      : 'rounded-bl-xs border border-border bg-surface text-text'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {noteText}
                  </p>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-xs',
                      isMe ? 'justify-end text-white/75' : 'justify-start text-text-subtle'
                    )}
                  >
                    <span>{formattedTime}</span>
                    {isMe && message.status === 'sending' && (
                      <span title="Đang gửi..." className="inline-flex items-center text-white/70">
                        <Clock size={11} className="animate-spin" />
                      </span>
                    )}
                    {isMe && message.status === 'error' && (
                      <span title="Gửi thất bại" className="inline-flex items-center text-rose-300">
                        <AlertCircle size={11} />
                      </span>
                    )}
                    {isMe && (!message.status || message.status === 'sent') && (
                      <span title="Đã gửi" className="inline-flex items-center text-white/70">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Render thẻ bài viết nhúng interactive nếu có liên kết bài viết bảng tin */}
              {sharedPostId && (
                <div className="relative">
                  <SharedPostBubbleCard postId={sharedPostId} isMe={isMe} />
                  {!noteText && (
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 px-1.5 text-xs font-medium',
                        isMe ? 'justify-end text-text-subtle' : 'justify-start text-text-subtle dark:text-text-subtle'
                      )}
                    >
                      <span>{formattedTime}</span>
                      {isMe && message.status === 'sending' && (
                        <span title="Đang gửi..." className="inline-flex items-center text-primary-solid">
                          <Clock size={11} className="animate-spin" />
                        </span>
                      )}
                      {isMe && message.status === 'error' && (
                        <span title="Gửi thất bại" className="inline-flex items-center text-danger">
                          <AlertCircle size={11} />
                        </span>
                      )}
                      {isMe && (!message.status || message.status === 'sent') && (
                        <span title="Đã gửi" className="inline-flex items-center text-success">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Render thẻ bài viết hội nhóm nhúng interactive nếu có liên kết bài viết nhóm */}
              {sharedGroupPost && (
                <div className="relative">
                  <SharedGroupPostBubbleCard
                    groupId={sharedGroupPost.groupId}
                    postId={sharedGroupPost.postId}
                    isMe={isMe}
                  />
                  {!noteText && (
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 px-1.5 text-xs font-medium',
                        isMe ? 'justify-end text-text-subtle' : 'justify-start text-text-subtle dark:text-text-subtle'
                      )}
                    >
                      <span>{formattedTime}</span>
                      {isMe && message.status === 'sending' && (
                        <span title="Đang gửi..." className="inline-flex items-center text-primary-solid">
                          <Clock size={11} className="animate-spin" />
                        </span>
                      )}
                      {isMe && message.status === 'error' && (
                        <span title="Gửi thất bại" className="inline-flex items-center text-danger">
                          <AlertCircle size={11} />
                        </span>
                      )}
                      {isMe && (!message.status || message.status === 'sent') && (
                        <span title="Đã gửi" className="inline-flex items-center text-success">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Render thẻ hội nhóm nhúng interactive nếu có liên kết hội nhóm */}
              {sharedGroupId && (
                <div className="relative">
                  <SharedGroupBubbleCard groupId={sharedGroupId} isMe={isMe} />
                  {!noteText && (
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 px-1.5 text-xs font-medium',
                        isMe ? 'justify-end text-text-subtle' : 'justify-start text-text-subtle dark:text-text-subtle'
                      )}
                    >
                      <span>{formattedTime}</span>
                      {isMe && message.status === 'sending' && (
                        <span title="Đang gửi..." className="inline-flex items-center text-primary-solid">
                          <Clock size={11} className="animate-spin" />
                        </span>
                      )}
                      {isMe && message.status === 'error' && (
                        <span title="Gửi thất bại" className="inline-flex items-center text-danger">
                          <AlertCircle size={11} />
                        </span>
                      )}
                      {isMe && (!message.status || message.status === 'sent') && (
                        <span title="Đã gửi" className="inline-flex items-center text-success">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Lightbox xem ảnh */}
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
    </div>
  )
}
