import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Briefcase, CalendarDays, Map, Search, BriefcaseBusiness } from 'lucide-react-native'
import { Card, Chip, Empty, Screen, Txt } from '@/components/ui'
import { UserRow } from '@/components/UserRow'
import { userApi } from '@/api/users'
import { useDebounced } from '@/lib/hooks'
import { useTheme } from '@/theme'
import { ListSkeleton } from '@/components/Skeleton'

export default function NetworkScreen() {
  const t = useTheme()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<string | undefined>()
  const debounced = useDebounced(query, 400)

  const results = useInfiniteQuery({
    queryKey: ['users-search', debounced, role],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => userApi.search({ query: debounced || undefined, role, page: pageParam }),
    getNextPageParam: (l) => (l.data.last ? undefined : l.data.pageNumber + 1),
  })
  const suggestions = useQuery({ queryKey: ['suggestions'], queryFn: () => userApi.suggestions(10) })
  const users = results.data?.pages.flatMap((p) => p.data.content) ?? []
  const searching = !!debounced || !!role

  return (
    <Screen>
      <Txt size={24} weight="800" style={{ paddingHorizontal: 16, paddingTop: 8 }}>Mạng lưới</Txt>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 }}>
        <Card onPress={() => router.push('/map')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Map size={20} color={t.primary} /><Txt weight="600">Bản đồ Alumni</Txt>
        </Card>
        <Card onPress={() => router.push('/career')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Briefcase size={20} color={t.primary} /><Txt weight="600">Career Path</Txt>
        </Card>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 10 }}>
        <Card onPress={() => router.push('/jobs')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BriefcaseBusiness size={20} color={t.primary} /><Txt weight="600">Việc làm</Txt>
        </Card>
        <Card onPress={() => router.push('/events')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={20} color={t.primary} /><Txt weight="600">Sự kiện</Txt>
        </Card>
      </View>
      <View style={{ margin: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderRadius: 12, paddingHorizontal: 12 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Tìm theo tên, kỹ năng, công ty..." placeholderTextColor={t.textMuted} style={{ flex: 1, color: t.text, paddingVertical: 10, paddingHorizontal: 8 }} />
      </View>
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="Tất cả" active={!role} onPress={() => setRole(undefined)} />
          <Chip label="Cựu sinh viên" active={role === 'ALUMNI'} onPress={() => setRole('ALUMNI')} />
          <Chip label="Sinh viên" active={role === 'STUDENT'} onPress={() => setRole('STUDENT')} />
        </ScrollView>
      </View>

      {results.isLoading ? (
        <ListSkeleton variant="row" />
      ) : (
        <FlashList
          data={users}
          keyExtractor={(u) => String(u.userId)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
          onEndReached={() => results.hasNextPage && results.fetchNextPage()}
          ListHeaderComponent={
            !searching && suggestions.data?.data?.length ? (
              <View style={{ marginBottom: 8 }}>
                <Txt weight="700" size={16} style={{ marginBottom: 4 }}>Gợi ý kết nối</Txt>
                {suggestions.data.data.slice(0, 5).map((u) => <UserRow key={u.userId} user={u} />)}
                <Txt weight="700" size={16} style={{ marginTop: 12 }}>Thành viên</Txt>
              </View>
            ) : null
          }
          ListEmptyComponent={<Empty text="Không tìm thấy thành viên phù hợp." />}
          renderItem={({ item }) => <UserRow user={item} />}
        />
      )}
      <Pressable style={{ display: 'none' }} />
    </Screen>
  )
}
