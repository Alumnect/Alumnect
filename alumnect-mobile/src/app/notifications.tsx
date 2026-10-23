import React from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Empty, Screen, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { notificationApi } from '@/api/notifications'
import type { NotificationItem } from '@/api/notifications'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'
import { routeForTarget } from '@/lib/notificationRoute'

export default function NotificationsScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
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

  return (
    <Screen>
      <Header title="Thông báo" right={<Txt color={t.primary} weight="600" size={13} onPress={() => readAll.mutate()}>Đọc tất cả</Txt>} />
      {q.isLoading ? (
        <ListSkeleton variant="row" />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => String(n.id)}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text="Bạn chưa có thông báo nào." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              style={{ flexDirection: 'row', padding: 14, gap: 12, backgroundColor: item.isRead ? 'transparent' : t.primaryTint, borderBottomWidth: 1, borderBottomColor: t.border }}
            >
              <Avatar uri={item.senderAvatarUrl} name={item.senderName ?? 'A'} size={44} />
              <View style={{ flex: 1 }}>
                {item.title ? <Txt weight="700">{item.title}</Txt> : null}
                <Txt size={14}>{item.content}</Txt>
                <Txt muted size={12} style={{ marginTop: 2 }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Txt>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
