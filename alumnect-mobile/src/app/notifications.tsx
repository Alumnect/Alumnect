import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Chip, ChipRow, Empty, IconButton, Screen, Txt } from '@/components/ui'
import { Bell, CheckCheck } from '@/components/icons'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { notificationApi } from '@/api/notifications'
import type { NotificationItem } from '@/api/notifications'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { routeForTarget } from '@/lib/notificationRoute'
import { groupApi } from '@/api/mentoringGroups'

/** Thời gian tương đối kiểu "5 phút trước". */
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function NotificationsScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const q = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => notificationApi.list(pageParam),
    getNextPageParam: (last) => (last.data.last ? undefined : last.data.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.data.content) ?? []
  const invitations = useQuery({ queryKey: ['mentoring-groups', 'invitations'], queryFn: groupApi.invitations, enabled: items.some((n) => n.targetType === 'MENTORING_GROUP_INVITATION') })
  const pendingGroups = new Set((invitations.data ?? []).map((g) => g.id))
  const latestInvite = new Map<number, number>()
  for (const n of items) if (n.targetType === 'MENTORING_GROUP_INVITATION') {
    const gid = Number(n.targetId?.split(':')[0])
    if (!latestInvite.has(gid)) latestInvite.set(gid, n.id)
  }
  const respond = useMutation({
    mutationFn: ({ groupId, accept }: { groupId: number; accept: boolean; notificationId: number }) => accept ? groupApi.accept(groupId) : groupApi.decline(groupId),
    onSuccess: (_data, input) => {
      readOne.mutate(input.notificationId)
      toast.success(input.accept ? 'Đã tham gia nhóm mentoring.' : 'Đã từ chối lời mời.')
    },
    onError: (e) => toast.error(errMsg(e)),
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['mentoring-groups'] }); void qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }
  const readAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!')
      refresh()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const readOne = useMutation({ mutationFn: (id: number) => notificationApi.markRead(id), onSuccess: refresh, onError: (e) => toast.error(errMsg(e)) })

  const open = (n: NotificationItem) => {
    if (!n.isRead) readOne.mutate(n.id)
    const href = routeForTarget(n.targetType, n.targetId)
    if (href) router.push(href)
  }

  const shown = filter === 'unread' ? items.filter((n) => !n.isRead) : items

  return (
    <Screen bg={t.card}>
      <Header
        title="Thông báo"
        right={<IconButton label="Đánh dấu tất cả đã đọc" icon={<CheckCheck size={19} color={t.text} />} onPress={() => readAll.mutate()} />}
      />
      <ChipRow>
        <Chip label="Tất cả" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Chưa đọc" active={filter === 'unread'} onPress={() => setFilter('unread')} />
      </ChipRow>
      {q.isLoading ? (
        <ListSkeleton variant="row" />
      ) : (
        <FlashList
          data={shown}
          keyExtractor={(n) => String(n.id)}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={
            <Empty error={q.error} onRetry={() => { void q.refetch() }}
              icon={<Bell size={28} color={t.primary} />}
              title={filter === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo'}
              text="Thông báo về lượt thích, bình luận, mentoring sẽ hiện ở đây."
            />
          }
          renderItem={({ item }) => {
            const groupId = Number(item.targetId?.split(':')[0])
            const invitation = item.targetType === 'MENTORING_GROUP_INVITATION' && latestInvite.get(groupId) === item.id
            const groupName = invitations.data?.find((g) => g.id === groupId)?.name ?? 'mentoring'
            return <View style={{ backgroundColor: item.isRead ? t.card : t.surface }}><Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12, backgroundColor: pressed ? t.inputBg : item.isRead ? t.card : t.surface })}
            >
              <Avatar uri={item.senderAvatarUrl} name={item.senderName ?? 'A'} size={52} />
              <View style={{ flex: 1 }}>
                {item.title ? <Txt weight="700" numberOfLines={1}>{item.title}</Txt> : null}
                <Txt size={14} numberOfLines={3} style={{ lineHeight: 20 }}>{item.content}</Txt>
                <Txt size={12} color={item.isRead ? t.textMuted : t.primary} weight={item.isRead ? '400' : '700'} style={{ marginTop: 3 }}>{timeAgo(item.createdAt)}</Txt>
              </View>
              {!item.isRead ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} /> : null}
            </Pressable>
            {invitation && pendingGroups.has(groupId) ? <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
              <Button title="Tham gia nhóm" accessibilityLabel={`Tham gia nhóm ${groupName}`} loading={respond.isPending && respond.variables?.groupId === groupId && respond.variables.accept} disabled={respond.isPending} onPress={() => respond.mutate({ groupId, accept: true, notificationId: item.id })} style={{ flex: 1 }} />
              <Button title="Từ chối" accessibilityLabel={`Từ chối lời mời ${groupName}`} variant="outline" loading={respond.isPending && respond.variables?.groupId === groupId && !respond.variables.accept} disabled={respond.isPending} onPress={() => respond.mutate({ groupId, accept: false, notificationId: item.id })} style={{ flex: 1 }} />
            </View> : invitation && invitations.isError ? <Button title="Tải lại lời mời" variant="ghost" onPress={() => void invitations.refetch()} /> : null}
            </View>
          }}
        />
      )}
    </Screen>
  )
}
