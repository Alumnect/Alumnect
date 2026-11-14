import React, { useEffect, useMemo, useState } from 'react'
import { Animated, Easing, LayoutAnimation, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text } from '@/components/AppText'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { BadgeCheck, IgClose, IgSearch, MessageSquare, PenSquare, SlidersHorizontal } from '@/components/icons'
import { Avatar, Empty, Screen, SearchBar, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { MeetupScribble } from '@/components/MeetupScribble'
import { FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { TopicStory, topicIcon } from '@/components/ForumBits'
import { Enter, MotionPressable, useReducedMotion } from '@/components/Motion'
import { SkeletonBlock } from '@/components/Skeleton'
import { SoftTabs } from '@/components/SocialUI'
import { VoteButton } from '@/components/VoteButton'
import { forumApi } from '@/api/forum'
import type { Question } from '@/api/forum'
import { authApi } from '@/api/auth'
import { useDebounced } from '@/lib/hooks'
import { useAuthStore } from '@/store/authStore'
import { radius, shadow, useTheme } from '@/theme'

// References: E:/Clone UIUX/{export,instagram-clone,kakaostory-clone}.
// Meetup: illustrated categories + search/filter header; Instagram: story rail for topics, icon-only top bar;
// Kakao: rounded feed cards on a quiet grey canvas, pill actions, floating compose button.

type SortKey = 'recent' | 'votes' | 'answers'
const SORTS: [SortKey, string][] = [
  ['recent', 'Mới nhất'],
  ['votes', 'Nhiều bình chọn'],
  ['answers', 'Nhiều câu trả lời'],
]

const cardFrame = { marginHorizontal: 12, marginBottom: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth }

/** Nút icon tròn trên thanh tiêu đề (kiểu Instagram), có chấm báo khi bộ lọc đang bật. */
function HeaderButton({ icon, label, active, dot, onPress }: { icon: React.ReactNode; label: string; active?: boolean; dot?: boolean; onPress: () => void }) {
  const t = useTheme()
  return (
    <MotionPressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: active || pressed ? t.inputBg : 'transparent' })}
    >
      {icon}
      {dot ? <View style={{ position: 'absolute', top: 7, right: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary, borderWidth: 2, borderColor: t.card }} /> : null}
    </MotionPressable>
  )
}

/** Lời mời đặt câu hỏi ở đầu danh sách (ô soạn nhanh kiểu Kakao) với minh hoạ bút chì của Meetup. */
function AskPrompt({ onPress }: { onPress: () => void }) {
  const t = useTheme()
  const me = useAuthStore((s) => s.user)
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Đặt câu hỏi"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 4, paddingVertical: 12, paddingLeft: 12, paddingRight: 14, borderRadius: 20, backgroundColor: t.primaryTint }}
    >
      <Avatar uri={me?.avatarUrl} name={me?.name ?? 'Bạn'} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="600">Bạn đang thắc mắc điều gì?</Txt>
        <Txt muted size={12} numberOfLines={1}>Cựu sinh viên sẵn sàng chia sẻ kinh nghiệm</Txt>
      </View>
      <BrandIcon name="pencil" size={36} />
    </MotionPressable>
  )
}

/** Thẻ câu hỏi bo tròn: tác giả, nhãn chủ đề có minh hoạ, tiêu đề, trích đoạn, ảnh thu nhỏ và hàng viên thao tác. */
const QuestionCard = React.memo(function QuestionCard({ item, index }: { item: Question; index: number }) {
  const t = useTheme()
  const router = useRouter()
  const reduced = useReducedMotion()
  const [scale] = useState(() => new Animated.Value(1))
  const press = (down: boolean) => {
    if (reduced) return
    Animated.timing(scale, { toValue: down ? 0.98 : 1, duration: down ? 90 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }
  const open = () => router.push({ pathname: '/forum/[id]', params: { id: item.id } })
  const openAuthor = () => item.authorId && router.push({ pathname: '/profile/[id]', params: { id: item.authorId } })
  const thumb = item.images[0]
  const answered = item.answers > 0
  return (
    <Enter delay={index < 6 ? index * 45 : 0}>
      <Animated.View style={[cardFrame, { backgroundColor: t.card, borderColor: t.border, transform: [{ scale }] }]}>
        <Pressable onPress={openAuthor} accessibilityRole="button" accessibilityLabel={`Trang cá nhân ${item.author}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14 }}>
          <Avatar uri={item.avatar} name={item.author} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Txt weight="700" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{item.author}</Txt>
              {item.verified ? <BadgeCheck size={15} color={t.info} weight="fill" /> : null}
            </View>
            <Txt muted size={12} numberOfLines={1}>{[item.major, item.time].filter(Boolean).join(' · ')}</Txt>
          </View>
        </Pressable>

        <Pressable onPress={open} onPressIn={() => press(true)} onPressOut={() => press(false)} accessibilityRole="link" accessibilityLabel={item.title} style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          {item.topic ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <BrandIcon name={topicIcon(item.topic)} size={18} />
              <Txt size={12} weight="700" color={t.primary} numberOfLines={1} style={{ flexShrink: 1 }}>{item.topic}</Txt>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="700" size={17} style={{ lineHeight: 24 }} numberOfLines={3}>{item.title}</Txt>
              {item.excerpt ? <Txt muted size={14} numberOfLines={thumb ? 3 : 2} style={{ marginTop: 4, lineHeight: 21 }}>{item.excerpt}</Txt> : null}
            </View>
            {thumb ? (
              <View>
                <Image source={{ uri: thumb }} style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" transition={150} recyclingKey={item.id} />
                {item.images.length > 1 ? (
                  <View style={{ position: 'absolute', right: 5, bottom: 5, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>+{item.images.length - 1}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 }}>
          {/* key theo id: ô danh sách được tái sử dụng, số phiếu không được dính sang câu hỏi khác. */}
          <VoteButton key={item.id} pill voted={item.voted} votes={item.votes} onVote={() => forumApi.vote(item.id)} onUnvote={() => forumApi.unvote(item.id)} />
          <Pressable
            onPress={open}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={answered ? `${item.answers} trả lời` : 'Chưa có trả lời, trả lời đầu tiên'}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: answered ? t.successTint : t.inputBg, opacity: pressed ? 0.8 : 1 })}
          >
            <MessageSquare size={18} color={answered ? t.success : t.textMuted} weight={answered ? 'fill' : 'regular'} />
            <Txt size={13} weight="600" color={answered ? t.success : t.textMuted}>{answered ? `${item.answers} trả lời` : 'Trả lời đầu tiên'}</Txt>
          </Pressable>
        </View>
      </Animated.View>
    </Enter>
  )
})

/** Khung chờ cùng hình dáng thẻ câu hỏi, nhấp nháy nhẹ trong lúc tải lần đầu. */
function QuestionSkeleton() {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [pulse] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (reduced) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, reduced])
  return (
    <Animated.View accessibilityLabel="Đang tải câu hỏi" accessibilityRole="progressbar" style={{ opacity: pulse }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[cardFrame, { backgroundColor: t.card, borderColor: t.border, padding: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SkeletonBlock width={38} height={38} round />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="42%" height={12} />
              <SkeletonBlock width="28%" height={10} />
            </View>
          </View>
          <SkeletonBlock width="24%" height={10} style={{ marginBottom: 10 }} />
          <SkeletonBlock height={15} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="72%" height={15} style={{ marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonBlock width={64} height={34} round />
            <SkeletonBlock width={104} height={34} round />
          </View>
        </View>
      ))}
    </Animated.View>
  )
}

/** Vạch tiến trình mảnh chạy ngang khi đổi chủ đề / sắp xếp: danh sách cũ vẫn hiển thị, không chớp khung chờ. */
function LoadingBar({ active }: { active: boolean }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const { width } = useWindowDimensions()
  const [x] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!active || reduced) return
    x.setValue(0)
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [active, reduced, x])
  if (!active) return null
  const bar = reduced ? width : width * 0.4
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', zIndex: 2 }}>
      <Animated.View style={{ width: bar, height: 2, backgroundColor: t.primary, transform: reduced ? [] : [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-bar, width] }) }] }} />
    </View>
  )
}

/** Nút nổi "Đặt câu hỏi": trượt lên khi lời mời ở đầu danh sách đã cuộn khuất. */
function AskFab({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [progress] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const animation = reduced
      ? Animated.timing(progress, { toValue: visible ? 1 : 0, duration: 0, useNativeDriver: true })
      : Animated.spring(progress, { toValue: visible ? 1 : 0, friction: 8, tension: 110, useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [visible, reduced, progress])
  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
      }}
    >
      <MotionPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Đặt câu hỏi"
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingLeft: 16, paddingRight: 20, borderRadius: 26, backgroundColor: t.primary }, shadow(3, t.isDark)]}
      >
        <PenSquare size={20} color={t.onPrimary} weight="bold" />
        <Txt weight="700" color={t.onPrimary}>Đặt câu hỏi</Txt>
      </MotionPressable>
    </Animated.View>
  )
}

/** Hỏi đáp: dải chủ đề kiểu story, sắp xếp nhanh, tìm kiếm và lọc theo ngành như Web. */
export default function ForumTab() {
  const t = useTheme()
  const router = useRouter()
  const reduced = useReducedMotion()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>('recent')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterValues>({})
  const [sheet, setSheet] = useState(false)
  const [fab, setFab] = useState(false)
  const [pulling, setPulling] = useState(false)
  const keyword = useDebounced(search, 400)
  const topics = useQuery({ queryKey: ['forum-topics'], queryFn: forumApi.topics, staleTime: 30 * 60_000 })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })

  const topicIds = selectedTopics.map(Number)
  const majorIds = ((filters.majors as string[]) ?? []).map(Number)

  const q = useInfiniteQuery({
    queryKey: ['forum', keyword, sort, topicIds, majorIds],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => forumApi.list({ page: pageParam, keyword, sort, topicIds, majorIds }),
    getNextPageParam: (l) => (l.hasMore ? l.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const filtering = !!keyword || topicIds.length > 0 || majorIds.length > 0

  const fields: FilterField[] = useMemo(
    () => [{ key: 'majors', title: 'Ngành (chọn nhiều)', type: 'multi', options: (majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name })) }],
    [majors.data],
  )

  const ask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    router.push('/forum/ask')
  }
  const toggleSearch = () => {
    Haptics.selectionAsync().catch(() => {})
    if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (searchOpen) setSearch('')
    setSearchOpen(!searchOpen)
  }
  const toggleTopic = (id: string | null) => {
    Haptics.selectionAsync().catch(() => {})
    setSelectedTopics((cur) => (id == null ? [] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }
  const refresh = async () => {
    setPulling(true)
    try {
      await q.refetch()
    } finally {
      setPulling(false)
    }
  }

  return (
    <Screen bg={t.card}>
      <View style={{ backgroundColor: t.card, paddingLeft: 16, paddingRight: 10, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8 }}>
          <MeetupScribble name="question_mark" size={28} color={t.primary} />
          <Text accessibilityRole="header" style={{ flex: 1, fontSize: 23, lineHeight: 30, fontWeight: '700', color: t.text, letterSpacing: -0.5 }}>Hỏi đáp</Text>
          <HeaderButton
            label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm câu hỏi'}
            active={searchOpen}
            icon={searchOpen ? <IgClose size={21} color={t.text} /> : <IgSearch size={22} color={t.text} />}
            onPress={toggleSearch}
          />
          <HeaderButton
            label={majorIds.length ? `Lọc theo ngành, đang chọn ${majorIds.length}` : 'Lọc theo ngành'}
            dot={countActive(filters) > 0}
            icon={<SlidersHorizontal size={22} color={t.text} />}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {})
              setSheet(true)
            }}
          />
        </View>
        {searchOpen ? <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm câu hỏi theo tiêu đề, nội dung..." autoFocus style={{ paddingRight: 6 }} /> : null}
      </View>

      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 96 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={pulling}
          onRefresh={() => { void refresh() }}
          onScroll={(e) => setFab(e.nativeEvent.contentOffset.y > 240)}
          scrollEventThrottle={32}
          ListHeaderComponent={
            <View>
              <View style={{ backgroundColor: t.card, marginBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
                <AskPrompt onPress={ask} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 16, paddingBottom: 6 }}>
                  <TopicStory icon="chat" label="Tất cả" active={!selectedTopics.length} onPress={() => toggleTopic(null)} />
                  {(topics.data ?? []).map((tp) => {
                    const id = String(tp.id)
                    return <TopicStory key={tp.id} icon={topicIcon(tp.name, tp.id)} label={tp.name} active={selectedTopics.includes(id)} onPress={() => toggleTopic(id)} />
                  })}
                </ScrollView>
                <SoftTabs
                  tabs={SORTS}
                  value={sort}
                  onChange={(k) => {
                    if (k === sort) return
                    Haptics.selectionAsync().catch(() => {})
                    setSort(k)
                  }}
                />
              </View>
              {q.isLoading ? <QuestionSkeleton /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<MeetupScribble name="two_chat_bubbles" size={60} color={t.primary} />}
                title={filtering ? 'Chưa có câu hỏi phù hợp' : 'Chưa có câu hỏi nào'}
                text={filtering ? 'Thử chủ đề khác hoặc bỏ bớt bộ lọc.' : 'Đặt câu hỏi đầu tiên để nhận lời khuyên từ cựu sinh viên.'}
                action="Đặt câu hỏi"
                onAction={ask}
              />
            )
          }
          renderItem={({ item, index }) => <QuestionCard item={item} index={index} />}
        />
        <LoadingBar active={q.isPlaceholderData} />
        <AskFab visible={fab} onPress={ask} />
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} title="Lọc câu hỏi" fields={fields} values={filters} onApply={setFilters} />
    </Screen>
  )
}
