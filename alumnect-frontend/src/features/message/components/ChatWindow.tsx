import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MessagesSquare, Users, Loader2, Info, Check, Trash2 } from 'lucide-react'
import { Avatar, Button, ConfirmModal, toast } from '@/components/ui'
import { MessageBubble } from './MessageBubble'
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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-plum-900/[0.02] dark:bg-transparent">
        <Loader2 size={36} className="animate-spin text-brand-500 mb-3" />
        <p className="text-sm font-medium text-plum-500">Đang chuẩn bị cuộc trò chuyện...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-plum-900/[0.02] dark:bg-transparent">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-500 shadow-sm dark:bg-brand-500/20 dark:text-brand-400">
          <MessagesSquare size={32} />
        </div>
        <h3 className="text-lg font-bold text-plum-900 dark:text-[#f0f2f5]">Chưa chọn cuộc trò chuyện</h3>
        <p className="mt-1 max-w-sm text-sm text-plum-400 dark:text-[#b0b3b8]">
          Hãy chọn một thành viên từ danh sách bên trái hoặc nhấn Nhắn tin từ trang danh bạ để bắt đầu trao đổi.
        </p>
        <Link
          to="/app/alumni"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-brand-700 active:scale-95"
        >
          <Users size={16} />
          Khám phá danh bạ thành viên
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
    <div className="flex h-full min-h-0 flex-col bg-plum-900/[0.01] dark:bg-transparent">
      {/* Header cuộc trò chuyện */}
      <div className="flex shrink-0 items-center justify-between border-b border-plum-900/10 bg-white/80 px-5 py-3.5 backdrop-blur-md dark:border-[#393a3b] dark:bg-[#242526]/80">
        {isGroup ? (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-85"
            title="Xem thông tin và quản lý nhóm"
          >
            <div className="relative shrink-0">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:text-brand-400">
                {conversation.avatarUrl ? (
                  <img src={conversation.avatarUrl} alt="Group" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <Users size={18} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-brand-600 text-white shadow-xs">
                <Users size={8} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">{displayName}</h3>
              <p className="text-xs font-medium text-plum-400 dark:text-[#b0b3b8]">
                {conversation.memberCount || 2} thành viên
              </p>
            </div>
          </button>
        ) : (
          <Link
            to={conversation.recipientId ? `/app/profile?userId=${conversation.recipientId}` : '#'}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            title={`Xem hồ sơ của ${displayName}`}
          >
            <Avatar
              src={conversation.recipientAvatar || undefined}
              name={displayName}
              size={42}
            />
            <div>
              <h3 className="text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">{displayName}</h3>
              {conversation.recipientMajor ? (
                <p className="text-xs font-medium text-plum-500 dark:text-[#b0b3b8]">
                  {conversation.recipientMajor}
                </p>
              ) : (
                <p className="text-xs font-medium text-plum-400 dark:text-[#b0b3b8]">
                  Thành viên AlumNect
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Nút tác vụ header */}
        <div className="flex items-center gap-2">
          {isGroup && (
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              title="Thông tin nhóm"
              className="grid h-8 w-8 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:bg-[#3a3b3c] dark:text-[#b0b3b8] dark:hover:bg-[#4e4f50] dark:hover:text-white"
            >
              <Info size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Banner Tin nhắn chờ từ người lạ */}
      {isStrangerRequest && (
        <div className="flex shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50/80 px-5 py-3 text-xs text-amber-900 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">
            Người này không nằm trong danh bạ theo dõi của bạn. Bạn có muốn chấp nhận cuộc trò chuyện không?
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAcceptRequest}
              disabled={acceptConversationMutation.isPending}
              className="h-7 rounded-xl bg-brand-600 px-3 text-[11px] font-bold text-white hover:bg-brand-700"
            >
              <Check size={12} className="mr-1" />
              Chấp nhận
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteRequest}
              disabled={deleteConversationMutation.isPending}
              className="h-7 rounded-xl border-amber-300 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:border-amber-800 dark:text-red-400"
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
        className="chat-scrollbar flex-1 min-h-0 space-y-3.5 overflow-y-auto overscroll-contain p-5"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          </div>
        )}

        {isLoadingMessages ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <div className="h-12 w-48 animate-pulse rounded-2xl bg-plum-900/10 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-plum-400 dark:text-[#b0b3b8]">
            <p className="text-sm">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên! 👋</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUserId ? String(m.senderId) === String(currentUserId) : false
            return <MessageBubble key={m.id} message={m} isMe={isMe} isGroup={isGroup} />
          })
        )}
      </div>

      {/* Khung soạn thảo tin nhắn */}
      <div className="shrink-0">
        <MessageInput onSendMessage={onSendMessage} />
      </div>

      {/* Modal thông tin nhóm */}
      {isGroup && (
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
