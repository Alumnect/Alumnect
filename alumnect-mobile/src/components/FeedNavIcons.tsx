import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import type { FeedFilter } from '@/api/feed'
import { useTheme } from '@/theme'
import { MeetupScribble } from './MeetupScribble'

// ============================================================================
// 1. CREATIVE LOGOS CHO PHÂN LOẠI BẢNG TIN (KHÁM PHÁ / TẤT CẢ / BÀI THƯỜNG / THÀNH TỰU / TUYỂN DỤNG / SỰ KIỆN)
// ============================================================================

export type FeedCategoryKey = 'explore' | FeedFilter

export const FEED_CATEGORY_META: Record<
  FeedCategoryKey,
  {
    label: string
    accent: string
    accentSoft: string
    accentDark: string
    badgeBg: string
    badgeText: string
  }
> = {
  explore: {
    label: 'Khám phá',
    accent: '#FF5A1F',
    accentSoft: '#FFF0E8',
    accentDark: '#C83E0B',
    badgeBg: '#FFF0E8',
    badgeText: '#D9460F',
  },
  all: {
    label: 'Tất cả',
    accent: '#E85D2A',
    accentSoft: '#FDECE4',
    accentDark: '#B84014',
    badgeBg: '#FDECE4',
    badgeText: '#C84B1B',
  },
  normal: {
    label: 'Bài thường',
    accent: '#6366F1',
    accentSoft: '#EEF2FF',
    accentDark: '#4338CA',
    badgeBg: '#EEF2FF',
    badgeText: '#4F46E5',
  },
  achievement: {
    label: 'Thành tựu',
    accent: '#F59E0B',
    accentSoft: '#FEF3C7',
    accentDark: '#B45309',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
  recruitment: {
    label: 'Tuyển dụng',
    accent: '#0EA5E9',
    accentSoft: '#E0F2FE',
    accentDark: '#0369A1',
    badgeBg: '#E0F2FE',
    badgeText: '#0284C7',
  },
  event: {
    label: 'Sự kiện',
    accent: '#EC4899',
    accentSoft: '#FCE7F3',
    accentDark: '#BE185D',
    badgeBg: '#FCE7F3',
    badgeText: '#DB2777',
  },
}

/**
 * Bộ logo danh mục Bảng tin sử dụng 100% nét vẽ tay Spot Illustrations gốc của Meetup:
 * - explore: Nét vẽ mũi tên xoay chuyển hướng phóng khoáng (swirly_arrow)
 * - all: Biểu tượng pop sao bừng sáng kết nối (pop)
 * - normal: Đôi bong bóng đối thoại vẽ tay đặc trưng Meetup (two_chat_bubbles)
 * - achievement: Ba ngôi sao vinh danh lấp lánh (three_sparkles)
 * - recruitment: Tên lửa thăng tiến sự nghiệp (rocket_top_right)
 * - event: Lịch sự kiện đính sao lấp lánh (calendar_with_sparkles)
 */
export function FeedCategoryLogo({
  category,
  size = 22,
  active = false,
  onDark = false,
}: {
  category: FeedCategoryKey
  size?: number
  active?: boolean
  onDark?: boolean
}) {
  const meta = FEED_CATEGORY_META[category] ?? FEED_CATEGORY_META.normal
  const glyphColor = onDark ? '#FFFFFF' : meta.accentDark

  switch (category) {
    case 'explore':
      return <MeetupScribble name="swirly_arrow" size={size} color={glyphColor} />
    case 'all':
      return <MeetupScribble name="pop" size={size} color={glyphColor} />
    case 'normal':
      return <MeetupScribble name="two_chat_bubbles" size={size} color={glyphColor} />
    case 'achievement':
      return <MeetupScribble name="three_sparkles" size={size} color={glyphColor} />
    case 'recruitment':
      return <MeetupScribble name="rocket_top_right" size={size} color={glyphColor} />
    case 'event':
      return <MeetupScribble name="calendar_with_sparkles" size={size} color={glyphColor} />
    default:
      return <MeetupScribble name="two_chat_bubbles" size={size} color={glyphColor} />
  }
}

// ============================================================================
// 2. CHIP LỌC BẢNG TIN CÓ HIỆU ỨNG BẬT NẢY, XOAY LOGO & HÀO QUANG
// ============================================================================

export function AnimatedFilterChip({
  category,
  label,
  active,
  onPress,
}: {
  category: FeedCategoryKey
  label: string
  active: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const meta = FEED_CATEGORY_META[category]
  const scale = useRef(new Animated.Value(1)).current
  const iconRot = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(active ? 1 : 0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glow, {
        toValue: active ? 1 : 0,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      ...(active
        ? [
            Animated.sequence([
              Animated.timing(iconRot, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.spring(iconRot, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
            ]),
          ]
        : []),
    ]).start()
  }, [active, glow, iconRot])

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.91,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start()
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    iconRot.setValue(-1)
    Animated.spring(iconRot, {
      toValue: 0,
      friction: 3.5,
      tension: 190,
      useNativeDriver: true,
    }).start()
    onPress()
  }

  const rotate = iconRot.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  })

  const isExplore = category === 'explore'

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={isExplore ? 'button' : 'tab'}
      accessibilityLabel={label}
      accessibilityState={isExplore ? undefined : { selected: active }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          height: 38,
          paddingHorizontal: 13,
          borderRadius: 19,
          backgroundColor: isExplore
            ? t.primary
            : active
              ? meta.accent
              : t.isDark
                ? t.inputBg
                : meta.accentSoft,
          borderWidth: isExplore ? 0 : 1.2,
          borderColor: isExplore
            ? 'transparent'
            : active
              ? meta.accentDark
              : t.isDark
                ? t.border
                : `${meta.accent}38`,
          shadowColor: isExplore ? t.primary : meta.accent,
          shadowOpacity: isExplore || active ? 0.28 : 0,
          shadowRadius: isExplore || active ? 6 : 0,
          shadowOffset: { width: 0, height: 3 },
          elevation: isExplore || active ? 3 : 0,
          transform: [{ scale }],
        }}
      >
        <Animated.View style={{ transform: [{ rotate }, { scale: active || isExplore ? 1.08 : 1 }] }}>
          <FeedCategoryLogo category={category} size={20} active={active} onDark={isExplore || active} />
        </Animated.View>
        <Animated.Text
          style={{
            fontSize: 13,
            fontWeight: active || isExplore ? '700' : '600',
            color: isExplore || active ? '#FFFFFF' : t.isDark ? t.text : meta.accentDark,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  )
}

/**
 * Huy hiệu phân loại bài viết (nằm cạnh tên tác giả trên PostCard) kèm logo sáng tạo.
 */
export function CreativePostTypeBadge({ type }: { type: FeedFilter }) {
  const t = useTheme()
  const meta = FEED_CATEGORY_META[type] ?? FEED_CATEGORY_META.normal
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: t.isDark ? `${meta.accent}24` : meta.badgeBg,
        borderWidth: 1,
        borderColor: t.isDark ? `${meta.accent}55` : `${meta.accent}35`,
        marginLeft: 4,
      }}
    >
      <FeedCategoryLogo category={type} size={14} active={false} />
      <Animated.Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.isDark ? meta.accent : meta.badgeText,
        }}
      >
        {meta.label}
      </Animated.Text>
    </View>
  )
}

// ============================================================================
// 3. BỘ ICON NAVBAR ĐA SẮC & HIỆU ỨNG TƯƠNG TÁC ẤN TƯỢNG
// ============================================================================

export type NavTabKey = 'home' | 'network' | 'map' | 'mentoring' | 'forum'

export function CreativeNavGlyph({
  tab,
  focused,
  size = 26,
}: {
  tab: NavTabKey
  focused: boolean
  size?: number
}) {
  const t = useTheme()
  const strokeIdle = t.isDark ? '#9CA3AF' : '#52525B'
  const strokeActive = t.isDark ? '#FFFFFF' : '#18181B'

  switch (tab) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          {/* Mái ấm bảng tin + ống khói & trái tim cam */}
          <Path
            d="M4.5 12.2L14 4.2L23.5 12.2V22.5C23.5 23.6 22.6 24.5 21.5 24.5H6.5C5.4 24.5 4.5 23.6 4.5 22.5V12.2Z"
            fill={focused ? '#FFE4D6' : 'none'}
            stroke={focused ? '#E85D2A' : strokeIdle}
            strokeWidth={focused ? 2.1 : 1.9}
            strokeLinejoin="round"
          />
          {/* Mái ngói nổi bật */}
          <Path
            d="M2.5 13.5L14 3.5L25.5 13.5"
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth={focused ? 2.3 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {focused ? (
            <>
              {/* Cửa vòm cam ấm + tia sáng */}
              <Path
                d="M11 24.5V17.5C11 15.8 12.3 14.5 14 14.5C15.7 14.5 17 15.8 17 17.5V24.5"
                fill="#E85D2A"
                stroke="#18181B"
                strokeWidth="1.6"
              />
              <Circle cx="14" cy="10.2" r="2" fill="#FBBF24" stroke="#E85D2A" strokeWidth="1.2" />
            </>
          ) : (
            <Path
              d="M11.2 24.5V18C11.2 16.5 12.5 15.2 14 15.2C15.5 15.2 16.8 16.5 16.8 18V24.5"
              stroke={strokeIdle}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </Svg>
      )

    case 'network':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          {/* Vòng kết nối cộng đồng */}
          {focused && <Circle cx="14" cy="15" r="10.5" fill="#FFF0E8" />}
          {/* Người bên trái & bên phải */}
          <Circle cx="7.5" cy="11" r="3" fill={focused ? '#FDBA74' : 'none'} stroke={focused ? '#C2410C' : strokeIdle} strokeWidth="1.8" />
          <Circle cx="20.5" cy="11" r="3" fill={focused ? '#93C5FD' : 'none'} stroke={focused ? '#1D4ED8' : strokeIdle} strokeWidth="1.8" />
          <Path
            d="M2.5 22C2.5 19.2 4.7 17 7.5 17M25.5 22C25.5 19.2 23.3 17 20.5 17"
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          {/* Nhân vật trung tâm nổi bật */}
          <Circle
            cx="14"
            cy="9.5"
            r="4"
            fill={focused ? '#E85D2A' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="2"
          />
          <Path
            d="M7.5 23.5C7.5 19.9 10.4 17 14 17C17.6 17 20.5 19.9 20.5 23.5"
            fill={focused ? '#FFE4D6' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {focused && (
            <Path d="M14 2.2L14.6 3.8L16.2 4.4L14.6 5L14 6.6L13.4 5L11.8 4.4L13.4 3.8Z" fill="#F59E0B" />
          )}
        </Svg>
      )

    case 'map':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          {/* Bản đồ gấp 3 mảnh */}
          <Path
            d="M3.5 7.5L10.5 5L17.5 7.5L24.5 5V20.5L17.5 23L10.5 20.5L3.5 23V7.5Z"
            fill={focused ? '#E0F2FE' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <Path d="M10.5 5V20.5M17.5 7.5V23" stroke={focused ? '#0284C7' : strokeIdle} strokeWidth="1.7" />
          {/* Ghim vị trí màu cam nổi bật trên bản đồ */}
          <Path
            d="M14 17.5C14 17.5 19 13.3 19 9.8C19 7 16.8 4.8 14 4.8C11.2 4.8 9 7 9 9.8C9 13.3 14 17.5 14 17.5Z"
            fill={focused ? '#E85D2A' : t.card}
            stroke={focused ? '#FFFFFF' : strokeIdle}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <Circle cx="14" cy="9.8" r="1.8" fill={focused ? '#FDE047' : strokeIdle} />
        </Svg>
      )

    case 'mentoring':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          {/* Mũ cử nhân cố vấn + tua rua vàng */}
          <Polygon
            points="14,4.5 26,10.2 14,16 2,10.2"
            fill={focused ? '#E85D2A' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Path
            d="M7 13.2V19.5C7 21.8 10.1 23.8 14 23.8C17.9 23.8 21 21.8 21 19.5V13.2"
            fill={focused ? '#FFE4D6' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Tua rua vàng */}
          <Path
            d="M24.2 11V18.5"
            stroke={focused ? '#F59E0B' : strokeIdle}
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {focused && <Circle cx="24.2" cy="19.5" r="1.8" fill="#F59E0B" />}
          {focused && <Circle cx="14" cy="10.2" r="1.6" fill="#FDE047" />}
        </Svg>
      )

    case 'forum':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          {/* Bong bóng Hỏi đáp thông thái + bóng đèn sáng kiến */}
          <Path
            d="M14 3.5C20.4 3.5 25.5 7.9 25.5 13.4C25.5 16.1 24.2 18.5 22.1 20.3L23.8 24.5L18.8 22.7C17.3 23.1 15.7 23.3 14 23.3C7.6 23.3 2.5 18.9 2.5 13.4C2.5 7.9 7.6 3.5 14 3.5Z"
            fill={focused ? '#FEF3C7' : 'none'}
            stroke={focused ? strokeActive : strokeIdle}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Dấu hỏi nghệ thuật kiêm bóng đèn */}
          <Path
            d="M11.6 10.5C11.6 9.1 12.7 8 14.1 8C15.5 8 16.6 9.1 16.6 10.5C16.6 11.6 15.8 12.3 14.8 12.8C14.2 13.1 14 13.6 14 14.3V14.8"
            stroke={focused ? '#D97706' : strokeIdle}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Circle cx="14" cy="18.2" r="1.4" fill={focused ? '#E85D2A' : strokeIdle} />
          {focused && (
            <Path d="M21.5 3.5L22.2 5.2L24 5.9L22.2 6.6L21.5 8.3L20.8 6.6L19 5.9L20.8 5.2Z" fill="#E85D2A" />
          )}
        </Svg>
      )
  }
}

// ============================================================================
// 4. NÚT TƯƠNG TÁC TRÊN BÀI VIẾT (THÍCH / BÌNH LUẬN / CHIA SẺ / LƯU) VỚI HIỆU ỨNG HẠT NỔ
// ============================================================================

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300]

export function InteractivePostActionButton({
  kind,
  active = false,
  count,
  text,
  label,
  onPress,
}: {
  kind: 'like' | 'comment' | 'share' | 'save'
  active?: boolean
  count?: number
  text?: string
  label: string
  onPress: () => void
}) {
  const t = useTheme()
  const scale = useRef(new Animated.Value(1)).current
  const rot = useRef(new Animated.Value(0)).current
  const flyX = useRef(new Animated.Value(0)).current
  const flyY = useRef(new Animated.Value(0)).current
  const burst = useRef(new Animated.Value(0)).current
  const [bursting, setBursting] = useState(false)

  const display = count && count > 0 ? (count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}K` : String(count)) : text

  const triggerAnimation = () => {
    Haptics.impactAsync(
      kind === 'like' || kind === 'save' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {})

    // Hiệu ứng bật nảy đàn hồi
    scale.setValue(0.68)
    Animated.spring(scale, {
      toValue: 1,
      friction: 3.6,
      tension: 210,
      useNativeDriver: true,
    }).start()

    // Hiệu ứng lắc / bay theo từng nút
    if (kind === 'share') {
      flyX.setValue(0)
      flyY.setValue(0)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flyX, { toValue: 6, duration: 130, useNativeDriver: true }),
          Animated.timing(flyY, { toValue: -5, duration: 130, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(flyX, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
          Animated.spring(flyY, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      rot.setValue(-1)
      Animated.spring(rot, {
        toValue: 0,
        friction: 3.5,
        tension: 200,
        useNativeDriver: true,
      }).start()
    }

    // Hiệu ứng pháo hoa / vòng sóng khi nhấn
    setBursting(true)
    burst.setValue(0)
    Animated.timing(burst, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setBursting(false)
    })

    onPress()
  }

  const rotate = rot.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '18deg'],
  })

  const ringScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 2.1],
  })
  const ringOpacity = burst.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.8, 0.55, 0],
  })

  const accentColor =
    kind === 'like'
      ? '#FF3040'
      : kind === 'save'
        ? '#E85D2A'
        : kind === 'comment'
          ? '#6366F1'
          : '#0EA5E9'

  return (
    <Pressable
      onPress={triggerAnimation}
      accessibilityRole="button"
      accessibilityLabel={count ? `${label}, ${count}` : label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        minWidth: 46,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 11,
        borderRadius: 999,
        backgroundColor: active
          ? `${accentColor}16`
          : pressed
            ? t.inputBg
            : 'transparent',
      })}
    >
      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        {bursting && (
          <>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: accentColor,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            {PARTICLE_ANGLES.map((deg, idx) => {
              const rad = (deg * Math.PI) / 180
              const tx = burst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(rad) * 16],
              })
              const ty = burst.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(rad) * 16],
              })
              const pScale = burst.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1.1, 0],
              })
              return (
                <Animated.View
                  key={deg}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 4.5,
                    height: 4.5,
                    borderRadius: 2.5,
                    backgroundColor: idx % 2 === 0 ? accentColor : '#FBBF24',
                    opacity: ringOpacity,
                    transform: [{ translateX: tx }, { translateY: ty }, { scale: pScale }],
                  }}
                />
              )
            })}
          </>
        )}

        <Animated.View
          style={{
            transform: [
              { scale },
              { rotate },
              { translateX: flyX },
              { translateY: flyY },
            ],
          }}
        >
          <PostActionGlyph kind={kind} active={active} color={active ? accentColor : t.textMuted} />
        </Animated.View>
      </View>

      {display ? (
        <Animated.Text
          style={{
            fontSize: 13,
            fontWeight: active ? '700' : '600',
            color: active ? accentColor : t.textMuted,
          }}
        >
          {display}
        </Animated.Text>
      ) : null}
    </Pressable>
  )
}

function PostActionGlyph({
  kind,
  active,
  color,
}: {
  kind: 'like' | 'comment' | 'share' | 'save'
  active: boolean
  color: string
}) {
  switch (kind) {
    case 'like':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16.5 3C14.6 3 13 3.9 12 5.3C11 3.9 9.4 3 7.5 3C4.4 3 2 5.4 2 8.6C2 13.1 6.4 17.3 11.3 20.6C11.7 20.9 12.3 20.9 12.7 20.6C17.6 17.3 22 13.1 22 8.6C22 5.4 19.6 3 16.5 3Z"
            fill={active ? '#FF3040' : 'none'}
            stroke={active ? '#FF3040' : color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {active && (
            <Path d="M7.2 6.8C6 7.4 5.5 8.6 5.5 9.6" stroke="#FFE4E6" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </Svg>
      )

    case 'comment':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3C17.2 3 21.5 6.8 21.5 11.5C21.5 13.6 20.6 15.5 19.1 17L20.5 21L16.3 19.5C15 19.8 13.5 20 12 20C6.8 20 2.5 16.2 2.5 11.5C2.5 6.8 6.8 3 12 3Z"
            stroke={color}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <Circle cx="8.5" cy="11.5" r="1.2" fill={color} />
          <Circle cx="12" cy="11.5" r="1.2" fill={color} />
          <Circle cx="15.5" cy="11.5" r="1.2" fill={color} />
        </Svg>
      )

    case 'share':
      return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21.2 3.3L3.4 10.2C2.5 10.6 2.5 11.9 3.5 12.2L10.2 14.3L14.5 9.8L11.7 15.8L13.8 21.5C14.1 22.4 15.4 22.4 15.8 21.5L22.3 4.6C22.6 3.7 21.9 3 21.2 3.3Z"
            stroke={color}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </Svg>
      )

    case 'save':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 3.5H18C19.1 3.5 20 4.4 20 5.5V20.5L12 16.2L4 20.5V5.5C4 4.4 4.9 3.5 6 3.5Z"
            fill={active ? '#E85D2A' : 'none'}
            stroke={active ? '#E85D2A' : color}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          {active && (
            <Polygon
              points="12,7 12.9,9 15,9.2 13.4,10.6 13.9,12.7 12,11.6 10.1,12.7 10.6,10.6 9,9.2 11.1,9"
              fill="#FDE047"
            />
          )}
        </Svg>
      )
  }
}

