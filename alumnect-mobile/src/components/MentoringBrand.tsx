import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { BrandIcon } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'
import { Avatar, Txt } from './ui'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/**
 * Biểu tượng Alumnect Mentoring đặc trưng:
 * Sử dụng BrandIcon Meetup Pro chuyên nghiệp, không đóng khung hộp cồng kềnh,
 * đồng bộ phong cách tối giản, hiện đại với Mạng lưới và Bản đồ.
 */
export function MentoringLogoIcon({ size = 34 }: { size?: number; color?: string }) {
  return <BrandIcon name="badge_pro" size={size} />
}

/** Giữ alias MeetupMIcon để tương thích ngược */
export const MeetupMIcon = MentoringLogoIcon

/**
 * Header Brand: BrandIcon badge_pro + typography sạch sẽ hiện đại đồng bộ với Network & Map
 */
export function MentoringHeaderBrand() {
  const { colors } = useMentoringTheme()
  return (
    <View style={styles.brandRow}>
      <BrandIcon name="badge_pro" size={34} />
      <View style={{ marginLeft: 10 }}>
        <Txt weight="800" size={20} style={{ color: colors.text, letterSpacing: -0.3 }}>
          Cố vấn
        </Txt>
        <Txt size={12} weight="500" style={{ color: colors.textTertiary, marginTop: 1 }}>
          Đồng hành & định hướng nghề nghiệp
        </Txt>
      </View>
    </View>
  )
}

/**
 * Instagram-style Story Avatar Ring cho Spotlight Mentors:
 * - Viền tròn Story Ring màu Cam thương hiệu với padding mềm mại
 * - Chấm trạng thái trực tuyến / sẵn sàng nổi bật (Live green dot)
 * - Tên hiển thị gọn gàng, huy hiệu đánh giá sao vàng
 * - Tương tác chạm haptics và hiệu ứng scale mượt mà (MotionPressable)
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.()
  }

  return (
    <MotionPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Mentor ${name}`}
      style={styles.storyContainer}
    >
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
          <View
            style={[
              styles.liveDot,
              {
                backgroundColor: liveGreen,
                borderColor: colors.card,
              },
            ]}
          />
        )}
      </View>

      <Txt
        numberOfLines={1}
        weight="700"
        size={11.5}
        style={{ color: colors.text, textAlign: 'center', width: ringSize + 14, marginTop: 5 }}
      >
        {name.split(' ').slice(-2).join(' ')}
      </Txt>

      {rating ? (
        <View
          style={[
            styles.ratingBadge,
            {
              backgroundColor: isDark ? '#2E1C10' : '#FFF3EB',
              borderColor: isDark ? '#4A2C16' : '#FFDFCC',
            },
          ]}
        >
          <Txt size={10} weight="800" style={{ color: viridian }}>
            ★ {rating.toFixed(1)}
          </Txt>
        </View>
      ) : null}
    </MotionPressable>
  )
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderWidth: 1,
  },
})
