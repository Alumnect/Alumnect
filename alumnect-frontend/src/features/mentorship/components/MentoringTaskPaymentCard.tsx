import { CheckCircle2, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, toast } from '@/components/ui'
import { downloadInvoicePdf } from '@/lib/invoicePdf'
import type { MentoringPaymentSummary } from '../model/mentoringTaskTypes'

interface MentoringTaskPaymentCardProps {
  payment?: MentoringPaymentSummary | null
  taskId?: number
  taskTitle?: string
  studentName?: string
  studentEmail?: string
}

function formatPaidAt(dateStr?: string | null, isEn = false) {
  if (!dateStr) return null

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null

  const locale = isEn ? 'en-GB' : 'vi-VN'
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  const day = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return `${time} · ${day}`
}

export function MentoringTaskPaymentCard({
  payment,
  taskId,
  taskTitle,
  studentName,
  studentEmail,
}: MentoringTaskPaymentCardProps) {
  const { i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')
  if (!payment) return null

  const paidAt = formatPaidAt(payment.paidAt, isEn)
  const formatVnd = (amt?: number | null) =>
    new Intl.NumberFormat('vi-VN').format(typeof amt === 'number' ? amt : 0) + (isEn ? ' VND' : 'đ')

  const handleDownloadPaymentInvoice = async () => {
    try {
      const code = `INV-PAY-${payment.orderCode || taskId || payment.paymentId}`
      const issuedDate = paidAt || new Date().toLocaleString(isEn ? 'en-GB' : 'vi-VN')
      const titleText = isEn ? 'PAYMENT INVOICE (LEARNER SIDE)' : 'HÓA ĐƠN THANH TOÁN YÊU CẦU (PHÍA HỌC VIÊN)'
      const html = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'vi'}">
<head>
  <meta charset="UTF-8" />
  <title>${titleText} - ${code}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 32px; }
    .invoice { max-width: 680px; margin: 0 auto; background: #ffffff; color: #000000; border: 1px solid #cbd5e1; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(15,23,42,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f27024; padding-bottom: 20px; margin-bottom: 24px; color: #000000; }
    .logo-wordmark { font-family: 'Caveat', 'Segoe Script', 'Comic Sans MS', cursive; font-size: 42px; font-weight: 700; line-height: 1; display: inline-block; }
    .logo-alum { color: #0a58ca; }
    .logo-nect { color: #c84b11; }
    .subtitle { font-size: 13px; font-weight: 700; color: #000000; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.4px; }
    .meta { text-align: right; font-size: 13px; color: #000000; line-height: 1.6; }
    .meta div { color: #000000; }
    .meta strong { color: #000000; font-weight: 700; }
    .task-title { margin-bottom: 18px; font-size: 14px; line-height: 1.6; color: #000000; word-break: break-all; }
    .task-title strong { color: #000000; }
    .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; background: #f8fafc; color: #000000; }
    .card h3 { margin: 0 0 14px 0; font-size: 15px; color: #000000; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 14px; color: #000000; }
    .row span { color: #000000; font-weight: 600; }
    .row strong { color: #000000; font-weight: 700; }
    .row.fee, .row.fee span { color: #dc2626 !important; font-weight: 700; }
    .row.total, .row.total span { border-top: 1px dashed #94a3b8; margin-top: 10px; padding-top: 12px; font-size: 16px; font-weight: 800; color: #0284c7 !important; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #334155; text-align: center; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo-wordmark"><span class="logo-alum">Alum</span><span class="logo-nect">Nect</span></div>
        <div class="subtitle">${isEn ? 'INVOICE FOR LEARNER SIDE' : 'HÓA ĐƠN PHÍA HỌC VIÊN'}</div>
      </div>
      <div class="meta">
        <div>${isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong>${code}</strong></div>
        <div>${isEn ? 'Order Code:' : 'Mã giao dịch PayOS:'} <strong>#${payment.orderCode}</strong></div>
        <div>${isEn ? 'Paid Date:' : 'Thời gian thanh toán:'} <strong>${issuedDate}</strong></div>
      </div>
    </div>

    ${taskTitle ? `<div class="task-title"><strong>${isEn ? 'Task:' : 'Nhiệm vụ:'}</strong> ${taskTitle}</div>` : ''}

    <div class="card">
      <h3>${isEn ? 'PAYMENT DETAILS (LEARNER SIDE)' : 'CHI TIẾT THANH TOÁN YÊU CẦU (PHÍA HỌC VIÊN)'}</h3>
      ${studentName ? `<div class="row"><span>${isEn ? 'Payer:' : 'Người thanh toán:'}</span><strong>${studentName}${studentEmail ? ` (${studentEmail})` : ''}</strong></div>` : ''}
      <div class="row"><span>${isEn ? 'Agreed Amount:' : 'Số tiền thỏa thuận:'}</span><strong>${formatVnd(payment.amount)}</strong></div>
      <div class="row"><span>${isEn ? 'Platform Fee on Payment:' : 'Phí nền tảng khi thanh toán:'}</span><strong style="color:#16a34a;">${formatVnd(0)}</strong></div>
      <div class="row total"><span>${isEn ? 'Total Amount Paid:' : 'Tổng số tiền đã thanh toán:'}</span><span>${formatVnd(payment.amount)}</span></div>
      <div class="row" style="margin-top:8px;"><span>${isEn ? 'Fund Custody Status:' : 'Trạng thái lưu giữ tiền:'}</span><strong>${isEn ? 'Held in full in PayOS' : 'Đang tạm giữ nguyên vẹn trên PayOS'}</strong></div>
    </div>

    <div class="footer">
      ${isEn
          ? 'Electronic payment invoice generated automatically via PayOS & AlumNect.'
          : 'Hóa đơn thanh toán điện tử được khởi tạo tự động qua cổng PayOS & hệ thống AlumNect.'}
    </div>
  </div>
</body>
</html>`
      const fileName = isEn ? `Payment-Invoice-${code}.pdf` : `Hoa-don-Thanh-toan-${code}.pdf`
      toast.info(isEn ? 'Generating payment PDF...' : 'Đang khởi tạo hóa đơn thanh toán PDF...')
      await downloadInvoicePdf(html, fileName)
      toast.success(isEn ? 'Payment invoice (PDF) downloaded!' : 'Đã tải hóa đơn thanh toán (PDF) về máy!')
    } catch {
      toast.error(isEn ? 'Could not download payment invoice.' : 'Không thể tải hóa đơn thanh toán PDF.')
    }
  }

  return (
    <div className="rounded-2xl border border-success-border bg-success-soft px-4 py-3 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-success">
              {isEn ? 'Paid (0 VND Platform Fee)' : 'Đã thanh toán (0đ phí nền tảng)'}
            </p>
            {paidAt && (
              <p className="mt-0.5 text-xs font-medium text-text-subtle">
                {paidAt} · {isEn ? 'Held in PayOS' : 'Đang giữ trên PayOS'}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDownloadPaymentInvoice}
          className="shrink-0 text-xs font-bold gap-1.5 h-8 px-2.5 bg-surface"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isEn ? 'Download Invoice' : 'Tải hóa đơn'}</span>
        </Button>
      </div>
    </div>
  )
}
