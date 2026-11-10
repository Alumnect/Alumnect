import React, { useMemo, useState } from 'react'
import { View, ScrollView } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { SquarePen, Users } from '@/components/icons'
import { Avatar, Empty, Screen, SearchBar, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName, isGroup } from '@/api/chat'
import type { Conversation } from '@/api/chat'
import { messagePreview } from '@/lib/share'
import { normalize } from '@/constants/filters'
import { useTheme } from '@/theme'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'

type Tab = 'primary' | 'requests' | 'mentoring'

const timeLabel = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const diff = (now.getTime() - d.getTime()) / 86_400_000
  if (diff < 7) return d.toLocaleDateString('vi-VN', { weekday: 'short' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function InboxScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('primary')
  const [kw, setKw] = useState('')
  const q = useQuery({ queryKey: ['conversations', tab], queryFn: () => (tab === 'mentoring' ? chatApi.conversations('primary', 'MENTORING') : chatApi.conversations(tab)) })
  const list = useMemo(() => {
    const all = q.data?.data ?? []
    const k = normalize(kw)
    return k ? all.filter((c) => normalize(convName(c)).includes(k)) : all
  }, [q.data, kw])

  const open = (c: Conversation) => {
    if (c.id == null && c.recipientId) router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(c.recipientId) } })
    else if (tab === 'requests') router.push({ pathname: '/chat/requests', params: { id: String(c.id) } })
    else router.push({ pathname: '/chat/[id]', params: { id: String(c.id) } })
  }

  return (
    <Screen bg={t.card}>
      <Header
        title="Tin nhắn"
        right={
          <>
            <MotionPressable accessibilityRole="button" accessibilityLabel="Tạo nhóm chat" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/chat/create-group')}><Users size={24} color={t.text} /></MotionPressable>
            <MotionPressable accessibilityRole="button" accessibilityLabel="Tin nhắn mới" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/chat/search-users')}><SquarePen size={26} color={t.text} /></MotionPressable>
          </>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm kiếm" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 22 }}>
        {([['primary', 'Hộp thư'], ['mentoring', 'Mentoring']] as const).map(([key, label]) => <MotionPressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: tab === key ? t.text : 'transparent' }}><Txt size={14} weight={tab === key ? '700' : '500'} muted={tab !== key}>{label}</Txt></MotionPressable>)}
        <MotionPressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'requests' }} onPress={() => setTab('requests')} style={{ marginLeft: 'auto', minHeight: 48, justifyContent: 'center' }}><Txt size={12} weight="600" color={tab === 'requests' ? t.text : t.primary}>Tin nhắn chờ</Txt></MotionPressable>
      </View>
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={list}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyExtractor={(c, i) => String(c.id ?? `d${i}`)}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={tab === 'primary' && !kw.trim() && list.length > 0 ? <View style={{ paddingTop: 18, paddingBottom: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 18 }}>
              {list.slice(0, 7).map((c, i) => <MotionPressable key={c.id ?? `recent-${i}`} accessibilityRole="button" accessibilityLabel={`Mở trò chuyện với ${convName(c)}`} onPress={() => open(c)} style={{ width: 64, alignItems: 'center', gap: 7 }}>
                <Avatar uri={convAvatar(c)} name={convName(c)} size={62} />
                <Txt size={12} numberOfLines={1} style={{ textAlign: 'center' }}>{convName(c)}</Txt>
              </MotionPressable>)}
            </ScrollView>
            <Txt size={15} weight="700" style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 2 }}>Cuộc trò chuyện</Txt>
          </View> : null}
          ListEmptyComponent={
            <Empty error={q.error} onRetry={() => { void q.refetch() }}
              icon={<BrandIcon name="chat" size={64} />}
              title={tab === 'requests' ? 'Không có tin nhắn chờ' : 'Chưa có cuộc trò chuyện'}
              text={tab === 'requests' ? 'Tin nhắn từ người chưa kết nối sẽ nằm ở đây.' : 'Bắt đầu nhắn tin với bạn bè và cựu sinh viên.'}
              action={tab === 'primary' ? 'Nhắn tin mới' : undefined}
              onAction={() => router.push('/chat/search-users')}
            />
          }
          renderItem={({ item }) => {
            const unread = item.unreadCount > 0
            return (
              <MotionPressable
                onPress={() => open(item)}
                accessibilityRole="button"
                accessibilityLabel={`${convName(item)}${unread ? `, ${item.unreadCount} tin nhắn chưa đọc` : ''}`}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: pressed ? t.inputBg : t.card })}
              >
                <View>
                  <Avatar uri={convAvatar(item)} name={convName(item)} size={60} />
                  {isGroup(item) ? (
                    <View style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.card }}>
                      <Users size={12} color={t.textMuted} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt size={14} weight={unread ? '700' : '500'} numberOfLines={1} style={{ flex: 1 }}>{convName(item)}</Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Txt muted={!unread} weight={unread ? '600' : '400'} size={13} numberOfLines={1} style={{ flex: 1 }}>{messagePreview(item.lastMessage)}</Txt>
                    <Txt size={12} muted>· {timeLabel(item.lastMessageAt)}</Txt>
                  </View>
                </View>
                {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary }} /> : null}
              </MotionPressable>
            )
          }}
        />
      )}
    </Screen>
  )
}
