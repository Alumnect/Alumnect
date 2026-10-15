import { CheckCircle2, ArrowRight, ShieldCheck, Award, Users } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn, vnd } from '@/lib/utils'
import type { MentorPackage } from '../model/mentorSubscriptionTypes'

interface MentorSubscriptionCardProps {
  pkg: MentorPackage
  isSelected?: boolean
  isPendingSelection?: boolean
  isCurrentlyActive?: boolean
  isCurrentActivePackage?: boolean
  activeEndDate?: string
  onSelect: (pkgId: number) => void
}

/**
 * Thẻ gói dịch vụ Mentor căn chỉnh thẳng hàng tuyệt đối 100% (UC92).
 */
export function MentorSubscriptionCard({
  pkg,
  isSelected = false,
  isPendingSelection = false,
  isCurrentlyActive = false,
  isCurrentActivePackage = false,
  activeEndDate,
  onSelect,
}: MentorSubscriptionCardProps) {
  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Card
      hover={!isCurrentlyActive || isCurrentActivePackage}
      className={cn(
        'relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 h-full bg-surface',
        isCurrentActivePackage
          ? 'border-success ring-2 ring-success shadow-md shadow-mint-500/10'
          : 'border-cream-300/90 dark:border-border shadow-xs hover:-translate-y-0.5 hover:shadow-sm'
      )}
    >
      <div>
        {/* Hàng 1: Thời hạn & Huy hiệu - Cố định độ cao h-6 ở cả 3 thẻ */}
        <div className="flex items-center justify-between h-6 mb-1.5">
          <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle">
            Thời hạn {pkg.durationMonths} tháng
          </span>

          {isCurrentActivePackage ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-soft border border-success-border px-2 py-0.5 rounded-full shadow-2xs">
              <CheckCircle2 size={12} className="text-success" /> Đang dùng
            </span>
          ) : (
            <div className="h-5" />
          )}
        </div>

        {/* Hàng 2: Tên gói - Trải dài trọn vẹn 100%, không bị chèn ép rớt dòng */}
        <h3 className="mb-1 font-display text-xl font-bold leading-snug tracking-tight text-text">
          {pkg.name}
        </h3>

        {/* Mô tả chi tiết quyền lợi gói do Admin cấu hình (cố định độ cao h-9 để đảm bảo căn thẳng hàng tuyệt đối) */}
        <div className="mb-3 min-h-10">
          <p className="text-sm leading-5 text-text-subtle">
            {pkg.description || 'Gói đồng hành và kích hoạt tư cách Mentor chính thức trên hệ thống.'}
          </p>
        </div>

        {/* Hàng 3: Giá niêm yết & Gạch ngang dưới thẳng hàng tuyệt đối */}
        <div className="pb-3 border-b border-border dark:border-border">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-text tracking-tight">
              {vnd(pkg.price)}
            </span>
            <span className="text-xs font-semibold text-text-subtle dark:text-text-subtle">
              / {pkg.durationMonths} tháng
            </span>
          </div>
          <div className="h-5 mt-1 flex items-center">
            {pkg.durationMonths > 1 ? (
              <p className="text-xs font-semibold text-success bg-success-soft px-2 py-0.5 rounded-md inline-block">
                Chỉ ~{vnd(Math.round(pkg.price / pkg.durationMonths))}/tháng
              </p>
            ) : (
              <p className="text-xs font-medium text-text-subtle dark:text-text-subtle">
                Kỳ hạn linh hoạt hàng tháng
              </p>
            )}
          </div>
        </div>

        {/* Hàng 4: Quyền lợi Mentor */}
        <div className="py-3.5 space-y-2.5 text-xs text-text-muted dark:text-[#cfd2d6]">
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-primary-soft flex items-center justify-center shrink-0">
              <Award size={12} className="text-primary-solid" />
            </div>
            <span className="font-medium">Huy hiệu Mentor trên hồ sơ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-success-soft flex items-center justify-center shrink-0">
              <Users size={12} className="text-success" />
            </div>
            <span className="font-medium">Kết nối và hướng dẫn 1:1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-info-soft flex items-center justify-center shrink-0">
              <ShieldCheck size={12} className="text-info" />
            </div>
            <span className="font-medium">Đối soát thù lao qua PayOS</span>
          </div>
        </div>
      </div>

      {/* Hàng 5: Nút hành động ở chân thẻ - Thẳng hàng tuyệt đối */}
      <div className="pt-3 border-t border-border dark:border-border">
        {isCurrentActivePackage ? (
          <div className="w-full text-center py-2 px-3 rounded-xl bg-success-soft border border-success-border text-xs text-success font-semibold shadow-2xs">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              <span>Gói đang kích hoạt</span>
            </div>
            {activeEndDate && (
              <span className="block text-xs text-success font-normal mt-0.5">
                Hạn đến {formatExpiry(activeEndDate)}
              </span>
            )}
          </div>
        ) : isCurrentlyActive ? (
          <div className="w-full text-center py-2.5 px-3 rounded-xl bg-surface-3 dark:bg-bg text-text-subtle text-xs font-medium cursor-not-allowed select-none">
            Có gói đang hoạt động
          </div>
        ) : (
          <Button
            variant="secondary"
            size="md"
            className="w-full rounded-xl border border-border py-2.5 text-xs font-semibold dark:border-border hover:border-primary hover:text-primary-solid"
            disabled={isPendingSelection}
            onClick={() => onSelect(pkg.id)}
            rightIcon={<ArrowRight size={13} />}
          >
            {isSelected ? 'Đã chọn gói' : 'Chọn gói'}
          </Button>
        )}
      </div>
    </Card>
  )
}
