import { Platform, useColorScheme, type TextStyle, type ViewStyle } from 'react-native'

/**
 * Màu thương hiệu: cam. `primary` đã được tối nhẹ để chữ trắng trên nền cam đạt tỷ lệ tương phản 4.5:1 (WCAG AA).
 * `primarySoft` là cam tươi gốc (#F27124), chỉ dùng cho mảng lớn/trang trí, không dùng làm màu chữ trên nền sáng.
 */
export const palette = {
  primary: '#CE4A09',
  primaryDark: '#B03E05',
  primarySoft: '#F27124',
  success: '#15803D',
  danger: '#DC2626',
  warning: '#B45309',
  info: '#2563EB',
  star: '#F59E0B',
}

/**
 * Hai hệ màu trung tính cùng một tông ấm (đá/stone) để hợp với màu cam, tránh trộn xám lạnh với xám ấm.
 * Chế độ tối là thiết kế riêng, không chỉ đảo màu.
 */
const light = {
  ...palette,
  /** Nền màn hình: trắng ngà ấm, để thẻ trắng nổi lên bằng viền chứ không bằng đổ bóng. */
  bg: '#FBFBFA',
  /** Nền thẻ, sheet, header */
  card: '#FFFFFF',
  /** Nền phụ bên trong thẻ (khối việc làm, sự kiện...) */
  surface: '#F6F6F4',
  border: '#E6E6E3',
  divider: '#EEEEEC',
  text: '#191918',
  textMuted: '#5E5E5A',
  textSubtle: '#787873',
  inputBg: '#F3F3F1',
  /** Chữ/biểu tượng đặt trên nền `primary`. */
  onPrimary: '#FFFFFF',
  primaryTint: '#FDF0E7',
  successTint: '#E8F6EE',
  dangerTint: '#FDECEC',
  infoTint: '#EAF1FE',
  warningTint: '#FEF3E2',
  overlay: 'rgba(28,25,23,0.5)',
  isDark: false,
}

const dark: typeof light = {
  ...palette,
  primary: '#FB8A3C',
  primaryDark: '#F27124',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  bg: '#12100E',
  card: '#1C1A17',
  surface: '#24211D',
  border: '#35312B',
  divider: '#2A2722',
  text: '#F5F2EE',
  textMuted: '#B3ABA1',
  textSubtle: '#8F877D',
  inputBg: '#26231F',
  /** Cam sáng trên nền tối cần chữ tối để đủ tương phản. */
  onPrimary: '#1C1917',
  primaryTint: '#3A2414',
  successTint: '#12301F',
  dangerTint: '#3A1717',
  infoTint: '#172A4A',
  warningTint: '#3A2A12',
  overlay: 'rgba(0,0,0,0.62)',
  isDark: true,
}

export type Theme = typeof light

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light
}

/** Bo góc: thẻ 20, ô nhập 14, nút viên thuốc. Một hệ thống duy nhất cho cả app. */
export const radius = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 }
/** Nhịp 4pt. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }

/* ------------------------------------------------------------------ */
/* Chữ: Be Vietnam Pro (thiết kế cho tiếng Việt, dấu rõ ràng)         */
/* ------------------------------------------------------------------ */

/** Tên font đã đăng ký trong `useFonts` ở `app/_layout.tsx`. */
export const FONT = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
} as const

/**
 * Với font tuỳ chỉnh, Android không tự đổi độ đậm theo `fontWeight` mà phải đổi `fontFamily`.
 * Hàm này đổi độ đậm quen thuộc ('600', 'bold'...) thành đúng tên font.
 */
export function fontFor(weight: TextStyle['fontWeight']): string {
  switch (String(weight ?? '400')) {
    case '100':
    case '200':
    case '300':
    case '400':
    case 'normal':
      return FONT.regular
    case '500':
      return FONT.medium
    case '600':
      return FONT.semibold
    case '700':
    case 'bold':
      return FONT.bold
    default:
      return FONT.extrabold
  }
}

/** Chiều cao dòng theo cỡ chữ. Tiếng Việt chồng nhiều dấu nên cần dòng thoáng hơn chữ Latin thường. */
export function lineHeightFor(size: number): number {
  if (size >= 28) return Math.round(size * 1.2)
  if (size >= 20) return Math.round(size * 1.28)
  return Math.round(size * 1.45)
}

/**
 * Bóng đổ: chỉ dùng cho lớp nổi (sheet, menu, nút nổi). Thẻ trong danh sách phẳng, tách bằng viền 1px.
 * Mức 1 = không bóng.
 */
export function shadow(level: 1 | 2 | 3 = 1, isDark = false): ViewStyle {
  if (isDark || level === 1) return {}
  const map = { 2: [3, 10, 0.07, 3], 3: [8, 24, 0.12, 8] } as const
  const [y, r, o, e] = map[level]
  return Platform.select<ViewStyle>({
    ios: { shadowColor: '#1C1917', shadowOffset: { width: 0, height: y }, shadowRadius: r, shadowOpacity: o },
    default: { elevation: e, shadowColor: '#1C1917' },
  })!
}
