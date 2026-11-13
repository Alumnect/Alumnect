import React, { useMemo, useState } from 'react'
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Empty, IconButton, Screen, Txt } from '@/components/ui'
import { Bell, ChevronRight, GraduationCap, Heart, IgBellCheck, MessageCircle, ShieldAlert } from '@/components/icons'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { notificationApi } from '@/api/notifications'
import type { NotificationItem } from '@/api/notifications'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { routeForTarget } from '@/lib/notificationRoute'
import { groupApi } from '@/api/mentoringGroups'

type NotifFilter = 'all' | 'unread' | 'system'

type ListRow =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'item'; id: string; item: NotificationItem }

/** Thời gian ngắn gọn kiểu Instagram ("3 giờ", "1 ngày", "5/10"). */
function shortTimeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ngày`
  const dt = new Date(iso)
  return `${dt.getDate()}/${dt.getMonth() + 1}`
}

/** Phân loại thông báo của hệ thống (bảo trì, kiểm duyệt, thông báo quản trị...). */
function isSystemNotif(n: NotificationItem): boolean {
  const type = (n.type ?? '').toUpperCase()
  const targetType = (n.targetType ?? '').toUpperCase()
  const title = (n.title ?? '').toLowerCase()
  const content = (n.content ?? '').toLowerCase()
  const sender = (n.senderName ?? '').toLowerCase()

  if (
    type.includes('SYSTEM') ||
    type.includes('ADMIN') ||
    type.includes('MODERATION') ||
    type.includes('MAINTENANCE') ||
    targetType === 'SYSTEM'
  ) {
    return true
  }
  if (
    title.includes('hệ thống') ||
    title.includes('bảo trì') ||
    title.includes('xem xét') ||
    title.includes('vi phạm') ||
    title.includes('tiêu chuẩn cộng đồng') ||
    title.includes('tài khoản') ||
    content.includes('hệ thống alumnect') ||
    content.includes('tiêu chuẩn cộng đồng') ||
    content.includes('quản trị viên') ||
    sender.includes('hệ thống') ||
    sender.includes('quản trị')
  ) {
    return true
  }
  if (!n.senderId && !n.senderName) {
    return true
  }
  return false
}

/** Nhóm thời gian giống Instagram: Đáng chú ý / Hôm nay, Hôm qua, 7 ngày qua, Trước đó. */
function getSectionTitle(iso: string, index: number, isRead: boolean): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (!isRead && hours < 24 && index < 3) return 'Đáng chú ý'
  if (hours < 24) return 'Hôm nay'
  if (hours < 48) return 'Hôm qua'
  if (hours < 24 * 7) return '7 ngày qua'
  return 'Trước đó'
}

/** Tiêu đề chung lặp lại với nội dung thì gộp gọn như Instagram. */
const GENERIC_TITLES = new Set([
  'câu trả lời mới',
  'bình luận mới',
  'lượt thích mới',
  'thông báo mới',
  'tin nhắn mới',
])

function formatInlineParts(n: NotificationItem): { lead: string; body: string } {
  const rawTitle = (n.title ?? '').trim()
  const rawContent = (n.content ?? '').trim()
  const sender = (n.senderName ?? '').trim()

  if (sender && rawContent.toLowerCase().startsWith(sender.toLowerCase())) {
    return {
      lead: rawContent.slice(0, sender.length),
      body: rawContent.slice(sender.length).trimStart(),
    }
  }
  if (rawTitle && !GENERIC_TITLES.has(rawTitle.toLowerCase())) {
    return {
      lead: rawTitle,
      body: rawContent,
    }
  }
  if (sender) {
    return {
      lead: sender,
      body: rawContent,
    }
  }
  return {
    lead: rawTitle || 'Hệ thống AlumNect',
    body: rawContent,
  }
}

/** Huy hiệu nhỏ ở góc phải dưới avatar giống Instagram. */
function NotifCornerBadge({ item, system }: { item: NotificationItem; system: boolean }) {
  const t = useTheme()
  const text = `${item.type ?? ''} ${item.title ?? ''} ${item.content ?? ''}`.toLowerCase()

  let bg = '#3B82F6'
  let icon = <MessageCircle size={10} color="#FFF" weight="fill" />

  if (system) {
    bg = '#EA580C'
    icon = <ShieldAlert size={10} color="#FFF" weight="fill" />
  } else if (text.includes('thích') || text.includes('like') || text.includes('reaction') || text.includes('tim')) {
    bg = '#FF3040'
    icon = <Heart size={10} color="#FFF" weight="fill" />
  } else if (text.includes('mentoring') || text.includes('cố vấn') || (item.targetType ?? '').includes('MENTOR')) {
    bg = '#7C3AED'
    icon = <GraduationCap size={10} color="#FFF" weight="fill" />
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: t.card,
      }}
    >
      {icon}
    </View>
  )
}

export default function NotificationsScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<NotifFilter>('all')

  const q = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => notificationApi.list(pageParam),
    getNextPageParam: (last) => (last.data.last ? undefined : last.data.pageNumber + 1),
  })
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.data.content) ?? [], [q.data])

  const systemItems = useMemo(() => items.filter(isSystemNotif), [items])
  const unreadSystemCount = useMemo(() => systemItems.filter((n) => !n.isRead).length, [systemItems])
  const unreadTotalCount = useMemo(() => items.filter((n) => !n.isRead).length, [items])

  const invitations = useQuery({
    queryKey: ['mentoring-groups', 'invitations'],
    queryFn: groupApi.invitations,
    enabled: items.some((n) => n.targetType === 'MENTORING_GROUP_INVITATION'),
  })
  const pendingGroups = new Set((invitations.data ?? []).map((g) => g.id))
  const latestInvite = new Map<number, number>()
  for (const n of items) {
    if (n.targetType === 'MENTORING_GROUP_INVITATION') {
      const gid = Number(n.targetId?.split(':')[0])
      if (!latestInvite.has(gid)) latestInvite.set(gid, n.id)
    }
  }

  const respond = useMutation({
    mutationFn: ({ groupId, accept }: { groupId: number; accept: boolean; notificationId: number }) =>
      accept ? groupApi.accept(groupId) : groupApi.decline(groupId),
    onSuccess: (_data, input) => {
      readOne.mutate(input.notificationId)
      toast.success(input.accept ? 'Đã tham gia nhóm mentoring.' : 'Đã từ chối lời mời.')
    },
    onError: (e) => toast.error(errMsg(e)),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }
  const readAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!')
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const readOne = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e)),
  })

  const open = (n: NotificationItem) => {
    if (!n.isRead) readOne.mutate(n.id)
    const href = routeForTarget(n.targetType, n.targetId)
    if (href) router.push(href)
  }

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.isRead)
    if (filter === 'system') return systemItems
    return items
  }, [items, systemItems, filter])

  const rows = useMemo<ListRow[]>(() => {
    const out: ListRow[] = []
    let lastSec = ''
    filtered.forEach((n, idx) => {
      const sec = getSectionTitle(n.createdAt, idx, n.isRead)
      if (sec !== lastSec) {
        out.push({ kind: 'section', id: `sec-${sec}-${n.id}`, title: sec })
        lastSec = sec
      }
      out.push({ kind: 'item', id: String(n.id), item: n })
    })
    return out
  }, [filtered])

  const changeFilter = (next: NotifFilter) => {
    Haptics.selectionAsync().catch(() => {})
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setFilter(next)
  }

  const latestSystem = systemItems[0]

  return (
    <Screen bg={t.card}>
      <Header
        title="Thông báo"
        right={
          <IconButton
            filled={false}
            label="Đánh dấu tất cả đã đọc"
            icon={<IgBellCheck size={23} color={t.text} />}
            onPress={() => readAll.mutate()}
          />
        }
      />

      {/* Thanh phân loại gọn nhẹ: Tất cả | Chưa đọc | Hệ thống (nằm bên phải) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => changeFilter('all')}
            accessibilityRole="button"
            style={{
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: filter === 'all' ? t.text : t.inputBg,
            }}
          >
            <Txt size={12.5} weight="600" color={filter === 'all' ? t.card : t.text}>
              Tất cả
            </Txt>
          </Pressable>

          <Pressable
            onPress={() => changeFilter('unread')}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 15,
              backgroundColor: filter === 'unread' ? t.text : t.inputBg,
            }}
          >
            <Txt size={12.5} weight="600" color={filter === 'unread' ? t.card : t.text}>
              Chưa đọc
            </Txt>
            {unreadTotalCount > 0 ? (
              <View
                style={{
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  borderRadius: 8,
                  backgroundColor: '#FF3040',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt size={10} weight="700" color="#FFF" style={{ lineHeight: 12 }}>
                  {unreadTotalCount > 99 ? '99+' : unreadTotalCount}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Mục Thông báo hệ thống nằm bên phải */}
        <Pressable
          onPress={() => changeFilter(filter === 'system' ? 'all' : 'system')}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 30,
            paddingHorizontal: 12,
            borderRadius: 15,
            backgroundColor: filter === 'system' ? t.text : t.inputBg,
          }}
        >
          <ShieldAlert size={14} color={filter === 'system' ? t.card : t.primary} weight="fill" />
          <Txt size={12.5} weight="600" color={filter === 'system' ? t.card : t.text}>
            Hệ thống
          </Txt>
          {unreadSystemCount > 0 ? (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#FF3040',
              }}
            />
          ) : null}
        </Pressable>
      </View>

      {q.isLoading ? (
        <ListSkeleton variant="row" />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.id}
          getItemType={(r) => r.kind}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            filter === 'all' && latestSystem ? (
              <Pressable
                onPress={() => changeFilter('system')}
                accessibilityRole="button"
                accessibilityLabel="Thông báo hệ thống"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  gap: 11,
                  backgroundColor: pressed ? t.inputBg : t.card,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: t.border,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: t.primaryTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <ShieldAlert size={20} color={t.primary} weight="fill" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={13.5} weight="700" numberOfLines={1}>
                    Thông báo hệ thống
                  </Txt>
                  <Txt size={12} color={t.textMuted} numberOfLines={1} style={{ marginTop: 1 }}>
                    {latestSystem.title || latestSystem.content}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {unreadSystemCount > 0 ? (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                  ) : null}
                  <ChevronRight size={16} color={t.textMuted} />
                </View>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => {
                void q.refetch()
              }}
              icon={<Bell size={28} color={t.primary} />}
              title={
                filter === 'unread'
                  ? 'Không còn thông báo chưa đọc'
                  : filter === 'system'
                    ? 'Chưa có thông báo hệ thống'
                    : 'Chưa có thông báo'
              }
              text={
                filter === 'system'
                  ? 'Các thông báo bảo trì, kiểm duyệt và cập nhật từ hệ thống sẽ hiển thị tại đây.'
                  : 'Thông báo về lượt thích, bình luận, mentoring sẽ hiện ở đây.'
              }
            />
          }
          renderItem={({ item: row }) => {
            if (row.kind === 'section') {
              return (
                <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, backgroundColor: t.card }}>
                  <Txt size={14} weight="700" color={t.text}>
                    {row.title}
                  </Txt>
                </View>
              )
            }

            const item = row.item
            const system = isSystemNotif(item)
            const { lead, body } = formatInlineParts(item)
            const groupId = Number(item.targetId?.split(':')[0])
            const invitation = item.targetType === 'MENTORING_GROUP_INVITATION' && latestInvite.get(groupId) === item.id
            const groupName = invitations.data?.find((g) => g.id === groupId)?.name ?? 'mentoring'

            return (
              <View style={{ backgroundColor: item.isRead ? t.card : t.surface }}>
                <Pressable
                  onPress={() => open(item)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    gap: 11,
                    backgroundColor: pressed ? t.inputBg : item.isRead ? t.card : t.surface,
                  })}
                >
                  <View style={{ position: 'relative', width: 40, height: 40 }}>
                    {system ? (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: t.primaryTint,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: t.border,
                        }}
                      >
                        <ShieldAlert size={19} color={t.primary} weight="fill" />
                      </View>
                    ) : (
                      <Avatar uri={item.senderAvatarUrl} name={item.senderName ?? 'U'} size={40} />
                    )}
                    <NotifCornerBadge item={item} system={system} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={13} numberOfLines={3} style={{ lineHeight: 18 }}>
                      <Txt size={13} weight="700" color={t.text}>
                        {lead}
                      </Txt>
                      {body ? (
                        <Txt size={13} color={t.text}>
                          {lead.endsWith(':') || lead.endsWith('.') ? ` ${body}` : ` ${body}`}
                        </Txt>
                      ) : null}
                      <Txt size={12} color={t.textMuted}>
                        {`  ${shortTimeAgo(item.createdAt)}`}
                      </Txt>
                    </Txt>
                  </View>

                  {invitation && pendingGroups.has(groupId) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Pressable
                        onPress={() => respond.mutate({ groupId, accept: true, notificationId: item.id })}
                        disabled={respond.isPending}
                        accessibilityLabel={`Tham gia nhóm ${groupName}`}
                        style={{
                          height: 30,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: '#3B82F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Txt size={12} weight="700" color="#FFF">
                          Xác nhận
                        </Txt>
                      </Pressable>
                      <Pressable
                        onPress={() => respond.mutate({ groupId, accept: false, notificationId: item.id })}
                        disabled={respond.isPending}
                        accessibilityLabel={`Từ chối lời mời ${groupName}`}
                        style={{
                          height: 30,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: t.inputBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Txt size={12} weight="600" color={t.text}>
                          Xóa
                        </Txt>
                      </Pressable>
                    </View>
                  ) : !item.isRead ? (
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#3B82F6' }} />
                  ) : null}
                </Pressable>
              </View>
            )
          }}
        />
      )}
    </Screen>
  )
}

