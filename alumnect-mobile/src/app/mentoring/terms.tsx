import React, { useEffect, useState } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BrandIcon } from '@/components/BrandIcon'
import { Enter, MotionPressable } from '@/components/Motion'
import { GoldenRulesInfographic, MentoringHeroArtwork, SmoothReveal } from '@/components/MentoringGuideVisuals'
import { mentoringApi } from '@/api/mentoring'
import { MENTORING_TERMS_SECTIONS } from '@/constants/mentoringTerms'
import { MENTORING_CORE_PRINCIPLES, MENTORING_GOLDEN_RULES } from '@/constants/mentoringGuideData'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
} from '@/components/icons'

type TermsViewMode = 'visual' | 'legal'

const COMMITMENTS = [
  'Tôi cam kết trung thực, giữ liêm chính học thuật và không giao dịch ngoài hệ thống.',
  'Tôi hiểu cơ chế Ký quỹ PayOS, quy tắc 72 giờ tự động duyệt Work Log và thuế NĐ 117/2025.',
  'Tôi đồng ý chính sách báo hủy 12h, thời hiệu khiếu nại 07 ngày và toàn bộ 10 điều khoản.',
]

/**
 * UC80 / UC90: Điều khoản & Cẩm nang Hướng dẫn Cố vấn trực quan — đồng bộ 100% nội dung Web
 * (3 nguyên tắc cốt lõi + 10 mục quy chế + NĐ 117/2025/NĐ-CP) với đồ họa vector & trải nghiệm Mobile tối ưu.
 */
export default function MentoringTermsScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()

  const [mode, setMode] = useState<TermsViewMode>('legal')
  const [modeTrackW, setModeTrackW] = useState(0)
  const [modeSlide] = useState(() => new Animated.Value(0))
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({
    1: true,
    5: true,
    6: true,
  })
  const [checked, setChecked] = useState<boolean[]>([false, false, false])

  useEffect(() => {
    Animated.spring(modeSlide, {
      toValue: mode === 'legal' ? 0 : 1,
      friction: 6.5,
      tension: 140,
      useNativeDriver: true,
    }).start()
  }, [mode, modeSlide])

  const status = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const accept = useMutation({
    mutationFn: mentoringApi.acceptTerms,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { })
      toast.success('Bạn đã đồng ý Điều khoản Hướng dẫn & Hỗ trợ.')
      qc.invalidateQueries({ queryKey: ['mentoring-terms'] })
      qc.invalidateQueries({ queryKey: ['mentoring-status'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const allChecked = checked.every(Boolean)
  const allExpanded = MENTORING_TERMS_SECTIONS.every((s) => openIds[s.id])

  const toggleSection = (id: number) => {
    Haptics.selectionAsync().catch(() => { })
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleExpandAll = () => {
    Haptics.selectionAsync().catch(() => { })
    const nextVal = !allExpanded
    const map: Record<number, boolean> = {}
    MENTORING_TERMS_SECTIONS.forEach((s) => {
      map[s.id] = nextVal
    })
    setOpenIds(map)
  }

  const toggleCommit = (index: number) => {
    Haptics.selectionAsync().catch(() => { })
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

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
        <Empty
          text="Không tải được trạng thái điều khoản."
          error={status.error}
          onRetry={() => {
            void status.refetch()
          }}
        />
      </Screen>
    )

  const toneBg = {
    brand: viridianSoft,
    success: isDark ? '#122E1E' : '#E8F6EE',
    info: isDark ? '#142642' : '#EAF1FE',
  }

  return (
    <Screen bg={colors.bg}>
      <Header
        title="Điều khoản Cố vấn"
        subtitle="Quy chuẩn minh bạch giữa Học viên & Mentor"
        right={
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { })
              router.push('/mentoring/guide')
            }}
            style={[
              styles.headerGuideBtn,
              { backgroundColor: viridianSoft, borderColor: isDark ? '#4A2C16' : '#FAD9C2' },
            ]}
          >
            <Sparkles size={13} color={viridian} weight="fill" />
            <Txt size={11.5} weight="800" style={{ color: viridian }}>
              Cẩm nang
            </Txt>
          </MotionPressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 1. HERO BANNER WITH VECTOR SHIELD */}
        <Enter>
          <View
            style={[
              styles.heroBanner,
              { backgroundColor: colors.heroBg, borderColor: colors.heroBorder },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.5 }}>
                KHÔNG GIAN CỐ VẤN ALUMNECT
              </Txt>
              <Txt size={19} weight="800" style={{ color: colors.text, marginTop: 4, lineHeight: 25 }}>
                Quy chế & Điều khoản Hướng dẫn
              </Txt>
              <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 18.5 }}>
                Bảo vệ môi trường kết nối chuyên nghiệp, ký quỹ minh bạch và quyền lợi công bằng cho cộng đồng ĐH FPT.
              </Txt>
              {status.data?.currentVersion ? (
                <View style={[styles.verPill, { backgroundColor: isDark ? '#2B2B2B' : '#FFFFFF' }]}>
                  <Txt size={10.5} weight="800" style={{ color: viridian }}>
                    Phiên bản {status.data.currentVersion} · NĐ 117/2025/NĐ-CP
                  </Txt>
                </View>
              ) : null}
            </View>
            <MentoringHeroArtwork variant="terms" />
          </View>
        </Enter>

        {/* 2. QUICK VISUAL GUIDE BANNER LINK */}
        <Enter delay={40}>
          <MotionPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { })
              router.push('/mentoring/guide')
            }}
            style={[
              styles.guideShortcutCard,
              { backgroundColor: colors.card, borderColor: viridian },
            ]}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: viridianSoft }]}>
              <BrandIcon name="binoculars" size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={13.5} weight="800" style={{ color: colors.text }}>
                Xem Cẩm nang 5 bước kèm ảnh chụp thực tế
              </Txt>
              <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
                Hướng dẫn từng thao tác cho Học viên & Cố vấn có chỉ dẫn trực quan
              </Txt>
            </View>
            <ChevronRight size={18} color={viridian} weight="bold" />
          </MotionPressable>
        </Enter>

        {/* 3. 3 CORE PRINCIPLES (Bento Cards — Đồng bộ Web) */}
        <Enter delay={80}>
          <Txt
            size={11.5}
            weight="800"
            style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 10 }}
          >
            3 Nguyên tắc nền tảng
          </Txt>
          <View style={{ gap: 10 }}>
            {MENTORING_CORE_PRINCIPLES.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.principleCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.principleIcon, { backgroundColor: toneBg[p.tone] }]}>
                  <BrandIcon name={p.brandIcon} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="800" style={{ color: colors.text }}>
                    {p.title}
                  </Txt>
                  <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                    {p.desc}
                  </Txt>
                </View>
              </View>
            ))}
          </View>
        </Enter>

        {/* 4. DUAL-MODE VIEW SWITCHER (Spring Sliding Thumb) */}
        <View
          onLayout={(e) => setModeTrackW(e.nativeEvent.layout.width)}
          style={[
            styles.modeTrack,
            { backgroundColor: isDark ? '#1D1D1D' : '#EDEFF2', borderColor: colors.border, position: 'relative' },
          ]}
        >
          {modeTrackW > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: 4,
                width: (modeTrackW - 8) / 2,
                borderRadius: 10,
                backgroundColor: viridian,
                transform: [
                  {
                    translateX: modeSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (modeTrackW - 8) / 2],
                    }),
                  },
                ],
              }}
            />
          ) : null}
          <MotionPressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => { })
              setMode('legal')
            }}
            style={styles.modeBtn}
          >
            <FileText size={14} color={mode === 'legal' ? '#FFFFFF' : colors.textSecondary} weight="bold" />
            <Txt size={12.5} weight="800" style={{ color: mode === 'legal' ? '#FFFFFF' : colors.textSecondary }}>
              10 Điều khoản đầy đủ
            </Txt>
          </MotionPressable>

          <MotionPressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => { })
              setMode('visual')
            }}
            style={styles.modeBtn}
          >
            <Sparkles size={14} color={mode === 'visual' ? '#FFFFFF' : colors.textSecondary} weight="fill" />
            <Txt size={12.5} weight="800" style={{ color: mode === 'visual' ? '#FFFFFF' : colors.textSecondary }}>
              Tóm tắt trực quan
            </Txt>
          </MotionPressable>
        </View>

        {/* 5. CONTENT BODY BY MODE */}
        {mode === 'visual' ? (
          <SmoothReveal>
            <View style={{ marginTop: 14 }}>
              <GoldenRulesInfographic rules={MENTORING_GOLDEN_RULES} />
            </View>
          </SmoothReveal>
        ) : (
          <SmoothReveal>
            <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Txt size={12} weight="700" style={{ color: colors.textTertiary }}>
                Văn bản Quy chế chính thức (10 mục)
              </Txt>
              <Pressable onPress={toggleExpandAll} hitSlop={8}>
                <Txt size={12} weight="800" style={{ color: viridian }}>
                  {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
                </Txt>
              </Pressable>
            </View>

            {MENTORING_TERMS_SECTIONS.map((s, idx) => {
              const isOpen = !!openIds[s.id]
              const isHighlight = s.id === 5 || s.id === 6 || s.id === 7
              return (
                <View
                  key={s.id}
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isOpen && isHighlight ? viridian : colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => toggleSection(s.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View
                      style={[
                        styles.numBadge,
                        { backgroundColor: isOpen ? viridian : viridianSoft },
                      ]}
                    >
                      <Txt
                        size={11}
                        weight="800"
                        style={{ color: isOpen ? '#FFFFFF' : viridian }}
                      >
                        {idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`}
                      </Txt>
                    </View>
                    <Txt weight="800" size={14} style={{ color: colors.text, flex: 1, lineHeight: 20 }}>
                      {s.title.replace(/^\d+\.\s*/, '')}
                    </Txt>
                    <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={16} color={isOpen ? viridian : colors.textTertiary} weight="bold" />
                    </View>
                  </Pressable>

                  {isOpen ? (
                    <SmoothReveal>
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle }}>
                        {s.content.map((p, i) => (
                          <Txt
                            key={i}
                            size={13}
                            style={{ color: colors.textSecondary, marginTop: i === 0 ? 0 : 7, lineHeight: 20.5 }}
                          >
                            {p.startsWith('•') ? p : `• ${p}`}
                          </Txt>
                        ))}
                      </View>
                    </SmoothReveal>
                  ) : null}
                </View>
              )
            })}
            </View>
          </SmoothReveal>
        )}

        {/* 6. ACCEPTANCE / CONSENT SECTION */}
        <View style={{ marginTop: 18 }}>
          {status.data?.accepted ? (
            <View
              style={[
                styles.acceptedBanner,
                {
                  backgroundColor: isDark ? '#122E1E' : '#E8F6EE',
                  borderColor: isDark ? '#1E4D31' : '#BCE6CC',
                },
              ]}
            >
              <CheckCircle2 size={22} color={isDark ? '#4ADE80' : '#15803D'} weight="fill" />
              <View style={{ flex: 1 }}>
                <Txt style={{ color: isDark ? '#4ADE80' : '#15803D' }} weight="800" size={13.5}>
                  Bạn đã đồng ý Điều khoản Hướng dẫn & Hỗ trợ
                </Txt>
                <Txt style={{ color: colors.textSecondary, marginTop: 2 }} size={12}>
                  Phiên bản hiện hành {status.data.currentVersion}. Bạn có thể tiếp tục sử dụng đầy đủ tính năng Cố vấn.
                </Txt>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.consentBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Txt size={14} weight="800" style={{ color: colors.text }}>
                  Xác nhận cam kết tham gia
                </Txt>
                {!allChecked ? (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => { })
                      setChecked([true, true, true])
                    }}
                    hitSlop={8}
                  >
                    <Txt size={12} weight="800" style={{ color: viridian }}>
                      Chọn tất cả
                    </Txt>
                  </Pressable>
                ) : null}
              </View>

              <View style={{ gap: 9, marginBottom: 16 }}>
                {COMMITMENTS.map((text, idx) => {
                  const active = checked[idx]
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => toggleCommit(idx)}
                      style={[
                        styles.commitRow,
                        {
                          backgroundColor: active ? viridianSoft : isDark ? '#202020' : '#FAFBFD',
                          borderColor: active ? viridian : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: active ? viridian : 'transparent',
                            borderColor: active ? viridian : colors.textTertiary,
                          },
                        ]}
                      >
                        {active ? <Check size={13} color="#FFFFFF" weight="bold" /> : null}
                      </View>
                      <Txt size={12.5} weight={active ? '700' : '500'} style={{ color: colors.text, flex: 1, lineHeight: 18.5 }}>
                        {text}
                      </Txt>
                    </Pressable>
                  )
                })}
              </View>

              <Button
                title="Tôi đã đọc, hiểu và đồng ý điều khoản"
                textColor="#FFFFFF"
                icon={<CheckCircle2 size={17} color="#FFFFFF" weight="bold" />}
                onPress={() => accept.mutate()}
                loading={accept.isPending}
                disabled={!allChecked || accept.isPending}
                style={{
                  backgroundColor: allChecked ? viridian : colors.textTertiary,
                  borderColor: allChecked ? viridian : colors.textTertiary,
                  minHeight: 52,
                  opacity: allChecked ? 1 : 0.65,
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  heroBanner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  guideShortcutCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1.4,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  principleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTrack: {
    marginTop: 18,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  numBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
  },
  consentBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  commitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
})
