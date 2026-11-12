import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'

import { Avatar, Button, Empty, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { Enter, MotionPressable } from '@/components/Motion'
import { ScrollView } from '@/components/ScrollView'
import { BadgeCheck, ChevronRight, Clock, Search, Star, Users, XCircle } from '@/components/icons'
import { eventApi } from '@/api/events'
import type { Attendee } from '@/api/events'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const ROLE_LABEL: Record<string, string> = { ALUMNI: 'Cựu sinh viên', STUDENT: 'Sinh viên' }

type FilterTab = 'ALL' | 'ALUMNI' | 'STUDENT'

/** Ngày đăng ký dạng "16/10". */
function registeredLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Màn hình danh sách người tham gia sự kiện.
 * Kết hợp phong cách Meetup (Event Bento Card + RSVP Progress + Brand Icon)
 * x Instagram (Story Avatar Ring cho Organizer + Search Bar tối giản + Hộp thông tin gọn gàng)
 * x Kakao (Thanh lọc danh mục theo pill tabs + Thẻ danh sách mềm mại + Hiệu ứng chạm mượt mà).
 */
export default function AttendeesScreen() {
  const t = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [kw, setKw] = useState('')
  const [tab, setTab] = useState<FilterTab>('ALL')
  const search = useDebounced(kw, 350)

  // Chi tiết sự kiện (để lấy tên sự kiện, người tổ chức và sức chứa)
  const detail = useQuery({ queryKey: ['event-detail', id], queryFn: () => eventApi.detail(id!) })
  const q = useQuery({ queryKey: ['attendees', id, search], queryFn: () => eventApi.attendees(id!, { search: search || undefined }) })

  const event = detail.data?.data
  const items = q.data?.data ?? []

  // Đếm theo từng phân loại
  const alumniCount = useMemo(() => items.filter((a) => a.role?.toUpperCase() === 'ALUMNI').length, [items])
  const studentCount = useMemo(() => items.filter((a) => a.role?.toUpperCase() === 'STUDENT').length, [items])

  // Lọc theo tab danh mục đã chọn
  const filteredItems = useMemo(() => {
    switch (tab) {
      case 'ALUMNI':
        return items.filter((a) => a.role?.toUpperCase() === 'ALUMNI')
      case 'STUDENT':
        return items.filter((a) => a.role?.toUpperCase() === 'STUDENT')
      default:
        return items
    }
  }, [items, tab])

  const totalAttendees = event?.attendeeCount ?? items.length
  const capacity = event?.capacity
  const percentFilled = capacity && capacity > 0 ? Math.min(100, Math.round((totalAttendees / capacity) * 100)) : null

  const handleTabChange = (nextTab: FilterTab) => {
    Haptics.selectionAsync()
    setTab(nextTab)
  }

  return (
    <Screen bg={t.card}>
      {/* Header bar */}
      <Header
        title="Người tham gia"
        subtitle={event?.title}
        right={
          items.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: t.isDark ? '#2E1C10' : '#FFF3EB',
                borderWidth: 1,
                borderColor: t.isDark ? '#4A2C16' : '#FFDFCC',
              }}
            >
              <Users size={14} color={t.primary} weight="bold" />
              <Txt size={12} weight="800" style={{ color: t.primary }}>
                {items.length}
              </Txt>
            </View>
          ) : null
        }
      />

      {q.isLoading ? (
        <View style={{ paddingTop: 16 }}>
          <ListSkeleton variant="row" />
        </View>
      ) : (
        <FlashList
          data={filteredItems}
          keyExtractor={(a) => String(a.userId)}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            <View>
              {/* 1. Meetup x Kakao Bento Hero Card */}
              <Enter duration={320}>
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 14,
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 20,
                    backgroundColor: t.isDark ? t.surface : '#FFFBF8',
                    borderWidth: 1,
                    borderColor: t.isDark ? t.border : '#FAD9C2',
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BrandIcon name="calendar" size={44} />
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <Txt weight="800" size={15.5} numberOfLines={2} style={{ color: t.text, letterSpacing: -0.2 }}>
                        {event?.title || 'Sự kiện FPT University'}
                      </Txt>
                      {event?.organizerName ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Txt muted size={12} numberOfLines={1}>
                            Tổ chức bởi <Txt weight="700" size={12} style={{ color: t.text }}>{event.organizerName}</Txt>
                          </Txt>
                          <BadgeCheck size={14} color={t.primary} weight="fill" />
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Attendance Stats & RSVP Progress Bar */}
                  <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: t.isDark ? t.border : '#FCE9DC' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={15} color={t.primary} weight="bold" />
                        <Txt weight="700" size={13} style={{ color: t.text }}>
                          {totalAttendees} người đã đăng ký
                        </Txt>
                      </View>
                      {capacity ? (
                        <Txt size={12} weight="600" style={{ color: t.textMuted }}>
                          {`${totalAttendees}/${capacity} chỗ (${percentFilled}%)`}
                        </Txt>
                      ) : null}
                    </View>

                    {capacity && percentFilled != null ? (
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: t.isDark ? '#333' : '#F0E6DF', overflow: 'hidden' }}>
                        <View
                          style={{
                            height: '100%',
                            width: `${percentFilled}%`,
                            backgroundColor: t.primary,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              </Enter>

              {/* 2. Instagram-Style Search Bar */}
              <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: t.isDark ? t.surface : t.inputBg,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: 1,
                    borderColor: t.border,
                    gap: 8,
                  }}
                >
                  <Search size={18} color={t.textMuted} />
                  <TextInput
                    value={kw}
                    onChangeText={setKw}
                    placeholder="Tìm theo tên, chức danh, kỹ năng..."
                    placeholderTextColor={t.textSubtle}
                    style={{ flex: 1, fontSize: 14, color: t.text, paddingVertical: 0 }}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  {kw.length > 0 ? (
                    <Pressable onPress={() => setKw('')} hitSlop={8} style={{ padding: 4 }}>
                      <XCircle size={18} color={t.textMuted} weight="fill" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* 3. Meetup / Kakao Horizontal Pill Category Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
              >
                {([
                  ['ALL', `Tất cả (${items.length})`],
                  ['ALUMNI', `Cựu sinh viên (${alumniCount})`],
                  ['STUDENT', `Sinh viên (${studentCount})`],
                ] as const).map(([k, label]) => {
                  const active = tab === k
                  return (
                    <MotionPressable
                      key={k}
                      onPress={() => handleTabChange(k)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: active ? t.primary : t.surface,
                        borderWidth: 1,
                        borderColor: active ? t.primary : t.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Txt
                        size={12.5}
                        weight={active ? '700' : '500'}
                        style={{ color: active ? '#fff' : t.text }}
                      >
                        {label}
                      </Txt>
                    </MotionPressable>
                  )
                })}
              </ScrollView>

              {/* Divider between filters and list */}
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginBottom: 4 }} />
            </View>
          }
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.divider, marginLeft: 74, marginRight: 16 }} />
          )}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              icon={<BrandIcon name="people" size={56} />}
              title={search ? 'Không tìm thấy kết quả' : tab !== 'ALL' ? 'Chưa có thành viên nhóm này' : 'Chưa có người tham gia'}
              text={
                search
                  ? `Không tìm thấy ai khớp với từ khóa "${search}".`
                  : tab !== 'ALL'
                    ? 'Chưa có người tham gia nào thuộc danh mục này đăng ký.'
                    : 'Những người đăng ký sự kiện sẽ hiển thị ở đây.'
              }
              action={search ? 'Xóa tìm kiếm' : tab !== 'ALL' ? 'Xem tất cả' : undefined}
              onAction={() => {
                if (search) setKw('')
                else setTab('ALL')
              }}
            />
          }
          renderItem={({ item }) => (
            <AttendeeRow
              item={item}
              isOrganizer={event?.organizerId === item.userId}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(item.userId) } })}
            />
          )}
        />
      )}
    </Screen>
  )
}

/**
 * Một hàng người tham gia (Instagram Profile x Kakao Action Card):
 * - Avatar: có Story-style Ring màu cam nhận diện cho Người tổ chức.
 * - Info: Họ tên, Huy hiệu vai trò, Giới thiệu chuyên môn.
 * - Metadata: Ngày đăng ký kèm icon đồng hồ.
 * - Action: Nút "Hồ sơ >" tinh tế với hiệu ứng MotionPressable.
 */
function AttendeeRow({
  item,
  isOrganizer,
  onPress,
}: {
  item: Attendee
  isOrganizer: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const role = item.role ? ROLE_LABEL[item.role.toUpperCase()] : undefined
  const registered = registeredLabel(item.registeredAt)

  return (
    <MotionPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={[item.fullName, isOrganizer ? 'người tổ chức' : role].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: pressed ? (t.isDark ? '#222' : '#F9F9FB') : t.card,
      })}
    >
      {/* Avatar (Instagram Story Ring cho Organizer) */}
      <View style={{ position: 'relative' }}>
        {isOrganizer ? (
          <View
            style={{
              padding: 2.5,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: t.primary,
              backgroundColor: t.card,
            }}
          >
            <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
          </View>
        ) : (
          <Avatar uri={item.avatarUrl} name={item.fullName} size={46} />
        )}

        {/* Small Host badge overlay trên Avatar */}
        {isOrganizer ? (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: t.primary,
              borderWidth: 1.5,
              borderColor: t.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={10} color="#FFFFFF" weight="fill" />
          </View>
        ) : null}
      </View>

      {/* Thông tin chính (Kakao Card Hierarchy) */}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {/* Hàng Họ tên + Tag vai trò */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
          <Txt weight="700" size={15} numberOfLines={1} style={{ color: t.text, flexShrink: 1 }}>
            {item.fullName}
          </Txt>

          {isOrganizer ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: t.isDark ? '#3A2414' : '#FFF3EB',
                paddingHorizontal: 6.5,
                paddingVertical: 1.5,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: t.isDark ? '#4A2C16' : '#FFDFCC',
              }}
            >
              <Star size={9.5} color={t.primary} weight="fill" />
              <Txt size={10.5} weight="700" style={{ color: t.primary }}>
                Tổ chức
              </Txt>
            </View>
          ) : role ? (
            <View
              style={{
                backgroundColor: t.isDark ? '#262626' : item.role?.toUpperCase() === 'ALUMNI' ? '#EEF4FF' : '#F0FDF4',
                paddingHorizontal: 6,
                paddingVertical: 1.5,
                borderRadius: 5,
              }}
            >
              <Txt
                size={10.5}
                weight="700"
                style={{
                  color: item.role?.toUpperCase() === 'ALUMNI' ? (t.isDark ? '#93C5FD' : '#1D4ED8') : (t.isDark ? '#86EFAC' : '#15803D'),
                }}
              >
                {role}
              </Txt>
            </View>
          ) : null}
        </View>

        {/* Chuyên ngành / Vị trí / Giới thiệu */}
        <Txt muted size={12.5} numberOfLines={1}>
          {item.headline || 'Thành viên AlumNect'}
        </Txt>

        {/* Ngày đăng ký kèm icon đồng hồ */}
        {registered ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Clock size={11} color={t.textMuted} />
            <Txt size={11.5} muted>
              {`Đăng ký ${registered}`}
            </Txt>
          </View>
        ) : null}
      </View>

      {/* Nút hành động "Hồ sơ >" (Instagram / Kakao Action Button) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: t.isDark ? t.surface : '#FFF3EB',
          borderWidth: 1,
          borderColor: t.isDark ? t.border : '#FFDFCC',
        }}
      >
        <Txt size={12} weight="700" style={{ color: t.primary }}>
          Hồ sơ
        </Txt>
        <ChevronRight size={12} color={t.primary} />
      </View>
    </MotionPressable>
  )
}
