import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Empty, Loading, Screen, Txt, SearchBar } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'
import { ChevronRight } from '@/components/icons'

/** UC73: tìm người dùng để nhắn tin. */
export default function SearchUsersScreen() {
  const t = useTheme()
  const router = useRouter()
  const [kw, setKw] = useState('')
  const keyword = useDebounced(kw, 400)
  const q = useQuery({ queryKey: ['chat-users', keyword], queryFn: () => chatApi.searchUsers(keyword) })
  return (
    <Screen bg={t.card}>
      <Header title="Tin nhắn mới" />
      <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm theo tên..." style={{ margin: 16 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14 }}><BrandIcon name="chat" size={30} /><View style={{ flex: 1 }}><Txt size={14} weight="600">{kw ? 'Kết quả tìm kiếm' : 'Bắt đầu một kết nối'}</Txt><Txt size={12} muted>Chọn người bạn muốn trò chuyện</Txt></View></View>
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={q.data?.data ?? []}
          keyExtractor={(u) => String(u.userId)}
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy người dùng." />}
          renderItem={({ item }) => (
            <MotionPressable accessibilityRole="button" accessibilityLabel={`Nhắn tin với ${item.fullName}`} onPress={() => router.replace({ pathname: '/chat/direct/[userId]', params: { userId: String(item.userId) } })} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13, backgroundColor: pressed ? t.inputBg : t.card })}>
              <Avatar uri={item.avatarUrl} name={item.fullName} size={50} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="600">{item.fullName}</Txt>
                {item.headline ? <Txt muted size={12} numberOfLines={1} style={{ marginTop: 3 }}>{item.headline}</Txt> : null}
              </View>
              <ChevronRight size={17} color={t.textSubtle} />
            </MotionPressable>
          )}
        />
      )}
    </Screen>
  )
}
