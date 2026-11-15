import React from 'react'
import { Empty, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { BrandIcon } from '@/components/BrandIcon'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'

/**
 * Hội nhóm (UC113–128) chỉ dành cho Cựu sinh viên: backend chặn `/api/v1/groups/**` với vai trò khác (403).
 * Bọc mọi màn Hội nhóm để tài khoản khác (kể cả mở từ link chia sẻ) thấy thông báo thay vì lỗi tải dữ liệu.
 */
export function withGroupsAlumniOnly<P extends object>(Screen_: React.ComponentType<P>) {
  function GroupsAlumniOnlyScreen(props: P) {
    const t = useTheme()
    const role = useAuthStore((s) => s.user?.role)
    if (role && role !== 'ALUMNI') {
      return (
        <Screen bg={t.card}>
          <Header title="Hội nhóm" />
          <Empty icon={<BrandIcon name="people" size={56} />} title="Dành cho Cựu sinh viên" text="Chức năng Hội nhóm chỉ dành cho Cựu sinh viên (Alumni)." />
        </Screen>
      )
    }
    return <Screen_ {...props} />
  }
  GroupsAlumniOnlyScreen.displayName = `GroupsAlumniOnly(${Screen_.displayName ?? Screen_.name ?? 'Screen'})`
  return GroupsAlumniOnlyScreen
}
