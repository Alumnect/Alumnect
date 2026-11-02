import Toast from 'react-native-toast-message'

/** Toast đồng nhất với Web (sonner): cùng API success/error/warning/info. */
const show = (type: 'success' | 'error' | 'info' | 'warning', message: string) =>
  Toast.show({ type, text1: message, position: 'top', visibilityTime: 3000 })

export type ToastAction = { label: string; secondary?: boolean; onPress: () => void }

/** Toast có nút hành động (vd "Nhận" / "Bỏ qua" yêu cầu mentoring), giống `toast.notification` trên Web. */
const showAction = (message: string, actions: ToastAction[], visibilityTime = 12_000) =>
  Toast.show({ type: 'action', text1: message, position: 'top', visibilityTime, props: { actions } })

export const toast = {
  action: showAction,
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  warning: (message: string) => show('info', message),
  info: (message: string) => show('info', message),
}

export const errMsg = (e: unknown, fallback = 'Đã có lỗi hệ thống xảy ra') =>
  e instanceof Error && e.message ? e.message : fallback
