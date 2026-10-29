import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Star } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import type { MentorCard } from '@/api/mentoring'
import { useTheme, palette } from '@/theme'

function MentorCardViewImpl({ m }: { m: MentorCard }) {
  const t = useTheme()
  const router = useRouter()
  const fields = m.supportedFields.map((f) => (typeof f === 'string' ? f : f.name)).slice(0, 3)
  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' tại ')
  const meta = [WORKING_MODE_LABEL[m.workingMode], MENTORING_TYPE_LABEL[m.mentoringType]].filter(Boolean).join(' · ')
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })}
      accessibilityRole="button"
      accessibilityLabel={`Mentor ${m.fullName}`}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 14, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: pressed ? t.inputBg : t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider })}
    >
      <Avatar uri={m.avatarUrl} name={m.fullName} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="600" size={16} numberOfLines={2} style={{ flexShrink: 1 }}>{m.fullName}</Txt>
        </View>
        {job || m.headline ? <Txt size={13} numberOfLines={2}>{job || m.headline}</Txt> : null}
        {fields.length ? <Txt muted size={12} numberOfLines={1}>{fields.join(' · ')}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Star size={14} color={palette.star} weight="fill" />
          <Txt size={13} weight="700">{m.rating?.toFixed?.(1) ?? m.rating}</Txt>
          <Txt muted size={12}>{`(${m.reviewCount})`}</Txt>
        </View>
        {meta ? <Txt muted size={12} numberOfLines={1}>{meta}</Txt> : null}
        {m.minHourlyRate ? <Txt size={14} weight="500" style={{ marginTop: 3 }}>{`Từ ${formatVnd(m.minHourlyRate)}/giờ`}</Txt> : null}
      </View>
    </Pressable>
  )
}

export const MentorCardView = React.memo(MentorCardViewImpl)
