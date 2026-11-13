import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { Avatar, Txt } from './ui'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/**
 * Biểu tượng Alumnect Mentoring đặc trưng (AM Ribbon x Meetup Style — Tone Cam - Trắng - Đen):
 * - Nền viên sỏi hữu cơ (Meetup organic pebble badge) màu Cam Alumnect gradient (#FF7A2F -> #CE4A09)
 * - Biểu tượng lồng ghép 'A' (Alumnect) & 'M' (Mentoring) dạng dải ruy-băng thư pháp mập mạp, đầy đặn (chubby & bold)
 * - Nét vắt cong thanh thoát, nổi bật trên cả nền Sáng và Tối
 */
export function MentoringLogoIcon({ size = 34 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Defs>
        <LinearGradient id="alumnectAmOrangeGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FF7A2F" />
          <Stop offset="55%" stopColor="#E6560F" />
          <Stop offset="100%" stopColor="#B83B04" />
        </LinearGradient>
      </Defs>

      {/* Meetup organic pebble badge - Viên sỏi hữu cơ đặc trưng phong cách Meetup x Alumnect Orange */}
      <Path
        fill="url(#alumnectAmOrangeGrad)"
        d="M44.281,3.422C33.911,0.474 19.213,4.268 11.2,7.57C3.881,10.587 -1.247,17.216 1.06,25.47C1.647,27.571 2.59,29.434 3.791,31.001C4.115,31.423 4.216,31.98 4.039,32.481C2.581,36.608 1.303,42.436 3.111,46.442C6.309,53.528 15.78,56.374 22.39,53.615H22.391C28.841,50.928 35.547,48.629 42.415,47.289C49.121,45.98 55.007,41.322 51.255,31.676C51.218,31.58 51.194,31.475 51.187,31.372C51.167,31.079 51.273,30.794 51.472,30.579C54.188,27.648 56.153,21.857 55.384,16.791C54.456,10.677 49.615,4.938 44.281,3.422Z"
      />

      {/* Dải bóng đổ nhẹ (Drop shadow) dưới nếp gập tạo độ sâu origami */}
      <Path
        fill="#4A1700"
        fillOpacity={0.28}
        d="M16.5 24.5C19.8 21.8 23.5 24.8 26.2 30.2L24.5 31.0C21.8 26.2 18.5 24.0 15.8 25.2Z"
      />

      {/* Chữ AM Monogram thư pháp đầy đặn, mập mạp và sắc nét (Chubby AM Ribbon) */}
      <Path
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.43 8.40L38.52 8.50L38.62 8.40L41.54 8.40L41.64 8.50L42.32 8.50L44.08 8.99L45.15 9.57L45.64 10.06L46.03 10.94L46.03 12.40L45.64 13.76L45.73 12.88L45.83 12.79L45.83 11.33L45.54 10.64L44.76 9.86L43.78 9.47L42.91 9.38L42.81 9.28L39.98 9.28L39.89 9.38L38.52 9.47L38.43 9.57L38.04 9.57L37.94 9.67L37.55 9.67L37.45 9.77L37.06 9.77L36.96 9.86L35.89 10.06L34.33 10.55L34.04 10.74L33.75 10.74L33.46 10.94L32.68 11.13L31.22 11.81L31.02 11.81L29.07 12.79L28.88 12.79L28.68 12.98L25.27 14.74L22.54 16.49L21.28 17.46L22.06 18.73L22.84 20.39L23.03 20.58L25.17 24.87L25.47 25.36L25.66 25.45L26.05 24.67L26.73 22.73L29.07 18.44L31.51 15.03L33.75 12.79L35.70 11.62L37.26 11.33L37.35 11.42L38.33 11.52L39.21 11.91L39.89 12.40L40.96 13.57L41.64 14.64L42.32 16.20L42.91 17.95L42.91 18.24L43.20 19.12L43.20 19.51L43.30 19.61L43.30 20.00L43.39 20.09L43.39 20.58L43.49 20.68L43.49 21.17L43.69 21.85L43.69 22.43L43.78 22.53L43.88 23.99L43.98 24.09L43.98 25.06L44.08 25.16L44.27 31.59L44.17 31.69L44.17 34.61L44.08 34.71L43.98 37.24L43.88 37.34L43.78 39.00L43.69 39.09L43.69 39.68L43.59 39.78L43.59 40.26L43.39 40.85L43.30 41.73L42.62 44.06L41.93 45.43L41.15 46.31L40.76 46.50L39.89 46.50L39.50 46.31L38.91 45.82L38.43 45.14L39.30 45.92L40.18 46.31L40.47 46.31L40.86 46.11L41.35 45.62L41.84 44.65L42.13 43.77L42.32 42.51L42.42 42.41L42.42 41.82L42.52 41.73L42.52 41.04L42.62 40.95L42.71 37.73L42.81 37.63L42.71 33.64L42.62 33.54L42.62 32.27L42.52 32.18L42.42 30.23L42.32 30.13L42.23 28.57L42.13 28.47L42.13 27.89L42.03 27.79L42.03 27.21L41.93 27.11L41.93 26.62L41.74 26.04L41.74 25.55L41.54 25.06L41.15 22.82L40.67 21.26L40.67 20.97L39.98 18.93L39.11 16.98L38.43 15.91L37.55 15.03L37.35 14.93L36.67 14.93L36.18 15.22L34.92 16.49L32.58 19.51L31.51 21.17L30.44 23.21L30.44 23.41L29.85 24.48L29.66 25.16L29.36 25.65L29.17 26.33L27.90 29.16L26.83 30.33L26.44 30.52L25.66 30.62L24.98 30.42L24.49 30.13L23.91 29.55L23.13 28.38L22.84 27.69L21.76 25.94L20.89 24.09L20.69 23.89L18.84 20.19L18.74 19.90L18.84 19.51L18.74 19.41L16.89 21.26L15.63 22.73L15.04 23.51L14.26 24.87L14.26 26.14L14.16 26.23L14.07 28.28L13.97 28.38L13.77 29.94L13.38 30.91L12.70 31.49L12.31 31.49L12.22 31.59L11.53 31.49L10.85 31.11L10.56 30.81L10.27 30.23L10.17 29.45L10.07 29.35L10.07 28.67L9.97 28.57L10.07 26.43L10.17 26.33L10.36 25.16L10.85 23.89L10.85 22.82L10.95 22.73L10.95 21.75L11.05 21.65L11.24 19.02L11.34 18.93L11.34 18.05L11.44 17.95L11.63 15.71L11.73 15.61L11.73 15.03L11.83 14.93L11.83 14.44L12.02 13.86L12.02 13.37L12.90 10.55L13.19 10.06L13.97 9.28L14.55 8.99L15.33 8.89L15.43 8.99L16.11 9.08L16.79 9.57L17.57 10.55L17.77 11.03L18.55 12.20L18.94 13.08L19.43 13.76L19.82 14.64L20.01 14.74L21.08 14.05L21.86 13.66L22.06 13.66L22.25 13.47L23.81 12.69L24.01 12.69L26.05 11.72L28.29 10.94L29.07 10.55L33.65 9.18L34.04 9.18L35.50 8.79L35.99 8.79L36.09 8.69L36.67 8.69L37.35 8.50L38.33 8.50L38.43 8.40Z M16.70 16.88L16.79 16.98L16.99 16.68L16.21 15.13L15.53 14.15L15.33 14.64L15.33 15.13L15.14 15.81L14.94 18.15L14.85 18.34L14.94 18.44L16.70 16.88Z"
      />
    </Svg>
  )
}

/** Giữ alias MeetupMIcon để tương thích ngược nếu các file khác gọi */
export const MeetupMIcon = MentoringLogoIcon

/**
 * Meetup x Instagram styled header logo with title (Cam - Trắng - Đen)
 */
export function MentoringHeaderBrand() {
  const { colors, viridian } = useMentoringTheme()
  return (
    <View style={styles.brandRow}>
      <MentoringLogoIcon size={36} />
      <View style={{ marginLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="800" size={19} style={{ color: colors.text, letterSpacing: -0.4 }}>
            Cố vấn
          </Txt>
          <View style={[styles.dotBadge, { backgroundColor: viridian }]} />
          <Txt weight="700" size={14} style={{ color: viridian }}>
            Mentoring
          </Txt>
        </View>
        <Txt size={11} weight="500" style={{ color: colors.textTertiary, marginTop: 1 }}>
          Kết nối 1:1 · Mạng lưới Cựu sinh viên FPT
        </Txt>
      </View>
    </View>
  )
}

/**
 * Instagram-style story avatar ring for Spotlight Mentors (Orange Ring + Live Dot)
 */
export function MentorStoryRing({
  uri,
  name,
  isLive,
  rating,
  size = 56,
  onPress,
}: {
  uri?: string | null
  name: string
  isLive?: boolean
  rating?: number
  size?: number
  onPress?: () => void
}) {
  const { colors, viridian, viridianSoft, liveGreen, isDark } = useMentoringTheme()
  const ringSize = size + 7

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.storyContainer, { opacity: pressed ? 0.8 : 1 }]}>
      <View
        style={[
          styles.storyRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: viridian,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Avatar uri={uri} name={name} size={size} />

        {/* Live / Available Indicator */}
        {isLive && (
          <View style={[styles.liveDot, { backgroundColor: liveGreen, borderColor: colors.card }]} />
        )}
      </View>

      <Txt
        numberOfLines={1}
        weight="600"
        size={11}
        style={{ color: colors.text, textAlign: 'center', width: ringSize + 14, marginTop: 5 }}
      >
        {name.split(' ').slice(-2).join(' ')}
      </Txt>

      {rating ? (
        <View
          style={[
            styles.ratingBadge,
            {
              backgroundColor: isDark ? '#2E1C10' : viridianSoft,
              borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            },
          ]}
        >
          <Txt size={10} weight="700" style={{ color: viridian }}>
            ★ {rating.toFixed(1)}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotBadge: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  storyContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  storyRing: {
    padding: 2.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  ratingBadge: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
