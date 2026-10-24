import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { mentoringWalletApi } from '../api/mentoringWalletApi'
import { MentorReviewModal } from './MentorReviewModal'
import { MentoringStatusStrip } from './MentoringUi'
import {
  AlertCircle,
  AlertTriangle,
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
  MoreHorizontal,
  RefreshCw,
  Star,
  ThumbsUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, Button, Skeleton, toast, DialogFrame } from '@/components/ui'
import {
  MessageBubble,
  MessageInput,
  useMessages,
  useMarkAsRead,
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
import { MentoringCreateDisputeModal } from './MentoringCreateDisputeModal'
import { MentoringAddEvidenceModal } from './MentoringAddEvidenceModal'
import { MentoringTaskReportModal } from './MentoringTaskReportModal'
import { MentoringTaskCompletionModal } from './MentoringTaskCompletionModal'
import { MentoringTaskReviewModal } from './MentoringTaskReviewModal'
import { MentoringTicketDiscussionModal } from './MentoringTicketDiscussionModal'
import { useTaskDetail } from '../hooks/useMentoringTasks'
import { useMentoringConversation } from '../hooks/useMentoringConversation'
import { useConfirmDeal, useProposeDeal, useRejectDeal, useRequestAdjustment } from '../hooks/useMentoringDeals'
import { CalendarClock, Scale, Send, Paperclip } from 'lucide-react'
import type { MentoringDeal, MentoringDealSnapshot } from '../model/mentoringDealTypes'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_REQUEST_FLOW_STATUS_LABELS,
  MENTORING_RESPONSE_STATUS_LABELS,
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
  const isStudent = ctx?.myRole === 'STUDENT'
  const isGroupMember = ctx?.myRole === 'GROUP_MEMBER'
  const groupParticipants = ctx?.participants ?? []
  const isGroupChat = Boolean(ctx?.groupId) && groupParticipants.length > 2
  const partnerId = isMentor ? ctx?.studentId : ctx?.mentorUserId
  const partnerName = (isMentor ? ctx?.studentName : ctx?.mentorName) || (isMentor ? 'Học viên' : 'Mentor')
  const partnerAvatar = isMentor ? ctx?.studentAvatar : ctx?.mentorAvatar
  const { mutate: markConversationAsRead } = useMarkAsRead()

  useEffect(() => {
    markConversationAsRead(conversationId)
  }, [conversationId, markConversationAsRead])

  // Trạng thái các modal / dialog
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState(false)
  const [isDealMenuOpen, setIsDealMenuOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAcceptByRequestOpen, setIsAcceptByRequestOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentDeal, setPaymentDeal] = useState<MentoringDeal | null>(null)
  const [topUpAmendment, setTopUpAmendment] = useState<{ id: number; version?: number; additionalAmount?: number } | null>(null)
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

  // UC112: Mở Dispute Ticket khiếu nại tranh chấp
  const [isCreateDisputeOpen, setIsCreateDisputeOpen] = useState(false)

  // UC113: Bổ sung bằng chứng tranh chấp
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false)

  // UC114: Báo cáo kết quả Task & Tài chính
  const [isTaskReportOpen, setIsTaskReportOpen] = useState(false)

  // UC119: Trao đổi & Hòa giải trong Ticket tranh chấp
  const [isTicketDiscussionOpen, setIsTicketDiscussionOpen] = useState(false)

  const { data: taskDetail, refetch: refetchTask } = useTaskDetail(ctx?.taskId ?? undefined)
  // Task đã kết thúc: ẩn mọi thao tác Task và nhắn tin, chỉ còn xem lịch sử trao đổi
  const currentTaskStatus = taskDetail?.overview?.status || ctx?.taskStatus
  const isTaskFinished =
    Boolean(ctx?.taskId) && ['COMPLETED', 'CANCELLED', 'RESOLVED'].includes(currentTaskStatus || '')
  const isTaskOverdue = Boolean(taskDetail?.overview?.overdue)

  // Học viên đánh giá Mentor sau khi Task hoàn thành (mỗi Task một lần)
  const canReviewMentor = ctx?.myRole === 'STUDENT' && currentTaskStatus === 'COMPLETED' && Boolean(ctx?.taskId)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const { data: myReview, refetch: refetchReview } = useQuery({
    queryKey: ['mentor-review', 'task', ctx?.taskId],
    queryFn: () => mentoringWalletApi.getTaskReview(ctx!.taskId!),
    enabled: canReviewMentor,
  })
  const submitReview = useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      mentoringWalletApi.submitReview({ taskId: ctx!.taskId!, rating: payload.rating, comment: payload.comment || undefined }),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá Mentor!')
      setIsReviewOpen(false)
      refetchReview()
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể gửi đánh giá'),
  })

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
      markConversationAsRead(conversationId)
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

  // Business events already have dedicated tickets and banners. Keep the chat
  // focused on the conversation, except actionable adjustment requests.
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.type !== 'SYSTEM' || Boolean(parseAdjustmentMessage(message.content))
      ),
    [messages]
  )

  const timeline = useMemo<TimelineItem[]>(() => {
    const oldestLoaded = messages.length > 0 ? new Date(messages[0].createdAt).getTime() : 0
    const items: TimelineItem[] = visibleMessages.map((m) => ({
      kind: 'message',
      at: new Date(m.createdAt).getTime(),
      message: m,
    }))
    snapshots.forEach((s) => {
      const at = new Date(s.createdAt).getTime()
      // Khi còn trang tin nhắn cũ chưa tải, chỉ hiển thị các phiên bản nằm trong khoảng thời gian đã tải
      if (!hasNextPage || at >= oldestLoaded) items.push({ kind: 'ticket', at, snapshot: s })
    })
    return items.sort((a, b) => a.at - b.at || (a.kind === 'ticket' ? -1 : 1))
  }, [messages, visibleMessages, snapshots, hasNextPage])

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
    setTopUpAmendment(null)
    setPaymentDeal(deal)
    setIsPaymentOpen(true)
  }

  // Thanh toán bổ sung cho Ticket điều chỉnh đã được chấp nhận (không phải thanh toán Deal ban đầu)
  const openTopUpPayment = () => {
    const amendment = taskDetail?.activeAmendment
    if (!deal || !amendment || amendment.status !== 'AWAITING_TOPUP') return
    setTopUpAmendment({ id: amendment.id, version: amendment.version, additionalAmount: amendment.additionalAmount })
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
    const studentPending = isLatest && isStudent && Boolean(deal?.canConfirm)
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
      <div className="space-y-3 rounded-3xl border border-border bg-surface p-6 dark:bg-bg">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !ctx) {
    return (
      <div className="rounded-3xl border border-danger-border bg-danger-soft p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-danger" />
        <p className="text-sm font-bold text-danger">
          {error?.message || 'Không thể tải cuộc trò chuyện.'}
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

  const permissions = taskDetail?.permissions
  const activeAmendment = taskDetail?.activeAmendment
  const isTaskActive = Boolean(ctx.taskId) && !isTaskFinished && (isMentor || isStudent)

  // Một thao tác chính duy nhất theo ngữ cảnh, để người dùng luôn biết bước tiếp theo
  type PrimaryAction = { label: string; icon: React.ReactNode; onClick: () => void }
  let primaryAction: PrimaryAction | null = null
  if (isTaskFinished) {
    if (canReviewMentor && !myReview) {
      primaryAction = { label: 'Đánh giá Mentor', icon: <Star className="h-3.5 w-3.5" />, onClick: () => setIsReviewOpen(true) }
    }
  } else if (isStudent && isDealLockedUnpaid && deal?.canPay) {
    primaryAction = {
      label: lastPaymentStatus && lastPaymentStatus !== 'PENDING' ? 'Thanh toán lại' : 'Thanh toán',
      icon: <CreditCard className="h-3.5 w-3.5" />,
      onClick: openPayment,
    }
  } else if (isStudent && activeAmendment?.status === 'AWAITING_TOPUP' && activeAmendment.canTopUp) {
    primaryAction = { label: 'Thanh toán bổ sung', icon: <CreditCard className="h-3.5 w-3.5" />, onClick: openTopUpPayment }
  } else if (permissions?.canConfirmCompletion && taskDetail?.latestCompletion) {
    primaryAction = { label: 'Nghiệm thu', icon: <CheckCircle2 className="h-3.5 w-3.5" />, onClick: () => setIsReviewCompletionOpen(true) }
  } else if (permissions?.canSubmitCompletion) {
    primaryAction = { label: 'Nộp hoàn thành', icon: <FileCheck className="h-3.5 w-3.5" />, onClick: () => setIsSubmitCompletionOpen(true) }
  }

  type ActionItem = { label: string; hint?: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }
  const viewItems: ActionItem[] = []
  if (ctx.taskId) viewItems.push({ label: 'Xem Task', hint: 'Tiến độ, Work Log, thông tin Deal', icon: <ClipboardCheck />, onClick: () => setIsTaskOpen(true) })
  if (deal) viewItems.push({ label: 'Lịch sử phiên bản Deal', icon: <History />, onClick: () => setIsHistoryOpen(true) })
  viewItems.push({
    label: 'Chi tiết yêu cầu',
    icon: <FileText />,
    onClick: () => navigate(isMentor ? `/app/mentoring/incoming-requests/${ctx.requestId}` : `/app/mentoring/requests/${ctx.requestId}`),
  })
  if (ctx.taskId && isMentor) viewItems.push({ label: 'Báo cáo Task & tài chính', icon: <FileText />, onClick: () => setIsTaskReportOpen(true) })

  const proposalItems: ActionItem[] = []
  if (isTaskActive && isMentor && permissions?.canRequestExtension && taskDetail?.activeExtension?.status !== 'PENDING') {
    proposalItems.push({ label: 'Gia hạn deadline', hint: 'Gửi đề xuất hạn chót mới', icon: <CalendarClock />, onClick: () => setIsExtensionModalOpen(true) })
  }
  if (isTaskActive && isMentor && permissions?.canRequestAmendment) {
    proposalItems.push({ label: 'Điều chỉnh & tăng tiền', hint: 'Thay đổi phạm vi, deadline hoặc thêm tiền', icon: <Edit3 />, onClick: () => setIsAmendmentModalOpen(true) })
  }
  if (isTaskActive && permissions?.canProposeSettlement) {
    proposalItems.push({ label: 'Dừng Task & chia quỹ', hint: 'Thỏa thuận kết thúc sớm', icon: <Scale />, onClick: () => setIsSettlementModalOpen(true) })
  }

  const supportItems: ActionItem[] = []
  if (isTaskActive && permissions?.canSubmitSettlementTicket) {
    supportItems.push({ label: 'Gửi thỏa thuận cho Ban Quản Trị', icon: <Send />, onClick: () => setIsSubmitSettlementTicketOpen(true) })
  }
  if (taskDetail?.activeTicket) {
    supportItems.push({ label: 'Trao đổi với Ban Quản Trị', icon: <MessagesSquare />, onClick: () => setIsTicketDiscussionOpen(true) })
    supportItems.push({ label: 'Bằng chứng tranh chấp', icon: <Paperclip />, onClick: () => setIsAddEvidenceOpen(true) })
  }
  if (isTaskActive && permissions?.canCreateDisputeTicket) {
    supportItems.push({ label: 'Mở khiếu nại', hint: 'Nhờ Ban Quản Trị phân xử', icon: <AlertTriangle />, onClick: () => setIsCreateDisputeOpen(true), danger: true })
  }

  const actionGroups = [
    { title: 'Xem', items: viewItems },
    { title: 'Đề xuất', items: proposalItems },
    { title: 'Hỗ trợ', items: supportItems },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm dark:bg-bg">
      {/* Header: người trao đổi · một thao tác chính theo ngữ cảnh · menu thao tác */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={partnerAvatar || undefined} name={partnerName} size={40} className="ring-2 ring-primary/20" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate font-display text-base font-bold text-text">{partnerName}</h2>
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold text-text-muted">
                {isMentor ? 'Học viên' : 'Mentor'}
              </span>
              {isTaskOverdue && (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                  Quá hạn
                </span>
              )}
              {isGroupMember && (
                <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
                  Thành viên nhóm
                </span>
              )}
            </div>
            <p className="truncate text-xs text-text-subtle">
              Yêu cầu #{ctx.requestId} · {ctx.requestTitle}
            </p>
            {ctx.groupId && groupParticipants.length > 0 && (
              <div className="mt-1 flex items-center gap-2" title={groupParticipants.map((p) => p.fullName).join(', ')}>
                <div className="flex -space-x-1.5">
                  {groupParticipants.slice(0, 6).map((p) => (
                    <Avatar key={p.id} src={p.avatarUrl || undefined} name={p.fullName} size={20} className="ring-2 ring-surface" />
                  ))}
                </div>
                <span className="truncate text-xs font-medium text-text-subtle">
                  Nhóm {ctx.groupName} · {groupParticipants.length} người
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deal && !ctx.taskId && <MentoringDealBadge status={deal.status} isLocked={deal.isLocked} isPaid={deal.isPaid} />}
          {primaryAction && (
            <Button size="sm" onClick={primaryAction.onClick} leftIcon={primaryAction.icon} className="h-9 rounded-xl text-xs">
              {primaryAction.label}
            </Button>
          )}
          {actionGroups.length > 0 && (
            <div className="relative" ref={taskActionMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskActionMenuOpen((v) => !v)}
                leftIcon={<MoreHorizontal className="h-4 w-4" />}
                aria-expanded={isTaskActionMenuOpen}
                className="h-9 rounded-xl text-xs"
              >
                Thao tác
              </Button>
              {isTaskActionMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 max-h-[min(520px,calc(100vh-200px))] w-72 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-2xl">
                  {actionGroups.map((group) => (
                    <div key={group.title} className="py-1">
                      <p className="px-2.5 pb-1 pt-1.5 text-xs font-bold uppercase tracking-wide text-text-subtle">{group.title}</p>
                      {group.items.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setIsTaskActionMenuOpen(false)
                            item.onClick()
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-surface-2 ${item.danger ? 'text-coral-600 dark:text-coral-300' : 'text-plum-800 dark:text-text'}`}
                        >
                          <span className={`mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4 ${item.danger ? 'text-coral-600' : 'text-brand-600'}`}>{item.icon}</span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold">{item.label}</span>
                            {item.hint && <span className="block text-xs font-normal text-text-subtle">{item.hint}</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ngữ cảnh Request */}
      <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs sm:px-6">
        <button
          type="button"
          onClick={() => setIsRequestPanelOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={isRequestPanelOpen}
        >
          <span className="flex min-w-0 items-center gap-2 text-text-muted">
            <FileText className="h-4 w-4 shrink-0 text-primary-solid" />
            <span className="shrink-0 font-bold">{MENTORING_REQUEST_FLOW_STATUS_LABELS[ctx.requestStatus] || ctx.requestStatus}</span>
            <span className="text-text-subtle">•</span>
            <span className="truncate">
              Ngân sách {requestPrice ? formatVnd(requestPrice) : 'Thỏa thuận'}
              {ctx.expectedDeadline ? ` • Mong muốn trước ${format(new Date(ctx.expectedDeadline), 'dd/MM/yyyy')}` : ''}
            </span>
          </span>
          {isRequestPanelOpen ? <ChevronUp className="h-4 w-4 text-text-subtle" /> : <ChevronDown className="h-4 w-4 text-text-subtle" />}
        </button>
        {isRequestPanelOpen && (
          <div className="mt-2 grid gap-2 pb-1 text-text-muted sm:grid-cols-2">
            <p className="sm:col-span-2 whitespace-pre-wrap text-text">{ctx.requestDescription}</p>
            <p>
              Loại yêu cầu: <b>{ctx.requestType === 'DIRECT' ? 'Gửi trực tiếp' : 'Yêu cầu chung'}</b>
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
              Phản hồi của Mentor: <b>{MENTORING_RESPONSE_STATUS_LABELS[ctx.responseStatus || ''] || ctx.responseStatus}</b>
              {ctx.respondedAt ? ` lúc ${format(new Date(ctx.respondedAt), 'dd/MM/yyyy HH:mm')}` : ''}
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(isMentor ? `/app/mentoring/incoming-requests/${ctx.requestId}` : `/app/mentoring/requests/${ctx.requestId}`)
              }
              className="justify-self-start font-bold text-primary-solid hover:underline"
            >
              Mở trang chi tiết Request →
            </button>
          </div>
        )}
      </div>

      {/* Dải trạng thái: chỉ đọc · Deal đã khóa chờ thanh toán · Task đang chạy · Task đã kết thúc */}
      {ctx.readOnly && !isTaskFinished && (
        <MentoringStatusStrip tone="gold" icon={<AlertTriangle />}>
          {ctx.readOnlyReason} Cuộc trò chuyện chỉ còn để xem lại.
        </MentoringStatusStrip>
      )}
      {isDealLockedUnpaid && (
        <MentoringStatusStrip
          tone="brand"
          icon={<CreditCard />}
          action={!deal?.canPay ? <span className="font-medium">Chờ Học viên thanh toán</span> : undefined}
        >
          Deal v{deal?.version} đã chốt · {formatVnd(Number(deal?.agreedPrice))}
          {lastPaymentStatus && lastPaymentStatus !== 'PAID'
            ? ` · Lần thanh toán gần nhất ${PAYMENT_STATUS_LABELS[lastPaymentStatus] || lastPaymentStatus}`
            : ''}
        </MentoringStatusStrip>
      )}
      {ctx.taskId && !isTaskFinished && (
        <MentoringStatusStrip
          tone="neutral"
          icon={<ClipboardCheck />}
          action={
            <button type="button" onClick={() => setIsTaskOpen(true)} className="font-semibold text-primary-solid hover:underline">
              Xem Task
            </button>
          }
        >
          Task #{ctx.taskId} · {MENTORING_TASK_STATUS_LABELS[currentTaskStatus || ''] || currentTaskStatus}
          {taskDetail?.overview?.deadline ? ` · Deadline ${format(new Date(taskDetail.overview.deadline), 'HH:mm dd/MM/yyyy')}` : ''}
        </MentoringStatusStrip>
      )}
      {isTaskFinished && (
        <MentoringStatusStrip
          tone={currentTaskStatus === 'COMPLETED' ? 'mint' : 'neutral'}
          icon={<CheckCircle2 />}
          action={canReviewMentor && myReview ? <span className="font-semibold">Bạn đã đánh giá {myReview.rating}★</span> : undefined}
        >
          {currentTaskStatus === 'COMPLETED'
            ? 'Công việc đã hoàn thành.'
            : currentTaskStatus === 'CANCELLED'
              ? 'Công việc đã dừng.'
              : 'Công việc đã được Ban Quản Trị giải quyết.'}{' '}
          Cuộc trò chuyện chỉ còn để xem lại.
        </MentoringStatusStrip>
      )}
      {isReviewOpen && (
        <MentorReviewModal
          mentorName={ctx.mentorName || 'Mentor'}
          isSubmitting={submitReview.isPending}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={(rating, comment) => submitReview.mutate({ rating, comment })}
        />
      )}

      {/* Banner các Ticket xử lý Task (UC109: Gia hạn, Điều chỉnh, Phân chia tiền & UC110: Nghiệm thu Task & UC111: Settlement Ticket) */}
      {ctx.taskId && !isTaskFinished && (
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
          canCreateDisputeTicket={taskDetail?.permissions?.canCreateDisputeTicket}
          canSubmitDisputeEvidence={taskDetail?.permissions?.canSubmitDisputeEvidence}
          isStudent={isStudent}
          isMentor={isMentor}
          onOpenTopUpPayment={openTopUpPayment}
          onOpenReviewCompletion={() => setIsReviewCompletionOpen(true)}
          onOpenSubmitSettlementTicket={() => setIsSubmitSettlementTicketOpen(true)}
          onOpenCreateDispute={() => setIsCreateDisputeOpen(true)}
          onOpenAddEvidence={() => setIsAddEvidenceOpen(true)}
          onOpenTaskReport={() => setIsTaskReportOpen(true)}
          onOpenTicketDiscussion={() => setIsTicketDiscussionOpen(true)}
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
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8f9fa]/50 px-4 py-4 dark:bg-bg sm:px-6"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-text-subtle shadow-xs">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-solid">
              <MessagesSquare className="h-6 w-6" />
            </div>
            <p className="font-display text-sm font-bold text-text">Bắt đầu trao đổi về Request</p>
            <p className="max-w-sm text-xs leading-relaxed text-text-subtle">
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
              return (
                <MessageBubble
                  key={`m-${item.message.id}`}
                  message={item.message}
                  isMe={item.message.senderId === currentUserId}
                  isGroup={isGroupChat}
                />
              )
            }
            const ticket = buildTicket(item.snapshot)
            const actions = actionsFor(item.snapshot.version)
            return (
              <MentoringDiscordTicketEmbed
                key={`t-${item.snapshot.id}`}
                ticket={ticket}
                isMe={ticket.senderId === currentUserId}
                isRecipient={isStudent}
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
      <div className="border-t border-border bg-surface p-3">
        {!ctx.canSendMessage ? (
          <div className="rounded-2xl bg-surface-2 p-3 text-center text-xs font-bold text-text-subtle">
            {isTaskFinished ? 'Công việc đã kết thúc, không thể nhắn tin thêm.' : ctx.readOnlyReason || 'Cuộc hội thoại này ở chế độ chỉ đọc.'}
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
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-brand-200/90 px-3 text-xs font-bold text-primary-solid transition hover:bg-primary-soft active:scale-95 dark:border-brand-700/40 dark:bg-brand-700/40"
                  >
                    <Handshake className="h-4 w-4 shrink-0" />
                    <span className="font-display font-bold">Giao dịch</span>
                    <ChevronUp className={`h-3.5 w-3.5 transition-transform ${isDealMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDealMenuOpen && (
                    <div className="absolute bottom-13 left-0 z-40 w-72 space-y-1 rounded-2xl border border-border bg-surface p-2 text-xs shadow-2xl sm:w-80">
                      <button
                        type="button"
                        disabled={!ctx.canAcceptDealByRequest}
                        onClick={() => {
                          setIsDealMenuOpen(false)
                          setIsAcceptByRequestOpen(true)
                        }}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="rounded-lg bg-success-soft p-1.5 text-success">
                          <ThumbsUp className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-text">Chấp nhận Deal theo Request</span>
                          <span className="block text-xs text-text-subtle">
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
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="rounded-lg bg-brand-100/70 p-1.5 text-primary-solid dark:bg-brand-700/60">
                          <Edit3 className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-text">Deal lại / Tạo Deal Ticket</span>
                          <span className="block text-xs text-text-subtle">
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
      {isAcceptByRequestOpen && typeof document !== 'undefined' && <DialogFrame
          onClose={() => setIsAcceptByRequestOpen(false)}
          zIndexClassName="z-[100]"
          maxWidthClassName="max-w-md"
          className="space-y-4 p-6 text-left"
        >
            <h4 className="font-display text-base font-bold text-text">Chấp nhận Deal theo Request</h4>
            <p className="text-xs text-text-subtle">
              Hệ thống tạo Deal Ticket từ điều kiện hiện tại của Request. Bạn được tính là đã xác nhận phiên bản này; Học viên cần xác nhận để khóa Deal.
            </p>
            <ul className="space-y-1.5 rounded-2xl bg-cream-100/70 p-3 text-xs text-text-muted dark:bg-white/5">
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
                className="rounded-xl font-bold"
              >
                Gửi Deal Ticket
              </Button>
            </div>
          </DialogFrame>}

      {/* Dialog: Từ chối */}
      {rejectTarget !== null && typeof document !== 'undefined' && <DialogFrame
          onClose={() => setRejectTarget(null)}
          zIndexClassName="z-[100]"
          maxWidthClassName="max-w-md"
          className="space-y-4 p-6 text-left"
        >
            <h4 className="font-display text-base font-bold text-text">Từ chối Deal Ticket phiên bản {rejectTarget}</h4>
            <p className="text-xs leading-relaxed text-text-muted">
              Chỉ từ chối đề xuất hiện tại; Request vẫn giữ nguyên và hai bên có thể tiếp tục trao đổi.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do (ví dụ: mức giá chưa phù hợp, deadline quá gấp...)"
              className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-text focus:border-danger focus:outline-none dark:bg-[#2d2e30]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)} disabled={rejectMutation.isPending}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleReject} disabled={rejectMutation.isPending} className="rounded-xl bg-danger text-text-inverse hover:opacity-90">
                {rejectMutation.isPending ? 'Đang gửi...' : 'Từ chối'}
              </Button>
            </div>
          </DialogFrame>}

      {/* Dialog: Yêu cầu điều chỉnh */}
      {adjustTarget !== null && (() => {
        const targetSnap = snapshots.find((s) => s.version === adjustTarget)
        const currentPrice = targetSnap ? targetSnap.agreedPrice : deal?.agreedPrice
        const currentDeadline = targetSnap ? targetSnap.deadline : deal?.deadline
        if (typeof document === 'undefined') return null
        return <DialogFrame
            onClose={() => setAdjustTarget(null)}
            zIndexClassName="z-[100]"
            maxWidthClassName="max-w-md"
            className="space-y-4 p-6 text-left"
          >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning text-text-inverse shadow-xs">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-text">
                    Gửi Ticket Yêu cầu điều chỉnh Deal
                  </h4>
                  <p className="text-xs text-warning font-bold">
                    Điều chỉnh Deal Ticket phiên bản {adjustTarget}
                  </p>
                </div>
              </div>

              {/* Tóm tắt điều khoản phiên bản hiện tại */}
              <div className="rounded-2xl border border-warning-border bg-warning-soft p-3 text-xs text-text-muted space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-subtle">Giá đề xuất hiện tại:</span>
                  <span className="font-bold text-warning">{formatVnd(Number(currentPrice || 0))}</span>
                </div>
                {currentDeadline && (
                  <div className="flex justify-between">
                    <span className="text-text-subtle">Deadline hiện tại:</span>
                    <span className="font-semibold">{format(new Date(currentDeadline), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">
                  Nội dung điều chỉnh mong muốn (Ghi chú Ticket):
                </label>
                <textarea
                  rows={3}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Ví dụ: Mong muốn giảm giá xuống 200.000đ hoặc dời deadline thêm 3 ngày..."
                  className="w-full rounded-2xl border border-border-strong bg-surface p-3 text-xs text-text focus:border-primary focus:outline-none"
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
                  className="rounded-xl font-bold bg-primary-solid text-on-primary hover:bg-primary-hover"
                  leftIcon={adjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                >
                  {adjustMutation.isPending ? 'Đang gửi...' : 'Gửi Ticket điều chỉnh'}
                </Button>
              </div>
            </DialogFrame>
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
            isRecipient={isStudent}
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
            setTopUpAmendment(null)
            refetch()
            refetchTask()
          }}
          deal={paymentDeal}
          topUpAmendment={topUpAmendment}
          onSuccess={() => {
            refetch()
            refetchTask()
          }}
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
          totalBudget={taskDetail?.overview?.escrowBalance ?? taskDetail?.overview?.agreedPrice ?? Number(deal?.agreedPrice ?? 0)}
          requiresRefundAccount={isStudent && taskDetail?.permissions?.hasRefundAccount === false}
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

      {/* UC112: Modal mở Dispute Ticket khiếu nại tranh chấp */}
      {isCreateDisputeOpen && ctx.taskId && (
        <MentoringCreateDisputeModal
          isOpen={isCreateDisputeOpen}
          onClose={() => setIsCreateDisputeOpen(false)}
          taskId={ctx.taskId}
          taskTitle={taskDetail?.overview?.taskTitle}
          isRequester={isStudent}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* UC113: Modal xem & bổ sung bằng chứng tranh chấp */}
      {isAddEvidenceOpen && ctx.taskId && taskDetail?.activeTicket && (
        <MentoringAddEvidenceModal
          isOpen={isAddEvidenceOpen}
          onClose={() => setIsAddEvidenceOpen(false)}
          taskId={ctx.taskId}
          ticket={taskDetail.activeTicket}
          isStudent={isStudent}
          onSuccess={() => {
            refetchTask()
            refetch()
          }}
        />
      )}

      {/* UC114: Modal xem báo cáo kết quả Task & Tài chính */}
      {isTaskReportOpen && ctx.taskId && (
        <MentoringTaskReportModal
          isOpen={isTaskReportOpen}
          onClose={() => setIsTaskReportOpen(false)}
          taskId={ctx.taskId}
          isStudent={isStudent}
          isMentor={isMentor}
        />
      )}

      {/* UC119: Modal trao đổi & hòa giải 3 bên trong Ticket tranh chấp */}
      {isTicketDiscussionOpen && taskDetail?.activeTicket && (
        <MentoringTicketDiscussionModal
          isOpen={isTicketDiscussionOpen}
          onClose={() => setIsTicketDiscussionOpen(false)}
          ticket={taskDetail.activeTicket}
          currentRole={isMentor ? 'MENTOR' : 'STUDENT'}
        />
      )}
    </div>
  )
}
