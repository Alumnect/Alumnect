import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Chip, ChipRow, Empty, IconButton, Screen, Txt } from '@/components/ui'
import { Bell, CheckCheck } from '@/components/icons'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { notificationApi } from '@/api/notifications'
import type { NotificationItem } from '@/api/notifications'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { routeForTarget } from '@/lib/notificationRoute'

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
  const readOne = useMutation({ mutationFn: (id: number) => notificationApi.markRead(id), onSuccess: refresh })

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
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={
            <Empty
              icon={<Bell size={28} color={t.primary} />}
              title={filter === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo'}
              text="Thông báo về lượt thích, bình luận, mentoring sẽ hiện ở đây."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, backgroundColor: pressed ? t.inputBg : item.isRead ? t.card : t.primaryTint })}
            >
              <Avatar uri={item.senderAvatarUrl} name={item.senderName ?? 'A'} size={52} />
              <View style={{ flex: 1 }}>
                {item.title ? <Txt weight="700" numberOfLines={1}>{item.title}</Txt> : null}
                <Txt size={14} numberOfLines={3} style={{ lineHeight: 20 }}>{item.content}</Txt>
                <Txt size={12} color={item.isRead ? t.textMuted : t.primary} weight={item.isRead ? '400' : '700'} style={{ marginTop: 3 }}>{timeAgo(item.createdAt)}</Txt>
              </View>
              {!item.isRead ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} /> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
