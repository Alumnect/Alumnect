import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'

/**
 * Toast thông báo đồng nhất hệ thống kèm phản hồi xúc giác (Haptic Feedback) chuẩn Meetup:
 * - Error: Rung cảnh báo lỗi (Notification Error)
 * - Success: Rung xác nhận thành công (Notification Success)
 * - Info/Warning/Action: Rung nhẹ phím ảo (VirtualKey / Light Impact)
 * - Thời lượng hiển thị mặc định: 4000ms (chuẩn Meetup Short Duration)
 */
const show = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
  if (type === 'error') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
  } else if (type === 'success') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }
  return Toast.show({ type, text1: message, position: 'top', visibilityTime: 4000 })
}

export type ToastAction = { label: string; secondary?: boolean; onPress: () => void }

/** Toast có nút hành động (vd "Nhận" / "Bỏ qua" yêu cầu mentoring), giống `toast.notification` trên Web. */
const showAction = (message: string, actions: ToastAction[], visibilityTime = 10_000) => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
  return Toast.show({ type: 'action', text1: message, position: 'top', visibilityTime, props: { actions } })
}

export const toast = {
  action: showAction,
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  warning: (message: string) => show('warning', message),
  info: (message: string) => show('info', message),
}

export const errMsg = (e: unknown, fallback = 'Đã có lỗi hệ thống xảy ra') => {
  if (e && typeof e === 'object') {
    const err = e as { data?: { data?: Record<string, string>; message?: string }; message?: string }
    const backendData = err.data
    if (backendData?.data && typeof backendData.data === 'object') {
      const fieldErrors = Object.values(backendData.data).filter(Boolean)
      if (fieldErrors.length > 0) return fieldErrors.join('. ')
    }
    if (backendData?.message && typeof backendData.message === 'string') {
      return backendData.message
    }
  }
  return e instanceof Error && e.message ? e.message : fallback
}
