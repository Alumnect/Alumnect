import React from 'react'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

/**
 * Chặn màn hình chỉ dành cho Cựu sinh viên (Mentor) — giống Web (`if (user?.role !== 'ALUMNI') <Navigate to="/app/mentoring" />`).
 */
export function withAlumniOnly<P extends object>(Screen: React.ComponentType<P>) {
  function AlumniOnlyScreen(props: P) {
    const role = useAuthStore((s) => s.user?.role)
    if (role && role !== 'ALUMNI') return <Redirect href="/(tabs)/mentoring" />
    return <Screen {...props} />
  }
  AlumniOnlyScreen.displayName = `AlumniOnly(${Screen.displayName ?? Screen.name ?? 'Screen'})`
  return AlumniOnlyScreen
}
