import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui'
import {
  ConversationList,
  ChatWindow,
  useConversations,
  useMessages,
  useSendMessage,
  useDirectConversation,
  useMarkAsRead,
  type Conversation,
} from '@/features/message'

export function MessagesPage() {
  const [searchParams] = useSearchParams()
  const targetUserIdParam = searchParams.get('userId')

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations()
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  const directConversationMutation = useDirectConversation()
  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()

  const requestedUserIdRef = useRef<number | null>(null)

  // Xử lý khi có query param ?userId=... (ví dụ bấm từ danh bạ cựu sinh viên hoặc hồ sơ)
  useEffect(() => {
    if (targetUserIdParam) {
      const targetUserId = Number(targetUserIdParam)
      if (!isNaN(targetUserId)) {
        // Nếu hội thoại với thành viên này đã có trong danh sách thì chọn ngay, không tạo mới
        const existing = conversations.find((c) => c.recipientId === targetUserId)
        if (existing) {
          setActiveConversation(existing)
          return
        }

        // Chặn gọi mutation lặp lại (ví dụ trong React Strict Mode)
        if (requestedUserIdRef.current === targetUserId) {
          return
        }
        requestedUserIdRef.current = targetUserId

        directConversationMutation.mutate(targetUserId, {
          onSuccess: (res) => {
            setActiveConversation(res.data)
          },
        })
      }
    }
  }, [targetUserIdParam, conversations])

  // Tự động chọn cuộc hội thoại đầu tiên nếu chưa chọn cuộc nào
  useEffect(() => {
    if (!activeConversation && conversations.length > 0 && !targetUserIdParam) {
      setActiveConversation(conversations[0])
    } else if (activeConversation) {
      // Cập nhật lại thông tin mới nhất của active conversation từ cache
      const updated = conversations.find((c) => c.id === activeConversation.id)
      if (updated) {
        setActiveConversation(updated)
      }
    }
  }, [conversations])

  // Tự động đánh dấu đã đọc khi mở một cuộc trò chuyện hoặc khi có tin nhắn mới đến trong hội thoại đang xem
  useEffect(() => {
    if (activeConversation && activeConversation.unreadCount > 0) {
      markAsReadMutation.mutate(activeConversation.id)
    }
  }, [activeConversation?.id, activeConversation?.unreadCount])

  // Lấy lịch sử tin nhắn của cuộc trò chuyện hiện tại (cuộn vô hạn)
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(activeConversation?.id ?? null)

  // Ghép các trang và đảo thứ tự để hiển thị: từ cũ nhất (trên) tới mới nhất (dưới)
  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    const allDesc = messagesData.pages.flatMap((page) => page.content || [])
    return [...allDesc].reverse()
  }, [messagesData])

  // Đánh dấu đã đọc khi mở cuộc trò chuyện
  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv)
    if (conv.unreadCount > 0) {
      markAsReadMutation.mutate(conv.id)
    }
  }

  // Gửi tin nhắn mới
  const handleSendMessage = async (content: string, attachments: any[]) => {
    if (!activeConversation) return

    await sendMessageMutation.mutateAsync({
      conversationId: activeConversation.id,
      recipientId: activeConversation.recipientId,
      content,
      attachments,
    })
  }

  return (
    <div className="mx-auto h-full max-w-6xl">
      <Card
        hover={false}
        className="grid h-full grid-cols-1 overflow-hidden border border-plum-900/10 bg-white/70 shadow-sm backdrop-blur-xl md:grid-cols-[320px_1fr]"
      >
        {/* Danh sách các cuộc trò chuyện bên trái */}
        <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden`}>
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            onSelect={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Khung chat chính bên phải */}
        <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden`}>
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            onSendMessage={handleSendMessage}
          />
        </div>
      </Card>
    </div>
  )
}
