import { CheckCircle2, ArrowRight, ShieldCheck, Award, Users, Sparkles, Gem } from 'lucide-react'
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
  const isPopular = pkg.durationMonths === 3 && !isCurrentActivePackage
  const isBestValue = pkg.durationMonths === 6 && !isCurrentActivePackage

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
        'relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 h-full bg-white dark:bg-[#242526]',
        isCurrentActivePackage
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
          : isPopular
          ? 'border-[#f27024] ring-2 ring-[#f27024]/20 shadow-lg shadow-orange-500/10 hover:-translate-y-0.5'
          : isBestValue
          ? 'border-violet-400/60 ring-2 ring-violet-500/15 shadow-sm hover:-translate-y-0.5'
          : 'border-slate-200/90 dark:border-[#393a3b] shadow-xs hover:-translate-y-0.5 hover:shadow-sm'
      )}
    >
      <div>
        {/* Hàng 1: Thời hạn & Huy hiệu - Cố định độ cao h-6 ở cả 3 thẻ */}
        <div className="flex items-center justify-between h-6 mb-1.5">
          <span className="text-xs font-semibold text-slate-400 dark:text-[#8a8d91]">
            Thời hạn {pkg.durationMonths} tháng
          </span>

          {isCurrentActivePackage ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 px-2 py-0.5 rounded-full shadow-2xs">
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /> Đang dùng
            </span>
          ) : isPopular ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#f27024] to-amber-500 px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles size={11} /> Phổ biến nhất
            </span>
          ) : isBestValue ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 px-2.5 py-0.5 rounded-full">
              <Gem size={11} /> Tiết kiệm nhất
            </span>
          ) : (
            <div className="h-5" />
          )}
        </div>

        {/* Hàng 2: Tên gói - Trải dài trọn vẹn 100%, không bị chèn ép rớt dòng */}
        <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-[#f0f2f5] tracking-tight leading-snug mb-1 truncate">
          {pkg.name}
        </h3>

        {/* Mô tả chi tiết quyền lợi gói do Admin cấu hình (cố định độ cao h-9 để đảm bảo căn thẳng hàng tuyệt đối) */}
        <div className="h-9 flex items-center mb-3">
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8] line-clamp-2 leading-relaxed">
            {pkg.description || 'Gói đồng hành và kích hoạt tư cách Mentor chính thức trên hệ thống.'}
          </p>
        </div>

        {/* Hàng 3: Giá niêm yết & Gạch ngang dưới thẳng hàng tuyệt đối */}
        <div className="pb-3 border-b border-slate-100 dark:border-[#393a3b]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-[#f0f2f5] tracking-tight">
              {vnd(pkg.price)}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-[#8a8d91]">
              / {pkg.durationMonths} tháng
            </span>
          </div>
          <div className="h-5 mt-1 flex items-center">
            {pkg.durationMonths > 1 ? (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md inline-block">
                Chỉ ~{vnd(Math.round(pkg.price / pkg.durationMonths))}/tháng
              </p>
            ) : (
              <p className="text-[11px] font-medium text-slate-400 dark:text-[#8a8d91]">
                Kỳ hạn linh hoạt hàng tháng
              </p>
            )}
          </div>
        </div>

        {/* Hàng 4: Quyền lợi Mentor */}
        <div className="py-3.5 space-y-2.5 text-xs text-slate-600 dark:text-[#cfd2d6]">
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
              <Award size={12} className="text-[#f27024]" />
            </div>
            <span className="font-medium truncate">Huy hiệu Mentor chính thức trên hồ sơ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <Users size={12} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-medium truncate">Kết nối & hướng dẫn 1:1 cùng người học</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
              <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium truncate">Đối soát thù lao an toàn qua PayOS</span>
          </div>
        </div>
      </div>

      {/* Hàng 5: Nút hành động ở chân thẻ - Thẳng hàng tuyệt đối */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#393a3b]">
        {isCurrentActivePackage ? (
          <div className="w-full text-center py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Gói đang kích hoạt</span>
            </div>
            {activeEndDate && (
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">
                Hạn đến {formatExpiry(activeEndDate)}
              </span>
            )}
          </div>
        ) : isCurrentlyActive ? (
          <div className="w-full text-center py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#18191a] text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed select-none">
            Đang dùng gói khác
          </div>
        ) : isPopular ? (
          <Button
            variant="primary"
            size="md"
            className="w-full font-bold rounded-xl text-xs py-2.5 bg-gradient-to-r from-[#f27024] to-[#ff8c38] hover:from-[#e05f13] hover:to-[#f27024] text-white shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all"
            disabled={isPendingSelection}
            onClick={() => onSelect(pkg.id)}
          >
            <span>{isSelected ? 'Đã chọn gói' : 'Chọn gói này'}</span>
            <ArrowRight size={13} />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="md"
            className="w-full font-semibold rounded-xl text-xs py-2.5 border border-slate-200 dark:border-[#393a3b] hover:border-[#f27024] hover:text-[#f27024] dark:hover:border-[#f27024] flex items-center justify-center gap-1.5 transition-all"
            disabled={isPendingSelection}
            onClick={() => onSelect(pkg.id)}
          >
            <span>{isSelected ? 'Đã chọn gói' : 'Chọn gói'}</span>
            <ArrowRight size={13} />
          </Button>
        )}
      </div>
    </Card>
  )
}
