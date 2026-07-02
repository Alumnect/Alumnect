import type { AuthUser } from '@/store/authStore'

/**
 * When `true`, route guards enforce auth/role and the auth hooks call the real
 * Spring Boot API. When `false` (default in dev / no backend), the app stays
 * fully browsable and "sign in" creates a local demo session.
 */
export const AUTH_ENFORCED = import.meta.env.VITE_REQUIRE_AUTH === 'true'

/** Demo identity used in non-enforced mode and as a display fallback. */
export const DEMO_USER: AuthUser = {
  id: 'demo-1',
  email: 'minhanh@fpt.edu.vn',
  name: 'Trần Minh Anh',
  role: 'ALUMNI',
  verified: true,
  avatarUrl: 'https://i.pravatar.cc/120?img=12',
}
