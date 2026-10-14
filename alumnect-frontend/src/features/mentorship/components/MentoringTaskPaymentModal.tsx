import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { toast } from '@/components/ui/Toast'
import { vnd } from '@/lib/utils'
import {
  useTaskPaymentCheckoutSession,
  useTaskPaymentPolling,
  useCancelTaskPayment,
} from '../hooks/useMentoringTasks'
import type { MentoringDeal } from '../model/mentoringDealTypes'
import type { MentoringTaskPaymentStatusResponse } from '../model/mentoringTaskTypes'

interface MentoringTaskPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  deal: MentoringDeal
  onSuccess?: (taskId: number) => void
}

/**
 * Modal hiển thị VietQR PayOS và thông tin thanh toán ký quỹ Mentoring Task (UC105).
 * Hỗ trợ tạo liên kết thanh toán, hiển thị QR code, đồng hồ đếm ngược, sao chép nhanh STK/Nội dung CK
 * và polling tự động 3s để nhận kết quả kích hoạt Task sang PREPARATION ngay lập tức.
 */
export function MentoringTaskPaymentModal({
  isOpen,
  onClose,
  deal,
  onSuccess,
}: MentoringTaskPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60) // 15 phút
  const [paidResult, setPaidResult] =
    useState<MentoringTaskPaymentStatusResponse | null>(null)

  // Khởi tạo & nạp link thanh toán tự động qua useQuery - Reactive 100%, có cache tránh hiển thị spinner lâu
  const {
    data: checkoutData,
    isLoading: isCheckoutLoading,
    error: checkoutError,
    refetch: retryCheckout,
  } = useTaskPaymentCheckoutSession(deal?.id, isOpen && !paidResult)

  const cancelPaymentMutation = useCancelTaskPayment()

  // Tính toán thời gian hết hạn chính xác từ paymentExpiresAt của backend
  useEffect(() => {
    if (checkoutData?.paymentExpiresAt) {
      const expiresAt = new Date(checkoutData.paymentExpiresAt).getTime()
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 15 * 60)
    } else {
      setTimeLeft(15 * 60)
    }
  }, [checkoutData?.paymentExpiresAt])

  const handleRetryCheckout = () => {
    retryCheckout()
  }

  // Reset state phụ khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPaidResult(null)
      setCopiedField(null)
    }
  }, [isOpen])

  // Đếm ngược thời gian thanh toán
  useEffect(() => {
    if (!isOpen || !checkoutData || paidResult || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, checkoutData, paidResult, timeLeft])

  // Polling trạng thái thanh toán từ PayOS
  useTaskPaymentPolling(
    checkoutData?.orderCode,
    isOpen && Boolean(checkoutData?.orderCode) && !paidResult,
    (res) => {
      setPaidResult(res)
      toast.success(
        'Thanh toán thành công! Mentoring Task đã chính thức được kích hoạt sang giai đoạn Chuẩn bị.'
      )
      if (res.taskId && onSuccess) {
        onSuccess(res.taskId)
      }
    }
  )

  if (!isOpen) return null

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Đã sao chép ${field}!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCancel = async () => {
    if (!checkoutData) {
      onClose()
      return
    }
    try {
      await cancelPaymentMutation.mutateAsync({
        orderCode: checkoutData.orderCode,
        reason: 'Học viên hủy giao dịch thanh toán Task',
      })
      toast.success('Đã hủy giao dịch thanh toán.')
      onClose()
    } catch {
      onClose()
    }
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // URL hình ảnh mã QR VietQR
  const qrImageUrl = checkoutData?.qrCodeUrl
    ? checkoutData.qrCodeUrl.startsWith('data:') ||
      checkoutData.qrCodeUrl.startsWith('http')
      ? checkoutData.qrCodeUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          checkoutData.qrCodeUrl
        )}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        checkoutData?.checkoutUrl || ''
      )}`

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[92vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelPaymentMutation.isPending}
          className="absolute right-5 top-5 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl dark:bg-brand-950/40 dark:text-brand-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-plum-900 dark:text-[#f0f2f5]">
              Thanh toán Mentoring Task
            </h2>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Thanh toán Deal #{deal.id} để kích hoạt Task và chuyển sang giai đoạn Chuẩn bị (PREPARATION)
            </p>
          </div>
        </div>

        {/* Màn hình thành công khi đã hoàn tất thanh toán */}
        {paidResult ? (
          <div className="py-8 text-center space-y-5 animate-scale-in">
            <div className="mx-auto w-20 h-20 rounded-full bg-mint-50 flex items-center justify-center text-mint-600 ring-8 ring-mint-50/50 dark:bg-mint-950/50 dark:text-mint-400 dark:ring-mint-900/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-plum-900 dark:text-[#f0f2f5]">
                Thanh toán thành công!
              </h3>
              <p className="text-sm text-plum-600 dark:text-[#b0b3b8] max-w-md mx-auto">
                Hệ thống đã xác nhận giao dịch số tiền{' '}
                <strong className="text-mint-700 dark:text-mint-400 font-bold">
                  {vnd(paidResult.amount || deal.agreedPrice)}
                </strong>
                . Mentoring Task #{paidResult.taskId || deal.taskId || ''} đã chính thức bắt đầu ở giai đoạn{' '}
                <span className="font-bold text-brand-600 dark:text-brand-400">CHUẨN BỊ (PREPARATION)</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-mint-50/60 border border-mint-200/60 text-xs text-mint-900 text-left space-y-1 dark:bg-mint-950/30 dark:border-mint-800/40 dark:text-mint-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-mint-600" />
                <span>Tiếp theo bạn có thể làm gì?</span>
              </div>
              <p className="text-mint-700 dark:text-mint-300">
                • Mentor và Học viên có thể tiếp tục trao đổi chuẩn bị tài liệu trong phần Trò chuyện trực tiếp.
              </p>
              <p className="text-mint-700 dark:text-mint-300">
                • Theo dõi tiến độ nhiệm vụ trong khu vực Quản lý Mentoring Tasks.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                onClick={onClose}
                className="rounded-2xl px-6 py-2.5 font-black bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25"
              >
                Hoàn tất & Tiếp tục
              </Button>
            </div>
          </div>
        ) : isCheckoutLoading ? (
          /* Màn hình tải liên kết PayOS */
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
            <p className="text-sm font-bold text-plum-700 dark:text-[#b0b3b8]">
              Đang tạo liên kết thanh toán PayOS VietQR an toàn...
            </p>
          </div>
        ) : checkoutData ? (
          /* Màn hình quét QR và thanh toán */
          <div className="space-y-6">
            {/* Tóm tắt Deal */}
            <div className="p-4 rounded-2xl bg-plum-50/70 border border-plum-900/10 dark:bg-white/5 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-plum-500 dark:text-[#b0b3b8]">Cố vấn (Mentor):</span>
                <span className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                  {deal.mentorName || 'Mentor'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-plum-500 dark:text-[#b0b3b8]">Phạm vi nhiệm vụ:</span>
                <span className="font-semibold text-plum-900 dark:text-[#f0f2f5] truncate max-w-[260px]">
                  {deal.taskScope}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-plum-900/10 dark:border-white/10">
                <span className="font-bold text-plum-700 dark:text-[#b0b3b8]">Số tiền thanh toán:</span>
                <span className="text-base font-black text-mint-700 dark:text-mint-400">
                  {vnd(checkoutData.amount)}
                </span>
              </div>
            </div>

            {/* Khung hiển thị VietQR */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-brand-50/50 to-white border border-brand-100 shadow-sm dark:from-white/5 dark:to-transparent dark:border-white/10 space-y-4">
              <div className="relative group p-3 bg-white rounded-2xl shadow-md border border-plum-100 dark:border-transparent">
                <img
                  src={qrImageUrl}
                  alt="VietQR PayOS"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-brand-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-white/90 text-brand-900 text-[11px] font-bold px-2 py-1 rounded-full shadow">
                    Quét bằng Mobile Banking
                  </span>
                </div>
              </div>

              {/* Đồng hồ đếm ngược */}
              <div className="flex items-center gap-2 text-xs font-bold text-plum-600 dark:text-[#b0b3b8]">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Thời gian thanh toán còn lại:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-xs ${
                    timeLeft < 180
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      : 'bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300'
                  }`}
                >
                  {formatTimer(timeLeft)}
                </span>
              </div>

              {/* Trạng thái Polling động */}
              <div className="flex items-center gap-2 text-xs text-plum-500 dark:text-[#b0b3b8]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint-500"></span>
                </span>
                <span>Hệ thống đang tự động lắng nghe kết quả chuyển khoản...</span>
              </div>
            </div>

            {/* Hướng dẫn chuyển khoản nhanh & copy */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-plum-700 dark:text-[#f0f2f5]">
                Hoặc chuyển khoản thủ công theo thông tin sau:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Số tiền */}
                <div className="p-3 rounded-xl bg-plum-50/60 dark:bg-white/5 border border-plum-900/5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-plum-400">Số tiền chính xác</p>
                    <p className="font-bold text-mint-700 dark:text-mint-400">
                      {vnd(checkoutData.amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(checkoutData.amount.toString(), 'Số tiền')}
                    className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-plum-500 transition-colors"
                  >
                    {copiedField === 'Số tiền' ? (
                      <Check className="w-4 h-4 text-mint-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Mã đơn hàng / Nội dung CK */}
                <div className="p-3 rounded-xl bg-plum-50/60 dark:bg-white/5 border border-plum-900/5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-plum-400">Nội dung CK / Mã đơn</p>
                    <p className="font-mono font-bold text-plum-900 dark:text-[#f0f2f5]">
                      {checkoutData.orderCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(checkoutData.orderCode.toString(), 'Nội dung chuyển khoản')
                    }
                    className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-plum-500 transition-colors"
                  >
                    {copiedField === 'Nội dung chuyển khoản' ? (
                      <Check className="w-4 h-4 text-mint-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Các nút hành động phụ */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-plum-900/10 dark:border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelPaymentMutation.isPending}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                {cancelPaymentMutation.isPending ? 'Đang hủy...' : 'Hủy giao dịch'}
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={checkoutData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 transition-colors"
                >
                  <span>Mở trang PayOS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Trạng thái lỗi không tạo được link PayOS */
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 ring-8 ring-rose-50/50 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-900/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5]">
                Chưa thể tạo liên kết thanh toán
              </h3>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8] max-w-sm mx-auto">
                {checkoutError?.message ||
                  'Không thể kết nối cổng thanh toán PayOS lúc này hoặc thông tin đơn hàng không hợp lệ. Vui lòng thử lại.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-xl px-4 text-xs font-bold text-plum-600 hover:text-plum-900"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryCheckout}
                disabled={isCheckoutLoading}
                className="rounded-xl px-4 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5"
              >
                {isCheckoutLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Thử lại</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
