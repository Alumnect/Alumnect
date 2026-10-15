import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui'
import {
  ConversationList,
  ChatWindow,
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  chatApi,
  isMentoringConversation,
  type Conversation,
  type SendMessagePayload,
} from '@/features/message'

export function MessagesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUserIdParam = searchParams.get('userId')
  const targetUserId = targetUserIdParam ? Number(targetUserIdParam) : null
  const hasTargetUser = targetUserId !== null && !isNaN(targetUserId) && targetUserId > 0

  const [currentTab, setCurrentTab] = useState<'primary' | 'requests'>('primary')

  const { data: fetchedConversations = [], isLoading: isLoadingConversations } = useConversations(
    currentTab,
    'GENERAL'
  )
  const { data: fetchedRequestsData = [] } = useConversations('requests', 'GENERAL')

  // Defense in depth: the general inbox must never expose Mentoring conversations,
  // even while an older backend response is still cached in the browser.
  const conversations = useMemo(
    () => fetchedConversations.filter((conversation) => !isMentoringConversation(conversation)),
    [fetchedConversations]
  )
  const requestsData = useMemo(
    () => fetchedRequestsData.filter((conversation) => !isMentoringConversation(conversation)),
    [fetchedRequestsData]
  )

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const activeGeneralConversation = isMentoringConversation(activeConversation)
    ? null
    : activeConversation

  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()

  // Kiểm tra xem thành viên mục tiêu đã có trong danh sách hội thoại hiện tại chưa
  const existingTargetConv = useMemo(() => {
    if (!hasTargetUser) return null
    return conversations.find((c) => c.recipientId === targetUserId) || null
  }, [hasTargetUser, conversations, targetUserId])

  // Nếu có targetUserId nhưng chưa có hội thoại trong DB, lấy thông tin hồ sơ để khởi tạo Draft
  const {
    data: directConvData,
    isLoading: isLoadingDirect,
  } = useQuery({
    queryKey: ['direct-conversation', targetUserId],
    queryFn: async () => {
      const res = await chatApi.getOrCreateDirectConversation(targetUserId!)
      return res.data
    },
    enabled: hasTargetUser && !existingTargetConv,
    staleTime: 5 * 60 * 1000,
  })

  // Chọn cuộc hội thoại phù hợp:
  // 1. Khi có ?userId=...: Ưu tiên hội thoại sẵn có, hoặc hội thoại Direct vừa nạp
  // 2. Khi không có ?userId=...: Tự động chọn cuộc hội thoại đầu tiên trong danh sách
  useEffect(() => {
    if (hasTargetUser) {
      // Nếu đã có cuộc hội thoại đang mở với đúng thành viên này và đã có ID thực tế, không ghi đè lại bằng Draft
      if (activeConversation && activeConversation.recipientId === targetUserId && activeConversation.id) {
        return
      }
      if (existingTargetConv) {
        setActiveConversation(existingTargetConv)
      } else if (directConvData) {
        setActiveConversation(directConvData)
      }
    } else {
      // Khi không có ?userId trên URL và chưa có cuộc hội thoại nào được chọn:
      // Tự động chọn cuộc hội thoại đầu tiên khi danh sách đã nạp xong
      if (!isLoadingConversations) {
        if (!activeConversation) {
          if (conversations.length > 0) {
            setActiveConversation(conversations[0])
          }
        } else {
          // Nếu danh sách rỗng (ví dụ tab không có hội thoại nào), bỏ chọn
          if (conversations.length === 0 && !activeConversation.id) {
            setActiveConversation(null)
          }
        }
      }
    }
  }, [
    hasTargetUser,
    existingTargetConv,
    directConvData,
    conversations,
    isLoadingConversations,
    activeConversation?.id,
    activeConversation?.recipientId,
    targetUserId,
  ])

  // Cập nhật lại thông tin mới nhất của active conversation khi cache conversations thay đổi
  useEffect(() => {
    if (activeConversation?.id) {
      const updated = conversations.find((c) => c.id === activeConversation.id)
      if (!updated) {
        setActiveConversation(null)
        return
      }
      if (
        updated.title !== activeConversation.title ||
          updated.avatarUrl !== activeConversation.avatarUrl ||
          updated.recipientName !== activeConversation.recipientName ||
          updated.recipientAvatar !== activeConversation.recipientAvatar ||
          updated.memberCount !== activeConversation.memberCount ||
          updated.unreadCount !== activeConversation.unreadCount ||
          updated.lastMessage !== activeConversation.lastMessage ||
          updated.isAccepted !== activeConversation.isAccepted
      ) {
        setActiveConversation(updated)
      }
    } else if (activeConversation && !activeConversation.id) {
      // Nếu activeConversation đang là draft (chưa có id) nhưng danh sách vừa nạp về đã có hội thoại thực tế
      const matched = conversations.find((c) => c.recipientId === activeConversation.recipientId)
      if (matched) {
        setActiveConversation(matched)
      }
    }
  }, [
    conversations,
    activeConversation?.id,
    activeConversation?.recipientId,
    activeConversation?.title,
    activeConversation?.avatarUrl,
    activeConversation?.recipientName,
    activeConversation?.recipientAvatar,
    activeConversation?.memberCount,
    activeConversation?.unreadCount,
    activeConversation?.lastMessage,
    activeConversation?.isAccepted,
  ])

  // Tự động đánh dấu đã đọc khi mở một cuộc trò chuyện hoặc khi có tin nhắn mới đến trong hội thoại đang xem
  useEffect(() => {
    if (
      activeGeneralConversation &&
      activeGeneralConversation.id &&
      activeGeneralConversation.unreadCount > 0
    ) {
      markAsReadMutation.mutate(activeGeneralConversation.id)
    }
  }, [activeGeneralConversation?.id, activeGeneralConversation?.unreadCount])

  // Nếu activeConversation là Draft (id = null), đưa lên đầu danh sách hiển thị để người dùng nhận biết
  const displayedConversations = useMemo(() => {
    if (
      activeGeneralConversation &&
      !activeGeneralConversation.id &&
      !conversations.some((c) => c.recipientId === activeGeneralConversation.recipientId)
    ) {
      return [activeGeneralConversation, ...conversations]
    }
    return conversations
  }, [conversations, activeGeneralConversation])

  // Lấy lịch sử tin nhắn của cuộc trò chuyện hiện tại (cuộn vô hạn)
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(activeGeneralConversation?.id ?? null)

  // Ghép các trang và đảo thứ tự để hiển thị: từ cũ nhất (trên) tới mới nhất (dưới)
  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    const allDesc = messagesData.pages.flatMap((page) => page.content || [])
    return [...allDesc].reverse()
  }, [messagesData])

  // Đánh dấu đã đọc khi người dùng bấm chọn cuộc trò chuyện
  const handleSelectConversation = (conv: Conversation) => {
    // Chat for Task của Mentoring Request mở ở màn hình riêng (hiển thị Request, Deal Ticket, thanh toán, Task)
    if (isMentoringConversation(conv) && conv.id) {
      navigate(`/app/mentoring/chats/${conv.id}`)
      return
    }
    setActiveConversation(conv)
    if (conv.id && conv.unreadCount > 0) {
      markAsReadMutation.mutate(conv.id)
    }
    // Xóa param ?userId trên URL nếu có
    if (targetUserIdParam) {
      setSearchParams({})
    }
  }

  // Gửi tin nhắn mới
  const handleSendMessage = async (
    content: string,
    attachments: NonNullable<SendMessagePayload['attachments']>
  ) => {
    if (!activeGeneralConversation) return

    const res = await sendMessageMutation.mutateAsync({
      conversationId: activeGeneralConversation.id ?? undefined,
      recipientId: activeGeneralConversation.recipientId ?? undefined,
      content,
      attachments,
    })

    // Nếu gửi tin nhắn trong một cuộc hội thoại đang ở Tin nhắn chờ (isAccepted = false):
    // Tự động chuyển sang Hộp thư chính (primary) và cập nhật isAccepted = true
    if (activeGeneralConversation.isAccepted === false) {
      setActiveConversation((prev) => (prev ? { ...prev, isAccepted: true } : null))
      setCurrentTab('primary')
    }

    // Nếu vừa gửi tin nhắn đầu tiên cho một cuộc hội thoại Draft (id = null):
    // Cập nhật activeConversation với ID hội thoại thực tế được backend khởi tạo
    if (!activeGeneralConversation.id && res.data.conversationId) {
      setActiveConversation((prev) =>
        prev ? { ...prev, id: res.data.conversationId, isAccepted: true } : null
      )
      if (targetUserIdParam) {
        setSearchParams({})
      }
    }
  }

  return (
    <div className="mx-auto h-full max-w-6xl">
      <Card
        hover={false}
        className="grid h-full grid-cols-1 overflow-hidden border border-plum-900/10 bg-white/70 shadow-sm backdrop-blur-xl md:grid-cols-[340px_1fr]"
      >
        {/* Danh sách các cuộc trò chuyện bên trái */}
        <div className={`${activeGeneralConversation ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden`}>
          <ConversationList
            conversations={displayedConversations}
            activeId={activeGeneralConversation?.id}
            activeRecipientId={!activeGeneralConversation?.id ? activeGeneralConversation?.recipientId : undefined}
            onSelect={handleSelectConversation}
            isLoading={isLoadingConversations}
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab)
              setActiveConversation(null)
              if (targetUserIdParam) {
                setSearchParams({})
              }
            }}
            requestsCount={requestsData.length}
            onGroupCreated={(group) => {
              setActiveConversation(group)
            }}
          />
        </div>

        {/* Khung chat chính bên phải */}
        <div className={`${!activeGeneralConversation ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden`}>
          <ChatWindow
            conversation={activeGeneralConversation}
            messages={activeGeneralConversation ? messages : []}
            isLoading={isLoadingDirect}
            isLoadingMessages={isLoadingMessages}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            onSendMessage={handleSendMessage}
            onConversationDeleted={() => {
              setActiveConversation(null)
            }}
            onConversationAccepted={() => {
              setActiveConversation((prev) => (prev ? { ...prev, isAccepted: true } : null))
              setCurrentTab('primary')
            }}
            onConversationUpdated={setActiveConversation}
          />
        </div>
      </Card>
    </div>
  )
}
