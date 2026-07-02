import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/store/authStore'
import { AUTH_ENFORCED } from '@/config/auth'

/** Requires an authenticated session (no-op in non-enforced/demo mode). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!AUTH_ENFORCED || isAuthenticated) return <>{children}</>
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}

/** Requires a specific role (no-op in non-enforced/demo mode). */
export function RoleRoute({ role, children }: { role: Role; children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!AUTH_ENFORCED) return <>{children}</>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== role) return <Navigate to="/app" replace />
  return <>{children}</>
}
