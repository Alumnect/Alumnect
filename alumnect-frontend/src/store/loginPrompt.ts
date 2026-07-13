import { create } from 'zustand'

/**
 * Store điều khiển popup mời đăng nhập (kiểu Facebook).
 * Guest bấm vào một hành động cần đăng nhập (thích/bình luận/đăng lại...) → gọi `open()`
 * để bật một modal nhỏ mời đăng nhập, thay vì vô hiệu hóa nút.
 */
type LoginPromptState = {
  /** Modal đang mở hay không */
  isOpen: boolean
  /** Thông điệp hiển thị trong modal (tùy ngữ cảnh hành động) */
  message: string
  /** Mở modal, kèm thông điệp tùy chọn */
  open: (message?: string) => void
  /** Đóng modal */
  close: () => void
}

const DEFAULT_MESSAGE = 'Đăng nhập để tiếp tục sử dụng đầy đủ tính năng của cộng đồng AlumNect.'

export const useLoginPrompt = create<LoginPromptState>((set) => ({
  isOpen: false,
  message: DEFAULT_MESSAGE,
  open: (message = DEFAULT_MESSAGE) => set({ isOpen: true, message }),
  close: () => set({ isOpen: false }),
}))
