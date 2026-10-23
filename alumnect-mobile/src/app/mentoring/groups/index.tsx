import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react-native'
import { Button, Card, Chip, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { groupApi, isActiveMember } from '@/api/mentoringGroups'
import type { MentoringGroup } from '@/api/mentoringGroups'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

type Tab = 'ALL' | 'MANAGED' | 'JOINED' | 'INVITATIONS'
const TABS: [Tab, string][] = [['ALL', 'Tất cả'], ['MANAGED', 'Tôi quản lý'], ['JOINED', 'Tôi tham gia'], ['INVITATIONS', 'Lời mời']]

/** Nhóm Mentoring: nhóm học viên cùng gửi yêu cầu cố vấn. */
export default function MentoringGroupsScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('ALL')

  const groups = useQuery({ queryKey: ['mentoring-groups', 'mine', tab], queryFn: () => groupApi.mine(tab === 'MANAGED' ? 'MANAGED' : tab === 'JOINED' ? 'JOINED' : 'ALL'), enabled: tab !== 'INVITATIONS' })
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
  const data = list.data ?? []

  const Item = ({ g }: { g: MentoringGroup }) => {
    const joined = g.joinedMemberCount ?? g.members?.filter(isActiveMember).length ?? 1
    return (
      <Card style={{ marginBottom: 12 }} onPress={tab === 'INVITATIONS' ? undefined : () => router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } })}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Txt weight="700" size={16} style={{ flex: 1 }} numberOfLines={2}>{g.name}</Txt>
          {g.canManage ? <Txt size={11} weight="700" color={t.primary}>Trưởng nhóm</Txt> : null}
        </View>
        {g.description ? <Txt muted size={13} numberOfLines={2} style={{ marginTop: 2 }}>{g.description}</Txt> : null}
        <Txt muted size={12} style={{ marginTop: 6 }}>{joined}/{g.maxMembers} thành viên · Trưởng nhóm: {g.leaderName ?? '—'}</Txt>
        {tab === 'INVITATIONS' ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Button title="Tham gia" style={{ flex: 1, height: 40 }} loading={respond.isPending} onPress={() => respond.mutate({ id: g.id, ok: true })} />
            <Button title="Từ chối" variant="outline" style={{ flex: 1, height: 40 }} onPress={() => respond.mutate({ id: g.id, ok: false })} />
          </View>
        ) : null}
      </Card>
    )
  }

  return (
    <Screen>
      <Header title="Nhóm Mentoring" right={<Plus size={24} color={t.primary} onPress={() => router.push('/mentoring/groups/create')} />} />
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {TABS.map(([k, l]) => <Chip key={k} label={k === 'INVITATIONS' && invites.data?.length ? `Lời mời (${invites.data.length})` : l} active={tab === k} onPress={() => setTab(k)} />)}
        </ScrollView>
      </View>
      {list.isLoading ? <Loading /> : (
        <FlashList
          data={data}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshing={list.isRefetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={<Empty text={tab === 'INVITATIONS' ? 'Bạn không có lời mời nào.' : 'Bạn chưa có nhóm Mentoring nào.'} />}
          renderItem={({ item }) => <Item g={item} />}
        />
      )}
    </Screen>
  )
}
