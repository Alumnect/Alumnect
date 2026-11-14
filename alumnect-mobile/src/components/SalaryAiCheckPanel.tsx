import React from 'react'
import { Pressable, View } from 'react-native'
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from '@/components/icons'
import { Txt } from './ui'
import { useTheme } from '@/theme'
import { toMillionText } from '@/api/salary'
import type { SalaryAiCheck } from '@/api/salary'

/**
 * Kết quả AI kiểm tra lương [A1] — đồng bộ SalaryAiCheckPanel của Web:
 * xanh (hợp lý) / vàng (cần xác nhận) / đỏ (chặn), dải lương thị trường, mẫu nội bộ AlumNect và nút "Sửa nhanh".
 */
export function SalaryAiCheckPanel({ result, enteredAmount, jobTitle, onApplySuggestion, disabled }: {
  result: SalaryAiCheck
  enteredAmount?: number
  jobTitle?: string
  onApplySuggestion: (amountVnd: number) => void
  disabled?: boolean
}) {
  const t = useTheme()
  const tone = result.isBlocked ? 'danger' : result.requiresConfirmation ? 'warning' : 'success'
  const color = { danger: t.danger, warning: t.warning, success: t.success }[tone]
  const bg = { danger: t.dangerTint, warning: t.warningTint, success: t.successTint }[tone]
  const Icon = result.isBlocked ? ShieldAlert : result.requiresConfirmation ? AlertTriangle : CheckCircle2
  const title = result.isBlocked ? 'Cảnh báo' : result.requiresConfirmation ? 'Mức lương khác thường — vui lòng kiểm tra lại' : 'Mức lương hợp lý so với thị trường'

  const m = result.realMarketRange
  const internal = result.alumnectInternalRange
  const hasInternal = !!internal && internal.sampleCount > 0 && internal.medianVnd != null
  const amount = enteredAmount && enteredAmount > 0 ? enteredAmount : m.medianVnd
  const range = (min: number, max: number, median: number) => `${toMillionText(min)} - ${toMillionText(max)} triệu/tháng (trung vị ${toMillionText(median)})`
  const hint = result.suggestedCorrectedAmountVnd
    ? ` Gợi ý: ${toMillionText(result.suggestedCorrectedAmountVnd)} triệu (${result.suggestedCorrectedAmountVnd.toLocaleString('vi-VN')} VND).`
    : ''
  const amountText = `${amount.toLocaleString('vi-VN')} VND`

  const advisory = result.advisoryMessageVi || (
    result.isBlocked
      ? `Mức lương ${amountText} cao hơn trần thị trường ${result.anomalyPercentage}% — quá bất thường nên không thể đăng để bảo vệ chất lượng dữ liệu. Bạn có nhập dư chữ số 0 không?${hint}`
      : result.status === 'HIGH_ANOMALY_ALLOWED'
        ? `Mức lương cao hơn trần thị trường ${result.anomalyPercentage}%. Nếu đúng là lương thực nhận (VD thưởng lớn, vị trí đặc thù) bạn có thể xác nhận gửi; nếu nhầm số, hãy sửa lại.${hint}`
        : result.status === 'BELOW_MARKET_WARNING'
          ? `Mức lương ${amountText} thấp hơn nhiều so với mặt bằng (${range(m.minVnd, m.maxVnd, m.medianVnd)}). Bạn có gõ thiếu chữ số 0 không?${hint} Nếu đúng là mức lương thực tế, bạn vẫn có thể xác nhận gửi.`
          : 'Mức lương hợp lý so với thị trường. Cảm ơn bạn đã đóng góp dữ liệu!'
  )
  const role = jobTitle?.trim() || 'vị trí này'
  const base = `Mặt bằng thị trường cho ${role} phổ biến ${range(m.minVnd, m.maxVnd, m.medianVnd)}.`
  const comparison = result.marketComparisonVi || (
    amount > m.maxVnd
      ? `${base} Mức bạn nhập (${toMillionText(amount)} triệu) vượt trần thị trường phổ biến.`
      : amount < m.minVnd
        ? `${base} Mức bạn nhập (${toMillionText(amount)} triệu) thấp hơn mức tối thiểu phổ biến.`
        : `${base} Mức bạn nhập (${toMillionText(amount)} triệu) nằm quanh phân vị P${m.percentileEstimate} của thị trường.`
  )
  const showFix = result.suggestedCorrectedAmountVnd != null && (result.isBlocked || result.requiresConfirmation)

  return (
    <View accessibilityLiveRegion="polite" style={{ borderRadius: 16, borderWidth: 1, borderColor: color, backgroundColor: bg, padding: 14, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon size={18} color={color} />
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <Txt weight="700" color={color}>{title}</Txt>
          <Txt size={13} style={{ lineHeight: 20 }}>{advisory}</Txt>
          <View style={{ borderRadius: 12, backgroundColor: t.card, paddingHorizontal: 12, paddingVertical: 8, gap: 4 }}>
            <Txt muted size={12}>
              <Txt size={12} weight="600">Thị trường VN: </Txt>
              {`${range(m.minVnd, m.maxVnd, m.medianVnd)} · bạn ở khoảng P${m.percentileEstimate}`}
            </Txt>
            {hasInternal ? (
              <Txt muted size={12}>
                <Txt size={12} weight="600">{`AlumNect (${internal!.sampleCount} mẫu): `}</Txt>
                {range(internal!.minVnd ?? internal!.medianVnd!, internal!.maxVnd ?? internal!.medianVnd!, internal!.medianVnd!)}
              </Txt>
            ) : null}
          </View>
          <Txt muted size={12} style={{ lineHeight: 18 }}>{comparison}</Txt>
          {showFix ? (
            <Pressable
              disabled={disabled}
              onPress={() => onApplySuggestion(result.suggestedCorrectedAmountVnd as number)}
              accessibilityRole="button"
              style={({ pressed }) => ({ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.primary, opacity: disabled ? 0.6 : pressed ? 0.85 : 1 })}
            >
              <Sparkles size={14} color="#fff" />
              <Txt size={12} weight="700" color="#fff">{`Sửa nhanh thành ${result.suggestedCorrectedAmountVnd!.toLocaleString('vi-VN')} VNĐ`}</Txt>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}
