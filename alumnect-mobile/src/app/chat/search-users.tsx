import React, { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

/** UC73: tìm người dùng để nhắn tin. */
export default function SearchUsersScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const keyword = useDebounced(kw, 400)
  const q = useQuery({ queryKey: ['chat-users', keyword], queryFn: () => chatApi.searchUsers(keyword) })
  return (
    <Screen>
      <Header title="Tin nhắn mới" />
      <TextInput value={kw} onChangeText={setKw} placeholder="Tìm theo tên..." placeholderTextColor={t.textMuted} style={{ margin: 16, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }} />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={q.data?.data ?? []}
          keyExtractor={(u) => String(u.userId)}
          ListEmptyComponent={<Empty text="Không tìm thấy người dùng." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.replace({ pathname: '/chat/direct/[userId]', params: { userId: String(item.userId) } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Avatar uri={item.avatarUrl} name={item.fullName} size={46} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{item.fullName}</Txt>
                <Txt muted size={13} numberOfLines={1}>{item.headline ?? ''}</Txt>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
