import React, { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Text } from '@/components/AppText'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from '@/components/icons'
import { useTheme } from '@/theme'

/** Chọn ngày + giờ (Android: hiện lần lượt hộp ngày rồi giờ). Giá trị là chuỗi ISO local 'YYYY-MM-DDTHH:mm:ss'. */
export function DateField({ label, value, onChange, error, minimumDate = new Date(), dateOnly = false }: { label?: string; value: string; onChange: (iso: string) => void; error?: string; minimumDate?: Date | null; dateOnly?: boolean }) {
  const t = useTheme()
  const [step, setStep] = useState<'date' | 'time' | null>(null)
  const parsed = value ? new Date(dateOnly ? `${value}T12:00:00` : value) : new Date()
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const [draft, setDraft] = useState(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '500', marginBottom: 8, fontSize: 14 }}>{label}</Text> : null}
      <Pressable
        onPress={() => { setDraft(date); setStep('date') }}
        accessibilityRole="button"
        accessibilityLabel={label ?? (dateOnly ? 'Chọn ngày' : 'Chọn ngày giờ')}
        style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderRadius: 12, borderWidth: 1, borderColor: error ? t.danger : t.controlBorder, paddingHorizontal: 14, paddingVertical: 12 }}
      >
        <Calendar size={18} color={t.textMuted} />
        <Text style={{ color: value ? t.text : t.textMuted, fontSize: 15 }}>{value ? dateOnly ? date.toLocaleDateString('vi-VN') : date.toLocaleString('vi-VN') : dateOnly ? 'Chọn ngày' : 'Chọn ngày giờ'}</Text>
      </Pressable>
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      {step ? (
        <DateTimePicker
          value={draft}
          mode={step}
          is24Hour
          minimumDate={step === 'date' ? minimumDate ?? undefined : undefined}
          onChange={(e, d) => {
            if (e.type === 'dismissed' || !d) return setStep(null)
            if (dateOnly) { setStep(null); onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); return }
            if (step === 'date') {
              const next = new Date(d)
              next.setHours(draft.getHours(), draft.getMinutes())
              setDraft(next)
              setStep(Platform.OS === 'android' ? 'time' : null)
              if (Platform.OS !== 'android') onChange(toIso(next))
            } else {
              const next = new Date(draft)
              next.setHours(d.getHours(), d.getMinutes())
              setStep(null)
              onChange(toIso(next))
            }
          }}
        />
      ) : null}
    </View>
  )
}
