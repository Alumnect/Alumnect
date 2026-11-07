/**
 * SalaryAiCheckPanel — hiển thị kết quả AI kiểm tra lương [A1] trong modal đóng góp:
 * xanh (hợp lý) / vàng (cần xác nhận) / đỏ (chặn cứng), kèm dải lương thị trường, mẫu nội bộ AlumNect và nút
 * "Sửa nhanh" 1 chạm.
 */
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Lightbulb, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toMillionText } from '../model/salary'
import type { SalaryAiCheck } from '../model/salary'

export function SalaryAiCheckPanel({
  result,
  enteredAmount,
  jobTitle,
  onApplySuggestion,
  disabled,
}: {
  result: SalaryAiCheck
  enteredAmount?: number
  jobTitle?: string
  onApplySuggestion: (amountVnd: number) => void
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')

  const tone = result.isBlocked ? 'danger' : result.requiresConfirmation ? 'warning' : 'success'
  const Icon = result.isBlocked ? ShieldAlert : result.requiresConfirmation ? AlertTriangle : CheckCircle2
  const toneClass = {
    danger: 'border-danger-border bg-danger-soft text-danger',
    warning: 'border-warning-border bg-warning-soft text-warning',
    success: 'border-success-border bg-success-soft text-success',
  }[tone]
  const title = result.isBlocked
    ? t('salary.aiPanelBlocked', 'Cảnh báo')
    : result.requiresConfirmation
      ? t('salary.aiPanelWarning')
      : t('salary.aiPanelNormal')

  const m = result.realMarketRange
  const internal = result.alumnectInternalRange
  const hasInternal = !!internal && internal.sampleCount > 0 && internal.medianVnd != null

  const amount = enteredAmount && enteredAmount > 0
    ? enteredAmount
    : result.suggestedCorrectedAmountVnd
      ? result.suggestedCorrectedAmountVnd * 10
      : m.medianVnd

  const amountFormatted = `${amount.toLocaleString('vi-VN')} VND`
  const hint = result.suggestedCorrectedAmountVnd
    ? t('salary.aiHintSuggestion', {
        suggestedMillion: isEn ? `${toMillionText(result.suggestedCorrectedAmountVnd)}M` : `${toMillionText(result.suggestedCorrectedAmountVnd)} triệu`,
        suggestedVnd: `${result.suggestedCorrectedAmountVnd.toLocaleString('vi-VN')} VND`,
      })
    : ''

  const rangeStr = t('salary.aiRangeText', {
    min: toMillionText(m.minVnd),
    max: toMillionText(m.maxVnd),
    median: toMillionText(m.medianVnd),
  })

  // Đoạn 1: Thông điệp khuyên bảo / cảnh báo (100% đồng bộ theo ngôn ngữ đang chọn)
  let advisory = ''
  if (!isEn && result.advisoryMessageVi) {
    advisory = result.advisoryMessageVi
  } else {
    if (result.isBlocked) {
      advisory = t('salary.aiAdvisoryBlocked', {
        amount: amountFormatted,
        pct: result.anomalyPercentage,
        hint,
      })
    } else if (result.status === 'HIGH_ANOMALY_ALLOWED') {
      advisory = t('salary.aiAdvisoryHigh', {
        pct: result.anomalyPercentage,
        hint,
      })
    } else if (result.status === 'BELOW_MARKET_WARNING') {
      advisory = t('salary.aiAdvisoryLow', {
        amount: amountFormatted,
        range: rangeStr,
        hint,
      })
    } else {
      advisory = t('salary.aiAdvisoryNormal')
    }
  }

  // Đoạn 2: So sánh mặt bằng thị trường (100% đồng bộ theo ngôn ngữ đang chọn)
  let comparison = ''
  if (!isEn && result.marketComparisonVi) {
    comparison = result.marketComparisonVi
  } else {
    const role = jobTitle?.trim() || (isEn ? 'this role' : 'vị trí này')
    const medianStr = isEn ? `${toMillionText(m.medianVnd)}M` : `${toMillionText(m.medianVnd)} triệu`
    const enteredStr = isEn ? `${toMillionText(amount)}M` : `${toMillionText(amount)} triệu`
    if (amount > m.maxVnd) {
      comparison = t('salary.aiComparisonAbove', {
        jobTitle: role,
        range: rangeStr,
        median: medianStr,
        amount: enteredStr,
      })
    } else if (amount < m.minVnd) {
      comparison = t('salary.aiComparisonBelow', {
        jobTitle: role,
        range: rangeStr,
        median: medianStr,
        amount: enteredStr,
      })
    } else {
      comparison = t('salary.aiComparisonAround', {
        jobTitle: role,
        range: rangeStr,
        median: medianStr,
        amount: enteredStr,
        p: m.percentileEstimate,
      })
    }
  }

  return (
    <div role="status" aria-live="polite" className={cn('rounded-2xl border p-3.5 text-sm', toneClass)}>
      <div className="flex items-start gap-2.5">
        <Icon size={18} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-bold">{title}</p>
          {advisory && <p className="leading-relaxed text-text">{advisory}</p>}

          <div className="space-y-1 rounded-xl bg-surface/70 px-3 py-2 text-xs text-text-muted">
            <p>
              <span className="font-semibold text-text">{t('salary.aiMarketLabel')}: </span>
              {t('salary.aiRangeText', { min: toMillionText(m.minVnd), max: toMillionText(m.maxVnd), median: toMillionText(m.medianVnd) })}
              {' · '}
              {t('salary.aiPercentile', { p: m.percentileEstimate })}
            </p>
            {hasInternal && (
              <p>
                <span className="font-semibold text-text">{t('salary.aiInternalLabel', { count: internal!.sampleCount })}: </span>
                {t('salary.aiRangeText', {
                  min: toMillionText(internal!.minVnd ?? internal!.medianVnd!),
                  max: toMillionText(internal!.maxVnd ?? internal!.medianVnd!),
                  median: toMillionText(internal!.medianVnd!),
                })}
              </p>
            )}
          </div>

          {comparison && <p className="text-xs leading-relaxed text-text-muted">{comparison}</p>}

          {result.suggestedCorrectedAmountVnd != null && !(!result.isBlocked && !result.requiresConfirmation) && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onApplySuggestion(result.suggestedCorrectedAmountVnd as number)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary-solid px-3 py-1.5 text-xs font-bold text-on-primary shadow-raised transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lightbulb size={14} />
              {t('salary.aiQuickFix', { val: result.suggestedCorrectedAmountVnd.toLocaleString('vi-VN') })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
