import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bell, Bookmark, MessageCircle, Plus, Search, X } from '@/components/icons'
import { Avatar, Empty, IconButton, Screen, SearchBar, Segmented, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import type { BrandIconName } from '@/components/BrandIcon'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'
import type { FeedFilter, Post } from '@/api/feed'
import { useTheme } from '@/theme'
import { useDebounced } from '@/lib/hooks'
import { useUnreadCount } from '@/api/notifications'
import { useAuthStore } from '@/store/authStore'
import { ListSkeleton } from '@/components/Skeleton'
import { Brand } from '@/components/Brand'

const FILTERS: [FeedFilter, string][] = [
  ['all', 'Tất cả'],
  ['normal', 'Bài thường'],
  ['achievement', 'Thành tựu'],
  ['recruitment', 'Tuyển dụng'],
  ['event', 'Sự kiện'],
]

const SHORTCUTS: { key: string; label: string; icon: BrandIconName | 'saved'; href: string }[] = [
  { key: 'jobs', label: 'Việc làm', icon: 'suitcase', href: '/jobs' },
  { key: 'events', label: 'Sự kiện', icon: 'calendar', href: '/events' },
  { key: 'groups', label: 'Hội nhóm', icon: 'people', href: '/groups' },
  { key: 'map', label: 'Bản đồ', icon: 'pin', href: '/map' },
  { key: 'career', label: 'Lộ trình', icon: 'list', href: '/career' },
  { key: 'salary', label: 'Mức lương', icon: 'coin', href: '/salary' },
  { key: 'saved', label: 'Đã lưu', icon: 'saved', href: '/saved-posts' },
]

/** Một ô tròn trong dải lối tắt (tương đương story của Instagram): viền cam, nhãn bên dưới. */
function RailItem({ label, onPress, children, ringColor, badge }: { label: string; onPress: () => void; children: React.ReactNode; ringColor?: string; badge?: boolean }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ width: 72, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 2.5, borderColor: ringColor ?? t.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{children}</View>
        {badge ? (
          <View style={{ position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: t.primary, borderWidth: 2, borderColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={13} color={t.onPrimary} weight="bold" />
          </View>
        ) : null}
      </View>
      <Txt size={11} numberOfLines={1} style={{ maxWidth: 70 }}>{label}</Txt>
    </Pressable>
  )
}

/** Dải lối tắt đầu bảng tin: "Bài viết của bạn" + các khu vực của Alumnect, thay cho story. */
function Rail() {
  const t = useTheme()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  return (
    <View style={{ backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, gap: 6 }}>
        <RailItem label="Bài của bạn" ringColor={t.border} badge onPress={() => router.push('/post/create')}>
          <Avatar uri={user?.avatarUrl} name={user?.name} size={56} />
        </RailItem>
        {SHORTCUTS.map((s) => (
          <RailItem key={s.key} label={s.label} onPress={() => router.push(s.href as never)}>
            {s.icon === 'saved' ? <Bookmark size={26} color={t.primary} weight="fill" /> : <BrandIcon name={s.icon} size={38} />}
          </RailItem>
        ))}
      </ScrollView>
    </View>
  )
}

export default function FeedScreen() {
  const t = useTheme()
  const router = useRouter()
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const keyword = useDebounced(search, 400)
  const unread = useUnreadCount()

  const q = useInfiniteQuery({
    queryKey: ['feed', filter, keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter, keyword }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
  const posts: Post[] = q.data?.pages.flatMap((p) => p.items) ?? []
  const searching = !!keyword

  return (
    <Screen>
      <View style={{ backgroundColor: t.card, paddingLeft: 16, paddingRight: 12, paddingTop: 8, paddingBottom: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Brand /></View>
          <IconButton
            filled={false}
            label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm kiếm'}
            icon={searchOpen ? <X size={24} color={t.text} /> : <Search size={24} color={t.text} />}
            onPress={() => {
              if (searchOpen) setSearch('')
              setSearchOpen(!searchOpen)
            }}
          />
          <IconButton filled={false} label="Thông báo" badge={unread} icon={<Bell size={24} color={t.text} />} onPress={() => router.push('/notifications')} />
          <IconButton filled={false} label="Tin nhắn" icon={<MessageCircle size={24} color={t.text} />} onPress={() => router.push('/chat')} />
        </View>
        {searchOpen ? <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm bài viết, người đăng..." autoFocus style={{ paddingRight: 10 }} /> : null}
      </View>

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
                    contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={q.isRefetching}
          onRefresh={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            q.refetch()
          }}
          ListHeaderComponent={
            <View>
              {!searching ? <Rail /> : null}
              <Segmented tabs={FILTERS} value={filter} onChange={setFilter} scrollable />
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty error={q.error} onRetry={() => { void q.refetch() }}
                icon={<MessageCircle size={28} color={t.primary} weight="duotone" />}
                title={searching ? 'Không tìm thấy bài viết' : 'Bảng tin còn trống'}
                text={searching ? 'Thử từ khoá khác hoặc bỏ bộ lọc.' : 'Hãy là người đầu tiên chia sẻ điều gì đó với cộng đồng.'}
                action={searching ? undefined : 'Tạo bài viết'}
                onAction={() => router.push('/post/create')}
              />
            )
          }
        />
      </View>
    </Screen>
  )
}
