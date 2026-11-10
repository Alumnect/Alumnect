import React, { useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { chatApi, convAvatar, convName } from '@/api/chat'
import { toast, errMsg } from '@/lib/toast'
import { BrandIcon } from '@/components/BrandIcon'
import { BottomBar } from '@/components/DetailBits'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { ScrollView } from '@/components/ScrollView'
import { Enter } from '@/components/Motion'
import { useTheme } from '@/theme'
import { messagePreview } from '@/lib/share'

/** UC69: chấp nhận / từ chối tin nhắn chờ. */
export default function MessageRequestScreen() {
  const t = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState(false)
  const validId = Number.isSafeInteger(Number(id)) && Number(id) > 0
  const requests = useQuery({ queryKey: ['conversations', 'requests'], queryFn: () => chatApi.conversations('requests'), enabled: validId })
  const conversation = requests.data?.data.find((c) => c.id === Number(id))
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
      {requests.isLoading ? <Loading /> : !conversation ? <Empty title="Không tìm thấy lời nhắn" text="Yêu cầu có thể đã được xử lý. Quay lại hộp thư để xem tin nhắn mới." error={requests.error} onRetry={validId ? () => void requests.refetch() : undefined} /> : <>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
          <Enter style={{ alignItems: 'center', gap: 14 }}>
            <BrandIcon name="chat" size={64} />
            <Avatar uri={convAvatar(conversation)} name={convName(conversation)} size={80} />
            <Txt heading size={22} weight="600" style={{ textAlign: 'center' }}>{convName(conversation)}</Txt>
            <Txt muted size={13} style={{ textAlign: 'center', maxWidth: 320 }}>muốn bắt đầu trò chuyện với bạn</Txt>
            {conversation.lastMessage ? <Card style={{ alignSelf: 'stretch', marginTop: 10, borderRadius: 20 }}><Txt size={11} weight="600" color={t.primary} style={{ marginBottom: 8 }}>LỜI NHẮN</Txt><Txt size={14}>{messagePreview(conversation.lastMessage)}</Txt></Card> : null}
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.surface, alignSelf: 'stretch', marginTop: 8 }}><Txt size={13} muted style={{ textAlign: 'center' }}>Người này chưa phải là kết nối của bạn. Bạn có thể chấp nhận để trò chuyện hoặc từ chối để xóa yêu cầu.</Txt></View>
          </Enter>
        </ScrollView>
        <BottomBar>
          <Button title="Từ chối" variant="outline" onPress={() => setConfirm(true)} disabled={accept.isPending || decline.isPending} style={{ flex: 1 }} />
          <Button title="Chấp nhận" variant="brand" onPress={() => accept.mutate()} loading={accept.isPending} disabled={decline.isPending} style={{ flex: 1.4 }} />
        </BottomBar>
      </>}
      <ConfirmSheet visible={confirm} title="Từ chối lời nhắn này?" message="Cuộc trò chuyện sẽ bị xóa khỏi tin nhắn chờ của bạn." confirmLabel="Từ chối" loading={decline.isPending} onClose={() => setConfirm(false)} onConfirm={() => decline.mutate()} />
    </Screen>
  )
}
