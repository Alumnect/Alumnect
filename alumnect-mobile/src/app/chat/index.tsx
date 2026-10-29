import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, SquarePen, Users } from '@/components/icons'
import { Avatar, Empty, IconButton, Screen, SearchBar, Segmented, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName, isGroup } from '@/api/chat'
import type { Conversation } from '@/api/chat'
import { messagePreview } from '@/lib/share'
import { normalize } from '@/constants/filters'
import { useTheme } from '@/theme'

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
            <IconButton label="Tạo nhóm chat" icon={<Users size={19} color={t.text} />} onPress={() => router.push('/chat/create-group')} />
            <IconButton label="Tin nhắn mới" icon={<SquarePen size={19} color={t.text} />} onPress={() => router.push('/chat/search-users')} />
          </>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm cuộc trò chuyện..." />
      </View>
      <Segmented<Tab> tabs={[['primary', 'Hộp thư'], ['requests', 'Tin nhắn chờ'], ['mentoring', 'Mentoring']]} value={tab} onChange={setTab} style={{ marginTop: 4 }} />
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={list}
          keyExtractor={(c, i) => String(c.id ?? `d${i}`)}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={
            <Empty error={q.error} onRetry={() => { void q.refetch() }}
              icon={<MessageCircle size={28} color={t.primary} />}
              title={tab === 'requests' ? 'Không có tin nhắn chờ' : 'Chưa có cuộc trò chuyện'}
              text={tab === 'requests' ? 'Tin nhắn từ người chưa kết nối sẽ nằm ở đây.' : 'Bắt đầu nhắn tin với bạn bè và cựu sinh viên.'}
              action={tab === 'primary' ? 'Nhắn tin mới' : undefined}
              onAction={() => router.push('/chat/search-users')}
            />
          }
          renderItem={({ item }) => {
            const unread = item.unreadCount > 0
            return (
              <Pressable
                onPress={() => open(item)}
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: pressed ? t.inputBg : t.card })}
              >
                <View>
                  <Avatar uri={convAvatar(item)} name={convName(item)} size={56} />
                  {isGroup(item) ? (
                    <View style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.card }}>
                      <Users size={11} color="#fff" />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider, paddingBottom: 10, paddingTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt weight={unread ? '800' : '600'} numberOfLines={1} style={{ flex: 1 }}>{convName(item)}</Txt>
                    <Txt size={12} color={unread ? t.primary : t.textSubtle} weight={unread ? '700' : '400'}>{timeLabel(item.lastMessageAt)}</Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Txt muted={!unread} weight={unread ? '600' : '400'} size={13} numberOfLines={1} style={{ flex: 1 }}>{messagePreview(item.lastMessage)}</Txt>
                    {unread ? (
                      <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                        <Txt size={11} weight="800" color="#fff">{item.unreadCount > 99 ? '99+' : item.unreadCount}</Txt>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </Screen>
  )
}
