import { messagePreview } from '@/lib/share'
import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Users } from 'lucide-react-native'
import { Avatar, Chip, Empty, Screen, Txt } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName, isGroup } from '@/api/chat'
import type { Conversation } from '@/api/chat'
import { useTheme } from '@/theme'

export default function InboxScreen() {
  const t = useTheme()
  const router = useRouter()
  const [tab, setTab] = useState<'primary' | 'requests' | 'mentoring'>('primary')
  const q = useQuery({ queryKey: ['conversations', tab], queryFn: () => (tab === 'mentoring' ? chatApi.conversations('primary', 'MENTORING') : chatApi.conversations(tab)) })
  const list = q.data?.data ?? []

  const open = (c: Conversation) => {
    if (c.id == null && c.recipientId) router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(c.recipientId) } })
    else if (tab === 'requests') router.push({ pathname: '/chat/requests', params: { id: String(c.id) } })
    else router.push({ pathname: '/chat/[id]', params: { id: String(c.id) } })
  }

  return (
    <Screen>
      <Header
        title="Tin nhắn"
        right={
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable onPress={() => router.push('/chat/search-users')} hitSlop={8}><Pencil size={22} color={t.text} /></Pressable>
            <Pressable onPress={() => router.push('/chat/create-group')} hitSlop={8}><Users size={22} color={t.text} /></Pressable>
          </View>
        }
      />
      <View style={{ flexDirection: 'row', padding: 12 }}>
        <Chip label="Hộp thư" active={tab === 'primary'} onPress={() => setTab('primary')} />
        <Chip label="Tin nhắn chờ" active={tab === 'requests'} onPress={() => setTab('requests')} />
        <Chip label="Mentoring" active={tab === 'mentoring'} onPress={() => setTab('mentoring')} />
      </View>
      {q.isLoading ? <ListSkeleton variant="row" /> : (
        <FlashList
          data={list}
          keyExtractor={(c, i) => String(c.id ?? `d${i}`)}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text={tab === 'primary' ? 'Chưa có cuộc trò chuyện nào.' : 'Không có tin nhắn chờ.'} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Avatar uri={convAvatar(item)} name={convName(item)} size={52} />
              <View style={{ flex: 1 }}>
                <Txt weight={item.unreadCount ? '800' : '600'} numberOfLines={1}>{convName(item)}{isGroup(item) ? ` · ${item.memberCount ?? ''} thành viên` : ''}</Txt>
                <Txt muted={!item.unreadCount} weight={item.unreadCount ? '600' : '400'} size={13} numberOfLines={1}>{messagePreview(item.lastMessage)}</Txt>
              </View>
              {item.unreadCount > 0 ? (
                <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                  <Txt size={11} weight="700" color="#fff">{item.unreadCount}</Txt>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
