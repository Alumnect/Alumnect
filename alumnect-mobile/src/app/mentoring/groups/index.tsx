import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Users } from '@/components/icons'
import { Button, Card, Chip, Empty, Loading, Screen, Txt, Tag } from '@/components/ui'
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
      <Card style={{ marginBottom: 16 }} onPress={tab === 'INVITATIONS' ? undefined : () => router.push({ pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } })}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Txt weight="800" size={16} style={{ flex: 1 }} numberOfLines={2}>{g.name}</Txt>
          {g.canManage ? <Tag label="Trưởng nhóm" /> : null}
        </View>
        {g.description ? <Txt muted size={13} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>{g.description}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.inputBg, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (joined / Math.max(1, g.maxMembers)) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: t.primary }} />
          </View>
          <Txt muted size={12}>{`${joined}/${g.maxMembers} thành viên`}</Txt>
        </View>
        <Txt muted size={12} style={{ marginTop: 6 }}>{`Trưởng nhóm: ${g.leaderName ?? '—'}`}</Txt>
        {tab === 'INVITATIONS' ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Button title="Tham gia" style={{ flex: 1, minHeight: 44 }} loading={respond.isPending} onPress={() => respond.mutate({ id: g.id, ok: true })} />
            <Button title="Từ chối" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => respond.mutate({ id: g.id, ok: false })} />
          </View>
        ) : null}
      </Card>
    )
  }

  return (
    <Screen>
      <Header title="Nhóm Mentoring" right={<Button title="Tạo nhóm" size="sm" icon={<Plus size={15} color="#fff" />} onPress={() => router.push('/mentoring/groups/create')} />} />
      <View style={{ backgroundColor: t.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {TABS.map(([k, l]) => <Chip key={k} label={k === 'INVITATIONS' && invites.data?.length ? `Lời mời (${invites.data.length})` : l} active={tab === k} onPress={() => setTab(k)} />)}
        </ScrollView>
      </View>
      {list.isLoading ? <Loading /> : (
        <FlashList
          data={data}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ padding: 12 }}
          refreshing={list.isRefetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={<Empty icon={<Users size={26} color={t.primary} />} title={tab === 'INVITATIONS' ? 'Không có lời mời' : 'Chưa có nhóm'} text={tab === 'INVITATIONS' ? 'Lời mời tham gia nhóm mentoring sẽ hiện ở đây.' : 'Tạo nhóm để cùng bạn bè nhận hướng dẫn từ mentor.'} />}
          renderItem={({ item }) => <Item g={item} />}
        />
      )}
    </Screen>
  )
}
