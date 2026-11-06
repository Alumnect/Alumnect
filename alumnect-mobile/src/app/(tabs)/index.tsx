import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bell, Bookmark, BriefcaseBusiness, CalendarDays, Compass, LayoutGrid, MessageCircle, Search, Trophy, X } from '@/components/icons'
import { ActionSheet } from '@/components/ActionSheet'
import { Empty, IconButton, Screen, SearchBar, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import type { BrandIconName } from '@/components/BrandIcon'
import { PostCard } from '@/components/PostCard'
import { feedApi } from '@/api/feed'
import type { FeedFilter, Post } from '@/api/feed'
import { useTheme } from '@/theme'
import { useDebounced } from '@/lib/hooks'
import { useUnreadCount } from '@/api/notifications'
import { ListSkeleton } from '@/components/Skeleton'
import { Brand } from '@/components/Brand'

const FILTERS: [FeedFilter, string][] = [
  ['all', 'Tất cả'],
  ['normal', 'Bài thường'],
  ['achievement', 'Thành tựu'],
  ['recruitment', 'Tuyển dụng'],
  ['event', 'Sự kiện'],
]

const FILTER_ICON: Record<FeedFilter, typeof Bell> = {
  all: LayoutGrid,
  normal: MessageCircle,
  achievement: Trophy,
  recruitment: BriefcaseBusiness,
  event: CalendarDays,
}

const DISCOVER: { label: string; icon: BrandIconName | 'saved'; href: string }[] = [
  { label: 'Việc làm', icon: 'suitcase', href: '/jobs' },
  { label: 'Sự kiện', icon: 'calendar', href: '/events' },
  { label: 'Hội nhóm', icon: 'people', href: '/groups' },
  { label: 'Bản đồ', icon: 'pin', href: '/map' },
  { label: 'Lộ trình', icon: 'list', href: '/career' },
  { label: 'Mức lương', icon: 'coin', href: '/salary' },
  { label: 'Đã lưu', icon: 'saved', href: '/saved-posts' },
]

/** Bảng "Khám phá": mọi khu vực của Alumnect ngoài bảng tin, gom vào một chỗ thay vì dàn hàng ngang trên feed. */
function DiscoverSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <ActionSheet visible={visible} onClose={onClose} title="Khám phá">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 }}>
        {DISCOVER.map((d) => (
          <Pressable
            key={d.label}
            accessibilityRole="button"
            accessibilityLabel={d.label}
            onPress={() => { onClose(); router.push(d.href as never) }}
            style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
              {d.icon === 'saved' ? <Bookmark size={28} color={t.primary} weight="fill" /> : <BrandIcon name={d.icon} size={40} />}
            </View>
            <Txt size={12} weight="500" numberOfLines={1}>{d.label}</Txt>
          </Pressable>
        ))}
      </View>
    </ActionSheet>
  )
}

/** Một hàng duy nhất: nút Khám phá + lọc loại bài (chip có icon, chip đang chọn đảo màu). */
function FeedBar({ filter, onFilter, onDiscover }: { filter: FeedFilter; onFilter: (f: FeedFilter) => void; onDiscover: () => void }) {
  const t = useTheme()
  return (
    <View style={{ backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={onDiscover}
          accessibilityRole="button"
          accessibilityLabel="Khám phá"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 })}
        >
          <Compass size={17} color={t.onPrimary} weight="fill" />
          <Txt size={13} weight="600" color={t.onPrimary}>Khám phá</Txt>
        </Pressable>
        <View style={{ width: StyleSheet.hairlineWidth, height: 20, backgroundColor: t.controlBorder }} />
        {FILTERS.map(([k, label]) => {
          const active = k === filter
          const Icon = FILTER_ICON[k]
          return (
            <Pressable
              key={k}
              onPress={() => onFilter(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: active ? t.text : t.inputBg, opacity: pressed ? 0.8 : 1 })}
            >
              <Icon size={16} color={active ? t.card : t.textMuted} weight={active ? 'fill' : 'regular'} />
              <Txt size={13} weight="600" color={active ? t.card : t.text}>{label}</Txt>
            </Pressable>
          )
        })}
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
  const [discoverOpen, setDiscoverOpen] = useState(false)
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
              <FeedBar filter={filter} onFilter={setFilter} onDiscover={() => setDiscoverOpen(true)} />
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
      <DiscoverSheet visible={discoverOpen} onClose={() => setDiscoverOpen(false)} />
    </Screen>
  )
}
