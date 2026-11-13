import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Award,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  FileText,
  GraduationCap,
  Handshake,
  IgMessenger,
  Landmark,
  LayoutGrid,
  ListChecks,
  RotateCcw,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  X,
} from '@/components/icons'
import { Empty, IconButton, Screen, SearchBar, Txt } from '@/components/ui'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { FilterButton, FilterSheet, countActive, type FilterField, type FilterValues } from '@/components/FilterSheet'
import { SheetModal } from '@/components/SheetModal'
import { MentorCardView } from '@/components/MentorCardView'
import { MentoringHeaderBrand, MentorStoryRing } from '@/components/MentoringBrand'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
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

/**
 * Cố vấn & Kết nối: Meetup x Instagram x Kakao 2026 Design
 * - Tone màu chủ đạo: Cam (#CE4A09 / #F27124) - Trắng (#FFFFFF) - Đen (#202329 / #101010)
 * - Instagram Story Spotlight Rail cho Top Mentors
 * - Kakao Quick Action Pills & Bento Utility Sheet với BrandIcon
 * - Meetup Mentor Directory Cards
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
  const keyword = useDebounced(kw, 400)

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

  // Query top spotlight mentors for Instagram-style story rail
  const spotlightQuery = useQuery({
    queryKey: ['mentoring-spotlight'],
    queryFn: () => mentoringApi.search({ sortBy: 'rating', sortDir: 'desc' }),
    staleTime: 5 * 60_000,
  })
  const spotlightMentors = spotlightQuery.data?.content ?? []

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const active = countActive(filters, ['sort'])

  const quickShortcuts: { key: string; label: string; brand: BrandIconName; href: string; primary?: boolean }[] =
    role === 'STUDENT'
      ? [
          { key: 'create', label: 'Tạo yêu cầu', brand: 'pencil', href: '/mentoring/create-request', primary: true },
          { key: 'my-req', label: 'Yêu cầu của tôi', brand: 'writing', href: '/mentoring/my-requests' },
          { key: 'tasks', label: 'Nhiệm vụ', brand: 'task', href: '/mentoring/tasks' },
          { key: 'deals', label: 'Thỏa thuận', brand: 'check', href: '/mentoring/deals' },
          { key: 'groups', label: 'Nhóm Cố vấn', brand: 'people2', href: '/mentoring/groups' },
          { key: 'rank', label: 'Xếp hạng', brand: 'star', href: '/mentoring/rankings' },
          { key: 'refunds', label: 'Hoàn tiền', brand: 'coin', href: '/mentoring/refunds' },
        ]
      : [
          { key: 'incoming', label: 'Yêu cầu đến', brand: 'writing', href: '/mentoring/incoming-requests', primary: true },
          { key: 'tasks', label: 'Nhiệm vụ', brand: 'task', href: '/mentoring/tasks' },
          { key: 'deals', label: 'Thỏa thuận', brand: 'check', href: '/mentoring/deals' },
          { key: 'earnings', label: 'Thu nhập', brand: 'coin', href: '/mentoring/earnings' },
          { key: 'groups', label: 'Nhóm Cố vấn', brand: 'people2', href: '/mentoring/groups' },
          { key: 'rank', label: 'Xếp hạng', brand: 'star', href: '/mentoring/rankings' },
          { key: 'status', label: 'Hồ sơ Mentor', brand: 'suitcase', href: '/mentoring/status' },
        ]

  return (
    <Screen bg={colors.bg}>
      {/* Top Bar with Brand + Utility & Messages Icon Actions */}
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <MentoringHeaderBrand />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconButton
            label="Quản lý & Tiện ích Cố vấn"
            icon={<LayoutGrid size={21} color={colors.text} />}
            onPress={() => setUtilitySheet(true)}
          />
          <IconButton
            label="Tin nhắn mentoring"
            icon={<IgMessenger size={21} color={colors.text} />}
            onPress={() => router.push('/mentoring/messages')}
          />
        </View>
      </View>

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
              {/* Kakao / Instagram Quick Flow Strip: 1-Tap Access to All Mentoring Flows */}
              <View style={[styles.quickFlowBar, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickFlowScroll}
                >
                  {quickShortcuts.map((s) => (
                    <Pressable
                      key={s.key}
                      onPress={() => router.push(s.href as never)}
                      style={({ pressed }) => [
                        styles.quickFlowPill,
                        s.primary
                          ? {
                              backgroundColor: viridian,
                              borderColor: viridian,
                            }
                          : {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
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
                        <BrandIcon name={s.brand} size={s.primary ? 16 : 19} />
                      </View>
                      <Txt
                        size={12}
                        weight={s.primary ? '700' : '600'}
                        style={{ color: s.primary ? '#FFFFFF' : colors.text }}
                      >
                        {s.label}
                      </Txt>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Instagram Story Spotlight Rail: Top Mentors */}
              {spotlightMentors.length > 0 && (
                <View style={[styles.spotlightSection, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
                  <View style={styles.spotlightTitleRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BrandIcon name="sparkle" size={18} />
                      <Txt size={12} weight="800" style={{ color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Mentor Tiêu Biểu
                      </Txt>
                    </View>
                    <Pressable
                      onPress={() => router.push('/mentoring/rankings')}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <BrandIcon name="star" size={15} />
                      <Txt size={12} weight="700" style={{ color: viridian }}>
                        Bảng xếp hạng
                      </Txt>
                      <ChevronRight size={13} color={viridian} weight="bold" />
                    </Pressable>
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

              {/* Combined Search & Quick Field Dropdown */}
              <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle, marginBottom: 10 }]}>
                <SearchBar
                  value={kw}
                  onChangeText={setKw}
                  placeholder="Tìm mentor theo tên, kỹ năng, công ty..."
                  style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}
                  right={<FilterButton count={active} onPress={() => setSheet(true)} />}
                />

                {/* Sub-row: 1-Tap Field Dropdown Pill & Experts Count */}
                <View style={styles.quickFieldRow}>
                  <Pressable
                    onPress={() => setFieldModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Chọn lĩnh vực"
                    style={({ pressed }) => [
                      styles.fieldDropdownBtn,
                      {
                        backgroundColor: selectedFieldId !== undefined ? viridianSoft : colors.surface,
                        borderColor: selectedFieldId !== undefined ? viridian : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Briefcase size={14} color={selectedFieldId !== undefined ? viridian : colors.textSecondary} />
                    <Txt
                      size={12}
                      weight={selectedFieldId !== undefined ? '700' : '600'}
                      style={{
                        color: selectedFieldId !== undefined ? viridian : colors.text,
                        marginLeft: 6,
                        marginRight: 4,
                        maxWidth: 200,
                      }}
                      numberOfLines={1}
                    >
                      {selectedIndustry ? selectedIndustry.name : 'Tất cả lĩnh vực'}
                    </Txt>
                    {selectedFieldId !== undefined ? (
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation()
                          setSelectedFieldId(undefined)
                        }}
                        style={{ padding: 2 }}
                      >
                        <X size={12} color={viridian} />
                      </Pressable>
                    ) : (
                      <ChevronDown size={13} color={colors.textSecondary} />
                    )}
                  </Pressable>

                  {items.length > 0 && (
                    <Txt size={12} weight="600" style={{ color: colors.textTertiary }}>
                      {items.length} chuyên gia
                    </Txt>
                  )}
                </View>
              </View>

              {q.isLoading ? <ListSkeleton variant="row" count={4} /> : null}
            </View>
          }
          ListEmptyComponent={
            q.isLoading ? null : (
              <Empty
                error={q.error}
                onRetry={() => { void q.refetch() }}
                icon={<GraduationCap size={34} color={viridian} />}
                title="Không tìm thấy mentor phù hợp"
                text="Thử thay đổi từ khóa tìm kiếm hoặc bấm nút 'Tất cả lĩnh vực'."
                action={active || selectedFieldId !== undefined ? 'Xoá tất cả bộ lọc' : undefined}
                onAction={() => {
                  setFilters(DEFAULTS)
                  setSelectedFieldId(undefined)
                }}
              />
            )
          }
          renderItem={({ item }) => <MentorCardView m={item} />}
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <Txt muted size={12} style={{ textAlign: 'center', padding: 16 }}>
                Đang tải thêm cố vấn...
              </Txt>
            ) : null
          }
        />
      </View>

      {/* Utility Bottom Sheet: Không gian quản lý & điều hành Cố vấn (Meetup x Kakao Bento) */}
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

          {role === 'STUDENT' ? (
            <>
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
            </>
          ) : (
            <>
              <UtilityRow
                brandIcon="writing"
                icon={<ClipboardList size={20} color="#FFFFFF" weight="bold" />}
                title="Yêu cầu đến"
                desc="Danh sách yêu cầu hướng dẫn mới từ sinh viên chờ duyệt"
                primary
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/incoming-requests')
                }}
              />
              <UtilityRow
                brandIcon="task"
                icon={<ListChecks size={20} color={viridian} />}
                title="Nhiệm vụ học viên"
                desc="Theo dõi tiến độ bài nộp và đánh giá chất lượng sinh viên"
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/tasks')
                }}
              />
              <UtilityRow
                brandIcon="check"
                icon={<Handshake size={20} color={viridian} weight="bold" />}
                title="Thỏa thuận hợp tác"
                desc="Hợp đồng mentoring và các cam kết đang hoạt động"
                onPress={() => {
                  setUtilitySheet(false)
                  router.push('/mentoring/deals')
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
          )}

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

      {/* Field Selection BottomSheet (1-Tap Fast Selection) */}
      <SheetModal visible={fieldModal} onClose={() => setFieldModal(false)} maxHeight={0.78}>
        <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
          <View style={{ flex: 1 }}>
            <Txt weight="800" size={17} style={{ color: colors.text }}>
              Lĩnh vực Cố vấn
            </Txt>
            <Txt size={11} weight="500" style={{ color: colors.textTertiary, marginTop: 2 }}>
              Chọn lĩnh vực chuyên môn bạn quan tâm
            </Txt>
          </View>
          <Pressable
            onPress={() => setFieldModal(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            style={[styles.sheetCloseBtn, { backgroundColor: colors.surface }]}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16), gap: 8 }}
        >
          {/* Option: Tất cả lĩnh vực */}
          <Pressable
            onPress={() => {
              setSelectedFieldId(undefined)
              setFieldModal(false)
            }}
            style={({ pressed }) => [
              styles.fieldOptionRow,
              {
                backgroundColor: selectedFieldId === undefined ? viridianSoft : colors.card,
                borderColor: selectedFieldId === undefined ? viridian : colors.borderSubtle,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Txt
                weight={selectedFieldId === undefined ? '700' : '600'}
                size={14}
                style={{ color: selectedFieldId === undefined ? viridian : colors.text }}
              >
                Tất cả lĩnh vực
              </Txt>
              <Txt size={11} weight="500" style={{ color: colors.textTertiary, marginTop: 2 }}>
                Hiển thị toàn bộ chuyên gia & mentor
              </Txt>
            </View>
            {selectedFieldId === undefined && <Check size={18} color={viridian} weight="bold" />}
          </Pressable>

          {/* List of industries */}
          {industries.map((ind) => {
            const isSelected = selectedFieldId === ind.id
            return (
              <Pressable
                key={ind.id}
                onPress={() => {
                  setSelectedFieldId(ind.id)
                  setFieldModal(false)
                }}
                style={({ pressed }) => [
                  styles.fieldOptionRow,
                  {
                    backgroundColor: isSelected ? viridianSoft : colors.card,
                    borderColor: isSelected ? viridian : colors.borderSubtle,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Txt
                    weight={isSelected ? '700' : '600'}
                    size={14}
                    style={{ color: isSelected ? viridian : colors.text }}
                  >
                    {ind.name}
                  </Txt>
                </View>
                {isSelected && <Check size={18} color={viridian} weight="bold" />}
              </Pressable>
            )
          })}
        </ScrollView>
      </SheetModal>

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
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.utilityRow,
        {
          backgroundColor: primary ? viridianSoft : colors.card,
          borderColor: primary ? viridian : colors.border,
          borderWidth: primary ? 1.5 : 1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.utilityIconWrap, { backgroundColor: primary ? '#FFFFFF' : viridianSoft, borderWidth: primary ? 1 : 0, borderColor: viridian }]}>
        {brandIcon ? <BrandIcon name={brandIcon} size={26} /> : icon}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt weight="800" size={14} style={{ color: colors.text }}>
            {title}
          </Txt>
          {primary && (
            <View style={{ backgroundColor: viridian, paddingHorizontal: 7, paddingVertical: 1.5, borderRadius: 6 }}>
              <Txt size={10} weight="700" style={{ color: '#FFFFFF' }}>
                Trọng tâm
              </Txt>
            </View>
          )}
        </View>
        <Txt size={12} weight="400" style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {desc}
        </Txt>
      </View>
      <ChevronRight size={16} color={primary ? viridian : colors.textTertiary} weight="bold" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: 6,
    paddingHorizontal: 13,
    height: 36,
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
  quickFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  fieldDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  fieldOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
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
