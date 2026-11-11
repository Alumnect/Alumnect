import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Empty, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { SheetModal } from '@/components/SheetModal'
import { ListSkeleton } from '@/components/Skeleton'
import { Check, ChevronDown, ChevronRight, Star, X } from '@/components/icons'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** UC87: bảng xếp hạng mentor theo lĩnh vực (Meetup x Instagram Podium Top 1-2-3 x Kakao Leaderboard — Cam - Trắng - Đen). */
export default function RankingsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [pickedField, setFieldId] = useState<number | null>(null)
  const [fieldSheet, setFieldSheet] = useState(false)
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const listIndustries = industries.data ?? []
  const fieldId = pickedField ?? listIndustries[0]?.id ?? null
  const activeIndustry = listIndustries.find((i) => i.id === fieldId)

  const q = useInfiniteQuery({
    queryKey: ['mentoring-ranking', fieldId],
    enabled: fieldId != null,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.ranking(fieldId!, pageParam),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })
  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const top3 = items.slice(0, 3)

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Bảng xếp hạng Mentor"
        subtitle="Vinh danh chuyên gia cố vấn uy tín nhất theo lĩnh vực"
        right={
          <Pressable
            onPress={() => setFieldSheet(true)}
            style={[styles.headerFilterBtn, { backgroundColor: viridianSoft, borderColor: viridian }]}
          >
            <BrandIcon name="computer" size={16} />
            <Txt size={11} weight="800" style={{ color: viridian }} numberOfLines={1}>
              Ngành
            </Txt>
            <ChevronDown size={13} color={viridian} weight="bold" />
          </Pressable>
        }
      />

      {/* Instagram / Meetup 1-Tap Horizontal Industry Chip Rail */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {listIndustries.map((ind) => {
            const active = fieldId === ind.id
            return (
              <Pressable
                key={ind.id}
                onPress={() => setFieldId(ind.id)}
                style={[
                  styles.industryChip,
                  {
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                {active && <BrandIcon name="sparkle" size={14} />}
                <Txt
                  size={12}
                  weight={active ? '700' : '600'}
                  style={{ color: active ? colors.actionText : colors.textSecondary }}
                >
                  {ind.name}
                </Txt>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {q.isLoading ? (
          <ListSkeleton variant="row" />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(m) => String(m.mentorId)}
            contentContainerStyle={{ paddingBottom: 36 }}
            onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
            ListHeaderComponent={
              top3.length > 0 ? (
                <View
                  style={[
                    styles.podiumContainer,
                    {
                      backgroundColor: isDark ? '#1A130E' : viridianSoft,
                      borderBottomColor: isDark ? '#3B2414' : '#FAD9C2',
                    },
                  ]}
                >
                  {/* Meetup x Kakao Podium Header Banner */}
                  <View style={styles.podiumHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <BrandIcon name="sparkle" size={20} />
                      <Txt
                        size={11}
                        weight="800"
                        style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}
                        numberOfLines={1}
                      >
                        {activeIndustry ? `Bảng Vàng · ${activeIndustry.name}` : 'Bảng Vàng Cố Vấn Tiêu Biểu'}
                      </Txt>
                    </View>
                    <View style={[styles.podiumCountPill, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
                      <BrandIcon name="star" size={14} />
                      <Txt size={11} weight="700" style={{ color: colors.text }}>
                        Top {items.length}
                      </Txt>
                    </View>
                  </View>

                  <View style={styles.podiumRow}>
                    {/* Rank #2 */}
                    {top3[1] ? (
                      <PodiumItem
                        m={top3[1]}
                        rank={2}
                        onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(top3[1].mentorId) } })}
                      />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    {/* Rank #1 */}
                    <PodiumItem
                      m={top3[0]}
                      rank={1}
                      featured
                      onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(top3[0].mentorId) } })}
                    />
                    {/* Rank #3 */}
                    {top3[2] ? (
                      <PodiumItem
                        m={top3[2]}
                        rank={3}
                        onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(top3[2].mentorId) } })}
                      />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="star" size={64} />}
                title="Chưa có dữ liệu xếp hạng"
                text="Lĩnh vực này hiện chưa có mentor nào đủ điều kiện xếp hạng."
              />
            }
            renderItem={({ item }) => {
              const isTop3 = item.rank <= 3
              return (
                <Pressable
                  onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(item.mentorId) } })}
                  style={({ pressed }) => [
                    styles.rankCard,
                    {
                      backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
                      borderColor: item.rank === 1 ? viridian : colors.border,
                      borderWidth: item.rank === 1 ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Top Identity Row: Rank + Avatar + Full Name & Company (Không bị cắt tên) */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor: isTop3 ? viridianSoft : colors.surface,
                          borderColor: isTop3 ? viridian : colors.borderSubtle,
                        },
                      ]}
                    >
                      {isTop3 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <BrandIcon name="star" size={16} />
                          <Txt size={9} weight="800" style={{ color: viridian, marginTop: -2 }}>
                            #{item.rank}
                          </Txt>
                        </View>
                      ) : (
                        <Txt weight="800" size={13} style={{ color: colors.textSecondary }}>
                          #{item.rank}
                        </Txt>
                      )}
                    </View>

                    <Avatar uri={item.avatarUrl} name={item.fullName} size={50} ring={isTop3} />

                    <View style={{ flex: 1, marginLeft: 2 }}>
                      <View style={styles.nameHeaderRow}>
                        <Txt weight="800" size={16} style={{ color: colors.text, flexShrink: 1 }}>
                          {item.fullName}
                        </Txt>
                        <BrandIcon name="check" size={16} />
                      </View>
                      <Txt size={13} style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {item.currentCompany ?? item.headline ?? 'Chuyên gia cố vấn Alumnect'}
                      </Txt>
                    </View>

                    <ChevronRight size={16} color={colors.textTertiary} />
                  </View>

                  {/* Bottom Kakao Metric Strip: Thoáng đãng, tách bạch Rating - Số phiên - Điểm Uy tín */}
                  <View style={[styles.cardBottomStrip, { borderTopColor: colors.borderSubtle }]}>
                    <View style={styles.metricLeftGroup}>
                      <View style={[styles.metricPill, { backgroundColor: viridianSoft }]}>
                        <Star size={12} color={viridian} weight="fill" />
                        <Txt size={12} weight="800" style={{ color: viridian }}>
                          {item.rating?.toFixed?.(1) ?? '5.0'}
                        </Txt>
                      </View>

                      <View style={[styles.metricPill, { backgroundColor: colors.surface }]}>
                        <BrandIcon name="task" size={13} />
                        <Txt size={12} weight="600" style={{ color: colors.textSecondary }}>
                          {`${item.completedTasks} phiên hoàn thành`}
                        </Txt>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.reputationPill,
                        {
                          backgroundColor: isTop3 ? viridian : viridianSoft,
                        },
                      ]}
                    >
                      <Txt
                        size={10}
                        weight="700"
                        style={{ color: isTop3 ? 'rgba(255,255,255,0.88)' : viridian, textTransform: 'uppercase' }}
                      >
                        Uy tín
                      </Txt>
                      <Txt
                        weight="800"
                        size={14}
                        style={{ color: isTop3 ? '#FFFFFF' : viridian, fontVariant: ['tabular-nums'] }}
                      >
                        {Math.round(item.reputationScore)}
                      </Txt>
                    </View>
                  </View>
                </Pressable>
              )
            }}
          />
        )}
      </View>

      {/* Industry Selection Bottom Sheet */}
      <SheetModal visible={fieldSheet} onClose={() => setFieldSheet(false)} maxHeight={0.75}>
        <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <BrandIcon name="computer" size={28} />
            <View style={{ flex: 1 }}>
              <Txt weight="800" size={17} style={{ color: colors.text }}>
                Chọn lĩnh vực xếp hạng
              </Txt>
              <Txt size={11} style={{ color: colors.textTertiary, marginTop: 2 }}>
                Xem bảng vàng Mentor tiêu biểu theo từng ngành
              </Txt>
            </View>
          </View>
          <Pressable onPress={() => setFieldSheet(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16), gap: 8 }}>
          {listIndustries.map((ind) => {
            const active = fieldId === ind.id
            return (
              <Pressable
                key={ind.id}
                onPress={() => {
                  setFieldId(ind.id)
                  setFieldSheet(false)
                }}
                style={[
                  styles.sheetRow,
                  {
                    backgroundColor: active ? viridianSoft : colors.card,
                    borderColor: active ? viridian : colors.borderSubtle,
                  },
                ]}
              >
                <Txt weight={active ? '800' : '600'} size={14} style={{ flex: 1, color: active ? viridian : colors.text }}>
                  {ind.name}
                </Txt>
                {active && <Check size={18} color={viridian} weight="bold" />}
              </Pressable>
            )
          })}
        </ScrollView>
      </SheetModal>
    </Screen>
  )
}

function PodiumItem({
  m,
  rank,
  featured,
  onPress,
}: {
  m: { fullName: string; avatarUrl?: string | null; reputationScore: number; rating?: number }
  rank: number
  featured?: boolean
  onPress: () => void
}) {
  const { colors, viridian, isDark } = useMentoringTheme()
  const badgeColor = rank === 1 ? viridian : rank === 2 ? '#64748B' : '#B45309'
  const avatarSize = featured ? 68 : 54
  const pedestalHeight = featured ? 64 : rank === 2 ? 50 : 44

  return (
    <Pressable onPress={onPress} style={styles.podiumCol}>
      {featured && (
        <View style={{ marginBottom: 4 }}>
          <BrandIcon name="star" size={22} />
        </View>
      )}
      <View style={[styles.podiumAvatarWrap, { borderColor: badgeColor, backgroundColor: colors.card }]}>
        <Avatar uri={m.avatarUrl} name={m.fullName} size={avatarSize} />
        <View style={[styles.podiumRankPill, { backgroundColor: badgeColor }]}>
          <Txt size={10} weight="800" style={{ color: '#FFFFFF' }}>
            #{rank}
          </Txt>
        </View>
      </View>
      <View style={styles.podiumNameWrap}>
        <Txt
          weight="800"
          size={featured ? 12.5 : 11.5}
          numberOfLines={2}
          style={{ color: colors.text, textAlign: 'center', lineHeight: 16 }}
        >
          {m.fullName}
        </Txt>
      </View>
      <View
        style={[
          styles.pedestalBlock,
          {
            height: pedestalHeight,
            backgroundColor: featured ? viridian : colors.card,
            borderColor: featured ? viridian : colors.border,
          },
        ]}
      >
        <Txt weight="800" size={featured ? 15 : 13} style={{ color: featured ? '#FFFFFF' : viridian, fontVariant: ['tabular-nums'] }}>
          {Math.round(m.reputationScore)} đ
        </Txt>
        <Txt size={10} weight="700" style={{ color: featured ? 'rgba(255,255,255,0.88)' : (isDark ? '#A1A1AA' : colors.textTertiary), marginTop: 1 }}>
          {`★ ${m.rating?.toFixed?.(1) ?? '5.0'}`}
        </Txt>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headerFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  industryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  podiumContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 0,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  podiumHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  podiumCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatarWrap: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2.5,
    position: 'relative',
    alignItems: 'center',
  },
  podiumRankPill: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  podiumNameWrap: {
    minHeight: 34,
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  pedestalBlock: {
    width: '100%',
    marginTop: 6,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 15,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardBottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  metricLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reputationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
})
