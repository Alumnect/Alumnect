import Toast from 'react-native-toast-message'

/** Toast đồng nhất với Web (sonner): cùng API success/error/warning/info. */
const show = (type: 'success' | 'error' | 'info' | 'warning', message: string) =>
  Toast.show({ type, text1: message, position: 'top', visibilityTime: 3000 })

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  warning: (message: string) => show('info', message),
  info: (message: string) => show('info', message),
}

export const errMsg = (e: unknown, fallback = 'Đã có lỗi hệ thống xảy ra') =>
  e instanceof Error && e.message ? e.message : fallback
