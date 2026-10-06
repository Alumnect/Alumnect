import { useState, useEffect } from 'react'
import { Copy, Check, Clock, ShieldCheck, QrCode } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { toast } from '@/components/ui/Toast'
import { vnd } from '@/lib/utils'
import type { MentorPaymentCheckoutResponse } from '../model/mentorPaymentTypes'

interface MentorPaymentQrCardProps {
  checkout: MentorPaymentCheckoutResponse
  isPolling?: boolean
}

/**
 * Giải mã chuỗi EMVCo VietQR của PayOS để lấy mã định danh ngân hàng (BIN) và số tài khoản nhận tiền thực tế.
 */
function parseEmvcoVietQr(qr: string): { bin?: string; accountNumber?: string; description?: string } | null {
  if (!qr || !qr.startsWith('000201')) return null
  try {
    const parseTLV = (str: string): Record<string, string> => {
      const res: Record<string, string> = {}
      let i = 0
      while (i < str.length) {
        const tag = str.substring(i, i + 2)
        const len = parseInt(str.substring(i + 2, i + 4), 10)
        if (isNaN(len)) break
        res[tag] = str.substring(i + 4, i + 4 + len)
        i += 4 + len
      }
      return res
    }

    const root = parseTLV(qr)
    let bin: string | undefined
    let accountNumber: string | undefined
    let description: string | undefined

    if (root['38']) {
      const tag38 = parseTLV(root['38'])
      if (tag38['01']) {
        const tag01 = parseTLV(tag38['01'])
        bin = tag01['00']
        accountNumber = tag01['01']
      }
    }

    if (root['62']) {
      const tag62 = parseTLV(root['62'])
      if (tag62['08']) {
        description = tag62['08']
      }
    }

    return { bin, accountNumber, description }
  } catch {
    return null
  }
}

const getBankName = (bin?: string) => {
  if (bin === '970416') return 'ACB (Ngân hàng Á Châu)'
  if (bin === '970422') return 'MBBank (Ngân hàng Quân Đội)'
  if (bin === '970436') return 'Vietcombank'
  if (bin === '970407') return 'Techcombank'
  return bin ? `Ngân hàng (BIN ${bin})` : 'Cổng PayOS Napas 247'
}

/**
 * Component hiển thị mã QR VietQR PayOS và thông tin chuyển khoản ngân hàng (UC93).
 * Hỗ trợ sao chép nhanh STK, số tiền, nội dung CK và đồng hồ đếm ngược phiên thanh toán.
 */
export function MentorPaymentQrCard({ checkout, isPolling = true }: MentorPaymentQrCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  const emvcoData = checkout.qrCodeUrl ? parseEmvcoVietQr(checkout.qrCodeUrl) : null
  const effectiveBin = checkout.bin || emvcoData?.bin
  const effectiveAccountNumber = checkout.accountNumber || emvcoData?.accountNumber
  const effectiveDescription = emvcoData?.description || checkout.description

  // Tính toán thời gian hết hạn phiên thanh toán
  useEffect(() => {
    if (!checkout.paymentExpiresAt) return

    const calculateTimeLeft = () => {
      const diff = Math.floor((new Date(checkout.paymentExpiresAt).getTime() - Date.now()) / 1000)
      return diff > 0 ? diff : 0
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [checkout.paymentExpiresAt])

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Đã sao chép ${fieldName} vào bộ nhớ tạm!`)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const qrImageSrc =
    checkout.qrCodeUrl?.startsWith('data:') || checkout.qrCodeUrl?.startsWith('http')
      ? checkout.qrCodeUrl
      : effectiveBin && effectiveAccountNumber
        ? `https://img.vietqr.io/image/${effectiveBin}-${effectiveAccountNumber}-compact2.png?amount=${checkout.amount}&addInfo=${encodeURIComponent(checkout.description)}`
        : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkout.qrCodeUrl)}`

  return (
    <Card hover={false} className="p-6 sm:p-8 rounded-3xl border border-plum-900/10 bg-white dark:bg-[#242526] shadow-card space-y-6">
      {/* Header trạng thái & Đồng hồ đếm ngược */}
      <div className="flex items-center justify-between border-b border-plum-900/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              Quét Mã VietQR PayOS
            </h3>
            <p className="text-xs text-plum-500">Mở App Ngân hàng hoặc Ví để quét</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={timeLeft > 180 ? 'brand' : 'danger'} icon={<Clock className="h-3 w-3" />}>
            {timeLeft > 0 ? formatCountdown(timeLeft) : 'Hết hạn'}
          </Badge>
        </div>
      </div>

      {/* Vùng hiển thị mã QR Code VietQR */}
      <div className="flex flex-col items-center justify-center rounded-2xl bg-cream-50 dark:bg-[#18191a] p-5 border border-plum-900/5">
        {checkout.qrCodeUrl ? (
          <div className="relative group p-3 bg-white rounded-2xl shadow-sm border border-plum-900/10">
            <img
              src={qrImageSrc}
              alt="Mã VietQR thanh toán PayOS"
              className="h-56 w-56 sm:h-64 sm:w-64 object-contain rounded-xl"
            />
          </div>
        ) : (
          <div className="flex h-56 w-56 items-center justify-center text-plum-400 text-xs">
            Đang tải mã VietQR...
          </div>
        )}

        {isPolling && (
          <div className="mt-3.5 flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            <span>Đang chờ bạn quét mã và chuyển tiền...</span>
          </div>
        )}
      </div>

      {/* Thông tin chuyển khoản chi tiết */}
      <div className="space-y-3 rounded-2xl bg-plum-900/[0.02] p-4 text-xs">
        {/* Số tiền thanh toán */}
        <div className="flex items-center justify-between py-1.5 border-b border-plum-900/5">
          <span className="text-plum-500">Số tiền cần thanh toán</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
              {vnd(checkout.amount)}
            </span>
            <button
              onClick={() => copyToClipboard(checkout.amount.toString(), 'Số tiền')}
              className="text-plum-400 hover:text-brand-600 transition-colors"
              title="Sao chép số tiền"
            >
              {copiedField === 'Số tiền' ? <Check className="h-3.5 w-3.5 text-mint-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Ngân hàng thụ hưởng */}
        <div className="flex items-center justify-between py-1.5 border-b border-plum-900/5">
          <span className="text-plum-500">Ngân hàng thụ hưởng</span>
          <span className="font-semibold text-plum-900 dark:text-[#e4e6eb]">
            {getBankName(effectiveBin)}
          </span>
        </div>

        {/* Số tài khoản */}
        {effectiveAccountNumber && (
          <div className="flex items-center justify-between py-1.5 border-b border-plum-900/5">
            <span className="text-plum-500">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-plum-900 dark:text-[#e4e6eb]">
                {effectiveAccountNumber}
              </span>
              <button
                onClick={() => copyToClipboard(effectiveAccountNumber, 'Số tài khoản')}
                className="text-plum-400 hover:text-brand-600 transition-colors"
                title="Sao chép số tài khoản"
              >
                {copiedField === 'Số tài khoản' ? <Check className="h-3.5 w-3.5 text-mint-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Tên chủ tài khoản */}
        <div className="flex items-center justify-between py-1.5 border-b border-plum-900/5">
          <span className="text-plum-500">Chủ tài khoản</span>
          <span className="font-semibold text-plum-900 dark:text-[#e4e6eb]">
            {checkout.accountName || 'PAYOS / NGUOI THU HUONG'}
          </span>
        </div>

        {/* Nội dung chuyển khoản */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-plum-500">Nội dung chuyển khoản</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md text-xs sm:text-sm">
              {effectiveDescription}
            </span>
            <button
              onClick={() => copyToClipboard(effectiveDescription, 'Nội dung chuyển khoản')}
              className="text-plum-400 hover:text-brand-600 transition-colors"
              title="Sao chép nội dung chuyển khoản"
            >
              {copiedField === 'Nội dung chuyển khoản' ? <Check className="h-3.5 w-3.5 text-mint-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>



      {/* Cam kết bảo mật */}
      <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-plum-400">
        <ShieldCheck className="h-3.5 w-3.5 text-mint-600" />
        <span>Thanh toán bảo mật trực tiếp qua Napas 247 & PayOS</span>
      </div>
    </Card>
  )
}
