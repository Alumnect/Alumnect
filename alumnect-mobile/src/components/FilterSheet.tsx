import React, { useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text, TextInput } from '@/components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, SlidersHorizontal, X } from '@/components/icons'
import { Button, Txt } from './ui'
import { useTheme, radius } from '@/theme'
import { selectionLabel, SelectOptions, SelectTrigger } from './SelectField'

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
        minHeight: 48,
        minWidth: 48,
        paddingHorizontal: active ? 12 : 0,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: active ? t.action : t.inputBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <SlidersHorizontal size={18} color={active ? t.onAction : t.text} />
      {active ? <Text style={{ color: t.onAction, fontWeight: '600', fontSize: 13 }}>{count}</Text> : null}
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
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? t.text : t.controlBorder,
        backgroundColor: active ? t.inputBg : t.card,
      }}
    >
      <Text style={{ color: t.text, fontWeight: active ? '600' : '400', fontSize: 13, lineHeight: 20 }}>{label}</Text>
    </Pressable>
  )
}

function SheetBody({ title, fields, initial, defaults, onApply, onClose, picker, setPicker }: { title: string; fields: FilterField[]; initial: FilterValues; defaults: FilterValues; onApply: (v: FilterValues) => void; onClose: () => void; picker: string | null; setPicker: (key: string | null) => void }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<FilterValues>(initial)
  const { height } = useWindowDimensions()
  const set = (k: string, v: string | string[] | undefined) => setDraft((d) => ({ ...d, [k]: v }))
  const active = fields.find((f) => f.key === picker)
  const choice = active && active.type !== 'text' ? active : null
  const back = () => { Keyboard.dismiss(); setPicker(null) }
  const selected = (key: string) => { const value = draft[key]; return Array.isArray(value) ? value : value ? [value] : [] }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '88%', backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
      <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        <Pressable onPress={choice ? back : onClose} accessibilityRole="button" accessibilityLabel={choice ? 'Quay lại bộ lọc' : 'Đóng'} style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          {choice ? <ChevronLeft size={22} color={t.text} /> : <X size={22} color={t.text} />}
        </Pressable>
        <Txt size={18} weight="600" style={{ flex: 1 }}>{choice?.title ?? title}</Txt>
        <Pressable onPress={() => choice ? set(choice.key, choice.type === 'multi' ? [] : undefined) : setDraft(defaults)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: t.primary, fontWeight: '700' }}>{choice ? 'Bỏ chọn' : 'Đặt lại'}</Text>
        </Pressable>
      </View>
      {choice ? <View style={{ height: Math.min(height * 0.55, 440), flexShrink: 1 }}><SelectOptions key={choice.key} options={choice.options} values={selected(choice.key)} multiple={choice.type === 'multi'} onSelect={(value) => {
        const values = selected(choice.key)
        set(choice.key, choice.type === 'multi' ? values.includes(value) ? values.filter((v) => v !== value) : [...values, value] : value || undefined)
        if (choice.type === 'single') back()
      }} /></View> : <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {fields.map((f) => (
          <View key={f.key} style={{ marginBottom: 18 }}>
            <Txt weight="700" style={{ marginBottom: 16 }}>{f.title}</Txt>
            {f.type === 'text' ? (
              <TextInput
                value={(draft[f.key] as string) ?? ''}
                onChangeText={(v) => set(f.key, f.numeric ? v.replace(/\D/g, '') : v)}
                placeholder={f.placeholder}
                accessibilityLabel={f.title}
                placeholderTextColor={t.textSubtle}
                keyboardType={f.numeric ? 'number-pad' : 'default'}
                style={{ minHeight: 50, backgroundColor: t.card, borderWidth: 1, borderColor: t.controlBorder, color: t.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
              />
            ) : f.options.length > 4 ? (
              <SelectTrigger label={f.title} summary={selectionLabel(f.options, selected(f.key))} placeholder={f.type === 'multi' ? 'Tất cả' : f.options.find((o) => !o.value)?.label ?? 'Tất cả'} onPress={() => { Keyboard.dismiss(); setPicker(f.key) }} onClear={selected(f.key).length ? () => set(f.key, f.type === 'multi' ? [] : undefined) : undefined} />
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
      </ScrollView>}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: t.divider }}>
        {choice ? <Button title="Xong" onPress={back} style={{ flex: 1 }} /> : <><Button title="Huỷ" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <Button
          title="Xem kết quả"
          onPress={() => {
            onApply(draft)
            onClose()
          }}
          style={{ flex: 2 }}
        /></>}
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
  const [picker, setPicker] = useState<string | null>(null)
  const close = () => { Keyboard.dismiss(); setPicker(null); onClose() }
  const dismiss = () => { if (picker) { Keyboard.dismiss(); setPicker(null) } else close() }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.overlay }} onPress={dismiss} />
        {visible ? <SheetBody title={title} fields={fields} initial={values} defaults={defaults} onApply={onApply} onClose={close} picker={picker} setPicker={setPicker} /> : null}
      </View>
    </Modal>
  )
}
