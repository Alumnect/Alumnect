import { Sparkles, CheckCircle2, ArrowRight, Clock, ShieldCheck } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { cn, vnd } from '@/lib/utils'
import type { MentorPackage } from '../model/mentorSubscriptionTypes'

interface MentorSubscriptionCardProps {
  pkg: MentorPackage
  isSelected?: boolean
  isPendingSelection?: boolean
  onSelect: (pkgId: number) => void
}

/**
 * Component hiển thị thẻ thông tin gói dịch vụ Mentor (UC92).
 * Thiết kế tuân thủ Premium Pastel Design System với hoạt ảnh và hiệu ứng tương tác.
 */
export function MentorSubscriptionCard({
  pkg,
  isSelected = false,
  isPendingSelection = false,
  onSelect,
}: MentorSubscriptionCardProps) {
  // Gói 3 tháng được đánh dấu làm gói Phổ biến nhất (Popular)
  const isPopular = pkg.durationMonths === 3

  return (
    <Card
      hover={true}
      className={cn(
        'relative flex flex-col justify-between p-7 transition-all duration-300 rounded-3xl border border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b]',
        isPopular && 'ring-2 ring-brand-500/80 shadow-glow bg-gradient-to-b from-brand-500/5 to-transparent',
        isSelected && 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
      )}
    >
      <div>
        {/* Banner nổi bật nằm vừa vặn đầu thẻ, không bị lệch hoặc cắt khuất */}
        {isPopular && (
          <div className="-mx-7 -mt-7 mb-5 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-500 via-violet-500 to-coral-500 px-4 py-2 text-center text-xs font-bold tracking-wide text-white rounded-t-[23px] shadow-xs">
            <Sparkles size={13} className="animate-spin text-white shrink-0" />
            <span>Được khuyên dùng nhiều nhất</span>
          </div>
        )}

        {/* Header thẻ: Tên gói và badge thời hạn */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
              {pkg.name}
            </h3>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-plum-500 dark:text-plum-400">
              <Clock size={13} className="text-brand-500" /> Thời hạn {pkg.durationMonths} tháng
            </span>
          </div>

          <Badge tone={isPopular ? 'brand' : 'neutral'} className="px-2.5 py-1 text-xs font-bold">
            {pkg.code}
          </Badge>
        </div>

        {/* Giá niêm yết */}
        <div className="mt-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-plum-900 dark:text-[#e4e6eb] tracking-tight">
              {vnd(pkg.price)}
            </span>
            <span className="text-xs font-medium text-plum-500 dark:text-[#b0b3b8]">
              / {pkg.durationMonths} tháng
            </span>
          </div>
          <p className="mt-1 text-xs text-plum-400">
            (~{vnd(Math.round(pkg.price / pkg.durationMonths))}/tháng)
          </p>
        </div>

        {/* Mô tả chi tiết */}
        <p className="mt-4 text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
          {pkg.description || `Gói dịch vụ duy trì kết nối và hỗ trợ cố vấn sinh viên FPT trong ${pkg.durationMonths} tháng.`}
        </p>

        {/* Danh sách quyền lợi */}
        <div className="mt-6 pt-5 border-t border-plum-900/10 dark:border-[#393a3b] space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Được kết nối và hướng dẫn trực tiếp cho Student</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Hiển thị huy hiệu Mentor chính thức trên Profile</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-500" />
            <span>Hỗ trợ nhận tiền thù lao cố vấn an toàn</span>
          </div>
        </div>
      </div>

      {/* Nút Chọn gói */}
      <div className="mt-8">
        <Button
          variant={isPopular ? 'primary' : 'secondary'}
          size="md"
          className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm rounded-xl py-3"
          disabled={isPendingSelection}
          onClick={() => onSelect(pkg.id)}
        >
          {isSelected ? 'Đã chọn gói này' : 'Lựa chọn gói này'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  )
}
