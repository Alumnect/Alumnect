import type { Transition } from 'framer-motion'

/**
 * Motion tokens — nguồn duy nhất quyết định "cảm giác chuyển động" của toàn ứng dụng.
 *
 * Nguyên tắc:
 *  - Chỉ animate `opacity` / `transform` (chạy trên compositor, không gây reflow) nên có thể kéo dài đủ lâu để mềm mại.
 *  - Vào màn hình: giảm tốc dần (ease-out) để "hạ cánh" nhẹ nhàng; rời màn hình: ngắn và gọn hơn để không cản người dùng.
 *  - Chỉ báo dùng `layoutId` chạy bằng lò xo mềm (không nảy) để phản hồi tự nhiên, không bị cứng.
 * Các giá trị CSS tương ứng (`--ease-soft`, `--default-transition-*`) khai báo trong `index.css`.
 */

/** Bốn tham số của cubic-bezier (định dạng framer-motion). */
export type Bezier = [number, number, number, number]

/** Vào màn hình: easeOutCubic — thấy rõ chuyển động ở giữa, hạ cánh êm. */
export const EASE_OUT: Bezier = [0.33, 1, 0.68, 1]
/** Rời màn hình: tăng tốc nhẹ để biến mất gọn gàng. */
export const EASE_IN: Bezier = [0.32, 0, 0.67, 0]
/** Chuyển đổi hai chiều (co giãn chiều cao, crossfade). */
export const EASE_IN_OUT: Bezier = [0.65, 0, 0.35, 1]

/** Tên các nhóm chuyển động dùng chung. */
type MotionToken = 'page' | 'content' | 'pop' | 'overlay' | 'exit' | 'height' | 'indicator' | 'sheet' | 'bounce'

export const TRANSITION: Record<MotionToken, Transition> = {
  /** Trang / khối nội dung lớn xuất hiện. */
  page: { duration: 0.4, ease: EASE_OUT },
  /** Khối nội dung vừa: nội dung tab, danh sách, thẻ. */
  content: { duration: 0.32, ease: EASE_OUT },
  /** Popover, dropdown, menu nhỏ, hộp thoại. */
  pop: { duration: 0.26, ease: EASE_OUT },
  /** Lớp nền mờ phía sau hộp thoại. */
  overlay: { duration: 0.24, ease: EASE_OUT },
  /** Rời đi (mọi loại phần tử). */
  exit: { duration: 0.16, ease: EASE_IN },
  /** Mở / đóng vùng có chiều cao thay đổi (khung bình luận, ô tìm kiếm). */
  height: { duration: 0.34, ease: EASE_IN_OUT },
  /** Chỉ báo tab dùng layoutId: lò xo mềm, gần như không nảy. */
  indicator: { type: 'spring', stiffness: 300, damping: 32, mass: 0.9 },
  /** Bottom sheet trượt từ dưới lên. */
  sheet: { type: 'spring', stiffness: 260, damping: 32 },
  /** Phản hồi khi bấm thích / lưu: nảy nhẹ rồi ổn định. */
  bounce: { type: 'spring', stiffness: 480, damping: 20 },
}
