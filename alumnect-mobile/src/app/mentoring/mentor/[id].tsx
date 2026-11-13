import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Laptop,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Target,
  UserRound,
} from '@/components/icons'
import { Avatar, Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Enter, MotionPressable } from '@/components/Motion'
import * as Haptics from 'expo-haptics'
import { Header } from '@/components/Header'
import { BottomBar, InfoRow, SectionCard } from '@/components/DetailBits'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/**
 * Hồ sơ Cố vấn: Giao diện kết hợp Meetup x Instagram Profile (Tone Cam - Trắng - Đen)
 * - Instagram-style Story Avatar Ring & Stat Metrics
 * - Meetup Content Cards & Orange/Black Actions
 */
export default function MentorDetailScreen() {
  const { colors, viridian, viridianSoft, liveGreen, isDark } = useMentoringTheme()
  const router = useRouter()
  const meId = useAuthStore((s) => s.user?.id)
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentor', id], queryFn: () => mentoringApi.mentor(id!) })
  const m = q.data

  if (q.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ Cố vấn" />
        <Loading />
      </Screen>
    )
  if (!m)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ Cố vấn" />
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy thông tin mentor." />
      </Screen>
    )

  const job = [m.currentPosition, m.currentCompany].filter(Boolean).join(' tại ')
  const isAvailable = m.canReceiveRequest !== false
  // Giống Web: mọi tài khoản (Sinh viên lẫn Cựu sinh viên) đều gửi được yêu cầu, trừ khi đây là hồ sơ Mentor của chính mình.
  const isSelfMentor = meId != null && String(meId) === String(m.userId)

  return (
    <Screen bg={colors.bg}>
      <Header title="Hồ sơ Cố vấn" subtitle="Thông tin chuyên gia & kinh nghiệm" />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Instagram Profile Header Card */}
        <View style={[styles.profileHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Cover Banner Accent (Warm Orange / Carbon) */}
          <View
            style={[
              styles.coverBanner,
              {
                backgroundColor: isDark ? '#26170D' : viridianSoft,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: isDark ? '#4A2C16' : '#FAD9C2',
              },
            ]}
          />

          <View style={styles.headerContent}>
            {/* Avatar with Story Ring */}
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarRing,
                  {
                    borderColor: isAvailable ? viridian : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Avatar uri={m.avatarUrl} name={m.fullName} size={82} />
              </View>
              {isAvailable && (
                <View style={[styles.liveIndicator, { backgroundColor: liveGreen, borderColor: colors.card }]} />
              )}
            </View>

            {/* Name & Title */}
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Txt size={22} weight="800" style={{ color: colors.text, flexShrink: 1 }}>
                  {m.fullName}
                </Txt>
                {m.isVerifiedAlumni !== false && <BadgeCheck size={22} color={viridian} weight="fill" />}
              </View>

              {job || m.headline ? (
                <Txt size={14} style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                  {job || m.headline}
                </Txt>
              ) : null}

              {/* Status & Location Badges */}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isAvailable ? (isDark ? '#142E1F' : '#EAFBF0') : (isDark ? '#2B1414' : '#FEF2F2'),
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: isAvailable ? liveGreen : '#DC2626' }]} />
                  <Txt size={12} weight="700" style={{ color: isAvailable ? (isDark ? '#4ADE80' : '#15803D') : '#DC2626' }}>
                    {isAvailable ? 'Sẵn sàng hướng dẫn' : 'Tạm ngưng nhận'}
                  </Txt>
                </View>

                {m.city ? (
                  <View style={[styles.cityPill, { backgroundColor: colors.tagBg, borderColor: colors.tagBorder }]}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Txt size={12} weight="600" style={{ color: colors.textSecondary, marginLeft: 3 }}>
                      {m.city}
                    </Txt>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Instagram-style 3-Column Stats Counter */}
            <View style={[styles.statsRow, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
              <View style={styles.statColumn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Star size={15} color={viridian} weight="fill" />
                  <Txt size={17} weight="800" style={{ color: colors.text }}>
                    {m.rating?.toFixed?.(1) ?? '—'}
                  </Txt>
                </View>
                <Txt size={11} weight="600" style={{ color: colors.textTertiary, marginTop: 2 }}>
                  {m.reviewCount} đánh giá
                </Txt>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statColumn}>
                <Txt size={17} weight="800" style={{ color: colors.text }}>
                  {m.completedTasks ?? 0}
                </Txt>
                <Txt size={11} weight="600" style={{ color: colors.textTertiary, marginTop: 2 }}>
                  Buổi đã cố vấn
                </Txt>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statColumn}>
                <Txt size={17} weight="800" style={{ color: viridian }}>
                  {Math.round(m.reputationScore ?? 0)}
                </Txt>
                <Txt size={11} weight="600" style={{ color: colors.textTertiary, marginTop: 2 }}>
                  Điểm uy tín
                </Txt>
              </View>
            </View>

            {!isAvailable && m.availabilityReason ? (
              <Txt size={12} style={{ color: colors.textTertiary, marginTop: 10, textAlign: 'center' }}>
                {m.availabilityReason}
              </Txt>
            ) : null}
          </View>
        </View>

        {/* Meetup Content Cards */}
        {/* 1. Giới thiệu */}
        <SectionCard title="Giới thiệu bản thân" icon={<BrandIcon name="writing" size={24} />}>
          <Txt size={14} style={{ color: colors.text, lineHeight: 22 }}>
            {m.bio || m.biography || 'Mentor chưa cập nhật phần giới thiệu chi tiết.'}
          </Txt>
        </SectionCard>

        {/* 2. Hình thức làm việc */}
        <SectionCard title="Hình thức & Phương thức hướng dẫn" icon={<BrandIcon name="computer" size={24} />}>
          {m.workingMode ? (
            <InfoRow
              icon={<Laptop size={16} color={viridian} />}
              label="Hình thức làm việc"
              value={WORKING_MODE_LABEL[m.workingMode] ?? m.workingMode}
            />
          ) : null}
          {m.mentoringType ? (
            <InfoRow
              icon={<Target size={16} color={viridian} />}
              label="Phương thức hỗ trợ"
              value={MENTORING_TYPE_LABEL[m.mentoringType] ?? m.mentoringType}
              last
            />
          ) : null}
        </SectionCard>

        {/* 3. Lĩnh vực & Chủ đề hỗ trợ */}
        {(m.supportedFields.length > 0 || m.topics.length > 0) && (
          <SectionCard title="Lĩnh vực & Chủ đề cố vấn" icon={<BrandIcon name="star" size={24} />}>
            <View style={styles.tagsContainer}>
              {m.supportedFields.map((f) => (
                <View key={f.id} style={[styles.fieldPill, { backgroundColor: viridianSoft }]}>
                  <CheckCircle2 size={12} color={viridian} weight="fill" />
                  <Txt size={12} weight="700" style={{ color: viridian, marginLeft: 4 }}>
                    {f.name}
                  </Txt>
                </View>
              ))}
            </View>
            {m.topics.length > 0 && (
              <View style={[styles.tagsContainer, { marginTop: 10 }]}>
                {m.topics.map((tp, idx) => (
                  <View key={idx} style={[styles.topicPill, { backgroundColor: colors.tagBg, borderColor: colors.tagBorder }]}>
                    <Txt size={12} weight="600" style={{ color: colors.textSecondary }}>
                      #{tp}
                    </Txt>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        )}

        {/* 4. Kỹ năng chuyên môn */}
        {m.skills.length > 0 && (
          <SectionCard title="Kỹ năng chuyên môn" icon={<BrandIcon name="sparkle" size={24} />}>
            <View style={styles.tagsContainer}>
              {m.skills.map((s) => (
                <View key={s.id} style={[styles.skillPill, { backgroundColor: colors.tagBg, borderColor: colors.tagBorder }]}>
                  <Txt size={12} weight="600" style={{ color: colors.text }}>
                    {s.skillName}
                  </Txt>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* 5. Kinh nghiệm làm việc */}
        {m.experiences.length > 0 && (
          <SectionCard title="Kinh nghiệm sự nghiệp" icon={<BrandIcon name="suitcase" size={24} />}>
            {m.experiences.map((e, i) => (
              <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      marginTop: 4,
                      backgroundColor: e.isCurrent ? viridian : colors.border,
                    }}
                  />
                  {i < m.experiences.length - 1 ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: colors.borderSubtle, marginVertical: 3 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < m.experiences.length - 1 ? 16 : 0 }}>
                  <Txt weight="800" size={14} style={{ color: colors.text }}>
                    {e.title}
                  </Txt>
                  <Txt size={13} weight="600" style={{ color: colors.textSecondary, marginTop: 1 }}>
                    {e.company}
                  </Txt>
                  <Txt size={12} style={{ color: colors.textTertiary, marginTop: 2 }}>
                    {`${e.startDate ?? ''} — ${e.isCurrent ? 'Hiện tại' : e.endDate ?? ''}`}
                  </Txt>
                </View>
              </View>
            ))}
          </SectionCard>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <BottomBar>
        {isSelfMentor ? (
          <Button
            title="Quản lý hồ sơ Mentor"
            variant="secondary"
            icon={<BrandIcon name="suitcase" size={20} />}
            onPress={() => router.push('/mentoring/status')}
            style={{ flex: 1 }}
          />
        ) : (
          <>
            <Button
              title="Nhắn tin"
              variant="secondary"
              icon={<MessageCircle size={18} color={viridian} weight="fill" />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push({ pathname: '/chat/direct/[userId]', params: { userId: String(m.userId) } })
              }}
              style={{ flex: 1 }}
            />
            <Button
              title="Gửi yêu cầu Cố vấn"
              textColor="#FFFFFF"
              icon={<Send size={16} color="#FFFFFF" weight="fill" />}
              disabled={!isAvailable}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                router.push({
                  pathname: '/mentoring/mentor/request',
                  params: { id: String(m.mentorId), name: m.fullName },
                })
              }}
              style={{
                flex: 1.8,
                paddingHorizontal: 10,
                backgroundColor: isAvailable ? viridian : colors.border,
                borderColor: isAvailable ? viridian : colors.border,
              }}
            />
          </>
        )}
      </BottomBar>
    </Screen>
  )
}

const styles = StyleSheet.create({
  profileHeaderCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverBanner: {
    height: 76,
    width: '100%',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: -44,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  topicPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  skillPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
