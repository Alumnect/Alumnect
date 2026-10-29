import React, { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { formatVnd, salaryApi } from '@/api/salary'
import { toast, errMsg } from '@/lib/toast'
import { palette } from '@/theme'

/** UC48–49: đóng góp của tôi — sửa / xóa. */
export default function MyContributionsScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['salary-mine'], queryFn: salaryApi.mine })
  const del = useMutation({
    mutationFn: (id: string) => salaryApi.remove(id),
    onSuccess: () => {
      setDeleting(null)
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
          ListEmptyComponent={<Empty error={q.error} onRetry={() => { void q.refetch() }} text="Bạn chưa có đóng góp nào." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 16 }}>
              <Txt weight="700">{item.jobTitle}</Txt>
              <Txt muted size={13}>{[item.company, item.region].filter(Boolean).join(' · ')}</Txt>
              <Txt weight="800" color={palette.primary} style={{ marginVertical: 4 }}>{formatVnd(item.grossAmount)}</Txt>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Sửa" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => router.push({ pathname: '/salary/contribute', params: { id: item.id } })} />
                <Button title="Xóa" variant="danger" style={{ flex: 1, minHeight: 44 }} onPress={() => setDeleting(item.id)} />
              </View>
            </Card>
          )}
        />
      )}
      <ConfirmSheet visible={deleting != null} title="Xóa đóng góp lương?" message="Bạn có thể giữ lại để tiếp tục chỉnh sửa. Đóng góp đã xóa không thể khôi phục." loading={del.isPending} onClose={() => setDeleting(null)} onConfirm={() => { if (deleting != null) del.mutate(deleting) }} />
    </Screen>
  )
}
