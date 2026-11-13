import React, { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { ChevronRight, Clock, MessageCircle, Star } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { BrandIcon } from './BrandIcon'
import { Enter, MotionPressable } from './Motion'
import { SkeletonBlock } from './Skeleton'
import { useMentoringHub, type ActionItem, type ActionTone, type ActivityItem } from '@/lib/useMentoringHub'
import type { MentorCard } from '@/api/mentoring'
import { formatVnd } from '@/api/mentoring'
import { taskApi, TASK_STATUS_LABEL } from '@/api/mentoringTask'
import type { Task } from '@/api/mentoringTask'
import { requestApi } from '@/api/mentoringFlow'
import { groupApi, isActiveMember } from '@/api/mentoringGroups'
import type { MentoringGroup } from '@/api/mentoringGroups'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'

type Hub = ReturnType<typeof useMentoringHub>

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

function SectionTitle({ title, count, action, onAction }: { title: string; count?: number; action?: string; onAction?: () => void }) {
  const { colors, viridian } = useMentoringTheme()
  return (
    <View style={styles.sectionTitle}>
      <Txt size={12.5} weight="800" style={{ color: colors.text, textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 }}>
        {count != null ? `${title} (${count})` : title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Txt size={12} weight="800" style={{ color: viridian }}>{action}</Txt>
          <ChevronRight size={13} color={viridian} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  )
}

/** Hàng "Cần bạn xử lý": icon Meetup trong ô màu theo mức độ, tiêu đề, mô tả, phản hồi nhanh ngay trên thẻ. */
function ActionRow({ item, last, showRole, onQuick, busy }: { item: ActionItem; last: boolean; showRole: boolean; onQuick: (item: ActionItem, accept: boolean) => void; busy: boolean }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const tint: Record<ActionTone, string> = {
    primary: viridianSoft,
    warning: isDark ? '#3A2E12' : '#FFF6E0',
    danger: isDark ? '#3A1616' : '#FDECEC',
    info: isDark ? '#14263A' : '#EAF3FF',
  }
  return (
    <MotionPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        router.push(item.href)
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card, borderBottomColor: last ? 'transparent' : colors.borderSubtle }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: tint[item.tone] }]}>
        <BrandIcon name={item.brand} size={26} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={13.5} weight="700" style={{ color: colors.text }} numberOfLines={2}>{item.title}</Txt>
        <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {showRole && item.as ? `${item.as === 'MENTOR' ? 'Bạn là Mentor' : 'Bạn là Học viên'} · ` : ''}{item.desc}
        </Txt>
        {item.quick ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              disabled={busy}
              onPress={() => onQuick(item, true)}
              style={({ pressed }) => [styles.quickBtn, { backgroundColor: viridian, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
            >
              {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Txt size={12.5} weight="800" style={{ color: '#FFFFFF' }}>{item.quick.kind === 'incoming' ? 'Nhận' : item.quick.kind === 'group' ? 'Tham gia' : 'Đồng ý'}</Txt>}
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => onQuick(item, false)}
              style={({ pressed }) => [styles.quickBtn, { backgroundColor: isDark ? colors.surface : '#F1F2F4', opacity: pressed ? 0.85 : 1 }]}
            >
              <Txt size={12.5} weight="700" style={{ color: colors.text }}>{item.quick.kind === 'incoming' ? 'Bỏ qua' : 'Từ chối'}</Txt>
            </Pressable>
          </View>
        ) : null}
      </View>
      {!item.quick ? <ChevronRight size={16} color={colors.textTertiary} weight="bold" /> : null}
    </MotionPressable>
  )
}

/** Thẻ task đang đồng hành: đối phương, tiến độ, hạn chót, Chat 1 chạm. */
function TaskCard({ task, hub }: { task: Task; hub: Hub }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const detail = hub.detailMap.get(task.id)
  const iAmMentor = hub.me?.id != null && String(hub.me.id) === String(task.mentorId)
  const other = iAmMentor ? { name: task.studentName, avatar: task.studentAvatar, label: 'Học viên' } : { name: task.mentorName, avatar: task.mentorAvatar, label: 'Mentor' }
  const pct = Math.max(0, Math.min(100, task.progressPercentage ?? 0))
  const left = daysLeft(task.deadline)
  const late = left < 0 && task.status !== 'SUBMITTED'
  const pending = hub.actionItems.filter((a) => a.key.startsWith(`task-${task.id}-`)).length
  const open = () => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(task.id) } })
  // Quyền thêm nhật ký do BE quyết định; khi chưa tải chi tiết thì dựa vào vai trò Mentor.
  const canLog = detail ? detail.permissions.canAddWorkLog : iAmMentor
  return (
    <MotionPressable onPress={open} accessibilityRole="button" style={[styles.taskCard, { backgroundColor: colors.card, borderColor: pending ? viridian : colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar uri={other.avatar} name={other.name} size={40} ring />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={11} weight="700" style={{ color: viridian, letterSpacing: 0.3 }} numberOfLines={1}>{other.label.toUpperCase()}</Txt>
          <Txt size={14} weight="800" style={{ color: colors.text }} numberOfLines={1}>{other.name ?? '—'}</Txt>
        </View>
        {pending ? (
          <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: viridian }}>
            <Txt size={11} weight="800" style={{ color: '#FFFFFF' }}>{pending}</Txt>
          </View>
        ) : null}
      </View>
      <Txt size={13} weight="600" style={{ color: colors.text, marginTop: 10, minHeight: 36 }} numberOfLines={2}>{task.taskTitle.split('\n').map((x) => x.trim()).find(Boolean) ?? task.taskTitle}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: isDark ? colors.surface : '#F1F2F4', overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: pct >= 100 ? '#16A34A' : viridian }} />
        </View>
        <Txt size={11.5} weight="800" style={{ color: pct >= 100 ? '#16A34A' : viridian }}>{`${pct}%`}</Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Clock size={12} color={late ? '#DC2626' : colors.textTertiary} />
        <Txt size={11.5} weight="600" style={{ color: late ? '#DC2626' : colors.textSecondary }}>
          {task.status === 'SUBMITTED' ? TASK_STATUS_LABEL.SUBMITTED : late ? `Quá hạn ${-left} ngày` : left === 0 ? 'Hết hạn hôm nay' : `Còn ${left} ngày`}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {detail?.conversationId ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push({ pathname: '/chat/[id]', params: { id: String(detail.conversationId), mentoring: '1' } })
            }}
            accessibilityLabel={`Nhắn tin với ${other.name ?? ''}`}
            style={({ pressed }) => [styles.cardBtn, { flex: 1, backgroundColor: viridian, opacity: pressed ? 0.85 : 1 }]}
          >
            <MessageCircle size={15} color="#FFFFFF" weight="fill" />
            <Txt size={12.5} weight="800" style={{ color: '#FFFFFF' }}>Chat</Txt>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            // Mentor được thêm nhật ký → mở thẳng form nhật ký; còn lại mở trang nhiệm vụ.
            if (canLog) router.push({ pathname: '/mentoring/tasks/[id]/action', params: { id: String(task.id), type: 'worklog' } })
            else open()
          }}
          style={({ pressed }) => [styles.cardBtn, { flex: 1, backgroundColor: viridianSoft, opacity: pressed ? 0.85 : 1 }]}
        >
          <Txt size={12.5} weight="800" style={{ color: viridian }}>{canLog ? '+ Nhật ký' : 'Xem tiến độ'}</Txt>
        </Pressable>
      </View>
    </MotionPressable>
  )
}

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d === 1) return 'hôm qua'
  if (d < 7) return `${d} ngày trước`
  const dt = new Date(iso)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
}

/** Tổng quan gọn cho Mentor: thu nhập tháng, đang xử lý, học viên đang hướng dẫn, thời hạn gói. */
function MentorStatsCard({ stats }: { stats: NonNullable<Hub['mentorStats']> }) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const cells: [string, string, string?][] = [
    [stats.loading ? '…' : formatVnd(stats.monthEarned), 'Thu nhập tháng này', viridian],
    [String(stats.mentees), 'Học viên đang hướng dẫn'],
    [stats.remainingDays != null ? `${stats.remainingDays} ngày` : stats.active ? 'Đang hoạt động' : 'Chưa kích hoạt', 'Gói Mentor', stats.remainingDays != null && stats.remainingDays <= 7 ? '#DC2626' : undefined],
  ]
  return (
    <MotionPressable
      onPress={() => router.push('/mentoring/earnings')}
      accessibilityRole="button"
      accessibilityLabel="Xem thu nhập Mentor"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <BrandIcon name="coin" size={22} />
        <Txt size={12.5} weight="800" style={{ color: colors.text, flex: 1, textTransform: 'uppercase', letterSpacing: 0.4 }}>Trung tâm Mentor</Txt>
        <Txt size={12} weight="800" style={{ color: viridian }}>Xem thu nhập</Txt>
        <ChevronRight size={13} color={viridian} weight="bold" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {cells.map(([value, label, color]) => (
          <View key={label} style={{ flex: 1, borderRadius: 14, backgroundColor: viridianSoft, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
            <Txt size={14} weight="800" style={{ color: color ?? colors.text }} numberOfLines={1}>{value}</Txt>
            <Txt size={10.5} style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{label}</Txt>
          </View>
        ))}
      </View>
      {stats.processing > 0 ? (
        <Txt size={11.5} style={{ color: colors.textSecondary, marginTop: 10 }}>{`${formatVnd(stats.processing)} đang chờ chi trả`}</Txt>
      ) : null}
    </MotionPressable>
  )
}

/** Dòng thời gian "Hoạt động gần đây" gộp từ lịch sử các task đang chạy. */
function ActivityList({ items }: { items: ActivityItem[] }) {
  const { colors, viridian } = useMentoringTheme()
  const router = useRouter()
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, 4)
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 6 }]}>
      {shown.map((a, i) => (
        <MotionPressable
          key={a.key}
          onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(a.taskId) } })}
          style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 14 }}
        >
          <View style={{ alignItems: 'center', width: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 14, backgroundColor: i === 0 ? viridian : colors.border }} />
            {i < shown.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: colors.borderSubtle, marginTop: 2 }} /> : null}
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt size={13} weight="700" style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{a.title}</Txt>
              <Txt size={11} style={{ color: colors.textTertiary }}>{timeAgo(a.timestamp)}</Txt>
            </View>
            <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
              {[a.actorName, a.description].filter(Boolean).join(' · ')}
            </Txt>
            <Txt size={11} weight="600" style={{ color: viridian, marginTop: 3 }} numberOfLines={1}>{a.taskTitle}</Txt>
          </View>
        </MotionPressable>
      ))}
      {items.length > 4 ? (
        <Pressable onPress={() => setAll((v) => !v)} style={[styles.moreRow, { borderTopColor: colors.borderSubtle, marginTop: 4 }]}>
          <Txt size={12.5} weight="800" style={{ color: viridian }}>{all ? 'Thu gọn' : 'Xem thêm hoạt động'}</Txt>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Thẻ mentor gợi ý (lướt ngang): avatar viền cam, chức danh, đánh giá, nút xem hồ sơ. */
function SuggestCard({ m }: { m: MentorCard }) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })
  }
  return (
    <MotionPressable onPress={open} accessibilityRole="button" style={[styles.suggestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar uri={m.avatarUrl} name={m.fullName} size={56} ring />
      <Txt size={13.5} weight="800" style={{ color: colors.text, marginTop: 8, textAlign: 'center' }} numberOfLines={1}>{m.fullName}</Txt>
      <Txt size={11.5} style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 2, minHeight: 30 }} numberOfLines={2}>
        {[m.currentPosition, m.currentCompany].filter(Boolean).join(' · ') || m.headline || m.majorName || 'Mentor AlumNect'}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <Star size={12} color="#F59E0B" weight="fill" />
        <Txt size={12} weight="800" style={{ color: colors.text }}>{m.rating ? m.rating.toFixed(1) : 'Mới'}</Txt>
        {m.reviewCount ? <Txt size={11} style={{ color: colors.textTertiary }}>{`(${m.reviewCount})`}</Txt> : null}
      </View>
      <View style={[styles.cardBtn, { alignSelf: 'stretch', marginTop: 10, backgroundColor: viridianSoft }]}>
        <Txt size={12} weight="800" style={{ color: viridian }}>Xem hồ sơ</Txt>
      </View>
    </MotionPressable>
  )
}

function Suggestions({ hub, onDiscover }: { hub: Hub; onDiscover: () => void }) {
  if (!hub.suggestions.length) return null
  return (
    <>
      <SectionTitle title="Mentor gợi ý cho bạn" action="Khám phá" onAction={onDiscover} />
      <SuggestReason text={hub.suggestReason} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }} decelerationRate="fast" snapToInterval={156 + 10}>
        {hub.suggestions.map((m) => <SuggestCard key={m.mentorId} m={m} />)}
      </ScrollView>
    </>
  )
}

function SuggestReason({ text }: { text: string }) {
  const { colors } = useMentoringTheme()
  return <Txt size={12} style={{ color: colors.textSecondary, paddingHorizontal: 18, marginTop: -6, marginBottom: 10 }}>{text}</Txt>
}

/** Một hàng nhóm cố vấn: chồng avatar thành viên, tên, vai trò, sĩ số, yêu cầu của nhóm. */
function GroupRow({ g, meId, last }: { g: MentoringGroup; meId?: string; last: boolean }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const joined = g.members.filter(isActiveMember)
  const faces = joined.slice(0, 3)
  const isLeader = String(g.leaderId) === meId
  const openReq = (g.requests ?? []).find((r) => r.status === 'OPEN' || r.status === 'MATCHED')
  const meta = [isLeader ? 'Trưởng nhóm' : `Trưởng nhóm: ${g.leaderName ?? '—'}`, `${g.joinedMemberCount ?? joined.length}/${g.maxMembers} thành viên`].join(' · ')
  return (
    <MotionPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } })
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card, borderBottomColor: last ? 'transparent' : colors.borderSubtle }]}
    >
      <View style={{ width: 58, height: 44, justifyContent: 'center' }}>
        {faces.length ? faces.map((m, i) => (
          <View key={m.id} style={{ position: 'absolute', left: i * 14, borderRadius: 18, borderWidth: 2, borderColor: colors.card }}>
            <Avatar uri={m.avatarUrl} name={m.fullName} size={30} />
          </View>
        )) : (
          <View style={[styles.actionIcon, { backgroundColor: viridianSoft }]}><BrandIcon name="people2" size={26} /></View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt size={13.5} weight="700" style={{ color: colors.text, flexShrink: 1 }} numberOfLines={1}>{g.name}</Txt>
          {isLeader ? (
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: viridianSoft }}>
              <Txt size={10} weight="800" style={{ color: viridian }}>LEADER</Txt>
            </View>
          ) : null}
        </View>
        <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{meta}</Txt>
        {openReq ? (
          <Txt size={11.5} weight="600" style={{ color: viridian, marginTop: 2 }} numberOfLines={1}>{`Yêu cầu: ${openReq.title}`}</Txt>
        ) : g.pendingMemberCount ? (
          <Txt size={11.5} style={{ color: colors.textTertiary, marginTop: 2 }}>{`${g.pendingMemberCount} lời mời đang chờ`}</Txt>
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.textTertiary} weight="bold" />
    </MotionPressable>
  )
}

function GroupSection({ hub }: { hub: Hub }) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const groups = hub.groups
  return (
    <>
      <SectionTitle title="Nhóm cố vấn" count={groups.length || undefined} action={groups.length ? 'Tất cả' : undefined} onAction={() => router.push('/mentoring/groups')} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {groups.slice(0, 3).map((g, i, arr) => <GroupRow key={g.id} g={g} meId={hub.me?.id} last={i === arr.length - 1} />)}
        {!groups.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 14 }}>
            <BrandIcon name="people2" size={36} />
            <Txt size={12.5} style={{ color: colors.textSecondary, flex: 1, lineHeight: 18 }}>Học cùng bạn bè: lập nhóm để cùng gửi yêu cầu và chia sẻ chi phí cố vấn.</Txt>
          </View>
        ) : null}
        <Pressable
          onPress={() => router.push('/mentoring/groups/create')}
          style={({ pressed }) => [styles.moreRow, { borderTopColor: groups.length ? colors.borderSubtle : 'transparent', backgroundColor: pressed ? viridianSoft : 'transparent' }]}
        >
          <Txt size={12.5} weight="800" style={{ color: viridian }}>+ Tạo nhóm cố vấn</Txt>
        </Pressable>
      </View>
    </>
  )
}

/**
 * Mục "Của tôi" của tab Cố vấn: (Trung tâm Mentor) → Cần bạn xử lý → Đang đồng hành → Yêu cầu đang chờ → Nhóm cố vấn → Hoạt động gần đây → Mentor gợi ý.
 * Lối tắt quản lý nằm ở menu ⊞ trên header.
 * Người chưa có hoạt động nào sẽ thấy lời mời tìm mentor / tạo yêu cầu.
 */
export function MentoringHub({ hub, onDiscover }: { hub: Hub; onDiscover: () => void }) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const quick = async (item: ActionItem, accept: boolean) => {
    if (!item.quick) return
    setBusyKey(item.key)
    try {
      if (item.quick.kind === 'extension') {
        await taskApi.respondExtension(item.quick.id, accept)
        qc.invalidateQueries({ queryKey: ['mentoring-task', item.quick.taskId] })
        toast.success(accept ? 'Đã chấp nhận gia hạn.' : 'Đã từ chối gia hạn.')
      } else if (item.quick.kind === 'group') {
        await (accept ? groupApi.accept(item.quick.id) : groupApi.decline(item.quick.id))
        qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
        toast.success(accept ? 'Đã tham gia nhóm cố vấn.' : 'Đã từ chối lời mời.')
      } else {
        await (accept ? requestApi.accept(item.quick.id) : requestApi.decline(item.quick.id))
        qc.invalidateQueries({ queryKey: ['mentoring-incoming'] })
        toast.success(accept ? 'Đã nhận yêu cầu. Kênh trao đổi đã được mở.' : 'Đã bỏ qua yêu cầu.')
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusyKey(null)
    }
  }

  const items = hub.actionItems
  const visibleItems = expanded ? items : items.slice(0, 4)
  const showRole = hub.isAlumni

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={hub.refreshing} onRefresh={() => { void hub.refetch() }} tintColor={viridian} colors={[viridian]} />}
    >
      {hub.loading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonBlock height={140} style={{ borderRadius: 18 }} />
          <SkeletonBlock height={200} style={{ borderRadius: 18 }} />
        </View>
      ) : !hub.hasActivity ? (
        <Enter>
          {hub.mentorStats ? <MentorStatsCard stats={hub.mentorStats} /> : null}
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BrandIcon name="binoculars" size={64} />
            <Txt size={18} weight="800" style={{ color: colors.text, marginTop: 12, textAlign: 'center' }}>Bắt đầu hành trình cố vấn</Txt>
            <Txt size={13} style={{ color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Bạn chưa có nhiệm vụ hay yêu cầu nào. Tìm mentor phù hợp hoặc đăng bài toán để mentor chủ động liên hệ.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' }}>
              <Pressable onPress={onDiscover} style={({ pressed }) => [styles.bigBtn, { backgroundColor: viridian, opacity: pressed ? 0.85 : 1 }]}>
                <Txt size={14} weight="800" style={{ color: '#FFFFFF' }}>Tìm mentor</Txt>
              </Pressable>
              <Pressable onPress={() => router.push('/mentoring/create-request')} style={({ pressed }) => [styles.bigBtn, { backgroundColor: viridianSoft, opacity: pressed ? 0.85 : 1 }]}>
                <Txt size={14} weight="800" style={{ color: viridian }}>Tạo yêu cầu</Txt>
              </Pressable>
            </View>
          </View>
          <Suggestions hub={hub} onDiscover={onDiscover} />
        </Enter>
      ) : (
        <>
          {hub.mentorStats ? (
            <Enter>
              <MentorStatsCard stats={hub.mentorStats} />
            </Enter>
          ) : null}

          {/* 1. Cần bạn xử lý */}
          <Enter>
            <SectionTitle title="Cần bạn xử lý" count={hub.detailsLoading && !items.length ? undefined : items.length} />
            {items.length ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {visibleItems.map((it, i) => (
                  <ActionRow key={it.key} item={it} last={i === visibleItems.length - 1} showRole={showRole} onQuick={quick} busy={busyKey === it.key} />
                ))}
                {items.length > 4 ? (
                  <Pressable onPress={() => setExpanded((v) => !v)} style={[styles.moreRow, { borderTopColor: colors.borderSubtle }]}>
                    <Txt size={12.5} weight="800" style={{ color: viridian }}>{expanded ? 'Thu gọn' : `Xem thêm ${items.length - 4} việc`}</Txt>
                  </Pressable>
                ) : null}
              </View>
            ) : hub.detailsLoading ? (
              <View style={{ paddingHorizontal: 16 }}><SkeletonBlock height={64} style={{ borderRadius: 18 }} /></View>
            ) : (
              <View style={[styles.card, styles.allDone, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BrandIcon name="check" size={30} />
                <View style={{ flex: 1 }}>
                  <Txt size={13.5} weight="700" style={{ color: colors.text }}>Bạn đã xử lý hết mọi việc</Txt>
                  <Txt size={12} style={{ color: colors.textSecondary }}>Việc mới cần bạn phản hồi sẽ xuất hiện tại đây.</Txt>
                </View>
              </View>
            )}
          </Enter>

          {/* 2. Đang đồng hành */}
          {hub.activeTasks.length ? (
            <Enter delay={60}>
              <SectionTitle title="Đang đồng hành" count={hub.activeTasks.length} action="Tất cả" onAction={() => router.push('/mentoring/tasks')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} decelerationRate="fast" snapToInterval={264 + 12}>
                {hub.activeTasks.map((t) => <TaskCard key={t.id} task={t} hub={hub} />)}
              </ScrollView>
            </Enter>
          ) : null}

          {/* 3. Yêu cầu đang chờ mentor */}
          {hub.waitingRequests.length ? (
            <Enter delay={120}>
              <SectionTitle title="Yêu cầu đang chờ" count={hub.waitingRequests.length} action="Tất cả" onAction={() => router.push('/mentoring/my-requests')} />
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {hub.waitingRequests.slice(0, 3).map((r, i, arr) => (
                  <MotionPressable
                    key={r.id}
                    onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(r.id) } })}
                    style={[styles.actionRow, { borderBottomColor: i === arr.length - 1 ? 'transparent' : colors.borderSubtle }]}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: viridianSoft }]}>
                      <BrandIcon name="writing" size={26} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt size={13.5} weight="700" style={{ color: colors.text }} numberOfLines={1}>{r.title}</Txt>
                      <Txt size={12} weight={r.matchedCount ? '700' : '400'} style={{ color: r.matchedCount ? viridian : colors.textSecondary, marginTop: 2 }}>
                        {r.matchedCount ? `${r.matchedCount} mentor đã phản hồi — xem & chọn` : 'Đang chờ mentor phản hồi'}
                      </Txt>
                    </View>
                    <ChevronRight size={16} color={colors.textTertiary} weight="bold" />
                  </MotionPressable>
                ))}
              </View>
            </Enter>
          ) : null}

          {/* 4. Nhóm cố vấn */}
          <Enter delay={150}>
            <GroupSection hub={hub} />
          </Enter>

          {/* 5. Hoạt động gần đây */}
          {hub.activity.length ? (
            <Enter delay={180}>
              <SectionTitle title="Hoạt động gần đây" />
              <ActivityList items={hub.activity} />
            </Enter>
          ) : null}

          {/* 6. Mentor gợi ý */}
          <Enter delay={240}>
            <Suggestions hub={hub} onDiscover={onDiscover} />
          </Enter>
        </>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: 6, marginBottom: 10 },
  card: { marginHorizontal: 16, marginBottom: 18, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickBtn: { minWidth: 76, height: 32, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreRow: { alignItems: 'center', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  allDone: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  taskCard: { width: 264, padding: 14, borderRadius: 20, borderWidth: 1.5, marginBottom: 18 },
  cardBtn: { height: 36, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  suggestCard: { width: 156, padding: 12, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  emptyCard: { marginHorizontal: 16, marginBottom: 20, padding: 22, borderRadius: 22, borderWidth: 1, alignItems: 'center' },
  bigBtn: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
})
