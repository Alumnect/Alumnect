import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  MessagesSquare,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react'
import { Avatar, Button, toast } from '@/components/ui'
import { MentoringDealBadge } from './MentoringDealBadge'
import { MentoringDealTicketCard } from './MentoringDealTicketCard'
import { MentoringDealActionModal } from './MentoringDealActionModal'
import {
  MessageBubble,
  MessageInput,
  useMessages,
  useSendMessage,
  useWebSocketChat,
  chatApi,
  type SendMessagePayload,
} from '@/features/message'
import { useDealDetail } from '../hooks/useMentoringDeals'
import { useAuthStore } from '@/store/authStore'
import type { MentoringDeal } from '../model/mentoringDealTypes'

interface MentoringChatForTaskProps {
  deal: MentoringDeal
  onBack?: () => void
  onDealUpdated?: () => void
}

/**
 * Khu vực Chat for Task riêng biệt thuộc Thỏa thuận Cố vấn (UC104 & UC105).
 * Tách biệt hoàn toàn với hệ thống Chat chung, tích hợp Deal Ticket Card ở đầu
 * và luồng tin nhắn trao đổi điều khoản, phạm vi công việc giữa Student và Mentor.
 */
export function MentoringChatForTask({
  deal,
  onBack,
  onDealUpdated,
}: MentoringChatForTaskProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const currentNumId = Number(currentUserId) || 0

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [resolvedConversationId, setResolvedConversationId] = useState<number | null>(
    deal.conversationId || null
  )

  // Lấy dữ liệu Deal và Snapshot mới nhất
  const { data: detailData, refetch: refetchDeal } = useDealDetail(deal.id)
  const currentDeal = detailData?.deal || deal

  const isMentor = currentNumId === currentDeal.mentorId
  const partnerId = isMentor ? currentDeal.studentId : currentDeal.mentorId
  const partnerName = isMentor
    ? currentDeal.studentName || 'Học viên'
    : currentDeal.mentorName || 'Cố vấn'
  const partnerAvatar = isMentor ? currentDeal.studentAvatar : currentDeal.mentorAvatar
  const partnerRole = isMentor ? 'Học viên' : 'Mentor'

  // Tự động tìm hoặc khởi tạo Conversation 1-1 cho deal nếu chưa có conversationId
  useEffect(() => {
    if (currentDeal.conversationId) {
      setResolvedConversationId(currentDeal.conversationId)
      return
    }

    if (partnerId && partnerId > 0) {
      let isSubscribed = true
      chatApi
        .getOrCreateDirectConversation(partnerId)
        .then((res) => {
          if (isSubscribed && res.data?.id) {
            setResolvedConversationId(res.data.id)
          }
        })
        .catch((err) => {
          console.error('Không thể tạo/mở cuộc hội thoại riêng cho Deal:', err)
        })

      return () => {
        isSubscribed = false
      }
    }
  }, [currentDeal.conversationId, partnerId])

  // Lắng nghe WebSocket tin nhắn thời gian thực
  useWebSocketChat()

  // Lấy lịch sử tin nhắn của cuộc trò chuyện Chat for Task
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(resolvedConversationId)

  // Ghép các trang và đảo thứ tự: tin nhắn cũ ở trên, mới ở dưới
  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    const allDesc = messagesData.pages.flatMap((page) => page.content || [])
    return [...allDesc].reverse()
  }, [messagesData])

  // Điều khiển cuộn danh sách tin nhắn
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const isFetchingOlderRef = useRef(false)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      })
    }
  }

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return

    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      prevScrollHeightRef.current = el.scrollHeight
      isFetchingOlderRef.current = true
      fetchNextPage()
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
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250
      if (isNearBottom) {
        scrollToBottom('smooth')
      }
    }
  }, [messages])

  useEffect(() => {
    isInitialLoadRef.current = true
    isFetchingOlderRef.current = false
    prevScrollHeightRef.current = 0
  }, [resolvedConversationId])

  // Gửi tin nhắn mới trong Chat for Task
  const sendMessageMutation = useSendMessage()
  const handleSendMessage = async (
    content: string,
    attachments: NonNullable<SendMessagePayload['attachments']>
  ) => {
    if (!resolvedConversationId) {
      toast.error('Đang chuẩn bị kênh chat riêng cho Task, vui lòng thử lại sau giây lát...')
      return
    }

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: resolvedConversationId,
        recipientId: partnerId,
        content,
        attachments,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi tin nhắn.'
      toast.error(msg)
    }
  }

  // Trạng thái chỉ đọc nếu Deal bị SUPERSEDED (Request đã chọn Mentor khác) hoặc bị HỦY
  const isSuperseded = currentDeal.status === 'SUPERSEDED'
  const isCancelled = currentDeal.status === 'CANCELLED'
  const isRejected = currentDeal.status === 'REJECTED'
  const isReadOnly = isSuperseded || isCancelled || isRejected

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[580px] flex-col overflow-hidden rounded-3xl border border-plum-900/[0.08] bg-white shadow-sm dark:border-white/10 dark:bg-[#1e1f20]">
      {/* Header Chat for Task */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.08] bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-white/10 dark:bg-[#242526]/90 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Quay lại danh sách Deals"
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-plum-900/10 bg-plum-50/50 text-plum-700 hover:bg-brand-50 hover:text-brand-600 transition-all dark:border-white/10 dark:bg-white/5 dark:text-[#f0f2f5] dark:hover:bg-brand-950/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <Avatar
            src={partnerAvatar || undefined}
            name={partnerName}
            size={40}
            className="ring-2 ring-brand-500/20"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">
                {partnerName}
              </h2>
              <span className="rounded-full bg-brand-100/70 px-2.5 py-0.5 text-[10px] font-black text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                {partnerRole}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-plum-500 dark:text-[#b0b3b8]">
              <span className="font-bold text-plum-700 dark:text-plum-300">
                Deal #{currentDeal.id} (v{currentDeal.version})
              </span>
              <span>•</span>
              <span className="truncate max-w-[220px] sm:max-w-xs">{currentDeal.taskScope}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MentoringDealBadge
            status={currentDeal.status}
            isLocked={currentDeal.isLocked}
            isPaid={currentDeal.isPaid}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailModalOpen(true)}
            leftIcon={<FileText className="h-3.5 w-3.5 text-brand-600" />}
            className="rounded-xl font-bold text-xs"
          >
            Lịch sử Snapshots
          </Button>
        </div>
      </div>

      {/* Cảnh báo trạng thái Read-only theo SRS UC104 */}
      {isSuperseded && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 sm:px-6">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Request đã chọn Mentor khác. Cuộc trò chuyện này ở chế độ chỉ đọc, không nhận hoặc chốt Deal mới.
          </span>
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2.5 bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-800 dark:text-rose-300 sm:px-6">
          <Info className="h-4 w-4 shrink-0 text-rose-600" />
          <span>Thỏa thuận Deal này đã bị hủy bỏ.</span>
        </div>
      )}

      {/* Thẻ Deal Ticket Pinned tại đỉnh khung chat */}
      <div className="p-3 sm:p-4 bg-plum-50/40 border-b border-plum-900/[0.06] dark:bg-black/20 dark:border-white/5">
        <MentoringDealTicketCard
          conversationId={resolvedConversationId}
          recipientId={partnerId}
          dealId={currentDeal.id}
          onPaymentSuccess={() => {
            refetchDeal()
            onDealUpdated?.()
          }}
        />
      </div>

      {/* Khu vực tin nhắn trao đổi trong Chat for Task */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-3 bg-[#f8f9fa]/50 dark:bg-[#18191a]"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-plum-500 shadow-xs dark:bg-white/10 dark:text-[#b0b3b8]">
              Đang tải tin nhắn cũ hơn...
            </span>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="text-xs font-bold text-plum-500 dark:text-[#b0b3b8]">
                Đang tải hội thoại trao đổi...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 dark:bg-brand-950/50">
              <MessagesSquare className="h-6 w-6" />
            </div>
            <p className="font-heading font-black text-sm text-plum-800 dark:text-[#f0f2f5]">
              Kênh Chat for Task riêng biệt
            </p>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8] max-w-sm leading-relaxed">
              Hãy gửi tin nhắn để cùng nhau trao đổi chi tiết phạm vi công việc, giá và chốt điều khoản thỏa thuận với đối tác.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentNumId

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={isMe}
              />
            )
          })
        )}
      </div>

      {/* Input gửi tin nhắn */}
      <div className="border-t border-plum-900/[0.08] bg-white p-3 dark:border-white/10 dark:bg-[#242526]">
        {isReadOnly ? (
          <div className="rounded-2xl bg-plum-50 p-3 text-center text-xs font-bold text-plum-500 dark:bg-white/5 dark:text-[#b0b3b8]">
            Cuộc hội thoại này đã kết thúc hoặc ở chế độ chỉ đọc.
          </div>
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!resolvedConversationId}
          />
        )}
      </div>

      {/* Modal xem lịch sử Snapshot chi tiết */}
      {isDetailModalOpen && (
        <MentoringDealActionModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            refetchDeal()
            onDealUpdated?.()
          }}
          dealId={currentDeal.id}
        />
      )}
    </div>
  )
}
