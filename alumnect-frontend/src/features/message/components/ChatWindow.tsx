import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MessagesSquare, Users, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { useAuthStore } from '@/store/authStore'
import type { Conversation, Message } from '../model/types'

interface ChatWindowProps {
  conversation: Conversation | null
  messages: Message[]
  isLoadingMessages?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onSendMessage: (content: string, attachments: any[]) => Promise<void>
}

export function ChatWindow({
  conversation,
  messages,
  isLoadingMessages,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSendMessage,
}: ChatWindowProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const isFetchingOlderRef = useRef(false)

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
      // Lần đầu mở hội thoại: cuộn ngay lập tức xuống tin nhắn mới nhất ở đáy
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
      isInitialLoadRef.current = false
    } else if (isFetchingOlderRef.current) {
      // Vừa tải thêm trang tin nhắn cũ: duy trì đúng vị trí scroll tương đối để không bị giật
      const newScrollHeight = el.scrollHeight
      const addedHeight = newScrollHeight - prevScrollHeightRef.current
      el.scrollTop = addedHeight
      isFetchingOlderRef.current = false
    } else {
      // Có tin nhắn mới phát sinh (gửi/nhận): tự cuộn xuống nếu đang ở gần đáy
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

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-plum-900/[0.02]">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-500 shadow-sm">
          <MessagesSquare size={32} />
        </div>
        <h3 className="text-lg font-bold text-plum-900">Chưa chọn cuộc trò chuyện</h3>
        <p className="mt-1 max-w-sm text-sm text-plum-400">
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-plum-900/[0.01]">
      {/* Header cuộc trò chuyện */}
      <div className="flex shrink-0 items-center justify-between border-b border-plum-900/10 bg-white/80 px-5 py-3.5 backdrop-blur-md">
        <Link
          to={`/app/profile?userId=${conversation.recipientId}`}
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
          title={`Xem hồ sơ của ${conversation.recipientName}`}
        >
          <Avatar
            src={conversation.recipientAvatar || undefined}
            name={conversation.recipientName}
            size={42}
          />
          <div>
            <h3 className="text-sm font-bold text-plum-900">
              {conversation.recipientName}
            </h3>
            {conversation.recipientMajor ? (
              <p className="text-xs font-medium text-plum-500">
                {conversation.recipientMajor}
              </p>
            ) : (
              <p className="text-xs font-medium text-plum-400">
                Thành viên AlumNect
              </p>
            )}
          </div>
        </Link>
      </div>

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
                <div className="h-12 w-48 animate-pulse rounded-2xl bg-plum-900/10" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-plum-400">
            <p className="text-sm">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên! 👋</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUserId ? String(m.senderId) === String(currentUserId) : false
            return <MessageBubble key={m.id} message={m} isMe={isMe} />
          })
        )}
      </div>

      {/* Khung soạn thảo tin nhắn */}
      <div className="shrink-0">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  )
}
