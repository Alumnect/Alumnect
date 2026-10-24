/**
 * AlumniDetailCard – Thẻ thông tin tóm tắt Alumni khi click Marker bản đồ.
 * Sử dụng interface AlumniCardData chuẩn hóa cho MapLibre.
 */
import { X, MapPin, Briefcase, User, GraduationCap } from 'lucide-react'
import { Card, Avatar, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'

/**
 * Dữ liệu alumni cần thiết để hiển thị thẻ thông tin trên bản đồ.
 */
export interface AlumniCardData {
  /** ID người dùng (số nguyên) */
  userId: number
  /** Họ và tên */
  fullName: string
  /** URL ảnh đại diện */
  avatarUrl: string
  /** Chức danh công việc */
  currentPosition: string
  /** Tên công ty */
  currentCompany: string
  /** Thành phố */
  city: string
  /** Vĩ độ */
  latitude: number
  /** Kinh độ */
  longitude: number
}

interface AlumniDetailCardProps {
  alumni: AlumniCardData | null
  onClose: () => void
}

/**
 * Component Thẻ hiển thị thông tin chi tiết tóm tắt của Alumni khi click chọn Marker trên bản đồ.
 * Sử dụng Framer Motion để tạo hiệu ứng trượt mượt mà và giao diện Pastel Premium.
 */
export function AlumniDetailCard({ alumni, onClose }: AlumniDetailCardProps) {
  const navigate = useNavigate()

  if (!alumni) return null

  return (
    <div
      className="w-full"
    >
      <Card hover={false} className="relative overflow-hidden p-5 border border-border shadow-soft bg-surface rounded-3xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-text-subtle hover:text-text-muted hover:bg-surface-2 transition"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar
              src={alumni.avatarUrl}
              name={alumni.fullName}
              size={64}
              ring
              className="rounded-2xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-text truncate">
              {alumni.fullName}
            </h3>

            {/* Current Position & Company */}
            <div className="mt-1.5 flex items-start gap-1.5 text-sm text-text-muted">
              <Briefcase size={14} className="text-primary-solid shrink-0 mt-0.5" />
              <span className="text-text-muted">
                {alumni.currentPosition || 'Chưa cập nhật vị trí'} tại{' '}
                <strong className="font-semibold text-text">
                  {alumni.currentCompany || 'Chưa cập nhật công ty'}
                </strong>
              </span>
            </div>

            {/* City */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-text-subtle">
              <MapPin size={13} className="text-danger shrink-0" />
              <span className="truncate">{alumni.city || 'Việt Nam'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => navigate('/app/profile?userId=' + alumni.userId)}
            variant="primary"
            size="sm"
            className="flex-1 justify-center rounded-xl bg-primary-solid hover:bg-primary-hover text-on-primary shadow-sm font-semibold"
            leftIcon={<User size={14} />}
          >
            Xem hồ sơ
          </Button>
          <Button
            onClick={() => navigate('/app/career')}
            variant="secondary"
            size="sm"
            className="flex-1 justify-center rounded-xl border border-border text-text-muted hover:bg-surface-2 font-semibold"
            leftIcon={<GraduationCap size={14} />}
          >
            Lộ trình sự nghiệp
          </Button>
        </div>
      </Card>
    </div>
  )
}

