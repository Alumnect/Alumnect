import React, { useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarX2, CheckCircle2, ChevronLeft, ChevronRight, Globe, MessageCircle, Share2 } from '@/components/icons'
import { Avatar, Button, Empty, IconButton, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { Header } from '@/components/Header'
import { BottomBar } from '@/components/DetailBits'
import { ShareSheet } from '@/components/ShareSheet'
import {
  AvatarStack,
  CapacityMeter,
  EventCover,
  EventStatusTag,
  attendeeSummary,
  eventEyebrow,
  eventFullDate,
  eventPhase,
  eventShortDate,
  eventTimeRange,
  isOnlineLocation,
  mapsUrl,
  onlinePlatform,
  onlineUrl,
  startsIn,
  type EventPhase,
} from '@/components/EventBits'
import { eventApi } from '@/api/events'
import { feedApi } from '@/api/feed'
import { useAuthStore } from '@/store/authStore'
import { postPath } from '@/lib/share'
import { radius, shadow, useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Số dòng giới thiệu hiển thị trước khi cần bấm "Xem thêm". */
const ABOUT_LINES = 6
/** Chiều cao dòng của đoạn giới thiệu, dùng cả khi hiển thị lẫn khi đo. */
const ABOUT_LINE_HEIGHT = 23
const COVER_HEIGHT = 220
/** Nút nổi trên ảnh bìa nằm cách mép trên 12 và cao 44; cuộn quá mức này là chúng trượt đi, nên hiện thanh tiêu đề gọn thay thế. */
const COMPACT_BAR_AT = 48

/** UC25–27, 29: chi tiết sự kiện, đăng ký hoặc hủy đăng ký, hủy sự kiện; mở được từ liên kết sâu. */
export default function EventScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const { id } = useLocalSearchParams<{ id: string; postId?: string }>()

  const [confirm, setConfirm] = useState<'event' | 'registration' | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [aboutClamped, setAboutClamped] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const status = useQuery({ queryKey: ['event-detail', id], queryFn: () => eventApi.detail(id!), refetchInterval: 30_000 })
  const st = status.data?.data
  const postId = st?.postId != null ? String(st.postId) : undefined
  // Ảnh bìa, giới thiệu và avatar người tổ chức nằm ở bài viết gốc của sự kiện; dùng chung cache với màn bài viết.
  const post = useQuery({ queryKey: ['post', postId], queryFn: () => feedApi.getPost(postId!), enabled: !!postId })
  // Dùng chung khóa cache với màn danh sách người tham gia (tìm kiếm rỗng).
  const attendees = useQuery({
    queryKey: ['attendees', id, ''],
    queryFn: () => eventApi.attendees(id!),
    enabled: !!st && st.status !== 'CANCELLED',
    retry: false,
  })

  const refresh = () => {
    setConfirm(null)
    qc.invalidateQueries({ queryKey: ['event-detail', id] })
    qc.invalidateQueries({ queryKey: ['event-rsvp', id] })
    qc.invalidateQueries({ queryKey: ['attendees', id] })
    qc.invalidateQueries({ queryKey: ['feed'] })
    qc.invalidateQueries({ queryKey: ['events-list'] })
    qc.invalidateQueries({ queryKey: ['event-history'] })
  }

  const rsvp = useMutation({
    mutationFn: () => eventApi.rsvp(id!),
    onSuccess: () => { toast.success('Đăng ký tham gia sự kiện thành công!'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const cancel = useMutation({
    mutationFn: () => eventApi.cancelRsvp(id!),
    onSuccess: () => { toast.success('Đã hủy tham gia sự kiện.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const cancelEvent = useMutation({
    mutationFn: () => eventApi.cancelEvent(id!),
    onSuccess: () => { toast.success('Đã hủy sự kiện.'); refresh() },
    onError: (e) => toast.error(errMsg(e)),
  })

  if (status.isError || status.isLoading || !st) {
    return (
      <Screen>
        <Header title="Sự kiện" />
        {status.isError ? (
          <Empty title="Không thể tải sự kiện" text="Sự kiện không còn khả dụng hoặc kết nối bị gián đoạn." error={status.error} onRetry={() => void status.refetch()} />
        ) : (
          <Loading />
        )}
      </Screen>
    )
  }

  const start = new Date(st.startTime)
  const end = st.endTime ? new Date(st.endTime) : null
  const count = st.attendeeCount ?? 0
  const phase = eventPhase({ status: st.status, start, end, count, capacity: st.capacity, started: st.started })
  const isHost = String(st.organizerId) === me?.id
  const online = isOnlineLocation(st.location)
  const link = onlineUrl(st.location)
  const canOpenLink = !!link && (st.registered || isHost)
  const when = phase === 'open' || phase === 'full' ? startsIn(start, end) : null
  const cover = post.data?.images?.[0] ?? null
  const about = post.data?.text?.trim() ?? ''
  const people = (attendees.data?.data ?? []).map((a) => ({ name: a.fullName, uri: a.avatarUrl }))

  const openUrl = (url: string, failMessage: string) => Linking.openURL(url).catch(() => toast.error(failMessage))
  const goAttendees = () => router.push({ pathname: '/events/attendees', params: { id: String(st.eventId ?? id) } })
  const goPost = () => router.push({ pathname: '/post/[id]', params: { id: String(st.postId) } })
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/events'))

  return (
    <Screen bg={t.bg}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEventThrottle={32}
        onScroll={(ev) => setScrolled(ev.nativeEvent.contentOffset.y > COMPACT_BAR_AT)}
      >
        <EventCover uri={cover} start={start} online={online} height={COVER_HEIGHT} dim={phase === 'cancelled' || phase === 'ended'}>
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <FloatingButton label="Quay lại" onPress={goBack} icon={<ChevronLeft size={22} color={t.text} />} />
            <FloatingButton label="Chia sẻ sự kiện" onPress={() => setShareOpen(true)} icon={<Share2 size={20} color={t.text} />} />
          </View>
        </EventCover>

        <View style={{ backgroundColor: t.card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <EventStatusTag phase={phase} registered={st.registered} />
            {isHost ? <Tag label="Bạn là người tổ chức" tone="primary" /> : null}
            {online ? <Tag label="Trực tuyến" tone="info" icon={<Globe size={12} color={t.info} />} /> : null}
          </View>
          <Txt size={24} weight="800" heading>{st.title}</Txt>

          <View style={{ marginTop: 12 }}>
            <MetaRow
              icon={<BrandIcon name="calendar" size={28} />}
              title={eventFullDate(start)}
              subtitle={`${eventTimeRange(start, end)}${when ? ` · ${when}` : ''}`}
            />
            {st.location ? (
              online ? (
                <MetaRow
                  icon={<BrandIcon name="world" size={28} />}
                  title={`Trực tuyến · ${onlinePlatform(st.location)}`}
                  subtitle={canOpenLink ? 'Liên kết tham gia đã sẵn sàng' : 'Liên kết dùng được sau khi bạn đăng ký'}
                  action={canOpenLink ? 'Mở' : undefined}
                  onPress={canOpenLink ? () => openUrl(link!, 'Không thể mở liên kết tham gia.') : undefined}
                />
              ) : (
                <MetaRow
                  icon={<BrandIcon name="pin" size={28} />}
                  title={st.location}
                  subtitle="Xem đường đi trên bản đồ"
                  action="Bản đồ"
                  onPress={() => openUrl(mapsUrl(st.location!), 'Không thể mở bản đồ.')}
                />
              )
            ) : null}
            <MetaRow
              icon={<Avatar uri={post.data?.avatar} name={st.organizerName} size={40} />}
              plainIcon
              title={st.organizerName}
              subtitle={isHost ? 'Người tổ chức (bạn)' : 'Người tổ chức'}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(st.organizerId) } })}
              last
            />
          </View>
        </View>

        {about ? (
          <Section title="Giới thiệu">
            <Txt size={15} numberOfLines={expanded ? undefined : ABOUT_LINES} style={{ lineHeight: ABOUT_LINE_HEIGHT }}>{about}</Txt>
            {/* Bản sao ẩn không giới hạn dòng để biết nội dung có dài hơn số dòng hiển thị hay không. */}
            <View style={{ position: 'absolute', top: 0, left: 16, right: 16, opacity: 0 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View onLayout={(ev) => setAboutClamped(ev.nativeEvent.layout.height > ABOUT_LINE_HEIGHT * ABOUT_LINES + 2)}>
                <Txt size={15} style={{ lineHeight: ABOUT_LINE_HEIGHT }}>{about}</Txt>
              </View>
            </View>
            {aboutClamped ? (
              <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
                <Txt size={14} weight="700" color={t.primary}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Txt>
              </Pressable>
            ) : null}
          </Section>
        ) : null}

        <Section title={`${count} người tham gia`} action={count > 0 ? 'Xem tất cả' : undefined} onAction={goAttendees}>
          {count > 0 ? (
            <Pressable onPress={goAttendees} accessibilityRole="button" accessibilityLabel={`Xem ${count} người tham gia`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AvatarStack people={people} total={count} size={34} />
              <Txt muted size={14} numberOfLines={2} style={{ flex: 1 }}>{attendeeSummary(people.map((p) => p.name), count)}</Txt>
            </Pressable>
          ) : (
            <Txt muted size={14}>{phase === 'cancelled' ? 'Sự kiện đã hủy nên không nhận đăng ký.' : 'Chưa có ai đăng ký. Hãy là người đầu tiên!'}</Txt>
          )}
          {phase !== 'cancelled' ? <CapacityMeter count={count} capacity={st.capacity} /> : null}
        </Section>

        <Pressable
          onPress={goPost}
          accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? t.inputBg : t.card, marginTop: 8, paddingHorizontal: 16, paddingVertical: 14 })}
        >
          <MessageCircle size={20} color={t.textMuted} />
          <Txt weight="600" style={{ flex: 1 }}>Xem bài viết và bình luận</Txt>
          <ChevronRight size={18} color={t.textSubtle} />
        </Pressable>

        {st.canCancel ? (
          <Section title="Quản lý sự kiện">
            <Txt muted size={13}>Người đã đăng ký sẽ không thể tiếp tục tham gia sau khi sự kiện bị hủy.</Txt>
            <Button
              title="Hủy sự kiện"
              variant="outline"
              icon={<CalendarX2 size={16} color={t.danger} />}
              onPress={() => setConfirm('event')}
              loading={cancelEvent.isPending}
            />
          </Section>
        ) : null}
      </ScrollView>

      {scrolled ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
          <IconButton label="Quay lại" filled={false} icon={<ChevronLeft size={22} color={t.text} />} onPress={goBack} />
          <Txt weight="700" numberOfLines={1} style={{ flex: 1 }}>{st.title}</Txt>
          <IconButton label="Chia sẻ sự kiện" icon={<Share2 size={20} color={t.text} />} onPress={() => setShareOpen(true)} />
        </View>
      ) : null}

      <BottomBar>
        <View style={{ flex: 1, justifyContent: 'center', minWidth: 0 }}>
          <Txt size={12} weight="700" color={phase === 'cancelled' ? t.textMuted : t.primary} numberOfLines={1}>{eventShortDate(start).toUpperCase()}</Txt>
          <StatusLine phase={phase} registered={st.registered} count={count} capacity={st.capacity} />
        </View>
        <ActionButton
          phase={phase}
          registered={st.registered}
          canRegister={st.canRegister}
          canCancelRegistration={st.canCancelRegistration}
          loading={rsvp.isPending || cancel.isPending}
          onRegister={() => rsvp.mutate()}
          onCancel={() => setConfirm('registration')}
        />
      </BottomBar>

      <ConfirmSheet
        visible={confirm != null}
        title={confirm === 'event' ? 'Hủy sự kiện này?' : 'Hủy đăng ký tham gia?'}
        message={confirm === 'event' ? 'Người đã đăng ký sẽ không thể tiếp tục tham gia sự kiện này.' : 'Chỗ tham gia của bạn sẽ được nhường cho người khác.'}
        confirmLabel="Xác nhận hủy"
        loading={cancel.isPending || cancelEvent.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => (confirm === 'event' ? cancelEvent.mutate() : cancel.mutate())}
      />
      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{ title: st.title, subtitle: eventEyebrow(start), thumbnail: cover, avatarUrl: post.data?.avatar, path: postPath(st.postId), typeLabel: 'Sự kiện' }}
      />
    </Screen>
  )
}

/** Nút tròn nổi trên ảnh bìa (quay lại, chia sẻ). */
function FloatingButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, opacity: pressed ? 0.8 : 0.94 }, shadow(2, t.isDark)]}
    >
      {icon}
    </Pressable>
  )
}

/** Một dòng thông tin có icon, tiêu đề, dòng phụ và hành động tùy chọn ở bên phải. */
function MetaRow({ icon, plainIcon, title, subtitle, action, onPress, last }: {
  icon: React.ReactNode
  plainIcon?: boolean
  title: string
  subtitle?: string
  action?: string
  onPress?: () => void
  last?: boolean
}) {
  const t = useTheme()
  const content = (
    <>
      {plainIcon ? icon : (
        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="600" numberOfLines={2}>{title}</Txt>
        {subtitle ? <Txt muted size={13} numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      {action ? <Txt size={14} weight="700" color={t.primary}>{action}</Txt> : onPress ? <ChevronRight size={18} color={t.textSubtle} /> : null}
    </>
  )
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.divider }
  if (!onPress) return <View style={style}>{content}</View>
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}${action ? `, ${action}` : ''}`} style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}>
      {content}
    </Pressable>
  )
}

/** Khối nội dung nền trắng tách nhau bằng khoảng nền, có tiêu đề và hành động tùy chọn. */
function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ backgroundColor: t.card, marginTop: 8, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt size={17} weight="700" heading style={{ flex: 1 }}>{title}</Txt>
        {action ? (
          <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={{ minHeight: 32, justifyContent: 'center', paddingLeft: 12 }}>
            <Txt size={14} weight="700" color={t.primary}>{action}</Txt>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  )
}

/** Dòng trạng thái ngắn trên thanh đáy, đi cùng ngày giờ. */
function StatusLine({ phase, registered, count, capacity }: { phase: EventPhase; registered: boolean; count: number; capacity?: number | null }) {
  const t = useTheme()
  if (registered && (phase === 'open' || phase === 'full')) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={14} color={t.success} />
        <Txt size={13} weight="600" color={t.success} numberOfLines={1}>Bạn đã đăng ký</Txt>
      </View>
    )
  }
  const text = {
    cancelled: 'Sự kiện đã bị hủy',
    live: 'Sự kiện đang diễn ra',
    ended: 'Sự kiện đã kết thúc',
    full: 'Đã hết chỗ',
    open: capacity ? `Còn ${Math.max(0, capacity - count)} chỗ` : 'Đang mở đăng ký',
  }[phase]
  return <Txt size={13} muted numberOfLines={1}>{text}</Txt>
}

/** Nút hành động chính của thanh đáy, đổi theo trạng thái đăng ký và giai đoạn sự kiện. */
function ActionButton({ phase, registered, canRegister, canCancelRegistration, loading, onRegister, onCancel }: {
  phase: EventPhase
  registered: boolean
  canRegister: boolean
  canCancelRegistration: boolean
  loading: boolean
  onRegister: () => void
  onCancel: () => void
}) {
  const t = useTheme()
  const closed = { cancelled: 'Đã hủy', live: 'Đang diễn ra', ended: 'Đã kết thúc' } as const
  if (phase === 'cancelled' || phase === 'live' || phase === 'ended') {
    return <Button title={closed[phase]} variant="secondary" disabled style={{ minWidth: 148 }} />
  }
  if (registered) {
    return <Button title="Hủy đăng ký" variant="outline" disabled={!canCancelRegistration} loading={loading} onPress={onCancel} style={{ minWidth: 148 }} />
  }
  if (phase === 'full' || !canRegister) {
    return <Button title={phase === 'full' ? 'Đã hết chỗ' : 'Chưa thể đăng ký'} variant="secondary" disabled style={{ minWidth: 148 }} />
  }
  return <Button title="Đăng ký" icon={<CheckCircle2 size={17} color={t.onAction} />} loading={loading} onPress={onRegister} style={{ minWidth: 148 }} />
}
