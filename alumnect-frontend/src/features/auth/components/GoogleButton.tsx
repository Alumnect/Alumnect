import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useGoogleLogin } from '../hooks/useAuthMutations'

/** Nút đăng nhập Google OAuth. Tích hợp trực tiếp Google Identity Services SDK. */
export function GoogleButton({ label }: { label: string }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const googleLoginMutation = useGoogleLogin()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCredentialResponse = async (response: any) => {
    const idToken = response.credential
    try {
      await googleLoginMutation.mutateAsync(idToken)
    } catch (err: any) {
      console.error('Google login failed:', err)
      // Nếu lỗi 404 (Tài khoản chưa tồn tại), chuyển hướng sang trang đăng ký và điền sẵn thông tin
      if (err.data?.error === 404) {
        const metadata = err.data.data // { email, fullName, providerUserId }
        navigate('/register', {
          state: {
            googleData: {
              email: metadata.email,
              fullName: metadata.fullName,
              token: idToken
            }
          }
        })
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated) return

    const initializeGoogleSignIn = () => {
      if (window.google && containerRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleCredentialResponse,
          auto_select: false,
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: containerRef.current.clientWidth || 340,
          text: label.toLowerCase().includes('đăng ký') ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
        })
      }
    }

    if (window.google) {
      initializeGoogleSignIn()
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn()
          clearInterval(interval)
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, label])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full flex justify-center min-h-[48px] relative">
        {/* Loading overlay hiển thị đè lên nút khi đang xử lý */}
        {googleLoginMutation.isPending && (
          <div className="absolute inset-0 z-10 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-plum-900/15 bg-white text-sm font-semibold text-plum-800">
            <svg className="animate-spin h-5 w-5 text-plum-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Đang kết nối với Google...
          </div>
        )}
        
        {/* Giữ container Google luôn được mount để tránh bị mất nút Google sau khi kết nối kết thúc */}
        <div 
          ref={containerRef} 
          className={`w-full flex justify-center ${googleLoginMutation.isPending ? 'invisible pointer-events-none' : ''}`} 
          id="google-signin-btn-container" 
        />
      </div>
      {googleLoginMutation.isError && googleLoginMutation.error?.message && (
        <p className="w-full rounded-xl bg-coral-50 border border-coral-200/50 px-3 py-2 text-xs font-medium text-coral-600 text-center animate-pop">
          {googleLoginMutation.error.message}
        </p>
      )}
    </div>
  )
}

