import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, Trash2 } from '@/components/icons'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { formatVnd, salaryApi } from '@/api/salary'
import type { SalaryContribution } from '@/api/salary'
import { getJobStyle } from '@/constants/jobTitles'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

/** Thẻ một đóng góp của người dùng chuẩn hóa giao diện và màu sắc đồng bộ với Web. */
function MyContributionCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SalaryContribution
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useTheme()
  const style = getJobStyle(item.jobTitle, t)

  return (
    <View
      style={{
        marginBottom: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.card,
      }}
    >
      {/* 1. Header: Chức danh & Nút thao tác nhỏ gọn chuẩn Web */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
          <Txt weight="700" size={15} numberOfLines={2}>
            {item.jobTitle}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Nút Sửa nhỏ gọn */}
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Sửa đóng góp"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.inputBg : t.card,
            })}
          >
            <Pencil size={13} color={t.text} />
            <Txt size={12} weight="600">Sửa</Txt>
          </Pressable>

          {/* Nút Xóa icon đỏ nhẹ nhàng, không chiếm chỗ */}
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Xóa đóng góp"
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.isDark ? '#7F1D1D' : '#FECDD3',
              backgroundColor: pressed ? (t.isDark ? '#451A1A' : '#FEE2E2') : t.dangerTint,
            })}
          >
            <Trash2 size={15} color={t.danger} />
          </Pressable>
        </View>
      </View>

      {/* 2. Badges: Ngành nghề (đổi màu theo getJobStyle chuẩn Web) & Công ty */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 }}>
        {item.industry ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: style.bg,
              borderWidth: 1,
              borderColor: style.border,
            }}
          >
            <Txt size={11} weight="600" color={style.color}>
              {item.industry}
            </Txt>
          </View>
        ) : null}
        {item.company ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: t.isDark ? '#26242E' : '#F3F4F6',
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Txt size={11} weight="500" color={t.textMuted} numberOfLines={1}>
              {item.company}
            </Txt>
          </View>
        ) : null}
      </View>

      {/* 3. Địa điểm */}
      {item.region ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <MapPin size={12} color={t.textMuted} />
          <Txt size={12} color={t.textMuted}>
            {item.region}
          </Txt>
        </View>
      ) : null}

      {/* 4. Mức lương (màu cam FPT chuẩn Web) & Kinh nghiệm */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.divider,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Txt weight="800" size={16} color={t.primary}>
            {formatVnd(item.grossAmount)}
          </Txt>
          <Txt size={12} color={t.textMuted}>
            / tháng
          </Txt>
        </View>
        {item.yearsExperience != null ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: t.primaryTint,
              borderWidth: 1,
              borderColor: t.isDark ? '#7C2D12' : '#FED7AA',
            }}
          >
            <Txt size={11} weight="600" color={t.primary}>
              {item.yearsExperience > 0 ? `${item.yearsExperience} năm KN` : 'Chưa có KN'}
            </Txt>
          </View>
        ) : null}
      </View>
    </View>
  )
}

/** UC48–49: đóng góp của tôi — xem danh sách, sửa, xóa với giao diện chuẩn hóa đồng bộ Web. */
export default function MyContributionsScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  const q = useQuery({ queryKey: ['salary-mine'], queryFn: salaryApi.mine })

  const del = useMutation({
    mutationFn: (id: string) => salaryApi.remove(id),
    onSuccess: () => {
      setDeleting(null)
      toast.success('Đã xóa đóng góp lương.')
      qc.invalidateQueries({ queryKey: ['salary-mine'] })
      qc.invalidateQueries({ queryKey: ['salary-feed'] })
      qc.invalidateQueries({ queryKey: ['salary-stats'] })
      qc.invalidateQueries({ queryKey: ['salary-stats-base'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  return (
    <Screen bg={t.bg}>
      <Header title="Đóng góp của tôi" />
      {q.isLoading ? (
        <Loading />
      ) : (
        <FlashList
          data={q.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Empty
              error={q.error}
              onRetry={() => { void q.refetch() }}
              title="Bạn chưa có đóng góp nào"
              text="Hãy cùng cộng đồng chia sẻ thông tin lương ẩn danh để giúp đỡ các thế hệ sinh viên và cựu sinh viên."
              action="Đóng góp ngay"
              onAction={() => router.push('/salary/contribute')}
            />
          }
          renderItem={({ item }) => (
            <MyContributionCard
              item={item}
              onEdit={() => router.push({ pathname: '/salary/contribute', params: { id: item.id } })}
              onDelete={() => setDeleting(item.id)}
            />
          )}
        />
      )}
      <ConfirmSheet
        visible={deleting != null}
        title="Xóa đóng góp lương?"
        message="Bạn có thể giữ lại để tiếp tục chỉnh sửa. Đóng góp đã xóa sẽ không thể khôi phục."
        confirmLabel="Xóa đóng góp"
        loading={del.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting != null) del.mutate(deleting)
        }}
      />
    </Screen>
  )
}
