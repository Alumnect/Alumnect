import React, { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'lucide-react-native'
import { useTheme } from '@/theme'

/** Chọn ngày + giờ (Android: hiện lần lượt hộp ngày rồi giờ). Giá trị là chuỗi ISO local 'YYYY-MM-DDTHH:mm:ss'. */
export function DateField({ label, value, onChange, error }: { label?: string; value: string; onChange: (iso: string) => void; error?: string }) {
  const t = useTheme()
  const [step, setStep] = useState<'date' | 'time' | null>(null)
  const date = value ? new Date(value) : new Date()
  const [draft, setDraft] = useState(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '600', marginBottom: 6, fontSize: 13 }}>{label}</Text> : null}
      <Pressable
        onPress={() => { setDraft(date); setStep('date') }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.inputBg, borderRadius: 12, borderWidth: 1, borderColor: error ? t.danger : t.border, paddingHorizontal: 14, paddingVertical: 12 }}
      >
        <Calendar size={18} color={t.textMuted} />
        <Text style={{ color: value ? t.text : t.textMuted, fontSize: 15 }}>{value ? new Date(value).toLocaleString('vi-VN') : 'Chọn ngày giờ'}</Text>
      </Pressable>
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      {step ? (
        <DateTimePicker
          value={draft}
          mode={step}
          is24Hour
          minimumDate={step === 'date' ? new Date() : undefined}
          onChange={(e, d) => {
            if (e.type === 'dismissed' || !d) return setStep(null)
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
