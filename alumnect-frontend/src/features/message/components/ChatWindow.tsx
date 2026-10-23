import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MessagesSquare, Users, Loader2, Info, Check, Trash2, ExternalLink, ChevronLeft } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { Avatar, Button, ConfirmModal, toast } from '@/components/ui'
import { MessageBubble, type BubblePosition } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { GroupInfoModal } from './GroupInfoModal'
import { useAuthStore } from '@/store/authStore'
import { useAcceptConversation, useDeleteConversation } from '../hooks/useChat'
import { type Conversation, type Message, type SendMessagePayload, isGroupConversation } from '../model/types'

interface ChatWindowProps {
  conversation: Conversation | null
  messages: Message[]
  isLoading?: boolean
  isLoadingMessages?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onSendMessage: (content: string, attachments: NonNullable<SendMessagePayload['attachments']>) => Promise<void>
  onConversationDeleted?: () => void
  onConversationAccepted?: () => void
  onConversationUpdated?: (updated: Conversation) => void
  /** Điện thoại: quay lại danh sách hội thoại */
  onBack?: () => void
}

export function ChatWindow({
  conversation,
  messages,
  isLoading,
  isLoadingMessages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSendMessage,
  onConversationDeleted,
  onConversationAccepted,
  onConversationUpdated,
  onBack,
}: ChatWindowProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const isFetchingOlderRef = useRef(false)

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const acceptConversationMutation = useAcceptConversation()
  const deleteConversationMutation = useDeleteConversation()

  // Cuộn nội bộ trong container tin nhắn
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      })
    }
  }

  // Xử lý sự kiện cuộn lên đỉnh để tải thêm tin nhắn cũ
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return

    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage && onLoadMore) {
      prevScrollHeightRef.current = el.scrollHeight
      isFetchingOlderRef.current = true
      onLoadMore()
    }
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || messages.length === 0) return

    if (isInitialLoadRef.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
      isInitialLoadRef.current = false
    } else if (isFetchingOlderRef.current) {
      const newScrollHeight = el.scrollHeight
      const addedHeight = newScrollHeight - prevScrollHeightRef.current
      el.scrollTop = addedHeight
      isFetchingOlderRef.current = false
    } else {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200
      if (isNearBottom) {
        scrollToBottom('smooth')
      }
    }
  }, [messages])

  // Reset cờ cuộn khi người dùng chuyển sang cuộc hội thoại khác
  useEffect(() => {
    isInitialLoadRef.current = true
    isFetchingOlderRef.current = false
    prevScrollHeightRef.current = 0
  }, [conversation?.id])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface p-8 text-center">
        <Loader2 size={36} className="animate-spin text-primary-solid mb-3" />
        <p className="text-sm font-medium text-text-subtle">Đang chuẩn bị cuộc trò chuyện...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface p-8 text-center">
        <span className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-border text-text-muted">
          <MessagesSquare size={30} />
        </span>
        <h3 className="text-lg font-bold text-text">Tin nhắn của bạn</h3>
        <p className="mt-1 max-w-xs text-sm text-text-subtle">Chọn một cuộc trò chuyện bên trái, hoặc nhắn tin cho thành viên từ danh bạ để bắt đầu.</p>
        <Link
          to="/app/alumni"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary-solid px-5 text-sm font-bold text-on-primary transition-colors hover:bg-primary-hover"
        >
          <Users size={16} />
          Tìm thành viên để nhắn tin
        </Link>
      </div>
    )
  }

  const isGroup = isGroupConversation(conversation)
  const isStrangerRequest = conversation.isAccepted === false
  const displayName = isGroup ? conversation.title || 'Nhóm trò chuyện' : conversation.recipientName

  const handleAcceptRequest = async () => {
    if (!conversation.id) return
    await acceptConversationMutation.mutateAsync(conversation.id)
    toast.success('Đã chấp nhận cuộc trò chuyện')
    if (onConversationAccepted) onConversationAccepted()
  }

  const handleDeleteRequest = () => {
    if (!conversation.id) return
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!conversation.id) return
    try {
      await deleteConversationMutation.mutateAsync(conversation.id)
      toast.success('Đã xóa cuộc trò chuyện')
      setIsDeleteDialogOpen(false)
      if (onConversationDeleted) onConversationDeleted()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      {/* Header cuộc trò chuyện */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-3 sm:px-5">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Quay lại danh sách" className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-2 md:hidden">
            <ChevronLeft size={22} />
          </button>
        )}
        {isGroup ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              className="relative shrink-0 transition-opacity hover:opacity-85"
              title="Xem thông tin và quản lý nhóm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary-solid shadow-xs ring-1 ring-primary/20">
                {conversation.avatarUrl ? (
                  <img src={conversation.avatarUrl} alt="Group" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <Users size={18} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary-solid text-on-primary shadow-xs">
                <Users size={8} />
              </div>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="truncate text-left text-sm font-bold text-text transition-colors hover:text-primary-solid"
                  title="Xem thông tin và quản lý nhóm"
                >
                  {displayName}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-text-subtle">
                  {conversation.memberCount || 2} thành viên
                </span>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to={conversation.recipientId ? `/app/profile?userId=${conversation.recipientId}` : '#'}
            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-90"
            title={`Xem hồ sơ của ${displayName}`}
          >
            <Avatar
              src={conversation.recipientAvatar || undefined}
              name={displayName}
              size={42}
            />
            <div>
              <h3 className="truncate text-[15px] font-bold text-text">{displayName}</h3>
              {conversation.recipientMajor ? (
                <p className="text-xs font-medium text-text-subtle">
                  {conversation.recipientMajor}
                </p>
              ) : (
                <p className="text-xs font-medium text-text-subtle">
                  Thành viên AlumNect
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Nút tác vụ header */}
        <div className="flex items-center gap-2">
          {isGroup && conversation.communityGroupId && (
            <Link
              to={`/app/groups/${conversation.communityGroupId}`}
              title={`Đến trang hội nhóm: ${conversation.communityGroupName || displayName}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-soft-border bg-brand-50/70 px-2.5 py-1.5 text-xs font-semibold text-primary-solid transition hover:bg-primary-soft hover:border-primary-soft-border active:scale-95 dark:bg-brand-950/50"
            >
              <Users size={13} className="shrink-0 text-primary-solid" />
              <span className="hidden sm:inline max-w-[120px] md:max-w-[180px] truncate">
                {conversation.communityGroupName || 'Hội nhóm'}
              </span>
              <ExternalLink size={12} className="shrink-0 opacity-70" />
            </Link>
          )}
          {isGroup && (
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              title="Thông tin nhóm"
              className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-text-muted transition-colors hover:bg-primary-soft hover:text-primary-solid"
            >
              <Info size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Banner Tin nhắn chờ từ người lạ */}
      {isStrangerRequest && (
        <div className="flex shrink-0 items-center justify-between border-b border-warning-border bg-warning-soft px-5 py-3 text-xs text-warning">
          <p className="font-medium">
            Người này không nằm trong danh bạ theo dõi của bạn. Bạn có muốn chấp nhận cuộc trò chuyện không?
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAcceptRequest}
              disabled={acceptConversationMutation.isPending}
              className="h-7 rounded-xl bg-primary-solid px-3 text-xs font-bold text-on-primary hover:bg-primary-hover"
            >
              <Check size={12} className="mr-1" />
              Chấp nhận
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteRequest}
              disabled={deleteConversationMutation.isPending}
              className="h-7 rounded-xl border-warning-border text-xs font-bold text-danger hover:bg-danger-soft"
            >
              <Trash2 size={12} className="mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách tin nhắn - cuộn độc lập mượt mà */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary-solid" />
          </div>
        )}

        {isLoadingMessages ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <div className="h-12 w-48 animate-pulse rounded-2xl bg-surface-3" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-text-subtle">
            <p className="text-sm">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = currentUserId ? String(m.senderId) === String(currentUserId) : false
            const prev = messages[i - 1]
            const next = messages[i + 1]
            const sameCluster = (a?: Message, b?: Message) =>
              !!a &&
              !!b &&
              a.type !== 'SYSTEM' &&
              b.type !== 'SYSTEM' &&
              String(a.senderId) === String(b.senderId) &&
              Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < 5 * 60 * 1000
            const joinPrev = sameCluster(prev, m)
            const joinNext = sameCluster(m, next)
            const position: BubblePosition = joinPrev ? (joinNext ? 'middle' : 'last') : joinNext ? 'first' : 'single'
            // Nhãn thời gian khi là tin đầu hoặc cách tin trước > 15 phút
            const gap = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity
            const d = new Date(m.createdAt)
            const timeLabel = !m.createdAt || isNaN(d.getTime()) ? null : gap > 15 * 60 * 1000 ? (isToday(d) ? format(d, 'HH:mm') : format(d, 'dd/MM/yyyy HH:mm')) : null
            return (
              <div key={m.id}>
                {timeLabel && <p className="my-3 text-center text-xs font-medium text-text-subtle">{timeLabel}</p>}
                <MessageBubble message={m} isMe={isMe} isGroup={isGroup} position={position} />
              </div>
            )
          })
        )}
      </div>

      {/* Khung soạn thảo tin nhắn */}
      <div className="shrink-0">
        <MessageInput onSendMessage={onSendMessage} />
      </div>

      {/* Modal thông tin nhóm */}
      {isGroup && isGroupInfoOpen && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={conversation}
          onConversationUpdated={onConversationUpdated}
          onLeftGroup={() => {
            if (onConversationDeleted) onConversationDeleted()
          }}
        />
      )}

      {/* Modal xác nhận xóa cuộc trò chuyện chuẩn hệ thống */}
      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        onClose={() => !deleteConversationMutation.isPending && setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa cuộc trò chuyện?"
        message="Xóa vĩnh viễn đoạn chat này?"
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        icon={<Trash2 size={24} />}
        isLoading={deleteConversationMutation.isPending}
      />
    </div>
  )
}
