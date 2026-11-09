import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { mentoringApi } from '@/api/mentoring'
import { MENTORING_TERMS_SECTIONS } from '@/constants/mentoringTerms'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { CheckCircle2, FileText } from '@/components/icons'

/** UC80: xem và chấp nhận điều khoản mentoring (Meetup x Kakao Document Style — Cam - Trắng - Đen). */
export default function MentoringTermsScreen() {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
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

  if (status.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Điều khoản Cố vấn" />
        <Loading />
      </Screen>
    )
  if (status.isError)
    return (
      <Screen bg={colors.bg}>
        <Header title="Điều khoản Cố vấn" />
        <Empty text="Không tải được trạng thái điều khoản." error={status.error} onRetry={() => { void status.refetch() }} />
      </Screen>
    )

  return (
    <Screen bg={colors.bg}>
      <Header title="Điều khoản Hướng dẫn & Hỗ trợ" subtitle="Quy chuẩn minh bạch giữa Học viên & Mentor" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        {MENTORING_TERMS_SECTIONS.map((s, idx) => (
          <View key={s.id} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={[styles.numBadge, { backgroundColor: viridianSoft }]}>
                <Txt size={11} weight="800" style={{ color: viridian }}>
                  {`0${idx + 1}`}
                </Txt>
              </View>
              <Txt weight="800" size={15} style={{ color: colors.text, flex: 1 }}>
                {s.title}
              </Txt>
            </View>
            {s.content.map((p, i) => (
              <Txt key={i} size={13.5} style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 21 }}>
                • {p}
              </Txt>
            ))}
          </View>
        ))}

        {status.data?.accepted ? (
          <View style={[styles.acceptedBanner, { backgroundColor: viridianSoft }]}>
            <CheckCircle2 size={18} color={viridian} weight="fill" />
            <Txt style={{ color: viridian, fontWeight: '800' }} size={13}>
              Bạn đã chấp nhận điều khoản (Phiên bản {status.data.currentVersion}).
            </Txt>
          </View>
        ) : (
          <Button
            title="Tôi đã đọc và đồng ý điều khoản"
            textColor="#FFFFFF"
            icon={<FileText size={16} color="#FFFFFF" weight="bold" />}
            onPress={() => accept.mutate()}
            loading={accept.isPending}
            style={{ backgroundColor: viridian, borderColor: viridian, minHeight: 52 }}
          />
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  numBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 6,
  },
})
