import React from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi } from '@/api/chat'
import { toast, errMsg } from '@/lib/toast'

/** UC69: chấp nhận / từ chối tin nhắn chờ. */
export default function MessageRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: ['conversations'] })

  const accept = useMutation({
    mutationFn: () => chatApi.accept(Number(id)),
    onSuccess: () => {
      toast.success('Đã chấp nhận tin nhắn.')
      done()
      router.replace({ pathname: '/chat/[id]', params: { id: String(id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const decline = useMutation({
    mutationFn: () => chatApi.remove(Number(id)),
    onSuccess: () => {
      toast.success('Đã từ chối cuộc trò chuyện.')
      done()
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  return (
    <Screen>
      <Header title="Tin nhắn chờ" />
      <View style={{ padding: 24, gap: 12 }}>
        <Txt>Người này chưa phải là kết nối của bạn. Chấp nhận để bắt đầu trò chuyện hoặc từ chối để xóa.</Txt>
        <Button title="Chấp nhận" onPress={() => accept.mutate()} loading={accept.isPending} />
        <Button title="Từ chối" variant="danger" onPress={() => decline.mutate()} loading={decline.isPending} />
      </View>
    </Screen>
  )
}
