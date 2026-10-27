import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bell, Bookmark, BriefcaseBusiness, CalendarDays, Coins, Image as ImageIcon, Map, MessageCircle, Route, Search, Users, X } from '@/components/icons'
import { Avatar, Empty, IconButton, PillLink, Screen, SearchBar, Segmented, Txt } from '@/components/ui'
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

/** Khoảng nền giữa các khối của đầu trang: tách khối bằng khoảng trống thay vì đổ bóng. */
function Gap() {
  const t = useTheme()
  return <View style={{ height: 1, backgroundColor: t.divider }} />
}

/** Ô soạn bài ở đầu bảng tin (giống Composer trên Web) với lối tắt chọn loại bài. */
function Composer() {
  const t = useTheme()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.trim().split(' ').slice(-1)[0] ?? 'bạn'
  const go = (type?: string) => router.push(type ? { pathname: '/post/create', params: { type } } : '/post/create')
  return (
    <View style={{ backgroundColor: t.card, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar uri={user?.avatarUrl} name={user?.name} size={44} />
        <Pressable
          onPress={() => go()}
          accessibilityRole="button"
          accessibilityLabel="Tạo bài viết mới"
          style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: t.inputBg, justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Txt muted numberOfLines={1}>{`${firstName} ơi, bạn đang nghĩ gì?`}</Txt>
        </Pressable>
        <IconButton filled={false} label="Đăng ảnh" icon={<ImageIcon size={24} color={t.primary} weight="duotone" />} onPress={() => go()} />
      </View>
    </View>
  )
}

function FeedIntro() {
  const name = useAuthStore((s) => s.user?.name?.trim().split(' ').slice(-1)[0] ?? 'bạn')
  return (
    <View style={{ padding: 16, paddingBottom: 8 }}>
      <Txt heading size={22} weight="500">Chào {name},</Txt>
      <Txt muted size={13} style={{ marginTop: 4 }}>Câu chuyện mới từ cộng đồng FPTU</Txt>
    </View>
  )
}

/** Hàng lối tắt khám phá: một dòng cuộn ngang thay cho hai hàng ô lớn. */
function Explore() {
  const t = useTheme()
  const router = useRouter()
  const icon = (Icon: typeof Users) => <Icon size={18} color={t.primary} weight="bold" />
  return (
    <View style={{ backgroundColor: t.card }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <PillLink icon={icon(BriefcaseBusiness)} label="Việc làm" onPress={() => router.push('/jobs')} />
        <PillLink icon={icon(CalendarDays)} label="Sự kiện" onPress={() => router.push('/events')} />
        <PillLink icon={icon(Users)} label="Hội nhóm" onPress={() => router.push('/groups')} />
        <PillLink icon={icon(Map)} label="Bản đồ" onPress={() => router.push('/map')} />
        <PillLink icon={icon(Route)} label="Lộ trình" onPress={() => router.push('/career')} />
        <PillLink icon={icon(Coins)} label="Mức lương" onPress={() => router.push('/salary')} />
        <PillLink icon={icon(Bookmark)} label="Đã lưu" onPress={() => router.push('/saved-posts')} />
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
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
              {!searching ? (
                <>
                  <FeedIntro />
                  <Composer />
                  <Explore />
                  <Gap />
                </>
              ) : null}
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
