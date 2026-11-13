import { Easing } from 'react-native'

/**
 * Meetup Motion Design Tokens
 * Trích xuất trực tiếp từ Meetup APK v2026.10.26 (MOTION-SPEC.md & gallery.html)
 */

export const DURATION = {
  /** Nút bấm, chuyển đổi elevation, phản hồi trạng thái phím */
  instant: 100,
  /** Chuyển trang mặc định, tooltip, dialog out, toast enter */
  fast: 150,
  /** Biến mất dứt khoát của Toast / Snackbar (M3 snackbar out) */
  exit: 75,
  /** Checkbox tick morph, radio dot overshoot hold */
  tick: 166,
  /** Bottom sheet M2, tab indicator */
  normal: 250,
  /** Side sheet M3 */
  sideSheet: 275,
  /** Panel trượt toàn màn hình, checkbox bounce, radio settle */
  smooth: 300,
  /** FAB enter (330ms với icon delay 90ms) */
  fab: 330,
  /** Dialog M3 in, Bottom sheet M3 in, Content crossfade */
  sheetIn: 400,
  /** Bottom sheet M3 out */
  sheetOut: 350,
  /** Banner promo trượt đáy */
  banner: 500,
  /** Chu kỳ nhịp thở nhẹ nhàng của Skeleton Loading */
  pulse: 1200,
  /** Spinner / Loader xoay tròn chu kỳ */
  spinner: 1500,
} as const

export const EASING = {
  /** Standard M3 */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Dialog in, Bottom sheet M3 in: mở nhanh rồi giảm tốc êm dịu */
  emphasizedDecel: Easing.bezier(0.1, 0.7, 0.1, 1),
  /** Dialog out, dismiss: bắt đầu chậm rồi biến mất dứt khoát */
  emphasizedAccel: Easing.bezier(0.3, 0, 0.8, 0.2),
  /** Content crossfade, Tab change, Snackbar scale (FastOutSlowIn) */
  legacy: Easing.bezier(0.4, 0, 0.2, 1),
  /** Panel slide in từ đáy (decelerate_cubic) */
  decelCubic: Easing.bezier(0, 0, 0.58, 1),
  /** Panel slide out về đáy (accelerate_cubic) */
  accelCubic: Easing.bezier(0.55, 0, 1, 0.45),
  /** Checkbox tick vẽ & viền nhún */
  bounceTick: Easing.bezier(0.333, 0, 0, 1),
  /** Tuyến tính cho crossfade */
  linear: Easing.linear,
} as const

