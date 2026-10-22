import React from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { MENTORING_TERMS_SECTIONS } from '@/constants/mentoringTerms'
import { toast, errMsg } from '@/lib/toast'

/** UC80: xem và chấp nhận điều khoản mentoring. */
export default function MentoringTermsScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const status = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const accept = useMutation({
    mutationFn: mentoringApi.acceptTerms,
    onSuccess: () => {
      toast.success('Bạn đã đồng ý Điều khoản Hướng dẫn & Hỗ trợ.')
      qc.invalidateQueries({ queryKey: ['mentoring-terms'] })
      qc.invalidateQueries({ queryKey: ['mentoring-status'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  if (status.isLoading) return <Screen><Header title="Điều khoản" /><Loading /></Screen>
  return (
    <Screen>
      <Header title="Điều khoản Hướng dẫn & Hỗ trợ" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {MENTORING_TERMS_SECTIONS.map((s) => (
          <View key={s.id} style={{ marginBottom: 16 }}>
            <Txt weight="700" size={16}>{s.title}</Txt>
            {s.content.map((p, i) => <Txt key={i} muted style={{ marginTop: 6, lineHeight: 21 }}>• {p}</Txt>)}
          </View>
        ))}
        {status.data?.accepted ? (
          <Txt color="#16A34A" weight="700">Bạn đã chấp nhận phiên bản {status.data.currentVersion}.</Txt>
        ) : (
          <Button title="Tôi đã đọc và đồng ý" onPress={() => accept.mutate()} loading={accept.isPending} />
        )}
      </ScrollView>
    </Screen>
  )
}
