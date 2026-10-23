import React, { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { Text, TextInput } from '@/components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SlidersHorizontal, X } from '@/components/icons'
import { Button, Txt } from './ui'
import { useTheme, radius } from '@/theme'

export type FilterOption = { value: string; label: string }
export type FilterField =
  | { key: string; title: string; type: 'single'; options: FilterOption[] }
  | { key: string; title: string; type: 'multi'; options: FilterOption[] }
  | { key: string; title: string; type: 'text'; placeholder?: string; numeric?: boolean }
export type FilterValues = Record<string, string | string[] | undefined>

/** Đếm số bộ lọc đang bật (bỏ qua giá trị rỗng). */
export function countActive(values: FilterValues, ignore: string[] = []) {
  return Object.entries(values).filter(([k, v]) => !ignore.includes(k) && (Array.isArray(v) ? v.length > 0 : !!v)).length
}

/** Nút "Bộ lọc" có số đếm, đặt cạnh ô tìm kiếm. */
export function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  const t = useTheme()
  const active = count > 0
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Bộ lọc, đang bật ${count}` : 'Bộ lọc'}
      style={({ pressed }) => ({
        height: 42,
        minWidth: 42,
        paddingHorizontal: active ? 12 : 0,
        borderRadius: radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: active ? t.primary : t.inputBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <SlidersHorizontal size={18} color={active ? t.onPrimary : t.text} />
      {active ? <Text style={{ color: t.onPrimary, fontWeight: '800', fontSize: 13 }}>{count}</Text> : null}
    </Pressable>
  )
}

function OptionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        backgroundColor: active ? t.primaryTint : t.card,
      }}
    >
      <Text style={{ color: active ? t.primary : t.text, fontWeight: active ? '700' : '500', fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

function SheetBody({ title, fields, initial, defaults, onApply, onClose }: { title: string; fields: FilterField[]; initial: FilterValues; defaults: FilterValues; onApply: (v: FilterValues) => void; onClose: () => void }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<FilterValues>(initial)
  const set = (k: string, v: string | string[] | undefined) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '88%', backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
      <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Đóng">
          <X size={22} color={t.text} />
        </Pressable>
        <Txt size={17} weight="800" style={{ flex: 1, textAlign: 'center' }}>{title}</Txt>
        <Pressable onPress={() => setDraft(defaults)} hitSlop={10} accessibilityRole="button">
          <Text style={{ color: t.primary, fontWeight: '700' }}>Đặt lại</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {fields.map((f) => (
          <View key={f.key} style={{ marginBottom: 18 }}>
            <Txt weight="700" style={{ marginBottom: 10 }}>{f.title}</Txt>
            {f.type === 'text' ? (
              <TextInput
                value={(draft[f.key] as string) ?? ''}
                onChangeText={(v) => set(f.key, f.numeric ? v.replace(/\D/g, '') : v)}
                placeholder={f.placeholder}
                placeholderTextColor={t.textSubtle}
                keyboardType={f.numeric ? 'number-pad' : 'default'}
                style={{ backgroundColor: t.inputBg, color: t.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
              />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {f.options.map((o) => {
                  const cur = draft[f.key]
                  const active = f.type === 'multi' ? Array.isArray(cur) && cur.includes(o.value) : (cur ?? '') === o.value
                  return (
                    <OptionChip
                      key={o.value || '__all'}
                      label={o.label}
                      active={active}
                      onPress={() => {
                        if (f.type === 'multi') {
                          const arr = Array.isArray(cur) ? cur : []
                          set(f.key, active ? arr.filter((x) => x !== o.value) : [...arr, o.value])
                        } else {
                          set(f.key, o.value || undefined)
                        }
                      }}
                    />
                  )
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: t.divider }}>
        <Button title="Huỷ" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <Button
          title="Xem kết quả"
          onPress={() => {
            onApply(draft)
            onClose()
          }}
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

/** Bottom sheet bộ lọc dùng chung: chọn một, chọn nhiều, hoặc nhập chữ. */
export function FilterSheet({
  visible,
  onClose,
  title = 'Bộ lọc',
  fields,
  values,
  defaults = {},
  onApply,
}: {
  visible: boolean
  onClose: () => void
  title?: string
  fields: FilterField[]
  values: FilterValues
  defaults?: FilterValues
  onApply: (v: FilterValues) => void
}) {
  const t = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.overlay }} onPress={onClose} />
        {visible ? <SheetBody title={title} fields={fields} initial={values} defaults={defaults} onApply={onApply} onClose={onClose} /> : null}
      </View>
    </Modal>
  )
}
