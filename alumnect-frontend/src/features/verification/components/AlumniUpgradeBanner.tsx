import { useState } from 'react'
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { UserProfileResponse } from '@/features/user/model/userTypes'
import { useMyVerificationStatus } from '../hooks/useVerification'
import { UpgradeAlumniModal } from './UpgradeAlumniModal'

interface AlumniUpgradeBannerProps {
  profile: UserProfileResponse
  compact?: boolean
}

/**
 * Nút / thanh trạng thái nhỏ gọn cho phép Sinh viên (STUDENT) gửi yêu cầu nâng cấp lên Cựu sinh viên (ALUMNI) (UC08).
 * - Mặc định (`compact = false`): Hiển thị dạng nút bấm nhỏ gọn đặt cạnh nút "Chỉnh sửa hồ sơ" trên ProfilePage.
 * - Khi `compact = true`: Hiển thị dạng dòng nhỏ gọn trong mục Học tập (FPTU) của EditProfileView.
 */
export function AlumniUpgradeBanner({
  profile,
  compact = false,
}: AlumniUpgradeBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isStudent = profile.role === 'STUDENT'
  const { data: verificationStatus, isLoading } = useMyVerificationStatus({
    enabled: isStudent,
  })

  if (!isStudent || isLoading) {
    return null
  }

  const status = verificationStatus?.status || 'NONE'

  return (
    <>
      {compact ? (
        /* Giao diện 1 dòng nhỏ gọn trong tab Chỉnh sửa hồ sơ -> Học tập (FPTU) */
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            {status === 'PENDING' ? (
              <>
                <Clock size={15} className="shrink-0 text-amber-500" />
                <span>
                  Yêu cầu nâng cấp <strong>Cựu sinh viên</strong> đang chờ Quản
                  trị viên xét duyệt.
                </span>
              </>
            ) : status === 'REJECTED' ? (
              <>
                <AlertTriangle size={15} className="shrink-0 text-danger" />
                <span>
                  Yêu cầu nâng cấp <strong>Cựu sinh viên</strong> cần bổ sung lại
                  minh chứng.
                </span>
              </>
            ) : (
              <>
                <GraduationCap
                  size={15}
                  className="shrink-0 text-primary-solid"
                />
                <span>
                  Đã tốt nghiệp FPTU? Gửi minh chứng để nâng cấp lên{' '}
                  <strong>Cựu sinh viên</strong>.
                </span>
              </>
            )}
          </div>

          <Button
            type="button"
            variant={status === 'PENDING' ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={
              status === 'PENDING' ? (
                <Clock size={13} />
              ) : status === 'REJECTED' ? (
                <RefreshCw size={13} />
              ) : undefined
            }
            rightIcon={
              status === 'NONE' ? <ArrowUpRight size={13} /> : undefined
            }
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold"
          >
            {status === 'PENDING'
              ? 'Xem trạng thái'
              : status === 'REJECTED'
                ? 'Gửi lại minh chứng'
                : 'Nâng cấp Cựu SV'}
          </Button>
        </div>
      ) : (
        /* Nút bấm nhỏ gọn đặt cạnh nút "Chỉnh sửa hồ sơ" trên Header Trang cá nhân */
        <>
          {status === 'PENDING' && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<Clock size={15} className="text-amber-500" />}
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 font-bold text-amber-700 shadow-sm hover:bg-amber-500/20 dark:text-amber-300"
            >
              Chờ duyệt Cựu SV
            </Button>
          )}

          {status === 'REJECTED' && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<AlertTriangle size={15} className="text-danger" />}
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl border border-danger-border bg-danger-soft/60 px-4 font-bold text-danger shadow-sm hover:bg-danger-soft"
            >
              Gửi lại minh chứng Cựu SV
            </Button>
          )}

          {status === 'NONE' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<GraduationCap size={16} />}
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl px-4 font-bold shadow-sm"
            >
              Nâng cấp Cựu SV
            </Button>
          )}

          {status === 'APPROVED' && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600">
              <CheckCircle2 size={15} />
              Đã duyệt Cựu SV
            </span>
          )}
        </>
      )}

      <UpgradeAlumniModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        verificationStatus={verificationStatus}
      />
    </>
  )
}
