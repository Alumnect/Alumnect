import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import type { Href } from 'expo-router'
import { taskApi } from '@/api/mentoringTask'
import type { Task, TaskDetail } from '@/api/mentoringTask'
import { dealApi, requestApi } from '@/api/mentoringFlow'
import type { IncomingRequest, MentoringRequest } from '@/api/mentoringFlow'
import { chatApi } from '@/api/chat'
import { formatVnd, mentoringApi } from '@/api/mentoring'
import type { MentorCard } from '@/api/mentoring'
import { walletApi } from '@/api/mentoringWallet'
import { groupApi } from '@/api/mentoringGroups'
import type { MentoringGroup } from '@/api/mentoringGroups'
import type { BrandIconName } from '@/components/BrandIcon'
import { useAuthStore } from '@/store/authStore'

/** Task còn đang chạy (chưa kết thúc) — hiện ở "Đang đồng hành". */
const ACTIVE_STATUSES = new Set(['PREPARATION', 'IN_PROGRESS', 'SUBMITTED', 'DISPUTED'])
/** Số task tối đa lấy chi tiết để dò việc cần xử lý (gia hạn, nghiệm thu, hòa giải...). */
const DETAIL_LIMIT = 6

export interface ActivityItem { key: string; taskId: number; taskTitle: string; title: string; description: string; actorName: string; timestamp: string }

export type ActionTone = 'primary' | 'warning' | 'danger' | 'info'
export interface ActionItem {
  key: string
  brand: BrandIconName
  tone: ActionTone
  title: string
  desc: string
  /** Vai trò của người xem trong việc này (hiện nhãn khi người dùng vừa là Mentor vừa là Học viên). */
  as?: 'MENTOR' | 'STUDENT'
  href: Href
  /** Phản hồi nhanh ngay trên thẻ. */
  quick?: { kind: 'extension'; id: number; taskId: number } | { kind: 'incoming'; id: number } | { kind: 'group'; id: number }
}

const shortDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
const taskHref = (id: number): Href => ({ pathname: '/mentoring/tasks/[id]', params: { id: String(id) } })

/** Dò các việc đang chờ người xem trong một task (dựa trên cờ quyền BE trả về). */
function taskActions(d: TaskDetail): ActionItem[] {
  const o = d.overview
  const as: ActionItem['as'] = d.permissions.isMentor ? 'MENTOR' : 'STUDENT'
  const out: ActionItem[] = []
  const k = (s: string) => `task-${o.id}-${s}`
  const pendingLogs = d.workLogs.filter((w) => w.status === 'PENDING_CONFIRMATION' && w.canConfirm).length
  if (pendingLogs) out.push({ key: k('logs'), brand: 'list', tone: 'primary', as, title: `${pendingLogs} nhật ký chờ bạn duyệt`, desc: o.taskTitle, href: taskHref(o.id) })
  const ext = d.activeExtension
  if (ext && (ext.canConfirm || ext.canReject))
    out.push({ key: k('ext'), brand: 'alarm_clock', tone: 'warning', as, title: `${ext.createdByName} xin gia hạn đến ${shortDate(ext.proposedDeadline)}`, desc: ext.reason || o.taskTitle, href: taskHref(o.id), quick: { kind: 'extension', id: ext.id, taskId: o.id } })
  const am = d.activeAmendment
  if (am?.canTopUp) out.push({ key: k('topup'), brand: 'coin', tone: 'warning', as, title: `Cần thanh toán thêm ${formatVnd(am.additionalAmount)}`, desc: `Điều chỉnh đã được chấp nhận · ${o.taskTitle}`, href: taskHref(o.id) })
  else if (am && (am.canConfirm || am.canReject)) out.push({ key: k('amend'), brand: 'pencil', tone: 'warning', as, title: `${am.createdByName} đề xuất điều chỉnh phạm vi`, desc: am.reason || o.taskTitle, href: taskHref(o.id) })
  const sp = d.activeSettlementProposal
  if (sp && (sp.canAccept || sp.canReject)) out.push({ key: k('settle'), brand: 'fist', tone: 'warning', as, title: `${sp.createdByName} đề xuất hòa giải`, desc: `Mentor ${formatVnd(sp.mentorAmount)} · Hoàn ${formatVnd(sp.studentRefund)}`, href: taskHref(o.id) })
  const c = d.latestCompletion
  if (c?.status === 'PENDING' && c.canConfirm) out.push({ key: k('done'), brand: 'check', tone: 'primary', as, title: 'Mentor đã nộp kết quả, chờ bạn nghiệm thu', desc: o.taskTitle, href: taskHref(o.id) })
  if (d.permissions.canSubmitCompletion && o.progressPercentage >= 100 && !(c?.status === 'PENDING'))
    out.push({ key: k('submit'), brand: 'badge_pro', tone: 'info', as, title: 'Đã đủ tiến độ — nộp kết quả nghiệm thu', desc: o.taskTitle, href: taskHref(o.id) })
  const tk = d.activeTicket
  if (tk && (tk.status === 'OPEN' || tk.status === 'IN_REVIEW'))
    out.push({ key: k('ticket'), brand: 'mentalhealth', tone: 'danger', as, title: `Tranh chấp #${tk.ticketCode} đang xử lý`, desc: tk.title, href: { pathname: '/mentoring/dispute/[ticketId]/chat', params: { ticketId: String(tk.id), taskId: String(o.id) } } })
  return out
}

/**
 * Dữ liệu cho mục "Của tôi" của tab Cố vấn: việc cần xử lý, task đang đồng hành, yêu cầu đang chờ, tin nhắn chưa đọc.
 * Tái dùng các API sẵn có; chi tiết task chỉ lấy cho tối đa DETAIL_LIMIT task đang chạy.
 */
export function useMentoringHub() {
  const me = useAuthStore((s) => s.user)
  const isAlumni = me?.role === 'ALUMNI'

  const tasksQ = useQuery({ queryKey: ['mentoring-tasks', 'hub'], queryFn: () => taskApi.mine({ page: 0 }), staleTime: 30_000 })
  const dealsQ = useQuery({ queryKey: ['mentoring-deals', 'hub'], queryFn: () => dealApi.mine(undefined, 0), staleTime: 30_000 })
  const requestsQ = useQuery({ queryKey: ['mentoring-requests', 'hub'], queryFn: () => requestApi.mine(0), staleTime: 30_000 })
  const incomingQ = useQuery({ queryKey: ['mentoring-incoming', 'WAITING', 'hub'], queryFn: () => requestApi.incoming({ status: 'WAITING', page: 0 }), enabled: isAlumni, staleTime: 30_000 })
  const groupsQ = useQuery({ queryKey: ['mentoring-groups', 'mine', 'ALL'], queryFn: () => groupApi.mine('ALL'), staleTime: 30_000 })
  const invitesQ = useQuery({ queryKey: ['mentoring-groups', 'invitations'], queryFn: groupApi.invitations, staleTime: 30_000 })
  const convQ = useQuery({ queryKey: ['conversations', 'mentoring'], queryFn: () => chatApi.conversations('primary', 'MENTORING'), staleTime: 30_000 })

  const activeTasks: Task[] = useMemo(() => (tasksQ.data?.content ?? []).filter((t) => ACTIVE_STATUSES.has(t.status)), [tasksQ.data])
  const details = useQueries({
    queries: activeTasks.slice(0, DETAIL_LIMIT).map((t) => ({
      queryKey: ['mentoring-task', t.id],
      queryFn: () => taskApi.detail(t.id),
      staleTime: 30_000,
    })),
  })
  const detailData = details.map((d) => d.data)
  const detailMap = new Map<number, TaskDetail>()
  for (const d of detailData) if (d) detailMap.set(d.overview.id, d)

  // Tính trực tiếp mỗi lần render (danh sách nhỏ) để luôn khớp dữ liệu chi tiết task mới nhất.
  const actionItems = (() => {
    const items: ActionItem[] = []
    for (const deal of dealsQ.data?.content ?? []) {
      const as: ActionItem['as'] = String(deal.mentorId) === me?.id ? 'MENTOR' : 'STUDENT'
      const href: Href = { pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } }
      if (deal.canPay) items.push({ key: `deal-${deal.id}-pay`, brand: 'coin', tone: 'primary', as, title: `Thỏa thuận #${deal.id} chờ thanh toán ${formatVnd(deal.agreedPrice)}`, desc: deal.requestTitle || deal.taskScope, href })
      else if (deal.canConfirm) items.push({ key: `deal-${deal.id}-confirm`, brand: 'writing', tone: 'primary', as, title: `Thỏa thuận #${deal.id} chờ bạn xác nhận`, desc: deal.requestTitle || deal.taskScope, href })
    }
    for (const inc of (incomingQ.data?.content ?? []).filter((r: IncomingRequest) => r.responseStatus === 'WAITING' && r.requestStatus === 'OPEN').slice(0, 3)) {
      items.push({ key: `incoming-${inc.id}`, brand: 'megaphone', tone: 'info', as: 'MENTOR', title: `${inc.studentName} gửi yêu cầu cố vấn`, desc: inc.title, href: { pathname: '/mentoring/incoming/[id]', params: { id: String(inc.id) } }, quick: { kind: 'incoming', id: inc.id } })
    }
    for (const g of invitesQ.data ?? []) {
      items.push({ key: `group-invite-${g.id}`, brand: 'people2', tone: 'info', title: `${g.leaderName ?? 'Trưởng nhóm'} mời bạn vào nhóm “${g.name}”`, desc: `${g.joinedMemberCount ?? 0}/${g.maxMembers} thành viên`, href: { pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } }, quick: { kind: 'group', id: g.id } })
    }
    for (const d of detailData) if (d) items.push(...taskActions(d))
    return items
  })()

  const waitingRequests: MentoringRequest[] = useMemo(() => (requestsQ.data?.content ?? []).filter((r) => r.status === 'OPEN'), [requestsQ.data])
  const unread = useMemo(() => (convQ.data?.data ?? []).reduce((s, c) => s + (c.unreadCount ?? 0), 0), [convQ.data])
  const incomingTotal = incomingQ.data?.totalElements ?? 0
  // Ngữ cảnh: chỉ khi các truy vấn chính đã xong mới quyết định mặc định mở "Của tôi" hay "Tìm mentor".
  const ready = !tasksQ.isLoading && !dealsQ.isLoading && !requestsQ.isLoading && (!isAlumni || !incomingQ.isLoading)
  const groups: MentoringGroup[] = (groupsQ.data ?? []).filter((g) => g.status === 'ACTIVE')
  const hasActivity = groups.length > 0 || activeTasks.length > 0 || actionItems.length > 0 || waitingRequests.length > 0 || incomingTotal > 0

  // Hoạt động gần đây: gộp lịch sử của các task đã tải chi tiết, mới nhất lên đầu.
  const activity: ActivityItem[] = detailData
    .flatMap((d) => (d ? d.history.map((h) => ({ key: `${d.overview.id}-${h.id}`, taskId: d.overview.id, taskTitle: d.overview.taskTitle, title: h.title, description: h.description, actorName: h.actorName, timestamp: h.timestamp })) : []))
    .filter((a) => !Number.isNaN(new Date(a.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  // Mentor gợi ý: theo lĩnh vực của yêu cầu đang chờ (nếu có), bỏ chính mình và mentor đang đồng hành.
  const optionsQ = useQuery({ queryKey: ['mentor-filter-options'], queryFn: mentoringApi.filterOptions, staleTime: 10 * 60_000 })
  const focusIndustry = waitingRequests[0]?.industryName
  const fieldId = focusIndustry ? optionsQ.data?.industries.find((i) => i.name === focusIndustry)?.id : undefined
  const suggestQ = useQuery({
    queryKey: ['mentoring-suggest', fieldId ?? 'top'],
    queryFn: () => mentoringApi.search({ fieldId, sortBy: 'rating', sortDir: 'desc' }),
    enabled: !focusIndustry || optionsQ.isFetched,
    staleTime: 5 * 60_000,
  })
  const busyMentorUserIds = new Set(activeTasks.map((t) => String(t.mentorId)))
  const suggestions: MentorCard[] = (suggestQ.data?.content ?? []).filter((m) => String(m.userId) !== me?.id && !busyMentorUserIds.has(String(m.userId))).slice(0, 8)
  const suggestReason = fieldId && focusIndustry ? `Phù hợp yêu cầu ngành ${focusIndustry}` : 'Mentor được đánh giá cao'

  // Tổng quan cho Mentor (ALUMNI đã có hồ sơ Mentor): thu nhập, học viên đang hướng dẫn, thời hạn gói.
  const statusQ = useQuery({ queryKey: ['mentoring-status'], queryFn: mentoringApi.status, enabled: isAlumni, staleTime: 60_000 })
  const isMentor = isAlumni && !!statusQ.data?.hasMentorProfile
  const walletQ = useQuery({ queryKey: ['mentor-wallet', 'hub'], queryFn: walletApi.earnings, enabled: isMentor, staleTime: 60_000 })
  const now = new Date()
  const monthEarned = (walletQ.data?.items ?? [])
    .filter((i) => i.status === 'SUCCEEDED')
    .filter((i) => { const d = new Date(i.transactedAt ?? i.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((sum, i) => sum + i.amount, 0)
  const mentorStats = isMentor
    ? {
        monthEarned,
        processing: walletQ.data?.totalProcessing ?? 0,
        mentees: activeTasks.filter((t) => String(t.mentorId) === me?.id).length,
        remainingDays: statusQ.data?.remainingDays ?? null,
        active: !!statusQ.data?.active,
        loading: walletQ.isLoading,
      }
    : null

  const refetch = () => Promise.all([groupsQ.refetch(), invitesQ.refetch(), suggestQ.refetch(), isMentor ? walletQ.refetch() : null, tasksQ.refetch(), dealsQ.refetch(), requestsQ.refetch(), isAlumni ? incomingQ.refetch() : null, convQ.refetch(), ...details.map((d) => d.refetch())])

  return {
    me,
    isAlumni,
    ready,
    hasActivity,
    actionItems,
    activeTasks,
    detailMap,
    waitingRequests,
    groups,
    activity,
    suggestions,
    suggestReason,
    mentorStats,
    unread,
    incomingTotal,
    loading: tasksQ.isLoading || dealsQ.isLoading,
    detailsLoading: details.some((d) => d.isLoading),
    refreshing: tasksQ.isRefetching || dealsQ.isRefetching,
    refetch,
  }
}
