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
  /** Thanh toán bổ sung cho Ticket điều chỉnh đã được chấp nhận (thay vì thanh toán Deal ban đầu) */
  topUpAmendment?: { id: number; version?: number; additionalAmount?: number } | null
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
  topUpAmendment,
  onSuccess,
}: MentoringTaskPaymentModalProps) {
  const isTopUp = Boolean(topUpAmendment)
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
  } = useTaskPaymentCheckoutSession(deal?.id, isOpen && !paidResult, topUpAmendment?.id)

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
      <div className="relative w-full max-w-xl bg-surface rounded-3xl border border-border shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[92vh] overflow-y-auto chat-scrollbar">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelPaymentMutation.isPending}
          className="absolute right-5 top-5 p-2 text-text-subtle hover:text-text-muted rounded-full hover:bg-surface-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-soft text-primary-solid rounded-2xl">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">
              {isTopUp ? 'Thanh toán bổ sung cho Task' : 'Thanh toán Mentoring Task'}
            </h2>
            <p className="text-xs text-text-subtle">
              {isTopUp
                ? `Thanh toán khoản bổ sung của Ticket điều chỉnh v${topUpAmendment?.version ?? ''} để điều chỉnh có hiệu lực`
                : `Thanh toán Deal #${deal.id} để kích hoạt Task và chuyển sang giai đoạn Chuẩn bị (PREPARATION)`}
            </p>
          </div>
        </div>

        {/* Màn hình thành công khi đã hoàn tất thanh toán */}
        {paidResult ? (
          <div className="py-8 text-center space-y-5 animate-scale-in">
            <div className="mx-auto w-20 h-20 rounded-full bg-success-soft flex items-center justify-center text-success ring-8 ring-success-border">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-text">
                Thanh toán thành công!
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Hệ thống đã xác nhận giao dịch số tiền{' '}
                <strong className="text-success font-bold">
                  {vnd(paidResult.amount || deal.agreedPrice)}
                </strong>
                .{' '}
                {isTopUp ? (
                  <>Khoản bổ sung đã được cộng vào quỹ Task #{paidResult.taskId || deal.taskId || ''} và điều chỉnh đã có hiệu lực.</>
                ) : (
                  <>
                    Mentoring Task #{paidResult.taskId || deal.taskId || ''} đã chính thức bắt đầu ở giai đoạn{' '}
                    <span className="font-bold text-primary-solid">CHUẨN BỊ </span>.
                  </>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-success-soft border border-success-border text-xs text-success text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-success" />
                <span>Tiếp theo bạn có thể làm gì?</span>
              </div>
              <p className="text-success">
                • Mentor và Học viên có thể tiếp tục trao đổi chuẩn bị tài liệu trong phần Trò chuyện trực tiếp.
              </p>
              <p className="text-success">
                • Theo dõi tiến độ nhiệm vụ trong khu vực Quản lý Mentoring Tasks.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                onClick={onClose}
                className="rounded-2xl px-6 py-2.5 font-bold bg-primary-solid hover:bg-primary-hover text-on-primary shadow-lg shadow-brand-500/25"
              >
                Hoàn tất & Tiếp tục
              </Button>
            </div>
          </div>
        ) : isCheckoutLoading ? (
          /* Màn hình tải liên kết PayOS */
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary-solid mx-auto" />
            <p className="text-sm font-bold text-text-muted">
              Đang tạo liên kết thanh toán PayOS VietQR an toàn...
            </p>
          </div>
        ) : checkoutData ? (
          /* Màn hình quét QR và thanh toán */
          <div className="space-y-6">
            {/* Tóm tắt Deal */}
            <div className="p-4 rounded-2xl bg-cream-100/70 border border-border dark:bg-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-subtle">Cố vấn (Mentor):</span>
                <span className="font-bold text-text">
                  {deal.mentorName || 'Mentor'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-subtle">Phạm vi nhiệm vụ:</span>
                <span className="font-semibold text-text truncate max-w-[260px]">
                  {deal.taskScope}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="font-bold text-text-muted">Số tiền thanh toán:</span>
                <span className="text-base font-bold text-success">
                  {vnd(checkoutData.amount)}
                </span>
              </div>
            </div>

            {/* Khung hiển thị VietQR */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-brand-50/50 to-white border border-primary-soft-border shadow-sm dark:from-white/5 dark:to-transparent space-y-4">
              <div className="relative group p-3 bg-surface rounded-2xl shadow-md border border-border dark:border-transparent">
                <img
                  src={qrImageUrl}
                  alt="VietQR PayOS"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-brand-700/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-surface text-primary-solid text-xs font-bold px-2 py-1 rounded-full shadow">
                    Quét bằng Mobile Banking
                  </span>
                </div>
              </div>

              {/* Đồng hồ đếm ngược */}
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                <Clock className="w-4 h-4 text-primary-solid" />
                <span>Thời gian thanh toán còn lại:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-xs ${timeLeft < 180
                      ? 'bg-danger-soft text-danger'
                      : 'bg-primary-soft text-primary-solid'
                    }`}
                >
                  {formatTimer(timeLeft)}
                </span>
              </div>

              {/* Trạng thái Polling động */}
              <div className="flex items-center gap-2 text-xs text-text-subtle">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span>Hệ thống đang tự động lắng nghe kết quả chuyển khoản...</span>
              </div>
            </div>

            {/* Hướng dẫn chuyển khoản nhanh & copy */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-text-muted">
                Hoặc chuyển khoản thủ công theo thông tin sau:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Số tiền */}
                <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-white/5 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-subtle">Số tiền chính xác</p>
                    <p className="font-bold text-success">
                      {vnd(checkoutData.amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(checkoutData.amount.toString(), 'Số tiền')}
                    className="p-1.5 hover:bg-surface rounded-lg text-text-subtle transition-colors"
                  >
                    {copiedField === 'Số tiền' ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Mã đơn hàng / Nội dung CK */}
                <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-white/5 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-subtle">Nội dung CK / Mã đơn</p>
                    <p className="font-mono font-bold text-text">
                      {checkoutData.orderCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(checkoutData.orderCode.toString(), 'Nội dung chuyển khoản')
                    }
                    className="p-1.5 hover:bg-surface rounded-lg text-text-subtle transition-colors"
                  >
                    {copiedField === 'Nội dung chuyển khoản' ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Các nút hành động phụ */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelPaymentMutation.isPending}
                className="text-xs text-danger hover:text-danger hover:bg-danger-soft"
              >
                {cancelPaymentMutation.isPending ? 'Đang hủy...' : 'Hủy giao dịch'}
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={checkoutData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-soft text-primary-solid hover:bg-primary-soft transition-colors"
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
            <div className="mx-auto w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center text-danger ring-8 ring-danger-border">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text">
                Chưa thể tạo liên kết thanh toán
              </h3>
              <p className="text-xs text-text-subtle max-w-sm mx-auto">
                {checkoutError?.message ||
                  'Không thể kết nối cổng thanh toán PayOS lúc này hoặc thông tin đơn hàng không hợp lệ. Vui lòng thử lại.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-xl px-4 text-xs font-bold text-text-muted hover:text-text"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryCheckout}
                disabled={isCheckoutLoading}
                className="rounded-xl px-4 text-xs font-bold bg-primary-solid hover:bg-primary-hover text-on-primary flex items-center gap-1.5"
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
