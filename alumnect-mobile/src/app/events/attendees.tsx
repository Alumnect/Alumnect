import React, { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { eventApi } from '@/api/events'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'

export default function AttendeesScreen() {
  const t = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [kw, setKw] = useState('')
  const search = useDebounced(kw, 400)
  const q = useQuery({ queryKey: ['attendees', id, search], queryFn: () => eventApi.attendees(id!, { search: search || undefined }) })
  return (
    <Screen>
      <Header title="Người tham gia" />
      <TextInput value={kw} onChangeText={setKw} placeholder="Tìm theo tên..." placeholderTextColor={t.textMuted} style={{ margin: 16, backgroundColor: t.inputBg, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }} />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={q.data?.data ?? []}
          keyExtractor={(a) => String(a.userId)}
          ListEmptyComponent={<Empty text="Chưa có người tham gia." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(item.userId) } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Avatar uri={item.avatarUrl} name={item.fullName} size={44} />
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
