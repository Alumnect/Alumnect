import React, { useMemo, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Pressable, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName } from '@/api/chat'
import { messagePreview } from '@/lib/share'
import { useTheme } from '@/theme'

/** Tin nhắn Mentoring: danh sách hội thoại theo từng yêu cầu / task (scope=MENTORING). */
export default function MentoringMessagesScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const q = useQuery({ queryKey: ['conversations', 'mentoring'], queryFn: () => chatApi.conversations('primary', 'MENTORING') })
  const items = useMemo(() => {
    const all = q.data?.data ?? []
    const k = kw.trim().toLowerCase()
    return k ? all.filter((c) => convName(c).toLowerCase().includes(k)) : all
  }, [q.data, kw])

  return (
    <Screen>
      <Header title="Tin nhắn Mentoring" />
      <View style={{ margin: 16, marginBottom: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput value={kw} onChangeText={setKw} placeholder="Tìm Mentor hoặc học viên..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
      </View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={items}
          keyExtractor={(c) => String(c.id)}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<Empty text={kw ? 'Không tìm thấy cuộc trò chuyện.' : 'Cuộc trò chuyện sẽ xuất hiện khi một yêu cầu Mentoring được kết nối.'} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.id != null && router.push({ pathname: '/chat/[id]', params: { id: String(item.id) } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: t.border }}
            >
              <Avatar uri={convAvatar(item)} name={convName(item)} size={46} />
              <View style={{ flex: 1 }}>
                <Txt weight="700" numberOfLines={1}>{convName(item)}</Txt>
                <Txt muted size={13} numberOfLines={1}>{messagePreview(item.lastMessage) || 'Bắt đầu trao đổi Mentoring'}</Txt>
              </View>
              {item.unreadCount > 0 ? (
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={12} weight="800" color="#fff">{item.unreadCount}</Txt>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
