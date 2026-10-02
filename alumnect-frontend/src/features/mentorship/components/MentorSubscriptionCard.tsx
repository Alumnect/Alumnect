import { Sparkles, CheckCircle2, ArrowRight, Clock, ShieldCheck, Lock, Award, Zap, Compass } from 'lucide-react'
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
 * Component hiển thị thẻ thông tin gói dịch vụ Mentor (UC92).
 * Thiết kế đồng bộ hoàn hảo theo chuẩn Premium Pastel Design System:
 * - Top Banner tích hợp liền mạch đầu thẻ (không bị clip/cắt xén bởi overflow).
 * - Chiều cao và vị trí các trường thông tin thẳng hàng 100%.
 * - Tiêu đề trải dài trọn vẹn không bị co cụm ép ngắt dòng.
 * - Trạng thái khóa rõ nét, có độ tương phản cao và thông điệp minh bạch.
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
  // Phân loại gói theo chu kỳ tháng
  const isPopular = pkg.durationMonths === 3 && !isCurrentActivePackage
  const isBestValue = pkg.durationMonths === 6 && !isCurrentActivePackage
  const isStarter = pkg.durationMonths === 1 && !isCurrentActivePackage

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
        'relative flex flex-col justify-between p-7 transition-all duration-300 rounded-3xl border h-full',
        isCurrentActivePackage
          ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-50/30 via-white to-transparent dark:from-emerald-950/20 dark:via-[#242526] ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
          : isPopular
          ? 'border-brand-500/50 bg-gradient-to-b from-brand-50/25 via-white to-transparent dark:from-brand-950/15 dark:via-[#242526] ring-2 ring-brand-500/20 shadow-sm'
          : isBestValue
          ? 'border-violet-500/30 bg-gradient-to-b from-violet-50/20 via-white to-transparent dark:from-violet-950/15 dark:via-[#242526] ring-2 ring-violet-500/15 shadow-sm'
          : 'border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b] shadow-sm'
      )}
    >
      <div>
        {/* 1. Header Banner liền mạch ở đỉnh thẻ (vừa vặn 100%, không bị cắt viền) */}
        {isCurrentActivePackage ? (
          <div className="-mx-7 -mt-7 mb-6 flex items-center justify-center gap-1.5 bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold tracking-wider uppercase text-white rounded-t-[23px] shadow-xs">
            <CheckCircle2 size={14} className="text-white shrink-0" />
            <span>Gói Đang Kích Hoạt Sử Dụng</span>
          </div>
        ) : isPopular ? (
          <div className="-mx-7 -mt-7 mb-6 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 px-4 py-2.5 text-center text-xs font-bold tracking-wider uppercase text-white rounded-t-[23px] shadow-xs">
            <Sparkles size={14} className="text-white shrink-0" />
            <span>Được Khuyên Dùng Nhiều Nhất</span>
          </div>
        ) : isBestValue ? (
          <div className="-mx-7 -mt-7 mb-6 flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-2.5 text-center text-xs font-bold tracking-wider uppercase text-white rounded-t-[23px] shadow-xs">
            <Zap size={14} className="text-white shrink-0" />
            <span>Gói Tiết Kiệm Tối Đa (Dài Hạn)</span>
          </div>
        ) : isStarter ? (
          <div className="-mx-7 -mt-7 mb-6 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-700 px-4 py-2.5 text-center text-xs font-bold tracking-wider uppercase rounded-t-[23px]">
            <Compass size={14} className="text-slate-500 shrink-0" />
            <span>Gói Trải Nghiệm Cơ Bản</span>
          </div>
        ) : null}

        {/* 2. Header thẻ: Tên gói & Thời hạn */}
        <div>
          <h3 className="font-heading text-xl font-extrabold text-plum-900 dark:text-[#e4e6eb] leading-snug">
            {pkg.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-plum-500 dark:text-[#b0b3b8]">
            <Clock size={13} className="text-brand-500 shrink-0" />
            <span>Thời hạn {pkg.durationMonths} tháng</span>
          </div>
        </div>

        {/* 3. Giá niêm yết & Đơn giá chia bình quân */}
        <div className="mt-6 pt-5 border-t border-plum-900/5 dark:border-[#393a3b]/60">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-plum-900 dark:text-[#e4e6eb] tracking-tight">
              {vnd(pkg.price)}
            </span>
            <span className="text-xs font-semibold text-plum-500 dark:text-[#b0b3b8]">
              / {pkg.durationMonths} tháng
            </span>
          </div>
          <p className="mt-1 text-xs text-plum-400 dark:text-zinc-500 font-medium">
            (~{vnd(Math.round(pkg.price / pkg.durationMonths))}/tháng)
          </p>
        </div>

        {/* 4. Mô tả chi tiết - Cân đối chiều cao cố định */}
        <p className="mt-4 text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed line-clamp-2 min-h-[36px]">
          {pkg.description || `Gói dịch vụ duy trì kết nối và hỗ trợ cố vấn sinh viên FPT trong ${pkg.durationMonths} tháng.`}
        </p>

        {/* 5. Danh sách quyền lợi nổi bật */}
        <div className="mt-6 pt-5 border-t border-plum-900/5 dark:border-[#393a3b]/60 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Kết nối & hướng dẫn cố vấn 1:1 cho Student</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <Award size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Hiển thị huy hiệu Mentor chính thức trên Profile</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-plum-700 dark:text-[#e4e6eb]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-500" />
            <span>Bảo vệ quyền lợi & đối soát thù lao an toàn</span>
          </div>
        </div>
      </div>

      {/* 6. Nút hành động ở chân thẻ */}
      <div className="mt-8 pt-2">
        {isCurrentActivePackage ? (
          <div className="w-full flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Gói Đang Sử Dụng</span>
            </div>
            {activeEndDate && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400/90 mt-0.5">
                Hết hạn: {formatExpiry(activeEndDate)}
              </span>
            )}
          </div>
        ) : isCurrentlyActive ? (
          <div
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 font-semibold text-xs cursor-not-allowed select-none shadow-xs"
            title="Bạn đang có gói Mentor còn hiệu lực. Vui lòng chờ hết hạn gói hiện tại để gia hạn."
          >
            <Lock size={13} className="text-slate-500 dark:text-zinc-400 shrink-0" />
            <span>Tạm khóa (Đang có gói hiệu lực)</span>
          </div>
        ) : (
          <Button
            variant={isPopular ? 'primary' : 'secondary'}
            size="md"
            className="w-full flex items-center justify-center gap-2 font-bold shadow-sm rounded-2xl py-3"
            disabled={isPendingSelection}
            onClick={() => onSelect(pkg.id)}
          >
            <span>{isSelected ? 'Đã chọn gói này' : 'Lựa chọn gói này'}</span>
            <ArrowRight size={15} />
          </Button>
        )}
      </div>
    </Card>
  )
}
