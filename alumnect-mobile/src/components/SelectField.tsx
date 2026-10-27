import React, { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, View } from 'react-native'
import { Text } from '@/components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, ChevronDown, X } from '@/components/icons'
import { IconButton, SearchBar, Txt } from './ui'
import { normalize } from '@/constants/filters'
import { useTheme, radius } from '@/theme'

export type SelectOption = { value: string; label: string }

/** Ô chọn một giá trị: chạm để mở danh sách dạng bottom sheet, có ô tìm khi danh sách dài. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
  error,
  clearable = true,
}: {
  label?: string
  value: string | null | undefined
  options: SelectOption[]
  onChange: (v: string | null) => void
  placeholder?: string
  error?: string
  clearable?: boolean
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const k = normalize(q)
    return k ? options.filter((o) => normalize(o.label).includes(k)) : options
  }, [options, q])

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '500', marginBottom: 8, fontSize: 14 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 12, paddingLeft: 14, paddingRight: 8, backgroundColor: t.card, borderWidth: 1, borderColor: error ? t.danger : t.controlBorder }}>
        <Pressable
          onPress={() => { setQ(''); setOpen(true) }}
          accessibilityRole="button"
          accessibilityLabel={label ?? placeholder}
          style={{ flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Txt style={{ flex: 1 }} color={current ? t.text : t.textSubtle} numberOfLines={2}>{current?.label ?? placeholder}</Txt>
          <ChevronDown size={18} color={t.textMuted} />
        </Pressable>
        {clearable && current ? (
          <Pressable onPress={(e) => { e.stopPropagation(); onChange(null) }} accessibilityRole="button" accessibilityLabel="Xoá lựa chọn" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.overlay }} onPress={() => setOpen(false)} />
          <View style={{ maxHeight: '80%', backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + 8 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, gap: 8 }}>
              <Txt heading size={18} weight="600" style={{ flex: 1 }}>{label ?? placeholder}</Txt>
              <IconButton filled={false} label="Đóng danh sách" icon={<X size={20} color={t.textMuted} />} onPress={() => setOpen(false)} />
            </View>
            {options.length > 8 ? <SearchBar value={q} onChangeText={setQ} placeholder="Tìm..." style={{ paddingHorizontal: 16, marginBottom: 6 }} /> : null}
            <FlatList
              data={filtered}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onChange(item.value)
                      setOpen(false)
                    }}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: pressed ? t.inputBg : 'transparent' })}
                  >
                    <Txt style={{ flex: 1 }} weight={active ? '700' : '400'} color={active ? t.primary : t.text}>{item.label}</Txt>
                    {active ? <Check size={18} color={t.primary} /> : null}
                  </Pressable>
                )
              }}
              ListEmptyComponent={<Txt muted style={{ textAlign: 'center', padding: 24 }}>Không có kết quả phù hợp.</Txt>}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}
