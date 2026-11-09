import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BadgeCheck, ChevronRight, Star } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import type { MentorCard } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

function MentorCardViewImpl({ m }: { m: MentorCard }) {
  const { colors, viridian, viridianSoft, isDark, liveGreen } = useMentoringTheme()
  const router = useRouter()
  const fields = m.supportedFields.map((f) => (typeof f === 'string' ? f : f.name)).slice(0, 3)
  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' tại ')
  const meta = [WORKING_MODE_LABEL[m.workingMode], MENTORING_TYPE_LABEL[m.mentoringType]].filter(Boolean).join(' · ')
  const isAvailable = m.active !== false

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })}
      accessibilityRole="button"
      accessibilityLabel={`Mentor ${m.fullName}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? (isDark ? '#252628' : '#F9FAFB') : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Header: Avatar + Name + Rating */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Avatar uri={m.avatarUrl} name={m.fullName} size={54} />
          {isAvailable && (
            <View style={[styles.liveDot, { backgroundColor: liveGreen, borderColor: colors.card }]} />
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Txt weight="700" size={16} numberOfLines={1} style={{ color: colors.text, flexShrink: 1 }}>
              {m.fullName}
            </Txt>
            <BadgeCheck size={17} color={viridian} />
          </View>

          {job || m.headline ? (
            <Txt size={13} numberOfLines={1} style={{ color: colors.textSecondary, marginTop: 1 }}>
              {job || m.headline}
            </Txt>
          ) : null}

          {/* Rating & Reputation Ribbon */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Star size={12} color="#D97706" weight="fill" />
              <Txt size={12} weight="700" style={{ color: '#B45309', marginLeft: 3 }}>
                {m.rating?.toFixed?.(1) ?? m.rating}
              </Txt>
              <Txt size={11} style={{ color: '#92400E', marginLeft: 2 }}>
                ({m.reviewCount})
              </Txt>
            </View>

            {m.reputationScore ? (
              <View style={[styles.taskPill, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                <Txt size={11} weight="600" style={{ color: colors.textSecondary }}>
                  Uy tín: {Math.round(m.reputationScore)}
                </Txt>
              </View>
            ) : null}

            {isAvailable ? (
              <View style={[styles.statusPill, { backgroundColor: isDark ? '#0D2D20' : '#ECFDF5' }]}>
                <Txt size={11} weight="600" style={{ color: '#059669' }}>
                  Sẵn sàng
                </Txt>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Field & Skill Badges (Meetup Pill Tags) */}
      {fields.length > 0 && (
        <View style={styles.tagRow}>
          {fields.map((f, i) => (
            <View key={i} style={[styles.tagBadge, { backgroundColor: colors.tagBg, borderColor: colors.tagBorder }]}>
              <Txt size={11} weight="500" style={{ color: colors.textSecondary }}>
                {f}
              </Txt>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: colors.borderSubtle }]} />

      {/* Footer: Price + Working Mode + CTA */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          {m.minHourlyRate ? (
            <Txt size={14} weight="700" style={{ color: viridian }}>
              {formatVnd(m.minHourlyRate)}
              <Txt size={11} weight="400" style={{ color: colors.textTertiary }}>
                {' '}/ giờ
              </Txt>
            </Txt>
          ) : (
            <Txt size={13} weight="600" style={{ color: colors.textSecondary }}>
              Tư vấn miễn phí
            </Txt>
          )}
          {meta ? (
            <Txt size={11} numberOfLines={1} style={{ color: colors.textTertiary, marginTop: 1 }}>
              {meta}
            </Txt>
          ) : null}
        </View>

        {/* Meetup-style Action Button */}
        <View style={[styles.actionBtn, { backgroundColor: viridianSoft }]}>
          <Txt size={12} weight="700" style={{ color: viridian }}>
            Hồ sơ
          </Txt>
          <ChevronRight size={13} color={viridian} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
})

export const MentorCardView = React.memo(MentorCardViewImpl)
