import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { BadgeCheck, Briefcase, ChevronRight, Star, Trophy } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { MotionPressable } from '@/components/Motion'
import type { MentorCard } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/**
 * Thẻ Mentor (Meetup Event Item x Instagram x Kakao 2026):
 * - Tinh giản, loại bỏ thông tin rườm rà (1:1, online/trực tiếp, huy hiệu chữ sẵn sàng)
 * - Avatar viền Story Ring Instagram kèm chấm xanh live trực quan
 * - Tên mentor + Tích xanh xác thực + Nghề nghiệp / Doanh nghiệp
 * - Dải chỉ số Kakao Bento Pills (Rating sao vàng, Điểm uy tín, Chuyên ngành)
 * - Nút hành động "Xem hồ sơ ›" cam thương hiệu với phản hồi chạm mượt mà
 */
function MentorCardViewImpl({ m }: { m: MentorCard }) {
  const { colors, viridian, viridianSoft, isDark, liveGreen } = useMentoringTheme()
  const router = useRouter()
  const fields = m.supportedFields.map((f) => (typeof f === 'string' ? f : f.name)).slice(0, 3)
  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' · ')
  const isAvailable = m.active !== false

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })
  }

  return (
    <MotionPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Mentor ${m.fullName}, ${job || 'Cố vấn chuyên môn'}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.border : '#EAECEF',
        },
      ]}
    >
      {/* 1. Main Profile Row: Avatar with Instagram Story Ring + Info */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: isAvailable ? viridian : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Avatar uri={m.avatarUrl} name={m.fullName} size={52} />
          </View>
          {isAvailable && (
            <View style={[styles.liveDot, { backgroundColor: liveGreen, borderColor: colors.card }]} />
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Txt weight="800" size={16.5} numberOfLines={1} style={{ color: colors.text, flexShrink: 1, letterSpacing: -0.2 }}>
              {m.fullName}
            </Txt>
            <BadgeCheck size={18} color={viridian} weight="fill" />
          </View>

          {job || m.headline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Briefcase size={12} color={colors.textSecondary} />
              <Txt size={12.5} numberOfLines={1} style={{ color: colors.textSecondary, flex: 1 }}>
                {job || m.headline}
              </Txt>
            </View>
          ) : null}

          {/* 3. Kakao Bento Metrics Ribbon */}
          <View style={styles.ratingRow}>
            {/* Rating */}
            <View
              style={[
                styles.ratingPill,
                {
                  backgroundColor: isDark ? '#2E1C10' : '#FFF5EE',
                  borderColor: isDark ? '#4A2C16' : '#FEDCC7',
                },
              ]}
            >
              <Star size={11.5} color={viridian} weight="fill" />
              <Txt size={11.5} weight="800" style={{ color: viridian, marginLeft: 3 }}>
                {m.rating?.toFixed?.(1) ?? m.rating ?? '5.0'}
              </Txt>
              <Txt size={10.5} weight="600" style={{ color: colors.textSecondary, marginLeft: 2 }}>
                ({m.reviewCount ?? 0})
              </Txt>
            </View>

            {/* Điểm uy tín */}
            {m.reputationScore ? (
              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: isDark ? '#262626' : '#F7F8FA',
                    borderColor: isDark ? '#383838' : '#E6E8EB',
                  },
                ]}
              >
                <Trophy size={11} color={viridian} weight="bold" />
                <Txt size={11} weight="700" style={{ color: colors.text, marginLeft: 3 }}>
                  Uy tín {Math.round(m.reputationScore)}
                </Txt>
              </View>
            ) : null}

            {/* Chuyên ngành */}
            {m.majorName ? (
              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: isDark ? '#262626' : '#F7F8FA',
                    borderColor: isDark ? '#383838' : '#E6E8EB',
                  },
                ]}
              >
                <Txt size={11} weight="500" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {m.majorName}
                </Txt>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* 4. Field & Skill Badges (Meetup Pill Tags) */}
      {fields.length > 0 && (
        <View style={styles.tagRow}>
          {fields.map((f, i) => (
            <View
              key={i}
              style={[
                styles.tagBadge,
                {
                  backgroundColor: isDark ? '#222222' : '#F4F5F7',
                  borderColor: isDark ? '#333333' : '#E7E9ED',
                },
              ]}
            >
              <Txt size={11} weight="600" style={{ color: colors.textSecondary }}>
                {f}
              </Txt>
            </View>
          ))}
        </View>
      )}

      {/* Hairline Divider */}
      <View style={[styles.cardDivider, { backgroundColor: isDark ? colors.borderSubtle : '#F0F2F5' }]} />

      {/* 3. Footer: Orange Action Button */}
      <View style={styles.footerRow}>
        <View
          style={[
            styles.actionBtn,
            {
              backgroundColor: viridian,
              shadowColor: viridian,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        >
          <Txt size={12} weight="800" style={{ color: '#FFFFFF' }}>
            Xem hồ sơ
          </Txt>
          <ChevronRight size={13} color="#FFFFFF" weight="bold" />
        </View>
      </View>
    </MotionPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
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
  avatarRing: {
    padding: 2.5,
    borderRadius: 999,
    borderWidth: 2,
  },
  liveDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
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
    gap: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
})

export const MentorCardView = React.memo(MentorCardViewImpl)
