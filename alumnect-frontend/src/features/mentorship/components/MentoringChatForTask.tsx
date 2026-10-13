import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CreditCard,
  Edit3,
  FileCheck,
  FileText,
  Handshake,
  History,
  Loader2,
  MessagesSquare,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, Button, Skeleton, toast } from '@/components/ui'
import {
  MessageBubble,
  MessageInput,
  useMessages,
  useSendMessage,
  useWebSocketChat,
  type Message,
  type SendMessagePayload,
} from '@/features/message'
import { useAuthStore } from '@/store/authStore'
import { MentoringDealBadge } from './MentoringDealBadge'
import { MentoringDealActionModal } from './MentoringDealActionModal'
import { MentoringDealFormModal } from './MentoringDealFormModal'
import { MentoringTaskPaymentModal } from './MentoringTaskPaymentModal'
import { MentoringTaskDetailModal } from './MentoringTaskDetailModal'
import { MentoringDiscordTicketEmbed } from './MentoringDiscordTicketEmbed'
import { MentoringAdjustmentTicketEmbed } from './MentoringAdjustmentTicketEmbed'
import { parseAdjustmentMessage } from '../model/mentoringAdjustmentTypes'
import { MentoringTicketDetailModal, type MentoringTicketData } from './MentoringTicketDetailModal'
import { MentoringTaskResolutionBanner } from './MentoringTaskResolutionBanner'
import { MentoringDeadlineExtensionModal } from './MentoringDeadlineExtensionModal'
import { MentoringTaskAmendmentModal } from './MentoringTaskAmendmentModal'
import { MentoringSettlementProposalModal } from './MentoringSettlementProposalModal'
import { MentoringSubmitSettlementTicketModal } from './MentoringSubmitSettlementTicketModal'
import { MentoringTaskCompletionModal } from './MentoringTaskCompletionModal'
import { MentoringTaskReviewModal } from './MentoringTaskReviewModal'
import { useTaskDetail } from '../hooks/useMentoringTasks'
import { useMentoringConversation } from '../hooks/useMentoringConversation'
import { useConfirmDeal, useProposeDeal, useRejectDeal, useRequestAdjustment } from '../hooks/useMentoringDeals'
import { CalendarClock, Scale, Send } from 'lucide-react'
import type { MentoringDeal, MentoringDealSnapshot } from '../model/mentoringDealTypes'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_REQUEST_FLOW_STATUS_LABELS,
  MENTORING_TASK_STATUS_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  formatVnd,
} from '../model/mentoringFlowLabels'

interface MentoringChatForTaskProps {
  /** ID Chat for Task (Conversation MENTORING của Request + Student + Mentor) */
  conversationId: number
  onBack?: () => void
}

/** Một phần tử trên dòng thời gian Chat for Task: tin nhắn hoặc một phiên bản Deal Ticket */
type TimelineItem =
  | { kind: 'message'; at: number; message: Message }
  | { kind: 'ticket'; at: number; snapshot: MentoringDealSnapshot }

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'đang chờ thanh toán',
  FAILED: 'thất bại',
  EXPIRED: 'đã hết hạn',
  CANCELLED: 'đã hủy',
  PAID: 'thành công',
}

/**
 * Chat for Task của một Mentoring Request (UC103 → UC104 → UC105).
 * - Mỗi cuộc hội thoại thuộc duy nhất bộ Request + Student + Mentor; ngữ cảnh lấy từ backend.
 * - Deal Ticket được hiển thị inline theo từng phiên bản (dữ liệu snapshot trong DB, không phân tích nội dung tin nhắn).
 * - Mentor: "Chấp nhận Deal theo Request" hoặc "Deal lại / Tạo Deal Ticket".
 * - Học viên: "Xác nhận & thanh toán", "Yêu cầu điều chỉnh", "Từ chối" trên phiên bản mới nhất.
 * - Sau thanh toán thành công, cuộc hội thoại tiếp tục được dùng cho Task ("Xem Task").
 * Mọi quyền thao tác (canConfirm, canPay, canCreateDealTicket, readOnly...) do backend tính và kiểm tra lại.
 */
export function MentoringChatForTask({ conversationId, onBack }: MentoringChatForTaskProps) {
  const navigate = useNavigate()
  const currentUserId = Number(useAuthStore((state) => state.user?.id)) || 0

  const { data: ctx, isLoading, error, refetch } = useMentoringConversation(conversationId)
  const deal: MentoringDeal | null = ctx?.deal?.deal ?? null
  const snapshots = useMemo(() => ctx?.deal?.snapshots ?? [], [ctx?.deal?.snapshots])
  const isMentor = ctx?.myRole === 'MENTOR'
  const partnerId = isMentor ? ctx?.studentId : ctx?.mentorUserId
  const partnerName = (isMentor ? ctx?.studentName : ctx?.mentorName) || (isMentor ? 'Học viên' : 'Mentor')
  const partnerAvatar = isMentor ? ctx?.studentAvatar : ctx?.mentorAvatar

  // Trạng thái các modal / dialog
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState(false)
  const [isDealMenuOpen, setIsDealMenuOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAcceptByRequestOpen, setIsAcceptByRequestOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentDeal, setPaymentDeal] = useState<MentoringDeal | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<number | null>(null)
  const [adjustNote, setAdjustNote] = useState('')
  const [ticketModal, setTicketModal] = useState<{ ticket: MentoringTicketData; version: number } | null>(null)
  const dealMenuRef = useRef<HTMLDivElement | null>(null)

  // UC109: Xử lý gia hạn deadline, điều chỉnh task, thỏa thuận dừng task
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)
  const [isTaskActionMenuOpen, setIsTaskActionMenuOpen] = useState(false)
  const taskActionMenuRef = useRef<HTMLDivElement | null>(null)

  // UC110: Nộp & Nghiệm thu hoàn thành Task
  const [isSubmitCompletionOpen, setIsSubmitCompletionOpen] = useState(false)
  const [isReviewCompletionOpen, setIsReviewCompletionOpen] = useState(false)

  // UC111: Gửi Settlement Ticket đã thỏa thuận lên Admin
  const [isSubmitSettlementTicketOpen, setIsSubmitSettlementTicketOpen] = useState(false)

  const { data: taskDetail, refetch: refetchTask } = useTaskDetail(ctx?.taskId ?? undefined)

  const proposeMutation = useProposeDeal()
  const confirmMutation = useConfirmDeal()
  const rejectMutation = useRejectDeal()
  const adjustMutation = useRequestAdjustment()
  const sendMessageMutation = useSendMessage()

  // Đóng menu giao dịch khi bấm ra ngoài
  useEffect(() => {
    if (!isDealMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dealMenuRef.current && !dealMenuRef.current.contains(e.target as Node)) setIsDealMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDealMenuOpen])

  // Đóng menu thao tác Task khi bấm ra ngoài
  useEffect(() => {
    if (!isTaskActionMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (taskActionMenuRef.current && !taskActionMenuRef.current.contains(e.target as Node)) setIsTaskActionMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isTaskActionMenuOpen])

  // Tin nhắn hệ thống realtime báo hiệu trạng thái nghiệp vụ thay đổi → tải lại ngữ cảnh từ backend
  useWebSocketChat((newMsg) => {
    if (newMsg.conversationId === conversationId) {
      refetch()
      refetchTask()
    }
  })

  // ---------------- Tin nhắn & dòng thời gian ----------------
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(conversationId)

  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    return [...messagesData.pages.flatMap((page) => page.content || [])].reverse()
  }, [messagesData])

  const timeline = useMemo<TimelineItem[]>(() => {
    const oldestLoaded = messages.length > 0 ? new Date(messages[0].createdAt).getTime() : 0
    const items: TimelineItem[] = messages.map((m) => ({ kind: 'message', at: new Date(m.createdAt).getTime(), message: m }))
    snapshots.forEach((s) => {
      const at = new Date(s.createdAt).getTime()
      // Khi còn trang tin nhắn cũ chưa tải, chỉ hiển thị các phiên bản nằm trong khoảng thời gian đã tải
      if (!hasNextPage || at >= oldestLoaded) items.push({ kind: 'ticket', at, snapshot: s })
    })
    return items.sort((a, b) => a.at - b.at || (a.kind === 'ticket' ? -1 : 1))
  }, [messages, snapshots, hasNextPage])

  // ---------------- Cuộn danh sách ----------------
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const isFetchingOlderRef = useRef(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeightRef.current = el.scrollHeight
      isFetchingOlderRef.current = true
      fetchNextPage()
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || timeline.length === 0) return
    if (isInitialLoadRef.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
      isInitialLoadRef.current = false
    } else if (isFetchingOlderRef.current) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      isFetchingOlderRef.current = false
    } else if (el.scrollHeight - el.scrollTop - el.clientHeight < 280) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [timeline])

  useEffect(() => {
    isInitialLoadRef.current = true
  }, [conversationId])

  // ---------------- Hành động ----------------
  const handleSendMessage = async (content: string, attachments: NonNullable<SendMessagePayload['attachments']>) => {
    try {
      await sendMessageMutation.mutateAsync({ conversationId, recipientId: partnerId, content, attachments })
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Không thể gửi tin nhắn.')
      refetch()
    }
  }

  const handleAcceptByRequest = async () => {
    try {
      const created = await proposeMutation.mutateAsync({ conversationId, proposalSource: 'REQUEST_ACCEPTANCE' })
      toast.success(`Đã gửi Deal Ticket phiên bản ${created.version} theo điều kiện của Request.`)
      setIsAcceptByRequestOpen(false)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Không thể chấp nhận Deal theo Request.')
    }
  }

  // Bước 1: xác nhận đúng phiên bản; Bước 2: mở thanh toán (Task chỉ tạo sau khi thanh toán thành công)
  const handleConfirmAndPay = async (version: number) => {
    if (!deal) return
    try {
      const updated = await confirmMutation.mutateAsync({ dealId: deal.id, version })
      if (updated.status === 'DEAL_CONFIRMED') {
        toast.success('Deal đã được khóa và Mentor đã được chọn. Tiếp tục thanh toán để kích hoạt Task.')
        setPaymentDeal(updated)
        setIsPaymentOpen(true)
      } else {
        toast.success('Đã xác nhận. Đang chờ bên còn lại xác nhận.')
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Không thể xác nhận Deal.')
    }
  }

  const handleReject = async () => {
    if (!deal || rejectTarget === null) return
    try {
      await rejectMutation.mutateAsync({
        dealId: deal.id,
        version: rejectTarget,
        reason: rejectReason.trim() || undefined,
      })
      toast.success('Đã từ chối Deal Ticket. Hai bên có thể tiếp tục trao đổi.')
      setRejectTarget(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Không thể từ chối Deal Ticket.')
    }
  }

  const handleRequestAdjustment = async () => {
    if (!deal || adjustTarget === null) return
    try {
      await adjustMutation.mutateAsync({
        dealId: deal.id,
        version: adjustTarget,
        note: adjustNote.trim() || undefined,
      })
      toast.success('Đã gửi yêu cầu điều chỉnh. Mentor sẽ gửi phiên bản Deal Ticket mới.')
      setAdjustTarget(null)
      setAdjustNote('')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Không thể gửi yêu cầu điều chỉnh.')
    }
  }

  const openPayment = () => {
    if (!deal) return
    setPaymentDeal(deal)
    setIsPaymentOpen(true)
  }

  // ---------------- Dựng dữ liệu Ticket cho từng phiên bản ----------------
  const buildTicket = (s: MentoringDealSnapshot): MentoringTicketData => {
    let status: MentoringTicketData['status'] = 'PENDING'
    if (deal && s.version < deal.version) status = 'SUPERSEDED'
    else if (deal?.status === 'DEAL_CONFIRMED') status = 'CONFIRMED'
    else if (deal?.status === 'REJECTED' || deal?.status === 'CANCELLED') status = 'REJECTED'
    else if (deal?.status === 'SUPERSEDED') status = 'ADJUSTMENT'

    const handlerName =
      status === 'CONFIRMED'
        ? ctx?.studentName
        : status === 'REJECTED'
          ? deal?.status === 'CANCELLED'
            ? 'Luồng Deal đã đóng'
            : deal?.updatedByName || ctx?.studentName
          : undefined

    return {
      ticketType: 'DEAL',
      ticketCode: `#DL-${String(deal?.id ?? s.dealId).padStart(3, '0')}`,
      version: s.version,
      dealId: deal?.id ?? s.dealId,
      senderId: s.modifiedByUserId,
      senderName: s.modifiedByName || ctx?.mentorName || 'Mentor',
      senderAvatar: s.modifiedByAvatar ?? ctx?.mentorAvatar,
      senderRole: 'Mentor',
      status,
      handlerName,
      handledAt: (status === 'CONFIRMED' ? deal?.lockedAt : deal?.updatedAt) || undefined,
      taskScope: s.taskScope,
      expectedResult: s.expectedResult,
      agreedPrice: Number(s.agreedPrice),
      deadline: s.deadline,
      workingMode: s.workingMode,
      participationType: s.participationType,
      taskType: s.taskType,
      proposalSource: s.proposalSource,
      changeNote: s.changeNote,
      createdAt: s.createdAt,
      isPaid: deal?.isPaid,
      isMentor,
    }
  }

  const buildAdjustmentTicket = (
    message: Message,
    adj: { senderName: string; version: number; note: string },
    snapshot?: MentoringDealSnapshot
  ): MentoringTicketData => {
    const isSuperseded = Boolean(deal && deal.version > adj.version)
    const status: MentoringTicketData['status'] = isSuperseded ? 'SUPERSEDED' : 'ADJUSTMENT'

    return {
      ticketType: 'ADJUSTMENT',
      ticketCode: `#ADJ-${String(deal?.id ?? snapshot?.dealId ?? 0).padStart(3, '0')}`,
      version: adj.version,
      dealId: deal?.id ?? snapshot?.dealId ?? 0,
      senderId: message.senderId,
      senderName: message.senderName || adj.senderName,
      senderAvatar: message.senderAvatar,
      senderRole: 'Học viên',
      status,
      adjustmentNote: adj.note,
      taskScope: snapshot?.taskScope ?? deal?.taskScope,
      expectedResult: snapshot?.expectedResult ?? deal?.expectedResult,
      agreedPrice: Number(snapshot?.agreedPrice ?? deal?.agreedPrice ?? 0),
      deadline: snapshot?.deadline ?? deal?.deadline,
      workingMode: snapshot?.workingMode ?? deal?.workingMode,
      participationType: snapshot?.participationType ?? deal?.participationType,
      taskType: snapshot?.taskType ?? deal?.taskType,
      proposalSource: snapshot?.proposalSource ?? deal?.proposalSource,
      createdAt: message.createdAt,
      isPaid: deal?.isPaid,
      isMentor,
    }
  }

  /** Hành động hợp lệ trên một phiên bản (chỉ phiên bản mới nhất mới có hành động) */
  const actionsFor = (version: number) => {
    const isLatest = Boolean(deal && version === deal.version)
    const studentPending = isLatest && !isMentor && Boolean(deal?.canConfirm)
    const mentorCanReissue =
      isLatest && isMentor && Boolean(ctx?.canCreateDealTicket) && (deal?.status === 'SUPERSEDED' || deal?.status === 'REJECTED')
    return {
      canAct: studentPending,
      onConfirm: studentPending ? () => handleConfirmAndPay(version) : undefined,
      onReject: isLatest && deal?.canReject ? () => setRejectTarget(version) : undefined,
      onRevert: studentPending && deal?.canRequestAdjustment
        ? () => setAdjustTarget(version)
        : mentorCanReissue
          ? () => setIsFormOpen(true)
          : undefined,
      onPay: isLatest && deal?.canPay ? openPayment : undefined,
    }
  }

  // ---------------- Render ----------------
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-3xl border border-plum-900/[0.08] bg-white p-6 dark:border-white/10 dark:bg-[#1e1f20]">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !ctx) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-center space-y-3 dark:bg-rose-950/20 dark:border-rose-900/30">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
          {error?.message || 'Không thể tải Chat for Task.'}
        </p>
        {onBack && (
          <Button variant="secondary" size="sm" onClick={onBack}>
            Quay lại
          </Button>
        )}
      </div>
    )
  }

  const requestPrice = ctx.budgetMax ?? ctx.budgetMin
  const isDealLockedUnpaid = deal?.status === 'DEAL_CONFIRMED' && !deal?.isPaid
  const lastPaymentStatus = ctx.latestPayment?.paymentStatus

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col overflow-hidden rounded-3xl border border-plum-900/[0.08] bg-white shadow-sm dark:border-white/10 dark:bg-[#1e1f20]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.08] bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-white/10 dark:bg-[#242526]/90 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Quay lại"
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-plum-900/10 bg-plum-50/50 text-plum-700 transition-all hover:bg-brand-50 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-[#f0f2f5]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Avatar src={partnerAvatar || undefined} name={partnerName} size={40} className="ring-2 ring-brand-500/20" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">{partnerName}</h2>
              <span className="rounded-full bg-brand-100/70 px-2.5 py-0.5 text-[10px] font-black text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                {isMentor ? 'Học viên' : 'Mentor'}
              </span>
              {ctx.selectedMentor && (
                <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[10px] font-black text-mint-700 dark:bg-mint-950/50 dark:text-mint-300">
                  Mentor được chọn
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-plum-500 dark:text-[#b0b3b8]">
              Chat for Task · Request #{ctx.requestId}: <span className="font-semibold">{ctx.requestTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {deal && <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} isPaid={deal.isPaid} />}
          {deal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              leftIcon={<History className="h-3.5 w-3.5 text-brand-600" />}
              className="rounded-xl text-xs font-bold"
            >
              Lịch sử phiên bản
            </Button>
          )}
          {ctx.taskId && (
            <div className="relative" ref={taskActionMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskActionMenuOpen((v) => !v)}
                leftIcon={<CalendarClock className="h-3.5 w-3.5 text-blue-600" />}
                className="rounded-xl text-xs font-bold border-blue-200 dark:border-blue-900/40 hover:bg-blue-50/50"
              >
                Xử lý Task (UC109)
              </Button>
              {isTaskActionMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-2xl bg-card border border-border shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setIsTaskActionMenuOpen(false)}
                >
                  <button
                    onClick={() => setIsExtensionModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-xl transition text-left"
                  >
                    <CalendarClock className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-bold">Gia hạn Deadline</div>
                      <div className="text-[10px] text-muted-foreground">Tạo Ticket đề xuất hạn chót mới</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsAmendmentModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-xl transition text-left"
                  >
                    <Edit3 className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-bold">Điều chỉnh & Tăng tiền</div>
                      <div className="text-[10px] text-muted-foreground">Bổ sung phạm vi và tiền (mục 5.8)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsSettlementModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-xl transition text-left"
                  >
                    <Scale className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <div className="font-bold">Thỏa thuận dừng Task</div>
                      <div className="text-[10px] text-muted-foreground">Thương lượng chia quỹ (mục 5.6)</div>
                    </div>
                  </button>
                  {taskDetail?.permissions?.canSubmitCompletion && (
                    <button
                      onClick={() => {
                        setIsSubmitCompletionOpen(true)
                        setIsTaskActionMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition text-left"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">Nộp hoàn thành Task (UC110)</div>
                        <div className="text-[10px] text-muted-foreground">Gửi kết quả nghiệm thu cuối cùng</div>
                      </div>
                    </button>
                  )}
                  {taskDetail?.permissions?.canConfirmCompletion && (
                    <button
                      onClick={() => {
                        setIsReviewCompletionOpen(true)
                        setIsTaskActionMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition text-left"
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold">Nghiệm thu Task (UC110)</div>
                        <div className="text-[10px] text-muted-foreground">Xác nhận hoàn thành & quyết toán</div>
                      </div>
                    </button>
                  )}
                  {taskDetail?.permissions?.canSubmitSettlementTicket && (
                    <button
                      onClick={() => {
                        setIsSubmitSettlementTicketOpen(true)
                        setIsTaskActionMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition text-left"
                    >
                      <Send className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold">Gửi Settlement Ticket (UC111)</div>
                        <div className="text-[10px] text-muted-foreground">Gửi Admin giải ngân theo thỏa thuận</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {taskDetail?.permissions?.canSubmitCompletion && (
            <Button
              size="sm"
              onClick={() => setIsSubmitCompletionOpen(true)}
              leftIcon={<FileCheck className="h-3.5 w-3.5" />}
              className="rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
            >
              Nộp hoàn thành
            </Button>
          )}
          {taskDetail?.permissions?.canConfirmCompletion && (
            <Button
              size="sm"
              onClick={() => setIsReviewCompletionOpen(true)}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              className="rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
            >
              Nghiệm thu Task
            </Button>
          )}
          {taskDetail?.permissions?.canSubmitSettlementTicket && (
            <Button
              size="sm"
              onClick={() => setIsSubmitSettlementTicketOpen(true)}
              leftIcon={<Send className="h-3.5 w-3.5" />}
              className="rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
            >
              Gửi Settlement Ticket
            </Button>
          )}
          {ctx.taskId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTaskOpen(true)}
              leftIcon={<ClipboardCheck className="h-3.5 w-3.5" />}
              className="rounded-xl text-xs font-black"
            >
              Xem Task
            </Button>
          )}
        </div>
      </div>

      {/* Ngữ cảnh Request */}
      <div className="border-b border-plum-900/[0.06] bg-plum-50/50 px-4 py-2 text-xs dark:border-white/5 dark:bg-black/20 sm:px-6">
        <button
          type="button"
          onClick={() => setIsRequestPanelOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={isRequestPanelOpen}
        >
          <span className="flex min-w-0 items-center gap-2 text-plum-700 dark:text-plum-200">
            <FileText className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="shrink-0 font-bold">{MENTORING_REQUEST_FLOW_STATUS_LABELS[ctx.requestStatus] || ctx.requestStatus}</span>
            <span className="text-plum-400">•</span>
            <span className="truncate">
              Ngân sách {formatVnd(ctx.budgetMin)} – {formatVnd(ctx.budgetMax)}
              {ctx.expectedDeadline ? ` • Mong muốn trước ${format(new Date(ctx.expectedDeadline), 'dd/MM/yyyy')}` : ''}
            </span>
          </span>
          {isRequestPanelOpen ? <ChevronUp className="h-4 w-4 text-plum-400" /> : <ChevronDown className="h-4 w-4 text-plum-400" />}
        </button>
        {isRequestPanelOpen && (
          <div className="mt-2 grid gap-2 pb-1 text-plum-600 dark:text-[#b0b3b8] sm:grid-cols-2">
            <p className="sm:col-span-2 whitespace-pre-wrap text-plum-800 dark:text-[#e4e6eb]">{ctx.requestDescription}</p>
            <p>
              Loại Request: <b>{ctx.requestType === 'DIRECT' ? 'Gửi trực tiếp (UC101)' : 'Yêu cầu chung (UC100)'}</b>
              {ctx.industryName ? ` · ${ctx.industryName}` : ''}
            </p>
            <p>
              Nhiệm vụ: <b>{MENTORING_TASK_TYPE_LABELS[ctx.taskType || ''] || ctx.taskType}</b>
            </p>
            <p>
              Hình thức: <b>{MENTORING_WORKING_MODE_LABELS[ctx.workingMode || ''] || ctx.workingMode}</b> ·{' '}
              {MENTORING_PARTICIPATION_LABELS[ctx.participationType || ''] || ctx.participationType}
            </p>
            <p>
              Phản hồi của Mentor: <b>{ctx.responseStatus}</b>
              {ctx.respondedAt ? ` lúc ${format(new Date(ctx.respondedAt), 'dd/MM/yyyy HH:mm')}` : ''}
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(isMentor ? `/app/mentoring/incoming-requests/${ctx.requestId}` : `/app/mentoring/requests/${ctx.requestId}`)
              }
              className="justify-self-start font-bold text-brand-600 hover:underline dark:text-brand-400"
            >
              Mở trang chi tiết Request →
            </button>
          </div>
        )}
      </div>

      {/* Banner trạng thái nghiệp vụ */}
      {ctx.readOnly && (
        <div className="flex items-center gap-2.5 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 sm:px-6">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{ctx.readOnlyReason} Cuộc trò chuyện ở chế độ chỉ đọc, lịch sử được giữ nguyên.</span>
        </div>
      )}
      {isDealLockedUnpaid && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 sm:px-6">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Deal phiên bản {deal?.version} đã khóa · {formatVnd(Number(deal?.agreedPrice))}
            {lastPaymentStatus && lastPaymentStatus !== 'PAID'
              ? ` · Lần thanh toán gần nhất ${PAYMENT_STATUS_LABELS[lastPaymentStatus] || lastPaymentStatus}`
              : ''}
          </span>
          {deal?.canPay ? (
            <Button size="sm" onClick={openPayment} leftIcon={<CreditCard className="h-3.5 w-3.5" />} className="rounded-xl text-xs font-black">
              {lastPaymentStatus && lastPaymentStatus !== 'PENDING' ? 'Thanh toán lại' : 'Thanh toán'}
            </Button>
          ) : (
            <span>Đang chờ Học viên thanh toán</span>
          )}
        </div>
      )}
      {ctx.taskId && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mint-500/20 bg-mint-500/10 px-4 py-2.5 text-xs font-bold text-mint-800 dark:text-mint-300 sm:px-6">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            Thanh toán thành công · Task #{ctx.taskId} ({MENTORING_TASK_STATUS_LABELS[ctx.taskStatus || ''] || ctx.taskStatus}). Chat này tiếp tục được dùng cho Task.
          </span>
          <button type="button" onClick={() => setIsTaskOpen(true)} className="font-black underline-offset-2 hover:underline">
            Xem Task
          </button>
        </div>
      )}

      {/* Banner các Ticket xử lý Task (UC109: Gia hạn, Điều chỉnh, Phân chia tiền & UC110: Nghiệm thu Task & UC111: Settlement Ticket) */}
      {ctx.taskId && (
        <MentoringTaskResolutionBanner
          taskId={ctx.taskId}
          activeExtension={taskDetail?.activeExtension}
          activeAmendment={taskDetail?.activeAmendment}
          activeSettlementProposal={taskDetail?.activeSettlementProposal}
          latestCompletion={taskDetail?.latestCompletion}
          activeTicket={taskDetail?.activeTicket}
          taskStatus={taskDetail?.overview?.status || ctx.taskStatus}
          canConfirmCompletion={taskDetail?.permissions?.canConfirmCompletion}
          canSubmitSettlementTicket={taskDetail?.permissions?.canSubmitSettlementTicket}
          isStudent={!isMentor}
          isMentor={isMentor}
          onOpenTopUpPayment={openPayment}
          onOpenReviewCompletion={() => setIsReviewCompletionOpen(true)}
          onOpenSubmitSettlementTicket={() => setIsSubmitSettlementTicketOpen(true)}
          onRefresh={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* Dòng thời gian: tin nhắn + Deal Ticket */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-[#f8f9fa]/50 px-4 py-4 dark:bg-[#18191a] sm:px-6"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-plum-500 shadow-xs dark:bg-white/10">
              Đang tải tin nhắn cũ hơn...
            </span>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-40 w-3/4" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center space-y-2 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50">
              <MessagesSquare className="h-6 w-6" />
            </div>
            <p className="font-heading text-sm font-black text-plum-800 dark:text-[#f0f2f5]">Bắt đầu trao đổi về Request</p>
            <p className="max-w-sm text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
              {isMentor
                ? 'Trao đổi với Học viên, sau đó dùng nút "Giao dịch" để Chấp nhận Deal theo Request hoặc tạo Deal Ticket mới.'
                : 'Trao đổi với Mentor về phạm vi, giá và thời hạn. Deal Ticket của Mentor sẽ hiển thị tại đây.'}
            </p>
          </div>
        ) : (
          timeline.map((item) => {
            if (item.kind === 'message') {
              const adj = parseAdjustmentMessage(item.message.content)
              if (adj) {
                const targetSnapshot = snapshots.find((s) => s.version === adj.version)
                const adjTicket = buildAdjustmentTicket(item.message, adj, targetSnapshot)
                const isLatest = Boolean(deal && adj.version === deal.version)
                return (
                  <MentoringAdjustmentTicketEmbed
                    key={`adj-m-${item.message.id}`}
                    ticket={adjTicket}
                    isMe={item.message.senderId === currentUserId}
                    isMentor={isMentor}
                    canCreateDealTicket={Boolean(ctx.canCreateDealTicket)}
                    isLatestSuperseded={isLatest}
                    onReissue={() => setIsFormOpen(true)}
                    onViewDetail={() => setTicketModal({ ticket: adjTicket, version: adj.version })}
                  />
                )
              }
              return <MessageBubble key={`m-${item.message.id}`} message={item.message} isMe={item.message.senderId === currentUserId} />
            }
            const ticket = buildTicket(item.snapshot)
            const actions = actionsFor(item.snapshot.version)
            return (
              <MentoringDiscordTicketEmbed
                key={`t-${item.snapshot.id}`}
                ticket={ticket}
                isMe={ticket.senderId === currentUserId}
                isRecipient={!isMentor}
                canAct={actions.canAct}
                onConfirm={actions.onConfirm}
                onReject={actions.onReject}
                onRevert={actions.onRevert}
                onPay={actions.onPay}
                onViewDetail={() => setTicketModal({ ticket, version: item.snapshot.version })}
                isConfirming={confirmMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            )
          })
        )}
      </div>

      {/* Ô nhập tin nhắn */}
      <div className="border-t border-plum-900/[0.08] bg-white p-3 dark:border-white/10 dark:bg-[#242526]">
        {!ctx.canSendMessage ? (
          <div className="rounded-2xl bg-plum-50 p-3 text-center text-xs font-bold text-plum-500 dark:bg-white/5 dark:text-[#b0b3b8]">
            {ctx.readOnlyReason || 'Cuộc hội thoại này ở chế độ chỉ đọc.'}
          </div>
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            leftActions={
              isMentor ? (
                <div className="relative" ref={dealMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsDealMenuOpen((v) => !v)}
                    title="Giao dịch Deal Ticket"
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-brand-200/90 bg-gradient-to-r from-brand-50 to-orange-50/60 px-3 text-xs font-bold text-brand-700 transition-all hover:bg-brand-100 active:scale-95 dark:border-brand-800/40 dark:bg-brand-950/40 dark:text-brand-300"
                  >
                    <Handshake className="h-4 w-4 shrink-0" />
                    <span className="font-heading font-black">Giao dịch</span>
                    <ChevronUp className={`h-3.5 w-3.5 transition-transform ${isDealMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDealMenuOpen && (
                    <div className="absolute bottom-13 left-0 z-40 w-72 space-y-1 rounded-2xl border border-plum-900/10 bg-white p-2 text-xs shadow-2xl dark:border-white/10 dark:bg-[#242526] sm:w-80">
                      <button
                        type="button"
                        disabled={!ctx.canAcceptDealByRequest}
                        onClick={() => {
                          setIsDealMenuOpen(false)
                          setIsAcceptByRequestOpen(true)
                        }}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-brand-50/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
                      >
                        <span className="rounded-lg bg-mint-100/70 p-1.5 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
                          <ThumbsUp className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-plum-900 dark:text-[#f0f2f5]">Chấp nhận Deal theo Request</span>
                          <span className="block text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                            {ctx.canAcceptDealByRequest
                              ? `Giá ${formatVnd(requestPrice)} · deadline theo Request`
                              : ctx.acceptByRequestUnavailableReason || 'Không khả dụng ở trạng thái hiện tại'}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={!ctx.canCreateDealTicket}
                        onClick={() => {
                          setIsDealMenuOpen(false)
                          setIsFormOpen(true)
                        }}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-brand-50/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
                      >
                        <span className="rounded-lg bg-brand-100/70 p-1.5 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                          <Edit3 className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-plum-900 dark:text-[#f0f2f5]">Deal lại / Tạo Deal Ticket</span>
                          <span className="block text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                            {ctx.canCreateDealTicket ? 'Nhập phạm vi, giá, deadline và kết quả mới' : 'Deal đã khóa hoặc Request không còn mở'}
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : undefined
            }
          />
        )}
      </div>

      {/* Dialog: Chấp nhận Deal theo Request */}
      {isAcceptByRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-plum-900/10 bg-white p-6 text-left shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
            <h4 className="font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">Chấp nhận Deal theo Request</h4>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Hệ thống tạo Deal Ticket từ điều kiện hiện tại của Request. Bạn được tính là đã xác nhận phiên bản này; Học viên cần xác nhận để khóa Deal.
            </p>
            <ul className="space-y-1.5 rounded-2xl bg-plum-50/70 p-3 text-xs text-plum-700 dark:bg-white/5 dark:text-[#e4e6eb]">
              <li>Giá: <b>{formatVnd(requestPrice)}</b> (ngân sách tối đa Học viên đề xuất)</li>
              <li>Deadline: <b>{ctx.expectedDeadline ? format(new Date(ctx.expectedDeadline), 'dd/MM/yyyy HH:mm') : '—'}</b></li>
              <li>Nhiệm vụ: <b>{MENTORING_TASK_TYPE_LABELS[ctx.taskType || ''] || ctx.taskType}</b></li>
              <li>Hình thức: <b>{MENTORING_WORKING_MODE_LABELS[ctx.workingMode || ''] || ctx.workingMode}</b></li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAcceptByRequestOpen(false)} disabled={proposeMutation.isPending}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptByRequest}
                disabled={proposeMutation.isPending}
                leftIcon={proposeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                className="rounded-xl font-black"
              >
                Gửi Deal Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Từ chối */}
      {rejectTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-2xl dark:border-gray-800 dark:bg-[#202124]">
            <h4 className="font-heading text-base font-black text-gray-900 dark:text-white">Từ chối Deal Ticket phiên bản {rejectTarget}</h4>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              Chỉ từ chối đề xuất hiện tại; Request vẫn giữ nguyên và hai bên có thể tiếp tục trao đổi.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do (ví dụ: mức giá chưa phù hợp, deadline quá gấp...)"
              className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-[#2d2e30] dark:text-gray-100"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)} disabled={rejectMutation.isPending}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleReject} disabled={rejectMutation.isPending} className="rounded-xl bg-red-600 text-white hover:bg-red-700">
                {rejectMutation.isPending ? 'Đang gửi...' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Yêu cầu điều chỉnh */}
      {adjustTarget !== null && (() => {
        const targetSnap = snapshots.find((s) => s.version === adjustTarget)
        const currentPrice = targetSnap ? targetSnap.agreedPrice : deal?.agreedPrice
        const currentDeadline = targetSnap ? targetSnap.deadline : deal?.deadline
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md space-y-4 rounded-3xl border border-plum-900/10 bg-white p-6 text-left shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">
                    Gửi Ticket Yêu cầu điều chỉnh Deal
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                    Điều chỉnh Deal Ticket phiên bản {adjustTarget}
                  </p>
                </div>
              </div>

              {/* Tóm tắt điều khoản phiên bản hiện tại */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-plum-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-[#e4e6eb] space-y-1">
                <div className="flex justify-between">
                  <span className="text-plum-500 dark:text-gray-400">Giá đề xuất hiện tại:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{formatVnd(Number(currentPrice || 0))}</span>
                </div>
                {currentDeadline && (
                  <div className="flex justify-between">
                    <span className="text-plum-500 dark:text-gray-400">Deadline hiện tại:</span>
                    <span className="font-semibold">{format(new Date(currentDeadline), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-plum-800 dark:text-gray-200">
                  Nội dung điều chỉnh mong muốn (Ghi chú Ticket):
                </label>
                <textarea
                  rows={3}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Ví dụ: Mong muốn giảm giá xuống 200.000đ hoặc dời deadline thêm 3 ngày..."
                  className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-[#3a3b3c] dark:text-[#f0f2f5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setAdjustTarget(null)} disabled={adjustMutation.isPending}>
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleRequestAdjustment}
                  disabled={adjustMutation.isPending}
                  className="rounded-xl font-black bg-amber-500 text-white hover:bg-amber-600"
                  leftIcon={adjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                >
                  {adjustMutation.isPending ? 'Đang gửi...' : 'Gửi Ticket điều chỉnh'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal chi tiết một phiên bản Ticket */}
      {ticketModal && (() => {
        const actions = actionsFor(ticketModal.version)
        const isAdj = ticketModal.ticket.ticketType === 'ADJUSTMENT'
        const mentorCanReissue = isMentor && Boolean(ctx?.canCreateDealTicket)
        return (
          <MentoringTicketDetailModal
            isOpen
            onClose={() => setTicketModal(null)}
            ticket={ticketModal.ticket}
            isRecipient={!isMentor}
            canAct={!isAdj && actions.canAct}
            onConfirm={!isAdj && actions.onConfirm ? async () => { setTicketModal(null); await actions.onConfirm?.() } : undefined}
            onReject={!isAdj && actions.onReject ? () => { setTicketModal(null); actions.onReject?.() } : undefined}
            onRevert={isAdj
              ? (mentorCanReissue ? () => { setTicketModal(null); setIsFormOpen(true) } : undefined)
              : (actions.onRevert ? () => { setTicketModal(null); actions.onRevert?.() } : undefined)}
            onPay={!isAdj && actions.onPay ? () => { setTicketModal(null); actions.onPay?.() } : undefined}
            isConfirming={confirmMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        )
      })()}

      {isFormOpen && (
        <MentoringDealFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          conversationId={conversationId}
          deal={deal}
          requestDefaults={{
            title: ctx.requestTitle,
            description: ctx.requestDescription,
            budgetMin: ctx.budgetMin,
            budgetMax: ctx.budgetMax,
            expectedDeadline: ctx.expectedDeadline,
            workingMode: ctx.workingMode,
            participationType: ctx.participationType,
            taskType: ctx.taskType,
          }}
        />
      )}

      {isPaymentOpen && paymentDeal && (
        <MentoringTaskPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false)
            refetch()
          }}
          deal={paymentDeal}
          onSuccess={() => refetch()}
        />
      )}

      {isHistoryOpen && deal && (
        <MentoringDealActionModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} dealId={deal.id} hideOpenChat />
      )}

      <MentoringTaskDetailModal isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} taskId={ctx.taskId} />

      {/* Modals nghiệp vụ UC109: Gia hạn, Điều chỉnh, Thỏa thuận dừng Task */}
      {isExtensionModalOpen && ctx.taskId && (
        <MentoringDeadlineExtensionModal
          isOpen={isExtensionModalOpen}
          onClose={() => setIsExtensionModalOpen(false)}
          taskId={ctx.taskId}
          currentDeadline={taskDetail?.overview?.deadline || ctx.expectedDeadline || new Date().toISOString()}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {isAmendmentModalOpen && ctx.taskId && (
        <MentoringTaskAmendmentModal
          isOpen={isAmendmentModalOpen}
          onClose={() => setIsAmendmentModalOpen(false)}
          taskId={ctx.taskId}
          currentScope={taskDetail?.overview?.taskScope || ctx.requestDescription || ''}
          currentExpectedResult={taskDetail?.deal?.expectedResult || ''}
          currentPrice={taskDetail?.overview?.agreedPrice || Number(deal?.agreedPrice) || 0}
          currentDeadline={taskDetail?.overview?.deadline || ctx.expectedDeadline || undefined}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {isSettlementModalOpen && ctx.taskId && (
        <MentoringSettlementProposalModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          taskId={ctx.taskId}
          totalBudget={taskDetail?.overview?.agreedPrice || Number(deal?.agreedPrice) || 0}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* UC110: Modal nộp kết quả hoàn thành Task (Mentor) */}
      {isSubmitCompletionOpen && ctx.taskId && (
        <MentoringTaskCompletionModal
          isOpen={isSubmitCompletionOpen}
          onClose={() => setIsSubmitCompletionOpen(false)}
          taskId={ctx.taskId}
          taskTitle={taskDetail?.overview?.taskTitle}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* UC110: Modal xem xét & nghiệm thu hoàn thành Task (Student) */}
      {isReviewCompletionOpen && ctx.taskId && taskDetail?.latestCompletion && (
        <MentoringTaskReviewModal
          isOpen={isReviewCompletionOpen}
          onClose={() => setIsReviewCompletionOpen(false)}
          taskId={ctx.taskId}
          completion={taskDetail.latestCompletion}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* UC111: Modal gửi Settlement Ticket đã thỏa thuận lên Admin */}
      {isSubmitSettlementTicketOpen && ctx.taskId && (
        <MentoringSubmitSettlementTicketModal
          isOpen={isSubmitSettlementTicketOpen}
          onClose={() => setIsSubmitSettlementTicketOpen(false)}
          taskId={ctx.taskId}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}
    </div>
  )
}
