import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import {
  Award,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Handshake,
  IgMessenger,
  Landmark,
  LayoutGrid,
  ListChecks,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from '@/components/icons'
import { Button, Empty, Screen, Txt } from '@/components/ui'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { SheetModal } from '@/components/SheetModal'
import { MentorCardView } from '@/components/MentorCardView'
import { MentoringHeaderBrand, MentorStoryRing } from '@/components/MentoringBrand'
import { Enter, MotionPressable } from '@/components/Motion'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
import { MentoringTermsGate } from '@/components/MentoringTermsGate'
import { MentoringSwitch, SwitchPane, type MentoringView } from '@/components/MentoringSwitch'
import { MentoringHub } from '@/components/MentoringHub'
import { useMentoringHub } from '@/lib/useMentoringHub'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { ListSkeleton } from '@/components/Skeleton'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const SORTS: [string, string][] = [
  ['reputationScore_desc', 'Uy tín cao nhất'],
  ['rating_desc', 'Đánh giá cao nhất'],
  ['completedMissions_desc', 'Nhiều nhiệm vụ nhất'],
  ['fullName_asc', 'Tên A-Z'],
]
const DEFAULTS: FilterValues = { sort: 'reputationScore_desc' }

/** Ánh xạ tên lĩnh vực sang biểu tượng Meetup 3D BrandIcon */
function getIndustryBrandIcon(name: string): BrandIconName {
  const lower = name.toLowerCase()
  if (lower.includes('công nghệ') || lower.includes('cntt') || lower.includes('tin học') || lower.includes('phần mềm') || lower.includes('it')) {
    return 'computer'
  }
  if (lower.includes('kinh doanh') || lower.includes('quản trị') || lower.includes('thương mại')) {
    return 'suitcase'
  }
  if (lower.includes('thiết kế') || lower.includes('đồ họa') || lower.includes('mỹ thuật') || lower.includes('ui/ux') || lower.includes('art')) {
    return 'painting'
  }
  if (lower.includes('marketing') || lower.includes('truyền thông') || lower.includes('quảng cáo') || lower.includes('pr')) {
    return 'megaphone'
  }
  if (lower.includes('ngôn ngữ') || lower.includes('ngoại ngữ') || lower.includes('dịch thuật') || lower.includes('tiếng')) {
    return 'world'
  }
  if (lower.includes('tài chính') || lower.includes('kế toán') || lower.includes('ngân hàng') || lower.includes('đầu tư')) {
    return 'coin'
  }
  if (lower.includes('luật') || lower.includes('pháp lý')) {
    return 'lock'
  }
  return 'sparkle'
}

/**
 * Cố vấn & Kết nối: Meetup x Instagram x Kakao 2026 Design
 * - Tone màu chủ đạo: Cam thương hiệu (#CE4A09 / #FB8A3C) - Trắng (#FFFFFF) - Đen (#202329 / #101010)
 * - Instagram Story Spotlight Rail cho Top Mentors với vòng Story Ring sống động
 * - Kakao Bento Quick Flow Pills với BrandIcon 3D Meetup đồng bộ
 * - Thanh tìm kiếm Instagram x Thanh lọc ngành nghề 1-chạm (Category Rail)
 * - Meetup Mentor Directory Cards với bố cục bento tối ưu và phản hồi xúc giác mượt mà
 */
export default function MentoringTab() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const role = useAuthStore((s) => s.user?.role)
  const [kw, setKw] = useState('')
  const [filters, setFilters] = useState<FilterValues>(DEFAULTS)
  const [sheet, setSheet] = useState(false)
  const [utilitySheet, setUtilitySheet] = useState(false)
  const [fieldModal, setFieldModal] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<number | undefined>(undefined)
  const keyword = useDebounced(kw, 350)
  // Tách 2 phần: "Của tôi" (việc cần xử lý, task đang đồng hành) và "Tìm mentor".
  // Mặc định theo ngữ cảnh: có hoạt động mentoring → "Của tôi", chưa có gì → "Tìm mentor". Người dùng chọn tay thì giữ nguyên.
  const hub = useMentoringHub()
  const [userView, setUserView] = useState<MentoringView | null>(null)
  const view: MentoringView = userView ?? (hub.ready ? (hub.hasActivity || hub.mentorStats ? 'mine' : 'discover') : 'mine')

  const options = useQuery({ queryKey: ['mentor-filter-options'], queryFn: mentoringApi.filterOptions, staleTime: 10 * 60_000 })
  const industries = options.data?.industries ?? []
  const specializations = options.data?.specializations ?? []
  const modeOptions = options.data?.workingModes?.length
    ? options.data.workingModes
    : (Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((v) => ({ value: v, label: WORKING_MODE_LABEL[v] }))
  const typeOptions = options.data?.mentoringTypes?.length
    ? options.data.mentoringTypes
    : (Object.keys(MENTORING_TYPE_LABEL) as MentoringType[]).map((v) => ({ value: v, label: MENTORING_TYPE_LABEL[v] }))
  const skills = options.data?.popularSkills ?? []

  const fields: FilterField[] = [
    { key: 'sort', title: 'Sắp xếp', type: 'single', options: SORTS.map(([v, l]) => ({ value: v, label: l })) },
    { key: 'fieldId', title: 'Lĩnh vực', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...industries.map((i) => ({ value: String(i.id), label: i.name }))] },
    { key: 'majorId', title: 'Chuyên ngành', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...specializations.map((m) => ({ value: String(m.id), label: m.name }))] },
    { key: 'mode', title: 'Hình thức làm việc', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...modeOptions.map((o) => ({ value: o.value, label: o.label }))] },
    { key: 'type', title: 'Loại hình hỗ trợ', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...typeOptions.map((o) => ({ value: o.value, label: o.label }))] },
    { key: 'skill', title: 'Kỹ năng phổ biến', type: 'single', options: [{ value: '', label: 'Tất cả' }, ...skills.map((s) => ({ value: s, label: s }))] },
  ]

  const effectiveFieldId = selectedFieldId ?? (filters.fieldId ? Number(filters.fieldId) : undefined)
  const selectedIndustry = industries.find((i) => i.id === effectiveFieldId)
  const [sortBy, sortDir] = ((filters.sort as string) ?? 'reputationScore_desc').split('_')
  const params = {
    keyword,
    fieldId: effectiveFieldId,
    majorId: filters.majorId ? Number(filters.majorId) : undefined,
    skill: (filters.skill as string) || undefined,
    workingMode: (filters.mode as WorkingMode) || undefined,
    mentoringType: (filters.type as MentoringType) || undefined,
    sortBy,
    sortDir,
  }

  const q = useInfiniteQuery({
    queryKey: ['mentoring-search', params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => mentoringApi.search({ ...params, page: pageParam }),
    getNextPageParam: (l) => (l.last ? undefined : l.pageNumber + 1),
  })

  // Spotlight mentors for Instagram Story Rail
  const spotlightQuery = useQuery({
    queryKey: ['mentoring-spotlight'],
    queryFn: () => mentoringApi.search({ sortBy: 'rating', sortDir: 'desc' }),
    staleTime: 5 * 60_000,
  })
  const spotlightMentors = spotlightQuery.data?.content ?? []

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const active = countActive(filters, ['sort'])

  // Danh mục phím tắt luồng Mentoring (Kakao Bento Action Strip)
  // Danh mục phím tắt luồng Mentoring — đồng bộ MENTORSHIP_NAVIGATION của Web:
  // nhóm "Mentoring của tôi" dùng chung (Cựu sinh viên cũng có thể gửi yêu cầu), nhóm "Dành cho Mentor" chỉ cho ALUMNI.
  const isAlumni = role === 'ALUMNI'
  // Phần "Tìm mentor" chỉ giữ lối tắt liên quan việc tìm kiếm; các mục quản lý đã chuyển sang "Của tôi".
  const quickShortcuts: { key: string; label: string; brand: BrandIconName; href: string; primary?: boolean }[] = [
    { key: 'create', label: 'Đăng bài toán tìm mentor', brand: 'pencil', href: '/mentoring/create-request', primary: true },
    { key: 'rank', label: 'Bảng xếp hạng', brand: 'star', href: '/mentoring/rankings' },
    { key: 'groups', label: 'Nhóm Cố vấn', brand: 'people2', href: '/mentoring/groups' },
  ]

  const handleSelectField = (fieldId: number | undefined) => {
    Haptics.selectionAsync()
    setSelectedFieldId(fieldId)
  }

  return (
    <MentoringTermsGate header={false}>
    <Screen bg={colors.bg}>
      {/* 1. Header Bar: Brand Logo + Tiện ích & Tin nhắn */}
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <MentoringHeaderBrand />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setUtilitySheet(true)
            }}
            accessibilityRole="button"
            accessibilityLabel="Quản lý & Tiện ích Cố vấn"
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isDark ? '#262626' : '#F4F5F7',
                borderColor: isDark ? '#383838' : '#E8EAED',
              },
            ]}
          >
            <LayoutGrid size={20} color={colors.text} />
          </MotionPressable>

          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/mentoring/messages')
            }}
            accessibilityRole="button"
            accessibilityLabel="Tin nhắn mentoring"
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isDark ? '#262626' : '#F4F5F7',
                borderColor: isDark ? '#383838' : '#E8EAED',
              },
            ]}
          >
            <IgMessenger size={20} color={colors.text} />
            {hub.unread ? (
              <View style={[styles.headerBadge, { backgroundColor: viridian, borderColor: colors.card }]}>
                <Txt size={10} weight="800" style={{ color: '#FFFFFF' }}>{hub.unread > 99 ? '99+' : hub.unread}</Txt>
              </View>
            ) : null}
          </MotionPressable>
        </View>
      </View>
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }}>
        <MentoringSwitch value={view} onChange={setUserView} badge={hub.actionItems.length} />
      </View>

      <SwitchPane visible={view === 'mine'} direction={-1}>
        <MentoringHub hub={hub} onDiscover={() => setUserView('discover')} />
      </SwitchPane>

      <SwitchPane visible={view === 'discover'} direction={1}>

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <FlashList
          data={q.isLoading ? [] : items}
          keyExtractor={(m) => String(m.mentorId)}
          contentContainerStyle={{ paddingBottom: 32 }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={() => {
            void q.refetch()
            void spotlightQuery.refetch()
          }}
          ListHeaderComponent={
            <View>
              {/* 2. Kakao Quick Flow Strip: Phím tắt thao tác nhanh với BrandIcon Meetup */}
              <View style={[styles.quickFlowBar, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickFlowScroll}
                >
                  {quickShortcuts.map((s) => (
                    <MotionPressable
                      key={s.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push(s.href as never)
                      }}
                      style={[
                        styles.quickFlowPill,
                        s.primary
                          ? {
                              backgroundColor: viridian,
                              borderColor: viridian,
                              shadowColor: viridian,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 4,
                              elevation: 2,
                            }
                          : {
                              backgroundColor: isDark ? colors.surface : '#F7F8FA',
                              borderColor: isDark ? colors.border : '#E6E8EB',
                            },
                      ]}
                    >
                      <View
                        style={
                          s.primary
                            ? {
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: '#FFFFFF',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }
                            : undefined
                        }
                      >
                        <BrandIcon name={s.brand} size={s.primary ? 15 : 18} />
                      </View>
                      <Txt
                        size={12.5}
                        weight={s.primary ? '800' : '700'}
                        style={{ color: s.primary ? '#FFFFFF' : colors.text }}
                      >
                        {s.label}
                      </Txt>
                    </MotionPressable>
                  ))}
                </ScrollView>
              </View>

              {/* 3. Instagram Story Spotlight Rail: Top Mentors Tiêu Biểu */}
              {spotlightMentors.length > 0 && (
                <View style={[styles.spotlightSection, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
                  <View style={styles.spotlightTitleRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BrandIcon name="sparkle" size={20} />
                      <Txt size={12.5} weight="800" style={{ color: colors.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        Mentor Tiêu Biểu
                      </Txt>
                    </View>
                    <MotionPressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push('/mentoring/rankings')
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <BrandIcon name="star" size={15} />
                      <Txt size={12} weight="800" style={{ color: viridian }}>
                        Bảng xếp hạng
                      </Txt>
                      <ChevronRight size={13} color={viridian} weight="bold" />
                    </MotionPressable>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.spotlightScroll}
                  >
                    {spotlightMentors.map((sm) => (
                      <MentorStoryRing
                        key={sm.mentorId}
                        uri={sm.avatarUrl}
                        name={sm.fullName}
                        isLive={sm.active !== false}
                        rating={sm.rating}
                        onPress={() =>
                          router.push({
                            pathname: '/mentoring/mentor/[id]',
                            params: { id: String(sm.mentorId) },
                          })
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 4. Instagram Explore Search Bar + 1-Tap Category Filter Rail */}
              <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle, marginBottom: 12 }]}>
                {/* Search Bar */}
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? colors.surface : '#F4F5F7',
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      height: 44,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 8,
                    }}
                  >
                    <Search size={18} color={colors.textSecondary} />
                    <TextInput
                      value={kw}
                      onChangeText={setKw}
                      placeholder="Tìm mentor theo tên, kỹ năng, công ty..."
                      placeholderTextColor={colors.textTertiary}
                      style={{ flex: 1, fontSize: 13.5, color: colors.text, paddingVertical: 0 }}
                      returnKeyType="search"
                      autoCorrect={false}
                    />
                    {kw.length > 0 ? (
                      <Pressable onPress={() => setKw('')} hitSlop={8} style={{ padding: 4 }}>
                        <XCircle size={18} color={colors.textSecondary} weight="fill" />
                      </Pressable>
                    ) : null}
                  </View>

                  <FilterButton count={active} onPress={() => setSheet(true)} />
                </View>

                {/* 1-Tap Horizontal Category Pills with Meetup 3D BrandIcons */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {/* Option: Tất cả */}
                  <MotionPressable
                    onPress={() => handleSelectField(undefined)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: selectedFieldId === undefined }}
                    style={[
                      styles.categoryPill,
                      selectedFieldId === undefined
                        ? {
                            backgroundColor: viridian,
                            borderColor: viridian,
                            shadowColor: viridian,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3,
                            elevation: 2,
                          }
                        : {
                            backgroundColor: isDark ? colors.surface : '#F7F8FA',
                            borderColor: isDark ? colors.border : '#E6E8EB',
                          },
                    ]}
                  >
                    <BrandIcon name="sparkle" size={16} />
                    <Txt
                      size={12.5}
                      weight={selectedFieldId === undefined ? '800' : '600'}
                      style={{ color: selectedFieldId === undefined ? '#FFFFFF' : colors.text }}
                    >
                      {`Tất cả (${items.length})`}
                    </Txt>
                  </MotionPressable>

                  {/* List of dynamic industries */}
                  {industries.map((ind) => {
                    const isSelected = selectedFieldId === ind.id
                    const iconName = getIndustryBrandIcon(ind.name)
                    return (
                      <MotionPressable
                        key={ind.id}
                        onPress={() => handleSelectField(ind.id)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.categoryPill,
                          isSelected
                            ? {
                                backgroundColor: viridian,
                                borderColor: viridian,
                                shadowColor: viridian,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3,
                                elevation: 2,
                              }
                            : {
                                backgroundColor: isDark ? colors.surface : '#F7F8FA',
                                borderColor: isDark ? colors.border : '#E6E8EB',
                              },
                        ]}
                      >
                        <BrandIcon name={iconName} size={16} />
                        <Txt
                          size={12.5}
                          weight={isSelected ? '800' : '600'}
                          style={{ color: isSelected ? '#FFFFFF' : colors.text }}
                        >
                          {ind.name}
                        </Txt>
                      </MotionPressable>
                    )
                  })}
                </ScrollView>
              </View>

              {q.isLoading ? <ListSkeleton variant="row" count={4} /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<BrandIcon name="binoculars" size={54} />}
                title="Không tìm thấy mentor phù hợp"
                text="Thử đổi từ khóa tìm kiếm hoặc chọn danh mục lĩnh vực khác."
                action={active || selectedFieldId !== undefined ? 'Xoá tất cả bộ lọc' : undefined}
                onAction={() => {
                  setFilters(DEFAULTS)
                  setSelectedFieldId(undefined)
                }}
              />
            )
          }
          renderItem={({ item }) => (
            <Enter duration={280}>
              <MentorCardView m={item} />
            </Enter>
          )}
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <Txt muted size={12} style={{ textAlign: 'center', padding: 16 }}>
                Đang tải thêm cố vấn...
              </Txt>
            ) : null
          }
        />
      </View>

      </SwitchPane>

      {/* 5. Utility Bottom Sheet: Không gian quản lý & điều hành Cố vấn (Kakao Bento Sheet) */}
      <SheetModal visible={utilitySheet} onClose={() => setUtilitySheet(false)} maxHeight={0.86}>
        <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
          <View style={{ flex: 1 }}>
            <Txt weight="800" size={18} style={{ color: colors.text }}>
              Trung tâm Cố vấn & Kết nối
            </Txt>
            <Txt size={12} weight="500" style={{ color: colors.textTertiary, marginTop: 2 }}>
              Quản lý toàn bộ yêu cầu, nhiệm vụ, thỏa thuận & cộng đồng
            </Txt>
          </View>
          <Pressable
            onPress={() => setUtilitySheet(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            style={[styles.sheetCloseBtn, { backgroundColor: colors.surface }]}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16), gap: 10 }}
        >
          {/* Section: Tác vụ trọng tâm */}
          <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2, marginBottom: 2 }}>
            Luồng Cố vấn chính
          </Txt>

          <UtilityRow
            brandIcon="pencil"
            icon={<FileText size={20} color="#FFFFFF" weight="bold" />}
            title="Tạo yêu cầu mới"
            desc="Đăng bài toán cần mentor hỗ trợ định hướng & giải đáp"
            primary
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/create-request')
            }}
          />
          <UtilityRow
            brandIcon="writing"
            icon={<ClipboardList size={20} color={viridian} />}
            title="Yêu cầu của tôi"
            desc="Theo dõi trạng thái các yêu cầu cố vấn bạn đã tạo"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/my-requests')
            }}
          />
          <UtilityRow
            brandIcon="task"
            icon={<ListChecks size={20} color={viridian} />}
            title="Nhiệm vụ của tôi"
            desc="Tiến độ bài tập và nhiệm vụ đang đồng hành cùng mentor"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/tasks')
            }}
          />
          <UtilityRow
            brandIcon="check"
            icon={<Handshake size={20} color={viridian} weight="bold" />}
            title="Thỏa thuận hợp tác"
            desc="Hợp đồng và điều khoản hướng dẫn đã xác lập"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/deals')
            }}
          />

          {isAlumni ? (
            <>
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 2 }}>
                Dành cho Mentor
              </Txt>
              <UtilityRow
                brandIcon="writing"
                icon={<ClipboardList size={20} color="#FFFFFF" weight="bold" />}
                title="Yêu cầu đến"
                desc="Yêu cầu hướng dẫn mới gửi đến bạn đang chờ phản hồi"
                primary
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/incoming-requests')
                }}
              />
              <UtilityRow
                brandIcon="coin"
                icon={<Landmark size={20} color={viridian} />}
                title="Thu nhập Cố vấn"
                desc="Thống kê thù lao hướng dẫn, số dư ví và chi trả tự động"
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/earnings')
                }}
              />
              <UtilityRow
                brandIcon="suitcase"
                icon={<UserCheck size={20} color={viridian} />}
                title="Hồ sơ & Trạng thái Mentor"
                desc="Cập nhật chuyên môn, gói đăng ký và trạng thái nhận học viên"
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/status')
                }}
              />
            </>
          ) : null}

          {/* Section: Cộng đồng & Mở rộng */}
          <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 2 }}>
            Cộng đồng, Xếp hạng & Bảo vệ
          </Txt>

          <UtilityRow
            brandIcon="people2"
            icon={<Users size={20} color={viridian} />}
            title="Nhóm Cố vấn"
            desc="Nhóm học viên cùng nhận cố vấn và thảo luận chuyên môn"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/groups')
            }}
          />

          <UtilityRow
            brandIcon="star"
            icon={<Award size={20} color={viridian} weight="fill" />}
            title="Bảng xếp hạng Mentor"
            desc="Vinh danh Top cựu sinh viên tiêu biểu và uy tín nhất"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/rankings')
            }}
          />

          <UtilityRow
            brandIcon="coin"
            icon={<RotateCcw size={20} color={viridian} />}
            title="Hoàn tiền & Tranh chấp"
            desc="Khai báo tài khoản nhận hoàn tiền & tra cứu lịch sử giải ngân"
            onPress={() => {
              setUtilitySheet(false)
              router.push('/mentoring/refunds')
            }}
          />
        </ScrollView>
      </SheetModal>

      {/* 6. FilterSheet nâng cao */}
      <FilterSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Lọc mentor nâng cao"
        fields={fields}
        values={filters}
        defaults={DEFAULTS}
        onApply={(f) => {
          setFilters(f)
          if (f.fieldId) setSelectedFieldId(Number(f.fieldId))
        }}
      />
    </Screen>
    </MentoringTermsGate>
  )
}

function UtilityRow({
  icon,
  brandIcon,
  title,
  desc,
  primary,
  onPress,
}: {
  icon: React.ReactNode
  brandIcon?: BrandIconName
  title: string
  desc: string
  primary?: boolean
  onPress: () => void
}) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  return (
    <MotionPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={[
        styles.utilityRow,
        {
          backgroundColor: primary ? (isDark ? '#2E1C10' : viridianSoft) : colors.card,
          borderColor: primary ? viridian : colors.border,
          borderWidth: primary ? 1.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.utilityIconWrap,
          {
            backgroundColor: primary ? '#FFFFFF' : (isDark ? '#262626' : viridianSoft),
            borderWidth: primary ? 1 : 0,
            borderColor: viridian,
          },
        ]}
      >
        {brandIcon ? <BrandIcon name={brandIcon} size={26} /> : icon}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt weight="800" size={14.5} style={{ color: colors.text }}>
            {title}
          </Txt>
          {primary && (
            <View style={{ backgroundColor: viridian, paddingHorizontal: 7, paddingVertical: 1.5, borderRadius: 6 }}>
              <Txt size={10} weight="800" style={{ color: '#FFFFFF' }}>
                MỚI
              </Txt>
            </View>
          )}
        </View>
        <Txt size={12} weight="500" style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {desc}
        </Txt>
      </View>
      <ChevronRight size={16} color={primary ? viridian : colors.textTertiary} weight="bold" />
    </MotionPressable>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFlowBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  quickFlowScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  quickFlowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.5,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
  },
  spotlightSection: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spotlightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  spotlightScroll: {
    paddingHorizontal: 16,
  },
  searchSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 16,
  },
  utilityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
