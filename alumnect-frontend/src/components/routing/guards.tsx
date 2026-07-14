import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/store/authStore'

/** Yêu cầu phiên đăng nhập hợp lệ — chuyển hướng về /login nếu chưa đăng nhập. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (isAuthenticated) return <>{children}</>
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}

/**
 * Biến thể layout-route của ProtectedRoute: bọc một nhóm route con qua <Outlet />.
 * Dùng cho nhánh /app khi bảng tin (index) mở cho Guest theo UC15/BR-12
 * nhưng các trang con còn lại vẫn yêu cầu đăng nhập.
 */
export function ProtectedOutlet() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (isAuthenticated) return <Outlet />
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}

/** Yêu cầu vai trò cụ thể — chuyển hướng nếu không có quyền. */
export function RoleRoute({ role, children }: { role: Role; children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== role) return <Navigate to="/app" replace />
  return <>{children}</>
}
