import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MentoringTermsContent } from './MentoringTermsContent'
import { useAcceptMentoringTerms, useMentoringTermsStatus } from '../hooks/useMentoringTerms'
import type { MentoringEntrySource } from '../model/mentoringTermsTypes'
import { Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  HeartHandshake,
  FileCheck2,
} from 'lucide-react'

interface MentoringTermsProps {
  /** Nguồn kích hoạt mở điều khoản để định tuyến sau khi chấp nhận */
  source?: MentoringEntrySource
  /** Callback tùy chọn được gọi sau khi chấp nhận thành công */
  onSuccess?: () => void
  /** Callback tùy chọn khi bấm nút Quay lại */
  onBack?: () => void
}

/**
 * Giao diện chính của Use Case UC90: Xem & Chấp nhận Điều khoản Hướng dẫn & Hỗ trợ.
 * Thiết kế theo chuẩn Split-Screen hiện đại:
 * - Cột trái (35%): Tiêu đề, tóm tắt 3 quy tắc cốt lõi, Checkbox cam kết và nút hành động.
 * - Cột phải (65%): Khung đọc văn bản điều khoản dạng khổ dọc toàn màn hình, cuộn mượt mà.
 * - Vừa vặn 1 màn hình duy nhất (Zero Window Scroll), khóa cuộn trang bên ngoài.
 */
export function MentoringTerms({
  source = 'MENTORING_HOME',
  onSuccess,
  onBack,
}: MentoringTermsProps) {
  const navigate = useNavigate()
  const [isChecked, setIsChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: statusData } = useMentoringTermsStatus()
  const acceptMutation = useAcceptMentoringTerms()

  const currentVersion = statusData?.currentVersion ?? '1.0'

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    // Quay lại trang trước đó hoặc về trang chủ app
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/app')
    }
  }

  const handleAccept = async () => {
    if (!isChecked || acceptMutation.isPending) return
    setErrorMessage(null)

    try {
      await acceptMutation.mutateAsync()

      if (onSuccess) {
        onSuccess()
        return
      }

      // Điều hướng dựa trên nguồn kích hoạt (Section 14)
      if (source === 'BECOME_MENTOR') {
        navigate('/app/mentoring/become-mentor', { replace: true })
      } else {
        navigate('/app/mentoring', { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chấp nhận điều khoản thất bại. Vui lòng thử lại.'
      setErrorMessage(msg)
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 sm:gap-5 min-h-0 overflow-y-auto lg:overflow-hidden">
      {/* CỘT TRÁI: Bảng thông tin, quy tắc tóm tắt & hộp cam kết */}
      <Card
        hover={false}
        className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col justify-between min-h-0 border border-plum-900/[0.08] bg-white p-5 sm:p-6 shadow-soft dark:bg-[#242526] dark:border-[#393a3b]"
      >
        <div className="flex flex-col min-h-0 space-y-4">
          {/* Header tiêu đề */}
          <div className="space-y-1.5 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-plum-900 dark:text-[#e4e6eb]">
              Điều khoản Hướng dẫn & Hỗ trợ
            </h1>
            <p className="text-xs sm:text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
              Vui lòng đọc kỹ quy chế và đồng ý với các cam kết trước khi tham gia mạng lưới Mentorship.
            </p>
          </div>

          {/* 3 Nguyên tắc hoạt động cốt lõi */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 dark:text-[#8a8d91]">
              Nguyên tắc hoạt động cốt lõi
            </span>

            <div className="flex items-start gap-3 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-3 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Trung thực & Bảo mật</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed">Cam kết thông tin trung thực, bảo mật tài khoản và dữ liệu cá nhân.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-3 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Tôn trọng & Văn hóa FPT</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed">Giao tiếp văn minh, tôn trọng lẫn nhau và giữ vững tinh thần học thuật.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-plum-900/[0.06] bg-cream-50/70 p-3 dark:bg-[#1e1f20] dark:border-[#393a3b]">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-plum-900 dark:text-[#e4e6eb]">Minh bạch Thỏa thuận (Deal)</p>
                <p className="text-plum-600 dark:text-[#b0b3b8] mt-0.5 leading-relaxed">Thực hiện đúng cam kết đã thống nhất và ghi nhận nhật ký Work Log.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Cam kết + Thông báo lỗi + Nút bấm ghim ở dưới */}
        <div className="mt-4 pt-3.5 border-t border-plum-900/[0.06] dark:border-[#393a3b] space-y-3 shrink-0">
          {/* Thông báo lỗi nếu API accept thất bại (BR-UC90-18) */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-coral-200 bg-coral-50/80 p-3 text-xs text-coral-800 dark:border-coral-900/50 dark:bg-coral-950/30 dark:text-coral-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral-600 dark:text-coral-400" />
              <div>
                <p className="font-semibold">Không thể hoàn tất thao tác</p>
                <p className="text-coral-700 dark:text-coral-300 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Hộp chọn checkbox cam kết thỏa thuận */}
          <div
            className={cn(
              'rounded-xl border p-3.5 transition-all select-none',
              isChecked
                ? 'border-brand-300 bg-brand-50/30 ring-1 ring-brand-200/50 dark:border-brand-700/60 dark:bg-brand-950/20'
                : 'border-plum-900/[0.08] bg-cream-50/50 dark:border-[#393a3b] dark:bg-[#1e1f20]'
            )}
          >
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                id="mentoring-terms-checkbox"
                checked={isChecked}
                onChange={(e) => {
                  setIsChecked(e.target.checked)
                  if (errorMessage) setErrorMessage(null)
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-plum-300 text-brand-500 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-xs font-medium leading-relaxed text-plum-900 dark:text-[#e4e6eb]">
                Tôi đã đọc, hiểu rõ và đồng ý với{' '}
                <strong className="text-brand-600 dark:text-brand-400">
                  Điều khoản Hướng dẫn & Hỗ trợ (Phiên bản {currentVersion})
                </strong>
                . Tôi cam kết tuân thủ quy tắc ứng xử, trung thực trong trao đổi và tôn trọng Thỏa thuận (Deal).
              </span>
            </label>
          </div>

          {/* Các nút bấm hành động */}
          <div className="flex items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="shrink-0"
            >
              Quay lại
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!isChecked || acceptMutation.isPending}
              onClick={handleAccept}
              leftIcon={
                acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              }
              className="flex-1"
            >
              {acceptMutation.isPending ? 'Đang ghi nhận...' : 'Đồng ý & Tiếp tục'}
            </Button>
          </div>
        </div>
      </Card>

      {/* CỘT PHẢI: Khung đọc văn bản điều khoản (Document Reader) toàn màn hình */}
      <Card
        hover={false}
        className="flex-1 min-h-0 flex flex-col border border-plum-900/[0.08] bg-white p-4 sm:p-6 shadow-soft dark:bg-[#242526] dark:border-[#393a3b]"
      >
        <MentoringTermsContent version={currentVersion} />
      </Card>
    </div>
  )
}
