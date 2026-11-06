import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

import { Avatar, Empty, Screen, SearchBar, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { eventApi } from '@/api/events'
import type { Attendee } from '@/api/events'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

const ROLE_LABEL: Record<string, string> = { ALUMNI: 'Cựu sinh viên', STUDENT: 'Sinh viên' }

/** Ngày đăng ký dạng "Đăng ký 05/11". */
function registeredLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `Đăng ký ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** UC29: danh sách người tham gia sự kiện, có tìm kiếm, vai trò và nhãn người tổ chức. */
export default function AttendeesScreen() {
  const t = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [kw, setKw] = useState('')
  const search = useDebounced(kw, 400)
  // Dùng lại chi tiết sự kiện đã tải ở màn trước để lấy tên sự kiện và người tổ chức.
  const detail = useQuery({ queryKey: ['event-detail', id], queryFn: () => eventApi.detail(id!) })
  const q = useQuery({ queryKey: ['attendees', id, search], queryFn: () => eventApi.attendees(id!, { search: search || undefined }) })
  const event = detail.data?.data
  const items = q.data?.data ?? []

  return (
    <Screen bg={t.card}>
      <Header title="Người tham gia" subtitle={event?.title} />
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm theo tên..." />
      </View>
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={items}
          keyExtractor={(a) => String(a.userId)}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListHeaderComponent={
            items.length > 0 ? (
              <Txt muted size={13} weight="600" style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
                {search ? `${items.length} kết quả` : `${event?.attendeeCount ?? items.length} người đã đăng ký${event?.capacity ? ` · tối đa ${event.capacity}` : ''}`}
              </Txt>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.divider, marginLeft: 72 }} />}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              icon={<BrandIcon name="people" size={56} />}
              title={search ? 'Không tìm thấy' : 'Chưa có người tham gia'}
              text={search ? 'Không có người tham gia nào khớp với tên này.' : 'Những người đăng ký sự kiện sẽ hiển thị ở đây.'}
            />
          }
          renderItem={({ item }) => <AttendeeRow item={item} isOrganizer={event?.organizerId === item.userId} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(item.userId) } })} />}
        />
      )}
    </Screen>
  )
}

/** Một người tham gia: avatar, tên, vai trò, giới thiệu ngắn và ngày đăng ký. */
function AttendeeRow({ item, isOrganizer, onPress }: { item: Attendee; isOrganizer: boolean; onPress: () => void }) {
  const t = useTheme()
  const role = item.role ? ROLE_LABEL[item.role.toUpperCase()] : undefined
  const registered = registeredLabel(item.registeredAt)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[item.fullName, isOrganizer ? 'người tổ chức' : role].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? t.inputBg : 'transparent' })}
    >
      <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{item.fullName}</Txt>
          {isOrganizer ? <Tag label="Người tổ chức" tone="primary" /> : null}
        </View>
        <Txt muted size={13} numberOfLines={1}>{[role, item.headline].filter(Boolean).join(' · ') || 'Thành viên AlumNect'}</Txt>
      </View>
      {registered ? <Txt muted size={12}>{registered}</Txt> : null}
    </Pressable>
  )
}
