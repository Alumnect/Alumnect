import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  MessagesSquare,
  AlertTriangle,
  FileText,
  Info,
  Handshake,
  ChevronUp,
  Edit3,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Avatar, Button, ConfirmModal, toast } from '@/components/ui'
import { MentoringDealBadge } from './MentoringDealBadge'
import { MentoringDealTicketCard } from './MentoringDealTicketCard'
import { MentoringDealActionModal } from './MentoringDealActionModal'
import { MentoringDealFormModal } from './MentoringDealFormModal'
import { MentoringTaskPaymentModal } from './MentoringTaskPaymentModal'
import {
  MessageBubble,
  MessageInput,
  useMessages,
  useSendMessage,
  useWebSocketChat,
  chatApi,
  type SendMessagePayload,
} from '@/features/message'
import {
  useDealDetail,
  useConfirmDeal,
  useRejectDeal,
  useRequestAdjustment,
} from '../hooks/useMentoringDeals'
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

  // Quản lý menu tiện ích mở rộng Deal
  const [isDealMenuOpen, setIsDealMenuOpen] = useState(false)
  const dealMenuRef = useRef<HTMLDivElement | null>(null)

  // Modals cho tạo / sửa Deal
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false)
  const [createProposalSource, setCreateProposalSource] = useState<'REQUEST_ACCEPTANCE' | 'RENEGOTIATION'>('RENEGOTIATION')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Dialog nhập lý do từ chối / điều chỉnh
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [adjustNote, setAdjustNote] = useState('')

  const confirmMutation = useConfirmDeal()
  const rejectMutation = useRejectDeal()
  const adjustMutation = useRequestAdjustment()

  // Đóng popover menu khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dealMenuRef.current && !dealMenuRef.current.contains(e.target as Node)) {
        setIsDealMenuOpen(false)
      }
    }
    if (isDealMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDealMenuOpen])

  // Xử lý Student chọn: "Xác nhận & thanh toán"
  const handleConfirmAndPay = async () => {
    try {
      const updated = await confirmMutation.mutateAsync(currentDeal.id)
      refetchDeal()
      onDealUpdated?.()
      if (updated.status === 'DEAL_CONFIRMED') {
        toast.success('Xác nhận Deal thành công! Đang mở cổng thanh toán PayOS...')
        setIsPaymentModalOpen(true)
      } else {
        toast.success('Đã xác nhận thỏa thuận. Đang chờ đối phương xác nhận.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xác nhận Deal.'
      toast.error(msg)
    }
  }

  // Xử lý Student chọn: "Yêu cầu điều chỉnh"
  const handleRequestAdjustment = async () => {
    try {
      await adjustMutation.mutateAsync({
        dealId: currentDeal.id,
        note: adjustNote.trim() || 'Học viên yêu cầu điều chỉnh các điều khoản',
      })
      toast.success('Đã gửi yêu cầu điều chỉnh. Deal Ticket cũ đã được đánh dấu SUPERSEDED.')
      setIsAdjustDialogOpen(false)
      setAdjustNote('')
      refetchDeal()
      onDealUpdated?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu điều chỉnh.'
      toast.error(msg)
    }
  }

  // Xử lý Student / Mentor chọn: "Từ chối"
  const handleRejectDeal = async () => {
    try {
      await rejectMutation.mutateAsync({
        dealId: currentDeal.id,
        reason: rejectReason.trim() || 'Từ chối đề xuất Deal',
      })
      toast.success('Đã từ chối Deal Ticket thành công.')
      setIsRejectDialogOpen(false)
      setRejectReason('')
      refetchDeal()
      onDealUpdated?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể từ chối Deal.'
      toast.error(msg)
    }
  }

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
            leftActions={
              <div className="relative" ref={dealMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsDealMenuOpen(!isDealMenuOpen)}
                  title="Chức năng mở rộng Thỏa thuận Deal"
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-brand-200/90 bg-gradient-to-r from-brand-50 to-orange-50/60 px-3 text-xs font-bold text-brand-700 shadow-2xs transition-all hover:bg-brand-100 hover:border-brand-300 active:scale-95 dark:border-brand-800/40 dark:bg-brand-950/40 dark:text-brand-300"
                >
                  <Handshake className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span className="font-heading font-black">{isMentor ? 'Deal lại' : 'Thỏa thuận Deal'}</span>
                  <ChevronUp
                    className={`h-3.5 w-3.5 text-brand-500 transition-transform duration-200 ${
                      isDealMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Popover Menu mở rộng ngay cạnh nút đính kèm */}
                {isDealMenuOpen && (
                  <div className="absolute bottom-13 left-0 z-40 w-72 sm:w-80 rounded-2xl border border-plum-900/10 bg-white p-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#242526] space-y-2 animate-scale-in">
                    <div className="flex items-center justify-between border-b border-plum-900/[0.06] pb-2 dark:border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Handshake className="h-4 w-4 text-brand-600" />
                        <span className="font-heading text-xs font-black text-plum-900 dark:text-[#f0f2f5]">
                          Tiện ích Thỏa thuận Deal
                        </span>
                      </div>
                      <span className="rounded-full bg-plum-100 px-2 py-0.5 text-[10px] font-bold text-plum-600 dark:bg-white/10 dark:text-plum-300">
                        Deal #{currentDeal.id} (v{currentDeal.version})
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {isMentor ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDealMenuOpen(false)
                              setCreateProposalSource('RENEGOTIATION')
                              setIsCreateDealModalOpen(true)
                            }}
                            className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-brand-50/80 dark:hover:bg-white/5"
                          >
                            <div className="rounded-lg bg-brand-100/70 p-1.5 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                              <Edit3 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                                Deal lại / Tạo Deal Ticket
                              </p>
                              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                Điều chỉnh giá, hạn chót, phạm vi hoặc hình thức học
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsDealMenuOpen(false)
                              setCreateProposalSource('REQUEST_ACCEPTANCE')
                              setIsCreateDealModalOpen(true)
                            }}
                            className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-mint-50/80 dark:hover:bg-white/5"
                          >
                            <div className="rounded-lg bg-mint-100/70 p-1.5 text-mint-600 dark:bg-mint-950/60 dark:text-mint-400">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                                Chấp nhận theo Request
                              </p>
                              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                Giữ nguyên điều kiện và mức giá đề xuất của học viên
                              </p>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDealMenuOpen(false)
                              setIsAdjustDialogOpen(true)
                            }}
                            className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-brand-50/80 dark:hover:bg-white/5"
                          >
                            <div className="rounded-lg bg-brand-100/70 p-1.5 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                              <RefreshCw className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                                Yêu cầu điều chỉnh Deal (Deal lại)
                              </p>
                              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                Gửi ghi chú yêu cầu Mentor cập nhật lại giá hoặc hạn chót
                              </p>
                            </div>
                          </button>

                          {currentDeal.status !== 'DEAL_CONFIRMED' && !currentDeal.isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsDealMenuOpen(false)
                                handleConfirmAndPay()
                              }}
                              className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-emerald-50/80 dark:hover:bg-white/5"
                            >
                              <div className="rounded-lg bg-emerald-100/70 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <CreditCard className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                  Xác nhận & Thanh toán
                                </p>
                                <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                  Đồng ý điều khoản và mở cổng thanh toán PayOS
                                </p>
                              </div>
                            </button>
                          )}

                          {currentDeal.status === 'DEAL_CONFIRMED' && !currentDeal.isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsDealMenuOpen(false)
                                setIsPaymentModalOpen(true)
                              }}
                              className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-emerald-50/80 dark:hover:bg-white/5"
                            >
                              <div className="rounded-lg bg-emerald-100/70 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <CreditCard className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                  Thanh toán Task ngay
                                </p>
                                <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                  Thanh toán để chuyển Task sang PREPARATION
                                </p>
                              </div>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsDealMenuOpen(false)
                              setIsRejectDialogOpen(true)
                            }}
                            className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-rose-50/80 dark:hover:bg-white/5"
                          >
                            <div className="rounded-lg bg-rose-100/70 p-1.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                              <XCircle className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-rose-700 dark:text-rose-300">
                                Từ chối thỏa thuận
                              </p>
                              <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                                Hủy bỏ đề xuất thỏa thuận này
                              </p>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* Modal tạo mới hoặc chỉnh sửa Deal Ticket */}
      {isCreateDealModalOpen && (
        <MentoringDealFormModal
          isOpen={isCreateDealModalOpen}
          onClose={() => setIsCreateDealModalOpen(false)}
          mode="create"
          deal={currentDeal}
          conversationId={resolvedConversationId}
          mentorId={isMentor ? currentNumId : partnerId}
          studentId={isMentor ? partnerId : currentNumId}
          requestId={currentDeal.requestId}
          proposalSource={createProposalSource}
          onSuccess={() => {
            refetchDeal()
            onDealUpdated?.()
          }}
        />
      )}

      {/* Modal thanh toán Mentoring Task (UC105) */}
      {isPaymentModalOpen && currentDeal && (
        <MentoringTaskPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          deal={currentDeal}
          onSuccess={() => {
            refetchDeal()
            onDealUpdated?.()
          }}
        />
      )}

      {/* Dialog xác nhận từ chối */}
      <ConfirmModal
        isOpen={isRejectDialogOpen}
        onClose={() => !rejectMutation.isPending && setIsRejectDialogOpen(false)}
        onConfirm={handleRejectDeal}
        title="Từ chối Deal Ticket đề xuất?"
        message="Bạn có chắc chắn muốn từ chối thỏa thuận Deal Ticket này? Thao tác này sẽ hủy đề xuất hiện tại và không tạo Task."
        confirmText="Từ chối đề xuất"
        cancelText="Đóng"
        variant="danger"
        icon={<AlertCircle size={24} />}
        isLoading={rejectMutation.isPending}
      />

      {/* Dialog nhập nội dung yêu cầu điều chỉnh */}
      {isAdjustDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 text-left space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
            <h4 className="font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">
              Yêu cầu điều chỉnh Deal Ticket (Deal lại)
            </h4>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Phiên bản hiện tại sẽ trở thành SUPERSEDED. Vui lòng ghi rõ nội dung bạn muốn Mentor điều chỉnh (giá, deadline, số buổi...).
            </p>
            <textarea
              rows={3}
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Ví dụ: Mong muốn giảm giá xuống 400.000đ hoặc kéo dài deadline thêm 3 ngày..."
              className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdjustDialogOpen(false)}
                disabled={adjustMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestAdjustment}
                disabled={adjustMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {adjustMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
