import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BadgeCheck, Star } from '@/components/icons'
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
      <Avatar uri={m.avatarUrl} name={m.fullName} size={56} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="700" size={16} numberOfLines={1} style={{ flexShrink: 1 }}>{m.fullName}</Txt>
          <BadgeCheck size={16} color={t.info} weight="fill" />
        </View>
        {job || m.headline ? <Txt size={13} numberOfLines={2}>{job || m.headline}</Txt> : null}
        {fields.length ? <Txt muted size={12} numberOfLines={1}>{fields.join(' · ')}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Star size={14} color={palette.star} weight="fill" />
          <Txt size={13} weight="700">{m.rating?.toFixed?.(1) ?? m.rating}</Txt>
          <Txt muted size={12}>{`(${m.reviewCount})`}</Txt>
          {m.minHourlyRate ? <Txt size={13} weight="700" color={t.primary} style={{ marginLeft: 'auto' }}>{`từ ${formatVnd(m.minHourlyRate)}/giờ`}</Txt> : null}
        </View>
        {meta ? <Txt muted size={12} numberOfLines={1}>{meta}</Txt> : null}
      </View>
    </Pressable>
  )
}

export const MentorCardView = React.memo(MentorCardViewImpl)
