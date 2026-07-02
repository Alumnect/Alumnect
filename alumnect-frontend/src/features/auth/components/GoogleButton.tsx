import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AUTH_ENFORCED, DEMO_USER } from '@/config/auth'

/** Google OAuth button. Demo mode creates a local session; real OAuth is TODO. */
export function GoogleButton({ label }: { label: string }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const onClick = () => {
    if (!AUTH_ENFORCED) {
      login({ user: DEMO_USER, accessToken: 'demo-access', refreshToken: 'demo-refresh' })
      navigate('/app')
      return
    }
    // TODO: redirect to the backend Google OAuth 2.0 authorize endpoint.
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-plum-900/15 bg-white text-sm font-semibold text-plum-800 transition-colors hover:bg-cream-100"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
      </svg>
      {label}
    </button>
  )
}
