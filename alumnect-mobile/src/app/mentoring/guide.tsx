import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Animated,
  Image,
  Pressable,
  ScrollView as RNScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Header } from '@/components/Header'
import { BrandIcon } from '@/components/BrandIcon'
import { Enter, MotionPressable, useReducedMotion } from '@/components/Motion'
import { Screen, Txt } from '@/components/ui'
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Play,
  Sparkles,
} from '@/components/icons'
import {
  GoldenRulesInfographic,
  GuideRoleSwitcher,
  MentoringHeroArtwork,
  SmoothReveal,
} from '@/components/MentoringGuideVisuals'
import {
  MENTOR_GUIDE_STEPS,
  MENTORING_GUIDE_FAQS,
  MENTORING_GOLDEN_RULES,
  STUDENT_GUIDE_STEPS,
  type GuideRoleType,
  type MobileGuideStep,
} from '@/constants/mentoringGuideData'
import { viewedGuideSteps } from '@/app/mentoring/guide-step'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** Thẻ bước gọn gàng có hiệu ứng đổ tầng lò xo khi đổi vai trò + ảnh thumbnail xem trước */
function CompactStepRow({
  item,
  index,
  isLast,
  visited,
  roleDirection,
  onPress,
}: {
  item: MobileGuideStep
  index: number
  isLast: boolean
  visited: boolean
  roleDirection: number
  onPress: () => void
}) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const reduced = useReducedMotion()
  const [anim] = useState(() => new Animated.Value(reduced ? 1 : 0))

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }).start()
    }, index * 55)
    return () => clearTimeout(timer)
  }, [anim, index, reduced])

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [roleDirection * 24, 0],
  })
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  })

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        opacity: anim,
        transform: [{ translateX }, { translateY }],
      }}
    >
      {/* Left Vertical Stepper Timeline */}
      <View style={styles.timelineCol}>
        <View
          style={[
            styles.timelineNode,
            {
              backgroundColor: visited ? '#15803D' : viridian,
              borderColor: visited
                ? isDark
                  ? '#1E4D31'
                  : '#BCE6CC'
                : isDark
                  ? '#54321C'
                  : '#FAD9C2',
            },
          ]}
        >
          {visited ? (
            <Check size={12} color="#FFFFFF" weight="bold" />
          ) : (
            <Txt size={11} weight="800" style={{ color: '#FFFFFF' }}>
              {item.step}
            </Txt>
          )}
        </View>
        {!isLast ? (
          <View
            style={[
              styles.timelineStem,
              {
                backgroundColor: visited
                  ? '#15803D'
                  : isDark
                    ? '#35251A'
                    : '#F2C9AF',
              },
            ]}
          />
        ) : null}
      </View>

      {/* Right Interactive Step Card */}
      <MotionPressable
        onPress={onPress}
        style={[
          styles.stepRowCard,
          {
            backgroundColor: colors.card,
            borderColor: visited ? (isDark ? '#1E4D31' : '#BCE6CC') : colors.border,
            marginBottom: isLast ? 0 : 10,
          },
        ]}
      >
        {/* Mini Real Screenshot Thumbnail */}
        <View style={[styles.thumbWrap, { borderColor: colors.border }]}>
          <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={[styles.thumbBadge, { backgroundColor: viridian }]}>
            <Txt size={9} weight="800" style={{ color: '#FFFFFF' }}>
              3 điểm
            </Txt>
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.stepMiniPill, { backgroundColor: visited ? (isDark ? '#122E1E' : '#E8F6EE') : viridianSoft }]}>
              <Txt size={10} weight="800" style={{ color: visited ? '#15803D' : viridian }}>
                {visited ? `BƯỚC 0${item.step} · ĐÃ XEM` : `BƯỚC 0${item.step}`}
              </Txt>
            </View>
          </View>
          <Txt size={14} weight="800" numberOfLines={2} style={{ color: colors.text, marginTop: 4, lineHeight: 19.5 }}>
            {item.title}
          </Txt>
          <Txt size={11.5} numberOfLines={2} style={{ color: colors.textSecondary, marginTop: 3, lineHeight: 16.5 }}>
            {item.subtitle}
          </Txt>
        </View>

        <View style={[styles.rowArrowCircle, { backgroundColor: viridianSoft }]}>
          <ChevronRight size={15} color={viridian} weight="bold" />
        </View>
      </MotionPressable>
    </Animated.View>
  )
}

/**
 * Màn hình Tổng quan Cẩm nang Hướng dẫn Cố vấn (/mentoring/guide):
 * Gọn gàng, tinh tế — hiển thị lộ trình 5 bước dạng danh sách có thumbnail,
 * chạm vào từng bước sẽ mở màn hình chi tiết riêng (/mentoring/guide-step) kèm ảnh vector tương tác.
 */
export default function MentoringGuideScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const userRole = useAuthStore((s) => s.user?.role)

  const [activeRole, setActiveRole] = useState<GuideRoleType>(
    userRole === 'ALUMNI' ? 'mentor' : 'student'
  )
  const [roleDirection, setRoleDirection] = useState<number>(1)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [, setRefreshTick] = useState(0)

  // Refresh "Đã xem" checkmarks whenever returning from a step detail screen
  useFocusEffect(
    useCallback(() => {
      setRefreshTick((t) => t + 1)
    }, [])
  )

  const steps = useMemo(
    () => (activeRole === 'student' ? STUDENT_GUIDE_STEPS : MENTOR_GUIDE_STEPS),
    [activeRole]
  )

  const visitedCount = steps.filter((s) => viewedGuideSteps.has(`${activeRole}-${s.step}`)).length

  const handleRoleChange = (nextRole: GuideRoleType) => {
    if (nextRole === activeRole) return
    setRoleDirection(nextRole === 'mentor' ? 1 : -1)
    setActiveRole(nextRole)
  }

  const openStep = (stepNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    router.push({
      pathname: '/mentoring/guide-step',
      params: { role: activeRole, step: String(stepNumber) },
    } as never)
  }

  const toggleFaq = (idx: number) => {
    Haptics.selectionAsync().catch(() => {})
    setExpandedFaq((prev) => (prev === idx ? null : idx))
  }

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Cẩm nang Cố vấn"
        subtitle="Lộ trình 5 bước trực quan · AlumNect"
        right={
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              router.push('/mentoring/terms')
            }}
            accessibilityRole="button"
            accessibilityLabel="Xem 10 điều khoản"
            style={[
              styles.headerTermsBtn,
              { backgroundColor: viridianSoft, borderColor: isDark ? '#4A2C16' : '#FAD9C2' },
            ]}
          >
            <FileText size={14} color={viridian} weight="bold" />
            <Txt size={11.5} weight="800" style={{ color: viridian }}>
              Điều khoản
            </Txt>
          </MotionPressable>
        }
      />

      <RNScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(36, insets.bottom + 24) }}
      >
        {/* 1. HERO VECTOR BANNER */}
        <Enter>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.heroBg,
                borderColor: colors.heroBorder,
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View
                style={[
                  styles.heroPill,
                  {
                    backgroundColor: isDark ? 'rgba(251,138,60,0.16)' : '#FFFFFF',
                    borderColor: isDark ? '#54321C' : '#FAD9C2',
                  },
                ]}
              >
                <Sparkles size={12} color={viridian} weight="fill" />
                <Txt size={10.5} weight="800" style={{ color: viridian, letterSpacing: 0.3 }}>
                  CẨM NANG THỰC CHIẾN
                </Txt>
              </View>

              <Txt size={20} weight="800" style={{ color: colors.text, marginTop: 10, lineHeight: 27 }}>
                Hướng dẫn Quy trình Cố vấn
              </Txt>
              <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 19 }}>
                Chọn từng bước để xem ảnh chụp giao diện thực tế kèm mũi tên chỉ dẫn tương tác & mẹo hữu ích.
              </Txt>
            </View>
            <MentoringHeroArtwork variant="guide" />
          </View>
        </Enter>

        {/* 2. ANIMATED ROLE SWITCHER */}
        <Enter delay={45}>
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <GuideRoleSwitcher role={activeRole} onChange={handleRoleChange} />
          </View>
        </Enter>

        {/* 3. QUICK START BUTTON + PROGRESS SUMMARY */}
        <Enter delay={80}>
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <MotionPressable
              onPress={() => openStep(visitedCount >= 5 ? 1 : Math.min(5, visitedCount + 1))}
              style={[styles.startTourBtn, { backgroundColor: viridian }]}
            >
              <View style={styles.startTourIcon}>
                <Play size={14} color={viridian} weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="800" style={{ color: '#FFFFFF' }}>
                  {visitedCount === 0
                    ? `Bắt đầu xem 5 bước ${activeRole === 'student' ? 'Học viên' : 'Cố vấn'}`
                    : visitedCount >= 5
                      ? 'Xem lại hành trình từ Bước 01'
                      : `Tiếp tục từ Bước 0${visitedCount + 1} (${visitedCount}/5 đã xem)`}
                </Txt>
                <Txt size={11.5} style={{ color: 'rgba(255,255,255,0.88)', marginTop: 1 }}>
                  Trải nghiệm từng bước riêng biệt, gọn mắt & trực quan
                </Txt>
              </View>
              <ChevronRight size={18} color="#FFFFFF" weight="bold" />
            </MotionPressable>
          </View>
        </Enter>

        {/* 4. COMPACT 5-STEP INTERACTIVE TIMELINE LIST */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={15.5} weight="800" style={{ color: colors.text }}>
                {activeRole === 'student'
                  ? 'Lộ trình 5 bước Học viên'
                  : 'Lộ trình 5 bước Cố vấn'}
              </Txt>
              <Txt size={11.5} style={{ color: colors.textTertiary, marginTop: 1 }}>
                Chạm vào bất kỳ bước nào để mở màn hình hướng dẫn chi tiết
              </Txt>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: visitedCount === 5 ? '#E8F6EE' : viridianSoft, flexShrink: 0 }]}>
              <Txt size={11} weight="800" style={{ color: visitedCount === 5 ? '#15803D' : viridian }}>
                {visitedCount}/5
              </Txt>
            </View>
          </View>

          <View>
            {steps.map((item, idx) => (
              <CompactStepRow
                key={`${activeRole}-${item.step}`}
                item={item}
                index={idx}
                isLast={idx === steps.length - 1}
                visited={viewedGuideSteps.has(`${activeRole}-${item.step}`)}
                roleDirection={roleDirection}
                onPress={() => openStep(item.step)}
              />
            ))}
          </View>
        </View>

        {/* 5. GOLDEN RULES INFOGRAPHIC GRID */}
        <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BrandIcon name="alarm_clock" size={26} />
            <View style={{ flex: 1 }}>
              <Txt size={15.5} weight="800" style={{ color: colors.text }}>
                Những con số vàng cần ghi nhớ
              </Txt>
              <Txt size={11.5} style={{ color: colors.textTertiary }}>
                Tóm tắt quy chế bảo vệ quyền lợi Học viên & Cố vấn
              </Txt>
            </View>
          </View>
          <GoldenRulesInfographic rules={MENTORING_GOLDEN_RULES} />
        </View>

        {/* 6. FAQ ACCORDION */}
        <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
          <View
            style={[
              styles.faqCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={[styles.faqHeaderIcon, { backgroundColor: viridianSoft }]}>
                <HelpCircle size={18} color={viridian} weight="bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={15.5} weight="800" style={{ color: colors.text }}>
                  Các câu hỏi thường gặp
                </Txt>
                <Txt size={11.5} style={{ color: colors.textTertiary }}>
                  Giải đáp nhanh về Ký quỹ, 72 giờ, Phí giao dịch & Khiếu nại
                </Txt>
              </View>
            </View>

            {MENTORING_GUIDE_FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              const isLast = idx === MENTORING_GUIDE_FAQS.length - 1
              return (
                <View
                  key={idx}
                  style={[
                    styles.faqItem,
                    {
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Pressable onPress={() => toggleFaq(idx)} style={styles.faqTrigger}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <View style={[styles.faqTag, { backgroundColor: viridianSoft }]}>
                        <Txt size={10} weight="800" style={{ color: viridian }}>
                          {faq.tag}
                        </Txt>
                      </View>
                      <Txt size={13.5} weight="700" style={{ color: colors.text, marginTop: 5, lineHeight: 19 }}>
                        {faq.q}
                      </Txt>
                    </View>
                    <View
                      style={{
                        transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
                        marginTop: 14,
                      }}
                    >
                      <ChevronDown
                        size={17}
                        color={isOpen ? viridian : colors.textTertiary}
                        weight="bold"
                      />
                    </View>
                  </Pressable>
                  {isOpen ? (
                    <SmoothReveal>
                      <Txt
                        size={12.5}
                        style={{
                          color: colors.textSecondary,
                          marginTop: 8,
                          lineHeight: 20,
                        }}
                      >
                        {faq.a}
                      </Txt>
                    </SmoothReveal>
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>

        {/* 7. FOOTER LEGAL TERMS LINK BANNER */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              router.push('/mentoring/terms')
            }}
            style={[
              styles.footerTermsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.footerIconWrap, { backgroundColor: viridianSoft }]}>
              <BrandIcon name="writing" size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="800" style={{ color: colors.text }}>
                Xem đầy đủ 10 Điều khoản dịch vụ
              </Txt>
              <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 17 }}>
                Quy chế pháp lý, chính sách ký quỹ & giải quyết tranh chấp.
              </Txt>
            </View>
            <ChevronRight size={18} color={viridian} weight="bold" />
          </MotionPressable>
        </View>
      </RNScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerTermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  startTourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#CE4A09',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startTourIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timelineCol: {
    width: 30,
    alignItems: 'center',
    marginRight: 8,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    zIndex: 2,
  },
  timelineStem: {
    flex: 1,
    width: 2.5,
    borderRadius: 2,
    marginTop: -2,
    marginBottom: -20,
  },
  stepRowCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 18,
    borderWidth: 1,
  },
  thumbWrap: {
    width: 58,
    height: 78,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#F5F6F7',
    position: 'relative',
  },
  thumbBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    right: 3,
    paddingVertical: 1.5,
    borderRadius: 5,
    alignItems: 'center',
  },
  stepMiniPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  faqHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqItem: {
    paddingVertical: 12,
  },
  faqTrigger: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footerTermsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
