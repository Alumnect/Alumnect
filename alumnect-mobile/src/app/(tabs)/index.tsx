import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import { useNavigation, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bookmark, IgBell, IgClose, IgMessenger, IgPlus, IgSearch, MessageCircle } from '@/components/icons'
import { AnimatedFilterChip } from '@/components/FeedNavIcons'
import { MeetupScribble } from '@/components/MeetupScribble'
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

/** Một hàng duy nhất: nút Khám phá cố định bên trái + các chip lọc loại bài cuộn ngang bên phải với bộ logo sáng tạo & hiệu ứng nảy. */
function FeedBar({ filter, onFilter, onDiscover }: { filter: FeedFilter; onFilter: (f: FeedFilter) => void; onDiscover: () => void }) {
  const t = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.card,
        paddingLeft: 12,
        marginBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
      }}
    >
      <AnimatedFilterChip
        category="explore"
        label="Khám phá"
        active={false}
        onPress={onDiscover}
      />
      <View style={{ width: 1, height: 22, backgroundColor: t.border, marginLeft: 10 }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: 10, paddingRight: 14, paddingVertical: 10, alignItems: 'center', gap: 8 }}
      >
        {FILTERS.map(([k, label]) => (
          <AnimatedFilterChip
            key={k}
            category={k}
            label={label}
            active={k === filter}
            onPress={() => {
              if (k !== filter) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                onFilter(k)
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

/** Nút hành động trên thanh topbar với hiệu ứng sóng lan toả & lắc nhún khi chạm. */
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
  const scale = useRef(new Animated.Value(1)).current
  const tilt = useRef(new Animated.Value(0)).current
  const ripple = useRef(new Animated.Value(0)).current
  const [rippling, setRippling] = useState(false)

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.82,
      useNativeDriver: true,
      speed: 45,
      bounciness: 6,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3.8,
      tension: 200,
    }).start()
  }

  const handlePress = () => {
    tilt.setValue(-1)
    Animated.spring(tilt, {
      toValue: 0,
      friction: 3.5,
      tension: 200,
      useNativeDriver: true,
    }).start()
    setRippling(true)
    ripple.setValue(0)
    Animated.timing(ripple, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRippling(false)
    })
    onPress()
  }

  const rotate = tilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  })
  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.85],
  })
  const rippleOpacity = ripple.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.65, 0.4, 0],
  })

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? t.primaryTint : pressed ? t.inputBg : 'transparent',
      })}
    >
      {rippling && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 30,
            height: 30,
            borderRadius: 15,
            borderWidth: 1.8,
            borderColor: t.primary,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale }, { rotate }], alignItems: 'center', justifyContent: 'center' }}>
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
                icon={<MeetupScribble name={searching ? 'no_search_map_result' : 'two_chat_bubbles'} size={52} color={t.primary} />}
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
