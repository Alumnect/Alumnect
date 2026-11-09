import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BadgeCheck, ChevronRight, Globe, MapPin, Star } from '@/components/icons'
import { Avatar, Txt } from './ui'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import type { MentorCard } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/**
 * Thẻ Mentor (Meetup Event Item x Instagram x Kakao 2026):
 * - Dòng Eyebrow trên cùng kiểu Meetup (HÌNH THỨC · LOẠI HỖ TRỢ) màu Cam thương hiệu
 * - Khối Avatar có viền tròn + chấm trạng thái trực tuyến + tích xác thực Cam
 * - Dải chỉ số (Rating, Điểm uy tín, Nhiệm vụ hoàn thành) kiểu Kakao crisp pills
 * - Danh sách lĩnh vực / kỹ năng và chân thẻ Đen - Cam tương phản cao
 */
function MentorCardViewImpl({ m }: { m: MentorCard }) {
  const { colors, viridian, viridianSoft, isDark, liveGreen } = useMentoringTheme()
  const router = useRouter()
  const fields = m.supportedFields.map((f) => (typeof f === 'string' ? f : f.name)).slice(0, 3)
  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' · ')
  const eyebrow = [WORKING_MODE_LABEL[m.workingMode], MENTORING_TYPE_LABEL[m.mentoringType]]
    .filter(Boolean)
    .join('  ·  ')
    .toUpperCase()
  const isAvailable = m.active !== false

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorId) } })}
      accessibilityRole="button"
      accessibilityLabel={`Mentor ${m.fullName}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? (isDark ? '#222222' : '#FAFAFB') : colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {/* Meetup Eyebrow Row: Working Mode + Mentoring Type + Status */}
      <View style={styles.eyebrowRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
          {m.workingMode === 'ONLINE' ? (
            <Globe size={12} color={viridian} weight="bold" />
          ) : (
            <MapPin size={12} color={viridian} weight="bold" />
          )}
          <Txt size={11} weight="700" numberOfLines={1} style={{ color: viridian, letterSpacing: 0.4, flex: 1 }}>
            {eyebrow || 'CỐ VẤN CHUYÊN MÔN 1:1'}
          </Txt>
        </View>
        {isAvailable ? (
          <View style={[styles.liveBadge, { backgroundColor: isDark ? '#142E1F' : '#EAFBF0' }]}>
            <View style={[styles.livePulse, { backgroundColor: liveGreen }]} />
            <Txt size={10} weight="700" style={{ color: isDark ? '#4ADE80' : '#15803D' }}>
              Sẵn sàng
            </Txt>
          </View>
        ) : null}
      </View>

      {/* Main Profile Row: Avatar + Name + Job + Metrics */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarRing, { borderColor: isAvailable ? viridian : colors.border }]}>
            <Avatar uri={m.avatarUrl} name={m.fullName} size={54} />
          </View>
          {isAvailable && (
            <View style={[styles.liveDot, { backgroundColor: liveGreen, borderColor: colors.card }]} />
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Txt weight="800" size={16} numberOfLines={1} style={{ color: colors.text, flexShrink: 1 }}>
              {m.fullName}
            </Txt>
            <BadgeCheck size={17} color={viridian} weight="fill" />
          </View>

          {job || m.headline ? (
            <Txt size={13} numberOfLines={1} style={{ color: colors.textSecondary, marginTop: 2 }}>
              {job || m.headline}
            </Txt>
          ) : null}

          {/* Rating & Reputation Ribbon (Kakao / Meetup Metrics) */}
          <View style={styles.ratingRow}>
            <View
              style={[
                styles.ratingPill,
                {
                  backgroundColor: isDark ? '#2E1C10' : viridianSoft,
                  borderColor: isDark ? '#4A2C16' : '#FAD9C2',
                },
              ]}
            >
              <Star size={12} color={viridian} weight="fill" />
              <Txt size={12} weight="700" style={{ color: viridian, marginLeft: 3 }}>
                {m.rating?.toFixed?.(1) ?? m.rating ?? '5.0'}
              </Txt>
              <Txt size={11} style={{ color: colors.textSecondary, marginLeft: 2 }}>
                ({m.reviewCount ?? 0})
              </Txt>
            </View>

            {m.reputationScore ? (
              <View style={[styles.metricPill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Txt size={11} weight="600" style={{ color: colors.text }}>
                  Uy tín {Math.round(m.reputationScore)}
                </Txt>
              </View>
            ) : null}

            {m.majorName ? (
              <View style={[styles.metricPill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Txt size={11} weight="500" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {m.majorName}
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
              <Txt size={11} weight="600" style={{ color: colors.textSecondary }}>
                {f}
              </Txt>
            </View>
          ))}
        </View>
      )}

      {/* Hairline Divider */}
      <View style={[styles.cardDivider, { backgroundColor: colors.borderSubtle }]} />

      {/* Footer: Price + High-Contrast Black/Orange Action Button */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          <Txt size={10} weight="600" style={{ color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Mức phí tham khảo
          </Txt>
          {m.minHourlyRate ? (
            <Txt size={15} weight="800" style={{ color: viridian, marginTop: 1 }}>
              {formatVnd(m.minHourlyRate)}
              <Txt size={11} weight="500" style={{ color: colors.textTertiary }}>
                {' '}/ giờ
              </Txt>
            </Txt>
          ) : (
            <Txt size={14} weight="700" style={{ color: colors.text, marginTop: 1 }}>
              Trao đổi linh hoạt
            </Txt>
          )}
        </View>

        {/* High-contrast Black / White 2026 Action Pill with Orange Accent */}
        <View style={[styles.actionBtn, { backgroundColor: colors.actionBg }]}>
          <Txt size={12} weight="700" style={{ color: colors.actionText }}>
            Xem hồ sơ
          </Txt>
          <ChevronRight size={13} color={colors.actionText} weight="bold" />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.5,
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
    marginTop: 7,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
})

export const MentorCardView = React.memo(MentorCardViewImpl)
