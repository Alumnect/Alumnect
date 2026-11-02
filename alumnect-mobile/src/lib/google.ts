import { NativeModules, TurboModuleRegistry } from 'react-native'

type GoogleModule = typeof import('@react-native-google-signin/google-signin')

/**
 * Web Client ID phải TRÙNG với GOOGLE_CLIENT_ID của backend: backend kiểm tra claim `aud`
 * của Google ID token đúng bằng giá trị này (AuthServiceImpl.verifyGoogleToken).
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''

/** Mô-đun native của Google Sign-In có trong bản app đang chạy hay không (Expo Go thì không có). */
const hasNativeGoogle = () => (TurboModuleRegistry.get('RNGoogleSignin') ?? NativeModules.RNGoogleSignin) != null

/**
 * Nạp thư viện Google Sign-In theo kiểu "lười", và chỉ khi mô-đun native thật sự có mặt.
 * Mô-đun này là mã native nên không có trong Expo Go: nếu import thẳng ở đầu file (hoặc `require` khi thiếu native)
 * thì Metro báo lỗi đỏ `RNGoogleSignin could not be found` và cả app sập; `try/catch` không chặn được lỗi này.
 * Nhờ kiểm tra trước, app vẫn chạy được trong Expo Go (chỉ ẩn nút Google); trên bản build riêng
 * (`expo run:android`/EAS) mọi thứ hoạt động bình thường.
 */
let googleModule: GoogleModule | null | undefined
function loadGoogle(): GoogleModule | null {
  if (googleModule !== undefined) return googleModule
  googleModule = hasNativeGoogle() ? (require('@react-native-google-signin/google-signin') as GoogleModule) : null
  return googleModule
}

let configured = false
const ensureConfigured = (g: GoogleModule) => {
  if (configured) return
  g.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, scopes: ['email', 'profile'] })
  configured = true
}

/** Có cấu hình Client ID và mô-đun native khả dụng thì mới hiện nút đăng nhập Google. */
export const isGoogleConfigured = () => GOOGLE_WEB_CLIENT_ID.length > 0 && loadGoogle() !== null

/** Mở hộp chọn tài khoản Google, trả về ID token (hoặc null nếu người dùng huỷ). */
export async function getGoogleIdToken(): Promise<string | null> {
  if (GOOGLE_WEB_CLIENT_ID.length === 0) throw new Error('Chưa cấu hình EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID cho ứng dụng.')
  const g = loadGoogle()
  if (!g) throw new Error('Đăng nhập Google chưa khả dụng trong bản này (cần bản build riêng của ứng dụng).')
  ensureConfigured(g)
  await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  // Đăng xuất phiên Google cũ để luôn hiện hộp chọn tài khoản.
  await g.GoogleSignin.signOut().catch(() => undefined)
  const res = await g.GoogleSignin.signIn()
  if (!g.isSuccessResponse(res)) return null
  return res.data.idToken ?? null
}
