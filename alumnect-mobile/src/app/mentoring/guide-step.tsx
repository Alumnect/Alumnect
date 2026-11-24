import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  ScrollView as RNScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Header } from '@/components/Header'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable, useReducedMotion } from '@/components/Motion'
import { Screen, Txt } from '@/components/ui'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
} from '@/components/icons'
import {
  AnnotatedMobileFrame,
  GuideLightboxModal,
} from '@/components/MentoringGuideVisuals'
import {
  MENTOR_GUIDE_STEPS,
  STUDENT_GUIDE_STEPS,
  type GuideRoleType,
  type MobileGuideStep,
} from '@/constants/mentoringGuideData'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** Theo dõi các bước người dùng đã xem trong phiên để hiển thị dấu tích trên màn Tổng quan */
export const viewedGuideSteps = new Set<string>()

/**
 * Màn hình chi tiết từng Bước Cẩm nang Cố vấn (/mentoring/guide-step):
 * - Mỗi bước 1 màn hình tập trung, gọn gàng, không phải cuộn dài.
 * - Thanh tiến độ 5 phân đoạn kiểu Story/Wizard có thể chạm nhảy trực tiếp.
 * - Chuyển đổi giữa Bước 1 → 5 có hiệu ứng trượt ngang lò xo mượt mà & rung xúc giác.
 */
export default function MentoringGuideStepScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const reduced = useReducedMotion()

  const params = useLocalSearchParams<{ role?: string; step?: string }>()
  const role: GuideRoleType = params.role === 'mentor' ? 'mentor' : 'student'
  const initialStep = Math.min(5, Math.max(1, Number(params.step) || 1))

  const [stepNum, setStepNum] = useState<number>(initialStep)
  const [direction, setDirection] = useState<number>(1)
  const [selectedCalloutId, setSelectedCalloutId] = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false)

  const [slideAnim] = useState(() => new Animated.Value(1))
  const [iconPop] = useState(() => new Animated.Value(1))
  const scrollRef = useRef<React.ComponentRef<typeof RNScrollView>>(null)

  const steps = useMemo(
    () => (role === 'student' ? STUDENT_GUIDE_STEPS : MENTOR_GUIDE_STEPS),
    [role]
  )
  const currentStep: MobileGuideStep = steps[stepNum - 1] ?? steps[0]

  useEffect(() => {
    viewedGuideSteps.add(`${role}-${stepNum}`)
  }, [role, stepNum])

  const triggerStepTransition = (nextStep: number, dir: number) => {
    if (nextStep < 1 || nextStep > steps.length || nextStep === stepNum) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setDirection(dir)
    setSelectedCalloutId(null)
    setStepNum(nextStep)

    // Scroll smoothly back to top for the newly selected step
    scrollRef.current?.scrollTo({ y: 0, animated: false })

    if (!reduced) {
      slideAnim.setValue(0)
      iconPop.setValue(0.8)
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          friction: 7.5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(iconPop, {
          toValue: 1,
          friction: 4.5,
          tension: 185,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [direction * 38, 0],
  })
  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  })

  const isFirst = stepNum === 1
  const isLast = stepNum === steps.length

  return (
    <Screen bg={colors.bg}>
      <Header
        title={`Bước 0${stepNum} / 0${steps.length}`}
        subtitle={role === 'student' ? 'Quy trình Học viên · AlumNect' : 'Quy trình Cố vấn · AlumNect'}
        right={
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              router.push('/mentoring/terms')
            }}
            style={[
              styles.headerTermsBtn,
              { backgroundColor: viridianSoft, borderColor: isDark ? '#4A2C16' : '#FAD9C2' },
            ]}
          >
            <FileText size={13.5} color={viridian} weight="bold" />
            <Txt size={11} weight="800" style={{ color: viridian }}>
              Điều khoản
            </Txt>
          </MotionPressable>
        }
      />

      {/* 5-Segment Interactive Stepper Bar (Story-style) */}
      <View
        style={[
          styles.stepperWrap,
          { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.segmentRow}>
          {steps.map((s) => {
            const active = s.step === stepNum
            const completed = s.step < stepNum
            return (
              <Pressable
                key={s.step}
                onPress={() => triggerStepTransition(s.step, s.step > stepNum ? 1 : -1)}
                hitSlop={6}
                style={{ flex: 1, paddingVertical: 4 }}
              >
                <View
                  style={[
                    styles.segmentBar,
                    {
                      backgroundColor: active
                        ? viridian
                        : completed
                          ? '#15803D'
                          : isDark
                            ? '#2D2D2D'
                            : '#E5E7EB',
                      height: active ? 5.5 : 4,
                    },
                  ]}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 5 }}>
                  {completed ? (
                    <Check size={10} color="#15803D" weight="bold" />
                  ) : null}
                  <Txt
                    size={10.5}
                    weight={active ? '800' : '600'}
                    style={{
                      color: active ? viridian : completed ? '#15803D' : colors.textTertiary,
                    }}
                  >
                    B{s.step}
                  </Txt>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Single Step Focused Body */}
      <RNScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <Animated.View
          style={{
            opacity: slideAnim,
            transform: [{ translateX }, { scale }],
          }}
        >
          {/* Step Title Hero Card */}
          <View
            style={[
              styles.stepHeaderCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Animated.View
                style={[
                  styles.stepIconWrap,
                  {
                    backgroundColor: viridianSoft,
                    borderColor: isDark ? '#54321C' : '#FAD9C2',
                    transform: [{ scale: iconPop }],
                  },
                ]}
              >
                <BrandIcon name={currentStep.brandIcon} size={30} />
              </Animated.View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.stepBadge, { backgroundColor: viridian }]}>
                    <Txt size={10} weight="800" style={{ color: '#FFFFFF', letterSpacing: 0.4 }}>
                      BƯỚC 0{currentStep.step}
                    </Txt>
                  </View>
                  <Txt size={11} weight="700" style={{ color: colors.textTertiary }}>
                    {role === 'student' ? 'Dành cho Học viên' : 'Dành cho Cố vấn'}
                  </Txt>
                </View>
                <Txt size={17} weight="800" style={{ color: colors.text, marginTop: 4, lineHeight: 23 }}>
                  {currentStep.title}
                </Txt>
              </View>
            </View>

            <Txt size={12.5} weight="700" style={{ color: viridian, marginTop: 10 }}>
              {currentStep.subtitle}
            </Txt>
            <Txt size={13} style={{ color: colors.textSecondary, marginTop: 5, lineHeight: 20 }}>
              {currentStep.description}
            </Txt>
          </View>

          {/* Interactive Screenshot with Animated SVG Callouts & Play Tour */}
          <View style={{ marginTop: 14 }}>
            <AnnotatedMobileFrame
              step={currentStep}
              selectedCalloutId={selectedCalloutId}
              onSelectCallout={setSelectedCalloutId}
              onZoom={() => setLightboxOpen(true)}
            />
          </View>

          {/* Interactive Callout Legend (1, 2, 3) */}
          <View style={{ marginTop: 14, gap: 8 }}>
            <Txt size={11.5} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2 }}>
              Các vị trí thao tác chính
            </Txt>
            {currentStep.callouts.map((c) => {
              const isSelected = selectedCalloutId === c.id
              return (
                <MotionPressable
                  key={c.id}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {})
                    setSelectedCalloutId(isSelected ? null : c.id)
                  }}
                  style={[
                    styles.calloutRow,
                    {
                      backgroundColor: isSelected
                        ? viridianSoft
                        : colors.card,
                      borderColor: isSelected ? viridian : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                      transform: [{ translateX: isSelected ? 4 : 0 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.calloutBadge,
                      {
                        backgroundColor: viridian,
                        transform: [{ scale: isSelected ? 1.12 : 1 }],
                      },
                    ]}
                  >
                    <Txt size={11} weight="800" style={{ color: '#FFFFFF' }}>
                      {c.id}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <Txt size={13} weight="800" style={{ color: isSelected ? viridian : colors.text, flex: 1 }}>
                        {c.title}
                      </Txt>
                      {isSelected ? (
                        <Txt size={10} weight="800" style={{ color: viridian }}>
                          ● Đang soi
                        </Txt>
                      ) : null}
                    </View>
                    <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                      {c.description}
                    </Txt>
                  </View>
                </MotionPressable>
              )
            })}
          </View>

          {/* Key Highlights */}
          <View
            style={[
              styles.highlightBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {currentStep.highlights.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                <CheckCircle2 size={14.5} color="#15803D" weight="fill" style={{ marginTop: 2 }} />
                <Txt size={12.5} style={{ color: colors.text, flex: 1, lineHeight: 18.5 }}>
                  {h}
                </Txt>
              </View>
            ))}
          </View>

          {/* Tip / Warning Notes */}
          {currentStep.notes.map((n, idx) => {
            const isWarn = n.type === 'warning'
            return (
              <View
                key={idx}
                style={[
                  styles.noteBox,
                  {
                    backgroundColor: isWarn
                      ? isDark
                        ? '#332510'
                        : '#FEF3E2'
                      : viridianSoft,
                    borderColor: isWarn
                      ? isDark
                        ? '#59401A'
                        : '#F9D8A7'
                      : isDark
                        ? '#4A2C16'
                        : '#FAD9C2',
                  },
                ]}
              >
                {isWarn ? (
                  <AlertTriangle
                    size={16}
                    color={isDark ? '#FBBF24' : '#B45309'}
                    weight="fill"
                    style={{ marginTop: 1 }}
                  />
                ) : (
                  <Info size={16} color={viridian} weight="fill" style={{ marginTop: 1 }} />
                )}
                <Txt
                  size={12.5}
                  weight={isWarn ? '700' : '500'}
                  style={{
                    color: isWarn
                      ? isDark
                        ? '#FDE68A'
                        : '#92400E'
                      : colors.text,
                    flex: 1,
                    lineHeight: 18.5,
                  }}
                >
                  {n.text}
                </Txt>
              </View>
            )
          })}

          {/* Deep-link Action Button to Real Feature */}
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              router.push(currentStep.actionRoute as never)
            }}
            style={[
              styles.actionCta,
              {
                backgroundColor: colors.card,
                borderColor: viridian,
              },
            ]}
          >
            <Txt size={13} weight="800" style={{ color: viridian }}>
              {currentStep.actionLabel}
            </Txt>
            <ChevronRight size={16} color={viridian} weight="bold" />
          </MotionPressable>
        </Animated.View>
      </RNScrollView>

      {/* Sticky Bottom Wizard Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <MotionPressable
          onPress={() => {
            if (isFirst) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              router.back()
            } else {
              triggerStepTransition(stepNum - 1, -1)
            }
          }}
          style={[
            styles.prevBtn,
            {
              backgroundColor: isDark ? '#242424' : '#F3F4F6',
              borderColor: colors.border,
            },
          ]}
        >
          <ChevronLeft size={16} color={colors.text} weight="bold" />
          <Txt size={13} weight="800" style={{ color: colors.text }}>
            {isFirst ? 'Tổng quan' : `Bước ${stepNum - 1}`}
          </Txt>
        </MotionPressable>

        <MotionPressable
          onPress={() => {
            if (isLast) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
              router.back()
            } else {
              triggerStepTransition(stepNum + 1, 1)
            }
          }}
          style={[
            styles.nextBtn,
            { backgroundColor: isLast ? '#15803D' : viridian },
          ]}
        >
          <Txt size={13.5} weight="800" style={{ color: '#FFFFFF' }}>
            {isLast ? 'Hoàn thành cẩm nang' : `Tiếp theo: Bước ${stepNum + 1}`}
          </Txt>
          {isLast ? (
            <Check size={16} color="#FFFFFF" weight="bold" />
          ) : (
            <ChevronRight size={16} color="#FFFFFF" weight="bold" />
          )}
        </MotionPressable>
      </View>

      {/* Full-Screen Zoom Lightbox Modal */}
      <GuideLightboxModal
        step={currentStep}
        visible={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
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
  stepperWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segmentBar: {
    width: '100%',
    borderRadius: 999,
  },
  stepHeaderCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  stepIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 15,
  },
  calloutBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  highlightBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 7,
  },
  noteBox: {
    marginTop: 10,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionCta: {
    marginTop: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#CE4A09',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
})
