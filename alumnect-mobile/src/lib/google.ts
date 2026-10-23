import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'

/**
 * Web Client ID phải TRÙNG với GOOGLE_CLIENT_ID của backend: backend kiểm tra claim `aud`
 * của Google ID token đúng bằng giá trị này (AuthServiceImpl.verifyGoogleToken).
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''

let configured = false
const ensureConfigured = () => {
  if (configured) return
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, scopes: ['email', 'profile'] })
  configured = true
}

export const isGoogleConfigured = () => GOOGLE_WEB_CLIENT_ID.length > 0

/** Mở hộp chọn tài khoản Google, trả về ID token (hoặc null nếu người dùng huỷ). */
export async function getGoogleIdToken(): Promise<string | null> {
  if (!isGoogleConfigured()) throw new Error('Chưa cấu hình EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID cho ứng dụng.')
  ensureConfigured()
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  // Đăng xuất phiên Google cũ để luôn hiện hộp chọn tài khoản.
  await GoogleSignin.signOut().catch(() => undefined)
  const res = await GoogleSignin.signIn()
  if (!isSuccessResponse(res)) return null
  return res.data.idToken ?? null
}
