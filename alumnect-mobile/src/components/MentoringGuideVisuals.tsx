import React, { useEffect, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable, useReducedMotion } from '@/components/Motion'
import { CornersOut, Pause, Play, Sparkles, X } from '@/components/icons'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import type { GoldenRuleCard, MobileCalloutPin, MobileGuideStep } from '@/constants/mentoringGuideData'

const SCREEN_W = Dimensions.get('window').width

/* ============================================================================
 * 1. HERO SVG VECTOR ARTWORK — Đồ họa vector cao cấp với chuyển động trôi & xoay nhẹ
 * ============================================================================ */
export function MentoringHeroArtwork({ variant = 'guide' }: { variant?: 'guide' | 'terms' }) {
  const { isDark } = useMentoringTheme()
  const reduced = useReducedMotion()
  const [floatAnim] = useState(() => new Animated.Value(0))
  const [pulseGlow] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (reduced) return
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseGlow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )
    floatLoop.start()
    glowLoop.start()
    return () => {
      floatLoop.stop()
      glowLoop.stop()
    }
  }, [floatAnim, pulseGlow, reduced])

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -6],
  })
  const rotate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2.5deg'],
  })
  const scale = pulseGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: 112,
        height: 112,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateY }, { rotate }, { scale }],
      }}
    >
      <Svg width={112} height={112} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F27124" stopOpacity={isDark ? '0.45' : '0.3'} />
            <Stop offset="100%" stopColor="#CE4A09" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FB8A3C" />
            <Stop offset="100%" stopColor="#CE4A09" />
          </LinearGradient>
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#2B2B2B' : '#FFFFFF'} />
            <Stop offset="100%" stopColor={isDark ? '#1D1D1D' : '#FFF7F2'} />
          </LinearGradient>
        </Defs>

        <Circle cx="60" cy="60" r="56" fill="url(#heroGlow)" />
        <Circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="#F27124"
          strokeOpacity={isDark ? '0.35' : '0.28'}
          strokeWidth="1.4"
          strokeDasharray="5 5"
        />

        {variant === 'terms' ? (
          <G>
            <Path
              d="M60 18 L92 30 V58 C92 79 77 95 60 102 C43 95 28 79 28 58 V30 L60 18 Z"
              fill="url(#shieldGrad)"
            />
            <Path
              d="M60 25 L85 34.5 V57.5 C85 74.5 73 88 60 94 C47 88 35 74.5 35 57.5 V34.5 L60 25 Z"
              fill="url(#cardGrad)"
            />
            <Path
              d="M47 59 L56 68 L74 49"
              fill="none"
              stroke="#15803D"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        ) : (
          <G>
            <Rect
              x="24"
              y="22"
              width="72"
              height="76"
              rx="18"
              fill="url(#cardGrad)"
              stroke="#F27124"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
            <Path
              d="M42 42 H76 C80 42 80 58 72 58 H48 C40 58 40 76 48 76 H76"
              fill="none"
              stroke="url(#shieldGrad)"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="42" cy="42" r="6" fill="#CE4A09" stroke="#FFFFFF" strokeWidth="2.2" />
            <Circle cx="60" cy="58" r="5.5" fill="#F27124" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="76" cy="76" r="7" fill="#15803D" stroke="#FFFFFF" strokeWidth="2.2" />
            <Path
              d="M73 76 L75.2 78.2 L79.5 73.8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        )}

        <Circle cx="99" cy="28" r="4" fill="#F59E0B" />
        <Circle cx="20" cy="84" r="3.5" fill="#15803D" />
        <Path
          d="M22 28 L24 22 L26 28 L32 30 L26 32 L24 38 L22 32 L16 30 Z"
          fill="#CE4A09"
          opacity="0.9"
        />
      </Svg>
    </Animated.View>
  )
}

/* ============================================================================
 * 2. FLOWING STEP CONNECTOR — Nhịp nối động chảy từ Bước N xuống Bước N+1
 * ============================================================================ */
export function StepFlowConnector({ nextStep }: { nextStep: number }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const reduced = useReducedMotion()
  const [flow] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (reduced) return
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 1650,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [flow, reduced])

  const dot1Opacity = flow.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [0.25, 1, 0.35, 0.25] })
  const dot2Opacity = flow.interpolate({ inputRange: [0, 0.3, 0.55, 0.9, 1], outputRange: [0.2, 0.35, 1, 0.3, 0.2] })
  const dot3Opacity = flow.interpolate({ inputRange: [0, 0.55, 0.85, 1], outputRange: [0.2, 0.3, 1, 0.25] })
  const badgeY = flow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-1.5, 2.5, -1.5] })

  return (
    <View style={styles.connectorWrap}>
      <View style={styles.connectorDotsCol}>
        <Animated.View style={[styles.connectorDot, { backgroundColor: viridian, opacity: dot1Opacity }]} />
        <Animated.View style={[styles.connectorDot, { backgroundColor: viridian, opacity: dot2Opacity }]} />
        <Animated.View style={[styles.connectorDot, { backgroundColor: viridian, opacity: dot3Opacity }]} />
      </View>
      <Animated.View
        style={[
          styles.connectorPill,
          {
            backgroundColor: isDark ? '#241810' : viridianSoft,
            borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            transform: [{ translateY: reduced ? 0 : badgeY }],
          },
        ]}
      >
        <Txt size={10.5} weight="800" style={{ color: viridian }}>
          Chuyển sang Bước 0{nextStep}
        </Txt>
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path
            d="M2.5 4.5 L6 8 L9.5 4.5"
            fill="none"
            stroke={viridian}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
      <View style={[styles.connectorLineHair, { backgroundColor: colors.borderSubtle }]} />
    </View>
  )
}

/* ============================================================================
 * 3. PULSING SVG TARGET DOT — Hiệu ứng sóng radar kép tại điểm neo
 * ============================================================================ */
function PulsingDot({
  xPct,
  yPct,
  active,
  dimmed,
  onPress,
}: {
  xPct: number
  yPct: number
  active: boolean
  dimmed: boolean
  onPress: () => void
}) {
  const reduced = useReducedMotion()
  const [pulse] = useState(() => new Animated.Value(0))
  const [dotScale] = useState(() => new Animated.Value(1))

  useEffect(() => {
    Animated.spring(dotScale, {
      toValue: active ? 1.28 : 1,
      friction: 4.5,
      tension: 190,
      useNativeDriver: true,
    }).start()
  }, [active, dotScale])

  useEffect(() => {
    if (reduced) return
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: active ? 1000 : 1900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, active, reduced])

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, active ? 2.8 : 2.1],
  })
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [active ? 0.85 : 0.45, active ? 0.45 : 0.2, 0],
  })

  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: 26,
        height: 26,
        marginLeft: -13,
        marginTop: -13,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dimmed ? 0.35 : 1,
        zIndex: active ? 25 : 15,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#F27124',
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <Animated.View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          backgroundColor: '#CE4A09',
          borderWidth: 2.2,
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 4,
          transform: [{ scale: dotScale }],
        }}
      />
    </Pressable>
  )
}

/* ============================================================================
 * 4. ANIMATED FLOATING CALLOUT PILL — Nhãn chỉ dẫn nảy lò xo & bồng bềnh nhẹ
 * ============================================================================ */
function AnimatedCalloutPill({
  c,
  index,
  imageWidth,
  imageHeight,
  isActive,
  isDimmed,
  compact,
  onPress,
}: {
  c: MobileCalloutPin
  index: number
  imageWidth: number
  imageHeight: number
  isActive: boolean
  isDimmed: boolean
  compact: boolean
  onPress: () => void
}) {
  const reduced = useReducedMotion()
  const [pop] = useState(() => new Animated.Value(1))
  const [bob] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.spring(pop, {
      toValue: isActive ? 1.09 : isDimmed ? 0.94 : 1,
      friction: 5,
      tension: 210,
      useNativeDriver: true,
    }).start()
  }, [isActive, isDimmed, pop])

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 1800 + index * 280,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 1800 + index * 280,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
      loop.start()
    }, index * 220)
    return () => {
      clearTimeout(timer)
      bob.stopAnimation()
    }
  }, [bob, index, reduced])

  const bobY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isActive ? -3.5 : -2],
  })

  const xPct = (c.labelX / imageWidth) * 100
  const yPct = (c.labelY / imageHeight) * 100
  const pillW = compact ? 175 : 210
  const isRightHalf = xPct > 55
  const posStyle = isRightHalf
    ? { right: `${Math.max(2, 100 - xPct - 18)}%` as const }
    : { left: `${Math.max(2, xPct - 16)}%` as const }

  return (
    <Animated.View
      style={[
        styles.calloutPillWrap,
        posStyle,
        {
          top: `${yPct}%`,
          marginTop: -15,
          zIndex: isActive ? 32 : 20,
          opacity: isDimmed ? 0.42 : 1,
          transform: [{ translateY: reduced ? 0 : bobY }, { scale: pop }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.calloutPill,
          {
            maxWidth: pillW,
            backgroundColor: isActive ? '#CE4A09' : 'rgba(255,255,255,0.97)',
            borderColor: isActive ? '#FFFFFF' : '#CE4A09',
            borderWidth: isActive ? 1.8 : 1.3,
          },
        ]}
      >
        <View
          style={[
            styles.calloutNumDot,
            { backgroundColor: isActive ? '#FFFFFF' : '#CE4A09' },
          ]}
        >
          <Txt
            size={10}
            weight="800"
            style={{ color: isActive ? '#CE4A09' : '#FFFFFF', lineHeight: 13 }}
          >
            {c.id}
          </Txt>
        </View>
        <Txt
          size={10.5}
          weight="800"
          numberOfLines={1}
          style={{ color: isActive ? '#FFFFFF' : '#202329', flexShrink: 1 }}
        >
          {c.shortLabel}
        </Txt>
      </Pressable>
    </Animated.View>
  )
}

/* ============================================================================
 * 5. ANNOTATED MOBILE FRAME — Ảnh thật + SVG Callouts + Chế độ Chạy minh họa 1→2→3
 * ============================================================================ */
export function AnnotatedMobileFrame({
  step,
  selectedCalloutId,
  onSelectCallout,
  onZoom,
  compact = false,
}: {
  step: MobileGuideStep
  selectedCalloutId: number | null
  onSelectCallout: (id: number | null) => void
  onZoom?: () => void
  compact?: boolean
}) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const [autoPlay, setAutoPlay] = useState(false)
  const aspectRatio = step.imageWidth / step.imageHeight

  // Auto-cycle tour through pins 1 -> 2 -> 3 when user taps Play
  useEffect(() => {
    if (!autoPlay) return
    const ids = step.callouts.map((c) => c.id)
    if (!ids.length) return
    const timer = setInterval(() => {
      const idx = selectedCalloutId ? ids.indexOf(selectedCalloutId) : -1
      const next = ids[(idx + 1) % ids.length]
      onSelectCallout(next)
    }, 2100)
    return () => clearInterval(timer)
  }, [autoPlay, selectedCalloutId, step.callouts, onSelectCallout])

  const handleTapCallout = (id: number) => {
    if (autoPlay) setAutoPlay(false)
    Haptics.selectionAsync().catch(() => {})
    onSelectCallout(selectedCalloutId === id ? null : id)
  }

  const toggleAutoPlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    if (!autoPlay) {
      setAutoPlay(true)
      onSelectCallout(step.callouts[0]?.id ?? 1)
    } else {
      setAutoPlay(false)
      onSelectCallout(null)
    }
  }

  return (
    <View
      style={[
        styles.deviceOuter,
        {
          backgroundColor: isDark ? '#141414' : '#FFFFFF',
          borderColor: autoPlay ? viridian : isDark ? '#323232' : '#E3E6EB',
        },
      ]}
    >
      {/* Top bar with Play Tour & Zoom buttons */}
      <View
        style={[
          styles.deviceTopBar,
          {
            backgroundColor: isDark ? '#1D1D1D' : '#F8F9FB',
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={[styles.macDot, { backgroundColor: '#F43F5E' }]} />
          <View style={[styles.macDot, { backgroundColor: '#F59E0B' }]} />
          <View style={[styles.macDot, { backgroundColor: '#10B981' }]} />
        </View>
        <Txt
          size={11}
          weight="700"
          numberOfLines={1}
          style={{ color: colors.textSecondary, flex: 1, textAlign: 'center', marginHorizontal: 6 }}
        >
          {step.imageCaption}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Pressable
            onPress={toggleAutoPlay}
            hitSlop={6}
            style={[
              styles.zoomChip,
              {
                backgroundColor: autoPlay ? viridian : viridianSoft,
                borderColor: autoPlay ? viridian : isDark ? '#4A2C16' : '#FAD9C2',
              },
            ]}
          >
            {autoPlay ? (
              <Pause size={11} color="#FFFFFF" weight="fill" />
            ) : (
              <Play size={11} color={viridian} weight="fill" />
            )}
            <Txt size={10} weight="800" style={{ color: autoPlay ? '#FFFFFF' : viridian }}>
              {autoPlay ? 'Dừng' : 'Lướt 1-3'}
            </Txt>
          </Pressable>
          {onZoom ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                onZoom()
              }}
              hitSlop={6}
              style={[
                styles.zoomChip,
                {
                  backgroundColor: isDark ? '#2B2B2B' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <CornersOut size={12} color={viridian} weight="bold" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Real Screenshot + SVG Leader Lines + Animated Pills */}
      <Pressable
        onPress={() => {
          if (onZoom) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            onZoom()
          }
        }}
        style={{ width: '100%', aspectRatio, position: 'relative', backgroundColor: '#F5F6F7', overflow: 'hidden' }}
      >
        <Image
          source={step.image}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />

        {selectedCalloutId !== null ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(16, 16, 16, 0.14)' },
            ]}
          />
        ) : null}

        <Svg
          viewBox={`0 0 ${step.imageWidth} ${step.imageHeight}`}
          style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
          pointerEvents="none"
        >
          {step.callouts.map((c) => {
            const isActive = selectedCalloutId === c.id
            const isDimmed = selectedCalloutId !== null && !isActive
            return (
              <G key={c.id} opacity={isDimmed ? 0.32 : 1}>
                {/* Soft halo glow under active leader line */}
                {isActive ? (
                  <Path
                    d={c.path}
                    fill="none"
                    stroke="#FB8A3C"
                    strokeOpacity={0.38}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {/* Crisp white contrast stroke */}
                <Path
                  d={c.path}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity={isActive ? 0.98 : 0.86}
                  strokeWidth={isActive ? 9 : 7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Main orange vector path */}
                <Path
                  d={c.path}
                  fill="none"
                  stroke={isActive ? '#CE4A09' : '#F27124'}
                  strokeWidth={isActive ? 5.2 : 3.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx={c.targetX}
                  cy={c.targetY}
                  r={isActive ? 24 : 16}
                  fill="#F27124"
                  fillOpacity={isActive ? 0.34 : 0.18}
                  stroke="#CE4A09"
                  strokeOpacity={isActive ? 0.95 : 0.6}
                  strokeWidth={isActive ? 3.2 : 2}
                />
              </G>
            )
          })}
        </Svg>

        {step.callouts.map((c) => (
          <PulsingDot
            key={`dot-${c.id}`}
            xPct={(c.targetX / step.imageWidth) * 100}
            yPct={(c.targetY / step.imageHeight) * 100}
            active={selectedCalloutId === c.id}
            dimmed={selectedCalloutId !== null && selectedCalloutId !== c.id}
            onPress={() => handleTapCallout(c.id)}
          />
        ))}

        {step.callouts.map((c, idx) => (
          <AnimatedCalloutPill
            key={`pill-${c.id}`}
            c={c}
            index={idx}
            imageWidth={step.imageWidth}
            imageHeight={step.imageHeight}
            isActive={selectedCalloutId === c.id}
            isDimmed={selectedCalloutId !== null && selectedCalloutId !== c.id}
            compact={compact}
            onPress={() => handleTapCallout(c.id)}
          />
        ))}
      </Pressable>

      {/* Caption footer */}
      <View
        style={[
          styles.deviceFooter,
          {
            backgroundColor: isDark ? '#1B1B1B' : '#FAFBFD',
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <Sparkles size={14} color={viridian} weight="fill" style={{ marginTop: 2 }} />
        <Txt size={11.5} style={{ color: colors.textSecondary, flex: 1, lineHeight: 17 }}>
          <Txt size={11.5} weight="800" style={{ color: viridian }}>
            Chạm 1–3 hoặc bấm Lướt 1-3:{' '}
          </Txt>
          {step.imageNotes}
        </Txt>
      </View>
    </View>
  )
}

/* ============================================================================
 * 6. FULL-SCREEN LIGHTBOX ZOOM MODAL — Hiệu ứng mở lò xo & chuyển thẻ mượt
 * ============================================================================ */
export function GuideLightboxModal({
  step,
  visible,
  onClose,
}: {
  step: MobileGuideStep | null
  visible: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const [selection, setSelection] = useState<{ stepKey: number; id: number | null }>({ stepKey: 0, id: 1 })
  const [zoomAnim] = useState(() => new Animated.Value(0))
  const [detailAnim] = useState(() => new Animated.Value(1))

  useEffect(() => {
    if (visible) {
      zoomAnim.setValue(0)
      Animated.spring(zoomAnim, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, zoomAnim])

  const focusedId = step && selection.stepKey === step.step ? selection.id : 1

  useEffect(() => {
    detailAnim.setValue(0)
    Animated.spring(detailAnim, {
      toValue: 1,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start()
  }, [focusedId, detailAnim])

  if (!step) return null
  const setFocusedId = (id: number | null) => setSelection({ stepKey: step.step, id })
  const activePin: MobileCalloutPin | undefined = step.callouts.find((c) => c.id === focusedId)

  const modalScale = zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] })
  const detailX = detailAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] })

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalHeader,
            { paddingTop: Math.max(insets.top, 14) + 6 },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Txt size={11} weight="800" style={{ color: '#FB8A3C', letterSpacing: 0.5 }}>
              BƯỚC {step.step} · PHÓNG TO CHI TIẾT
            </Txt>
            <Txt size={15} weight="800" numberOfLines={1} style={{ color: '#FFFFFF', marginTop: 2 }}>
              {step.title}
            </Txt>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng phóng to"
            style={styles.modalCloseBtn}
          >
            <X size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: zoomAnim, transform: [{ scale: modalScale }] }}>
            <AnnotatedMobileFrame
              step={step}
              selectedCalloutId={focusedId}
              onSelectCallout={setFocusedId}
            />
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.modalBottomPanel,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 14) + 6,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {step.callouts.map((c) => {
              const selected = focusedId === c.id
              return (
                <MotionPressable
                  key={c.id}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {})
                    setFocusedId(c.id)
                  }}
                  style={[
                    styles.modalTabPill,
                    {
                      backgroundColor: selected ? viridian : isDark ? '#242424' : '#F3F4F6',
                      borderColor: selected ? viridian : colors.border,
                    },
                  ]}
                >
                  <Txt
                    size={11.5}
                    weight="800"
                    numberOfLines={1}
                    style={{ color: selected ? '#FFFFFF' : colors.text }}
                  >
                    {c.id}. {c.shortLabel}
                  </Txt>
                </MotionPressable>
              )
            })}
          </View>

          {activePin ? (
            <Animated.View
              style={[
                styles.modalDetailBox,
                {
                  backgroundColor: viridianSoft,
                  borderColor: isDark ? '#4A2C16' : '#FAD9C2',
                  opacity: detailAnim,
                  transform: [{ translateX: detailX }],
                },
              ]}
            >
              <Txt size={13} weight="800" style={{ color: colors.text }}>
                {activePin.id}. {activePin.title}
              </Txt>
              <Txt size={12} style={{ color: colors.textSecondary, marginTop: 3, lineHeight: 18 }}>
                {activePin.description}
              </Txt>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

/* ============================================================================
 * 7. GOLDEN RULES INFOGRAPHIC GRID — 6 Con số & Quy tắc vàng trực quan
 * ============================================================================ */
export function GoldenRulesInfographic({ rules }: { rules: GoldenRuleCard[] }) {
  const { colors, isDark } = useMentoringTheme()

  const toneColors = {
    brand: { fg: isDark ? '#FB8A3C' : '#CE4A09', bg: isDark ? '#321F12' : '#FDF0E7', border: isDark ? '#54321C' : '#F8D4BC' },
    success: { fg: isDark ? '#4ADE80' : '#15803D', bg: isDark ? '#122E1E' : '#E8F6EE', border: isDark ? '#1E4D31' : '#BCE6CC' },
    warning: { fg: isDark ? '#FBBF24' : '#B45309', bg: isDark ? '#332510' : '#FEF3E2', border: isDark ? '#59401A' : '#F9D8A7' },
    info: { fg: isDark ? '#60A5FA' : '#2563EB', bg: isDark ? '#142642' : '#EAF1FE', border: isDark ? '#223E6B' : '#C2D7FC' },
    danger: { fg: isDark ? '#F87171' : '#DC2626', bg: isDark ? '#361616' : '#FDECEC', border: isDark ? '#5C2525' : '#F9C6C6' },
  }

  return (
    <View style={styles.rulesGrid}>
      {rules.map((r) => {
        const tc = toneColors[r.tone]
        return (
          <MotionPressable
            key={r.id}
            onPress={() => Haptics.selectionAsync().catch(() => {})}
            style={[
              styles.ruleCard,
              {
                width: (SCREEN_W - 32 - 10) / 2,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={[styles.ruleIconBox, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                <BrandIcon name={r.brandIcon} size={22} />
              </View>
              <View style={[styles.ruleMetricPill, { backgroundColor: tc.bg }]}>
                <Txt size={11.5} weight="800" style={{ color: tc.fg }}>
                  {r.metric}
                </Txt>
              </View>
            </View>
            <Txt size={10.5} weight="800" style={{ color: tc.fg, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {r.unit}
            </Txt>
            <Txt size={13} weight="800" style={{ color: colors.text, marginTop: 2 }} numberOfLines={2}>
              {r.title}
            </Txt>
            <Txt size={11.5} style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 16.5 }}>
              {r.desc}
            </Txt>
          </MotionPressable>
        )
      })}
    </View>
  )
}

/* ============================================================================
 * 8. ANIMATED ROLE SWITCHER — Chuyển đổi mượt Học viên / Cố vấn có trượt lò xo
 * ============================================================================ */
export function GuideRoleSwitcher({
  role,
  onChange,
}: {
  role: 'student' | 'mentor'
  onChange: (r: 'student' | 'mentor') => void
}) {
  const { colors, viridian, isDark } = useMentoringTheme()
  const [trackW, setTrackW] = useState(0)
  const [slide] = useState(() => new Animated.Value(role === 'student' ? 0 : 1))

  useEffect(() => {
    Animated.spring(slide, {
      toValue: role === 'student' ? 0 : 1,
      friction: 6.5,
      tension: 140,
      useNativeDriver: true,
    }).start()
  }, [role, slide])

  const tabW = trackW > 0 ? (trackW - 8) / 2 : 0
  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabW],
  })

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={[
        styles.switchTrack,
        {
          backgroundColor: isDark ? '#1D1D1D' : '#EDEFF2',
          borderColor: colors.border,
        },
      ]}
    >
      {tabW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.switchThumb,
            {
              width: tabW,
              backgroundColor: viridian,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      <MotionPressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {})
          onChange('student')
        }}
        style={styles.switchBtn}
      >
        <BrandIcon name="people" size={18} />
        <Txt
          size={13}
          weight="800"
          style={{ color: role === 'student' ? '#FFFFFF' : colors.textSecondary }}
        >
          Sinh viên / Học viên
        </Txt>
      </MotionPressable>

      <MotionPressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {})
          onChange('mentor')
        }}
        style={styles.switchBtn}
      >
        <BrandIcon name="suitcase" size={18} />
        <Txt
          size={13}
          weight="800"
          style={{ color: role === 'mentor' ? '#FFFFFF' : colors.textSecondary }}
        >
          Cố vấn / Mentor
        </Txt>
      </MotionPressable>
    </View>
  )
}

/* ============================================================================
 * 9. ANIMATED ACCORDION CONTENT REVEAL — Trượt mở nội dung mềm mại (không giật)
 * ============================================================================ */
export function SmoothReveal({ children }: { children: React.ReactNode }) {
  const [anim] = useState(() => new Animated.Value(0))
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 8,
      tension: 150,
      useNativeDriver: true,
    }).start()
  }, [anim])
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] })
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  connectorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  connectorDotsCol: {
    alignItems: 'center',
    gap: 3.5,
  },
  connectorDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
  },
  connectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  connectorLineHair: {
    width: 24,
    height: 1,
    borderRadius: 1,
  },
  deviceOuter: {
    borderRadius: 20,
    borderWidth: 1.4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deviceTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 8.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  macDot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
  },
  zoomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  calloutPillWrap: {
    position: 'absolute',
  },
  calloutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 999,
    shadowColor: '#CE4A09',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  calloutNumDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 16, 0.94)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBottomPanel: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalTabPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ruleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
  },
  ruleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleMetricPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  switchTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  switchThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    shadowColor: '#CE4A09',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    zIndex: 2,
  },
})
