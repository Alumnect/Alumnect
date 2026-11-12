import { useTheme } from './index'

/**
 * Hệ thống Design Tokens cho luồng Cố vấn (Mentoring Flow) — Trend 2026
 * Kết hợp bố cục Meetup (Event/Item cards) x Instagram (Story ring, Pill tabs) x Kakao (Grouped Bento & Action rows)
 * Đồng bộ hoàn toàn theo bảng màu Cam - Trắng - Đen (Orange, White, Black) của hệ thống (hỗ trợ cả Light & Dark mode).
 */
export const meetupTokens = {
  // Bảng màu Cam - Đen - Trắng chủ đạo (giữ alias viridian để tương thích toàn bộ màn hình)
  viridian: '#CE4A09',
  viridianDark: '#B03E05',
  viridianLight: '#F27124',
  viridianSoft: '#FDF0E7',
  viridianSoftDark: '#2E1C10',
  orange: '#F27124',
  orangeDeep: '#CE4A09',
  orangeSoft: '#FDF0E7',
  orangeSoftDark: '#2E1C10',
  peach: '#DC2626',
  peachSoft: '#FEF2F2',
  peachSoftDark: '#3A1818',
  meetupRed: '#DC2626',
  indigo: '#202329',
  liveGreen: '#16A34A',
  gold: '#D97706',
  goldSoft: '#FEF3C7',

  // Instagram story ring gradient (Cam - Hổ phách - Đen tuyền)
  storyGradient: ['#F27124', '#CE4A09', '#202329'],
  mentorGradient: ['#F27124', '#CE4A09', '#191919'],

  // Neutral layers — Light Mode (Trắng tinh khiết, Xám khói nhạt, Đen than, Cam điểm nhấn)
  light: {
    bg: '#F5F6F7',
    card: '#FFFFFF',
    surface: '#F3F4F5',
    cardElevated: '#FFFFFF',
    border: '#E6E8EB',
    borderSubtle: '#EEF0F2',
    text: '#202329',
    textSecondary: '#5C626C',
    textTertiary: '#666D77',
    tagBg: '#F3F4F5',
    tagBorder: '#E6E8EB',
    chipActiveBg: '#202329',
    chipActiveText: '#FFFFFF',
    chipInactiveBg: '#FFFFFF',
    chipInactiveBorder: '#E6E8EB',
    chipInactiveText: '#5C626C',
    heroBg: '#FDF0E7',
    heroBorder: '#FAD9C2',
    actionBg: '#CE4A09',
    actionText: '#FFFFFF',
    orangeBtnBg: '#CE4A09',
    orangeBtnText: '#FFFFFF',
  },

  // Neutral layers — Dark Mode (Đen Carbon, Xám đậm, Trắng sáng, Cam rực)
  dark: {
    bg: '#101010',
    card: '#191919',
    surface: '#222222',
    cardElevated: '#262626',
    border: '#303030',
    borderSubtle: '#262626',
    text: '#F4F4F4',
    textSecondary: '#B8B8B8',
    textTertiary: '#8E8E93',
    tagBg: '#242424',
    tagBorder: '#343434',
    chipActiveBg: '#F4F4F4',
    chipActiveText: '#141414',
    chipInactiveBg: '#191919',
    chipInactiveBorder: '#303030',
    chipInactiveText: '#B8B8B8',
    heroBg: '#2A1A0E',
    heroBorder: '#4A2C16',
    actionBg: '#FB8A3C',
    actionText: '#FFFFFF',
    orangeBtnBg: '#F27124',
    orangeBtnText: '#FFFFFF',
  },
}

export function useMentoringTheme() {
  const sys = useTheme()
  const isDark = sys.isDark
  const colors = isDark ? meetupTokens.dark : meetupTokens.light
  const primary = sys.primary // #CE4A09 (light) | #FB8A3C (dark)
  const primarySoft = sys.primaryTint // #FDF0E7 (light) | #3A2414 (dark)

  return {
    isDark,
    ...meetupTokens,
    // Đồng bộ động theo chế độ Sáng / Tối của hệ thống
    viridian: primary,
    viridianSoft: primarySoft,
    orange: primary,
    orangeSoft: primarySoft,
    colors,
    sys,
  }
}
