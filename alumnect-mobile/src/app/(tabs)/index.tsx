import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import { useNavigation, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bell, Bookmark, BriefcaseBusiness, CalendarDays, Compass, IgBell, IgClose, IgMessenger, IgPlus, IgSearch, LayoutGrid, MessageCircle, Trophy } from '@/components/icons'
import { ActionSheet } from '@/components/ActionSheet'
import { Empty, Screen, SearchBar, Txt } from '@/components/ui'
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
            onPress={() => {
              Haptics.selectionAsync().catch(() => {})
              onClose()
              router.push(d.href as never)
            }}
            style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 8, opacity: pressed ? 0.65 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}
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

/** Một hàng duy nhất: nút Khám phá cố định bên trái + các chip lọc loại bài cuộn ngang bên phải. */
function FeedBar({ filter, onFilter, onDiscover }: { filter: FeedFilter; onFilter: (f: FeedFilter) => void; onDiscover: () => void }) {
  const t = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.card,
        paddingLeft: 14,
        marginBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          onDiscover()
        }}
        accessibilityRole="button"
        accessibilityLabel="Khám phá"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 36,
          paddingHorizontal: 13,
          borderRadius: 18,
          backgroundColor: t.primary,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Compass size={17} color={t.onPrimary} weight="fill" />
        <Txt size={13} weight="600" color={t.onPrimary}>Khám phá</Txt>
      </Pressable>
      <View style={{ width: 1, height: 22, backgroundColor: t.border, marginLeft: 10 }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: 10, paddingRight: 14, paddingVertical: 10, alignItems: 'center', gap: 8 }}
      >
        {FILTERS.map(([k, label]) => {
          const active = k === filter
          const Icon = FILTER_ICON[k]
          return (
            <Pressable
              key={k}
              onPress={() => {
                if (k !== filter) {
                  Haptics.selectionAsync().catch(() => {})
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                  onFilter(k)
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 18,
                backgroundColor: active ? t.text : t.inputBg,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
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

/** Nút hành động trên thanh topbar theo phong cách Instagram Cotton (E:\Clone UIUX\instagram-clone). */
function HeaderActionBtn({
  icon,
  label,
  badge,
  active = false,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  badge?: number
  active?: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const [scale] = useState(() => new Animated.Value(1))

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.86,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 10,
    }).start()
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? t.inputBg : pressed ? t.bg : 'transparent',
      })}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
        {icon}
        {badge && badge > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#FF3040',
              borderWidth: 1.8,
              borderColor: t.card,
            }}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  )
}

export default function FeedScreen() {
  const t = useTheme()
  const router = useRouter()
  const navigation = useNavigation()
  const listRef = useRef<FlashListRef<Post>>(null)
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

  const [manualRefreshing, setManualRefreshing] = useState(false)
  const refetchRef = useRef(q.refetch)
  useEffect(() => {
    refetchRef.current = q.refetch
  }, [q.refetch])

  const reloadLatestPosts = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
    setManualRefreshing(true)
    const start = Date.now()
    try {
      await refetchRef.current()
    } finally {
      const elapsed = Date.now() - start
      if (elapsed < 350) {
        await new Promise((r) => setTimeout(r, 350 - elapsed))
      }
      setManualRefreshing(false)
    }
  }, [])

  // Khi bấm vào nút Home dưới thanh navbar: cuộn mượt lên đầu bảng tin và tải lại bài viết mới nhất.
  useEffect(() => {
    const unsub = navigation.addListener('tabPress' as never, () => {
      void reloadLatestPosts()
    })
    return unsub
  }, [navigation, reloadLatestPosts])

  return (
    <Screen>
      <View
        style={{
          backgroundColor: t.card,
          paddingHorizontal: 10,
          paddingTop: 6,
          paddingBottom: 8,
          gap: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 38 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}>
            <HeaderActionBtn
              label="Tạo bài viết"
              icon={<IgPlus size={25} color={t.text} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                router.push('/post/create')
              }}
            />
          </View>
          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              onPress={() => {
                void reloadLatestPosts()
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="AlumNect — Làm mới bảng tin"
            >
              <Brand centered />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, zIndex: 2 }}>
            <HeaderActionBtn
              label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm kiếm'}
              active={searchOpen}
              icon={searchOpen ? <IgClose size={21} color={t.text} /> : <IgSearch size={22} color={t.text} />}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                if (searchOpen) setSearch('')
                setSearchOpen(!searchOpen)
              }}
            />
            <HeaderActionBtn
              label="Thông báo"
              badge={unread}
              icon={<IgBell size={22} color={t.text} />}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                router.push('/notifications')
              }}
            />
            <HeaderActionBtn
              label="Tin nhắn"
              icon={<IgMessenger size={22} color={t.text} />}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                router.push('/chat')
              }}
            />
          </View>
        </View>
        {searchOpen ? <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm bài viết, người đăng..." autoFocus style={{ paddingHorizontal: 4 }} /> : null}
      </View>

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          ref={listRef}
          data={q.isLoading ? [] : posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={manualRefreshing || q.isRefetching}
          onRefresh={() => {
            void reloadLatestPosts()
          }}
          ListHeaderComponent={
            <View>
              <FeedBar filter={filter} onFilter={setFilter} onDiscover={() => setDiscoverOpen(true)} />
              {q.isLoading ? <ListSkeleton variant="post" /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
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
