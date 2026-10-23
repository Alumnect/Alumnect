import React from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { formatVnd, salaryApi } from '@/api/salary'
import { toast, errMsg } from '@/lib/toast'
import { palette } from '@/theme'

/** UC48–49: đóng góp của tôi — sửa / xóa. */
export default function MyContributionsScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['salary-mine'], queryFn: salaryApi.mine })
  const del = useMutation({
    mutationFn: (id: string) => salaryApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa đóng góp lương.')
      qc.invalidateQueries({ queryKey: ['salary-mine'] })
      qc.invalidateQueries({ queryKey: ['salary-feed'] })
      qc.invalidateQueries({ queryKey: ['salary-stats'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  return (
    <Screen>
      <Header title="Đóng góp của tôi" />
      {q.isLoading ? <Loading /> : (
        <FlashList
          data={q.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Empty text="Bạn chưa có đóng góp nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }}>
              <Txt weight="700">{item.jobTitle}</Txt>
              <Txt muted size={13}>{[item.company, item.region].filter(Boolean).join(' · ')}</Txt>
              <Txt weight="800" color={palette.primary} style={{ marginVertical: 4 }}>{formatVnd(item.grossAmount)}</Txt>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Sửa" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => router.push({ pathname: '/salary/contribute', params: { id: item.id } })} />
                <Button title="Xóa" variant="danger" style={{ flex: 1, height: 38 }} onPress={() => del.mutate(item.id)} />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
