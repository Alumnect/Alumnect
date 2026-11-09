import { useColorScheme } from 'react-native'

/**
 * Meetup + Instagram + KakaoStory design tokens for Mentoring flow.
 * Extracted from com.meetup & Instagram & KakaoStory UI clones.
 */
export const meetupTokens = {
  // Meetup signature colors
  viridian: '#008294',
  viridianDark: '#006775',
  viridianLight: '#00A3BA',
  viridianSoft: '#E6F5F7',
  viridianSoftDark: '#0D2D33',
  peach: '#F65858',
  peachSoft: '#FFF0F0',
  peachSoftDark: '#331515',
  meetupRed: '#FF1154',
  indigo: '#00455D',
  liveGreen: '#32D74B',
  gold: '#D97706',
  goldSoft: '#FEF3C7',

  // Instagram story ring gradient
  storyGradient: ['#F58529', '#DD2A7B', '#8134AF'],
  mentorGradient: ['#008294', '#00B4D8', '#F65858'],

  // Neutral layers
  light: {
    bg: '#F8F9FA',
    card: '#FFFFFF',
    surface: '#F6F7F8',
    cardElevated: '#FFFFFF',
    border: '#E5E5EA',
    borderSubtle: '#F0F0F2',
    text: '#212121',
    textSecondary: '#666666',
    textTertiary: '#8E8E93',
    tagBg: '#F2F2F7',
    tagBorder: '#E5E5EA',
    chipActiveBg: '#008294',
    chipActiveText: '#FFFFFF',
    chipInactiveBg: '#FFFFFF',
    chipInactiveBorder: '#E5E5EA',
    chipInactiveText: '#48484A',
  },
  dark: {
    bg: '#121212',
    card: '#1C1C1E',
    surface: '#232425',
    cardElevated: '#2C2C2E',
    border: '#2C2C2E',
    borderSubtle: '#222224',
    text: '#F5F5F7',
    textSecondary: '#A1A1A6',
    textTertiary: '#636366',
    tagBg: '#2C2C2E',
    tagBorder: '#3A3A3C',
    chipActiveBg: '#008294',
    chipActiveText: '#FFFFFF',
    chipInactiveBg: '#1C1C1E',
    chipInactiveBorder: '#2C2C2E',
    chipInactiveText: '#D1D1D6',
  },
}

export function useMentoringTheme() {
  const isDark = useColorScheme() === 'dark'
  const colors = isDark ? meetupTokens.dark : meetupTokens.light
  return {
    isDark,
    ...meetupTokens,
    colors,
  }
}

