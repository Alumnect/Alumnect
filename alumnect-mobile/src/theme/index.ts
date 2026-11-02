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
 * Nền trung tính giữ trọng tâm ở con người và nội dung; màu cam dành cho thương hiệu.
 * Chế độ tối là thiết kế riêng, không chỉ đảo màu.
 */
const light = {
  ...palette,
  /** Thẻ trắng trên nền xám nhạt, phân tách bằng viền thay vì bóng đổ. */
  bg: '#F5F6F7',
  /** Nền thẻ, sheet, header */
  card: '#FFFFFF',
  /** Nền phụ bên trong thẻ (khối việc làm, sự kiện...) */
  surface: '#F3F4F5',
  border: '#E6E8EB',
  divider: '#EEF0F2',
  controlBorder: '#CFD3D8',
  text: '#202329',
  textMuted: '#5C626C',
  textSubtle: '#666D77',
  inputBg: '#F1F3F5',
  action: '#202329',
  onAction: '#FFFFFF',
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
  bg: '#101010',
  card: '#191919',
  surface: '#222222',
  border: '#303030',
  divider: '#292929',
  controlBorder: '#505050',
  text: '#F4F4F4',
  textMuted: '#B8B8B8',
  textSubtle: '#A6A6A6',
  inputBg: '#252525',
  action: '#F4F4F4',
  onAction: '#191919',
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

/** Bo góc: thẻ 16, ô nhập và nút 12, sheet 24. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }
/** Nhịp 4pt. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }

/** Phone grid: width = 16 + content + 16; two columns = (width - 48) / 2. */
export const layout = { gutter: 16, gap: 16, touch: 44, control: 48, maxWidth: 720 }

/** Stable, muted identity colours. These encode people, never status. */
export function avatarColors(name: string, isDark: boolean): [string, string] {
  const hash = Array.from(name.normalize('NFC')).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0)
  const lightPairs: [string, string][] = [['#E4ECE8', '#315B46'], ['#E5EBF4', '#3E577C'], ['#F4E9DC', '#795733'], ['#F2E3E7', '#794452']]
  const darkPairs: [string, string][] = [['#24372C', '#AFD2B9'], ['#283344', '#BACCE7'], ['#3A3025', '#E0C29E'], ['#3A2930', '#E0B7C4']]
  return (isDark ? darkPairs : lightPairs)[hash % lightPairs.length]
}

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
