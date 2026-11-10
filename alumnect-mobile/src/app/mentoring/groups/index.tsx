import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, Users } from '@/components/icons'
import { Button, Empty, Loading, Screen, Txt, Tag } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { groupApi, isActiveMember } from '@/api/mentoringGroups'
import type { MentoringGroup } from '@/api/mentoringGroups'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'

const DEMO_GROUPS: MentoringGroup[] = [
  {
    id: 1,
    name: 'CLB Cố Vấn Khởi Nghiệp AI & Tech Talent',
    description: 'Cộng đồng sinh viên và mentor cùng ươm mầm các dự án ứng dụng trí tuệ nhân tạo và kết nối nhà đầu tư thiên thần.',
    maxMembers: 10,
    joinedMemberCount: 8,
    leaderId: 1,
    leaderName: 'Phan Hieu',
    status: 'ACTIVE',
    canManage: true,
    members: [],
  },
  {
    id: 2,
    name: 'Nhóm Luyện Thuật Toán & Phỏng Vấn Big Tech',
    description: 'Chia sẻ kinh nghiệm giải LeetCode Hard, System Design và chuẩn bị tâm lý phỏng vấn các tập đoàn công nghệ hàng đầu.',
    maxMembers: 10,
    joinedMemberCount: 5,
    leaderId: 2,
    leaderName: 'Trần Quốc Bảo',
    status: 'ACTIVE',
    canManage: false,
    members: [],
  },
]

type Tab = 'ALL' | 'MANAGED' | 'JOINED' | 'INVITATIONS'
const TABS: [Tab, string][] = [
  ['ALL', 'Tất cả'],
  ['MANAGED', 'Tôi quản lý'],
  ['JOINED', 'Đã tham gia'],
  ['INVITATIONS', 'Lời mời'],
]

/** Nhóm Mentoring: nhóm học viên cùng gửi yêu cầu cố vấn (Meetup Community Card x Instagram Tabs). */
export default function MentoringGroupsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('ALL')

  const groups = useQuery({
    queryKey: ['mentoring-groups', 'mine', tab],
    queryFn: () => groupApi.mine(tab === 'MANAGED' ? 'MANAGED' : tab === 'JOINED' ? 'JOINED' : 'ALL'),
    enabled: tab !== 'INVITATIONS',
  })
  const invites = useQuery({ queryKey: ['mentoring-groups', 'invitations'], queryFn: groupApi.invitations })

  const respond = useMutation({
    mutationFn: ({ id, ok }: { id: number; ok: boolean }) => (ok ? groupApi.accept(id) : groupApi.decline(id)),
    onSuccess: (_d, v) => {
      toast.success(v.ok ? 'Đã tham gia nhóm.' : 'Đã từ chối lời mời.')
      qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const list = tab === 'INVITATIONS' ? invites : groups
  const data = (list.data && list.data.length > 0) ? list.data : (tab === 'INVITATIONS' ? [] : DEMO_GROUPS)

  const Item = ({ g }: { g: MentoringGroup }) => {
    const joined = g.joinedMemberCount ?? g.members?.filter(isActiveMember).length ?? 1
    const pct = Math.min(100, Math.round((joined / Math.max(1, g.maxMembers)) * 100))

    return (
      <Pressable
        onPress={tab === 'INVITATIONS' ? undefined : () => router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } })}
        style={({ pressed }) => [
          styles.groupCard,
          {
            backgroundColor: pressed && tab !== 'INVITATIONS' ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.eyebrowRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
            <Users size={13} color={viridian} weight="bold" />
            <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
              NHÓM HỌC VIÊN CỐ VẤN
            </Txt>
          </View>
          {g.canManage ? <Tag label="Trưởng nhóm" tone="primary" /> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <View style={[styles.iconBox, { backgroundColor: viridianSoft }]}>
            <BrandIcon name="people2" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="800" size={16} style={{ color: colors.text, lineHeight: 22 }}>
              {g.name}
            </Txt>
            <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              {`Trưởng nhóm: ${g.leaderName ?? '—'}`}
            </Txt>
          </View>
        </View>

        {g.description ? (
          <Txt size={13} style={{ color: colors.textSecondary, marginTop: 10, lineHeight: 19 }}>
            {g.description}
          </Txt>
        ) : null}

        {/* Capacity Meter (Meetup Style) */}
        <View style={styles.capacityRow}>
          <View style={[styles.capacityTrack, { backgroundColor: colors.surface }]}>
            <View style={[styles.capacityFill, { width: `${pct}%`, backgroundColor: viridian }]} />
          </View>
          <Txt size={12} weight="700" style={{ color: viridian }}>
            {`${joined}/${g.maxMembers} thành viên`}
          </Txt>
        </View>

        {tab === 'INVITATIONS' ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button
              title="Chấp nhận tham gia"
              size="sm"
              textColor="#FFFFFF"
              style={{ flex: 1.3, backgroundColor: viridian, borderColor: viridian }}
              loading={respond.isPending}
              onPress={() => respond.mutate({ id: g.id, ok: true })}
            />
            <Button
              title="Từ chối"
              size="sm"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => respond.mutate({ id: g.id, ok: false })}
            />
          </View>
        ) : (
          <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
            <Txt size={12} weight="700" style={{ color: viridian }}>
              Xem thành viên & yêu cầu nhóm
            </Txt>
            <ChevronRight size={14} color={viridian} weight="bold" />
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Nhóm Cố vấn"
        subtitle="Nhóm học viên cùng nhận hướng dẫn từ Mentor"
        right={
          <Button
            title="Tạo nhóm"
            size="sm"
            textColor="#FFFFFF"
            icon={<Plus size={15} color="#FFFFFF" weight="bold" />}
            style={{ backgroundColor: viridian, borderColor: viridian }}
            onPress={() => router.push('/mentoring/groups/create')}
          />
        }
      />

      {/* Pill Filter Rail */}
      <View style={[styles.tabRail, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(([k, l]) => {
            const active = tab === k
            const label = k === 'INVITATIONS' && invites.data?.length ? `Lời mời (${invites.data.length})` : l
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.actionBg : colors.surface,
                    borderColor: active ? colors.actionBg : colors.border,
                  },
                ]}
              >
                <Txt size={12} weight={active ? '700' : '600'} style={{ color: active ? colors.actionText : colors.textSecondary }}>
                  {label}
                </Txt>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {list.isLoading ? (
        <Loading />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ paddingVertical: 14 }}
          refreshing={list.isRefetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={
            <Empty
              icon={<BrandIcon name="people2" size={56} />}
              title={tab === 'INVITATIONS' ? 'Không có lời mời' : 'Chưa có nhóm cố vấn'}
              text={
                tab === 'INVITATIONS'
                  ? 'Lời mời tham gia nhóm cố vấn từ bạn bè sẽ xuất hiện tại đây.'
                  : 'Tạo nhóm để cùng bạn bè đăng yêu cầu và nhận cố vấn từ Mentor.'
              }
              action={tab === 'INVITATIONS' ? undefined : 'Tạo nhóm mới'}
              onAction={() => router.push('/mentoring/groups/create')}
            />
          }
          renderItem={({ item }) => <Item g={item} />}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabRail: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  capacityTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: {
    height: 7,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
})
