import React, { useDeferredValue, useMemo, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Text } from '@/components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, ChevronDown, X } from '@/components/icons'
import { Button, IconButton, SearchBar, Txt } from './ui'
import { normalize } from '@/constants/filters'
import { useTheme, radius } from '@/theme'

export type SelectOption = { value: string; label: string }

export function selectionLabel(options: SelectOption[], values: string[]) {
  const names = options.filter((o) => values.includes(o.value)).map((o) => o.label)
  if (!names.length) return values.some(Boolean) ? `Đã chọn ${values.length}` : ''
  return values.length > 2 || values.length > names.length ? `${names.slice(0, 2).join(', ')} +${values.length - Math.min(names.length, 2)}` : names.join(', ')
}

/** Shared collapsed control; the parent chooses where to display the option list. */
export function SelectTrigger({ label, summary, placeholder, onPress, onClear, expanded = false, error }: {
  label: string; summary: string; placeholder: string; onPress: () => void; onClear?: () => void; expanded?: boolean; error?: string
}) {
  const t = useTheme()
  return <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 12, paddingLeft: 14, paddingRight: 8, backgroundColor: t.card, borderWidth: 1, borderColor: error ? t.danger : t.controlBorder }}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded }} accessibilityValue={{ text: summary || placeholder }} aria-expanded={expanded} aria-valuetext={summary || placeholder} style={{ flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Txt style={{ flex: 1 }} color={summary ? t.text : t.textSubtle} numberOfLines={1}>{summary || placeholder}</Txt>
      <ChevronDown size={18} color={t.textMuted} />
    </Pressable>
    {onClear ? <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel={`Xóa lựa chọn ${label}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><X size={16} color={t.textMuted} /></Pressable> : null}
  </View>
}

/** Render inside the existing modal, avoiding nested modals and nested virtual lists. */
export function SelectOptions({ options, values, multiple = false, onSelect }: {
  options: SelectOption[]; values: string[]; multiple?: boolean; onSelect: (value: string) => void
}) {
  const t = useTheme()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filtered = useMemo(() => {
    const key = normalize(deferredQuery)
    return key ? options.filter((o) => normalize(o.label).includes(key)) : options
  }, [options, deferredQuery])
  return <View style={{ flex: 1, minHeight: 0 }}>
    {options.length > 5 ? <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm lựa chọn..." style={{ paddingHorizontal: 16, marginBottom: 8 }} /> : null}
    <FlashList
      style={{ flex: 1 }}
      data={filtered}
      extraData={values}
      keyExtractor={(o) => o.value}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => {
        const active = values.includes(item.value) || (!multiple && !values.length && item.value === '')
        return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: active }} aria-checked={active} accessibilityLabel={item.label} onPress={() => onSelect(item.value)} style={({ pressed }) => ({ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? t.inputBg : active ? t.surface : t.card })}>
          <Txt style={{ flex: 1 }} weight={active ? '600' : '400'}>{item.label}</Txt>
          {active ? <Check size={18} color={t.primary} /> : null}
        </Pressable>
      }}
      ListEmptyComponent={<Txt muted style={{ textAlign: 'center', padding: 24 }}>Không có kết quả phù hợp.</Txt>}
    />
  </View>
}

type FieldProps = {
  label?: string; options: SelectOption[]; placeholder?: string; error?: string; clearable?: boolean
}

function SelectionField({ label, options, placeholder = 'Chọn...', error, clearable = true, values, onChange, multiple = false }: FieldProps & {
  values: string[]; onChange: (values: string[]) => void; multiple?: boolean
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [open, setOpen] = useState(false)
  const summary = selectionLabel(options, values)
  const close = () => { Keyboard.dismiss(); setOpen(false) }
  const sheetHeight = Math.min(height * 0.8, Math.max(180, Math.min(options.length, 7) * 52 + 92 + (options.length > 5 ? 64 : 0) + (multiple ? 66 : 0) + insets.bottom))
  return <View style={{ marginBottom: 14 }}>
    {label ? <Text style={{ color: t.text, fontWeight: '500', marginBottom: 8, fontSize: 14 }}>{label}</Text> : null}
    <SelectTrigger label={label ?? placeholder} summary={summary} placeholder={placeholder} expanded={open} error={error} onPress={() => setOpen(true)} onClear={clearable && values.some(Boolean) ? () => onChange([]) : undefined} />
    {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'android' ? insets.top : 0}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng danh sách lựa chọn" style={{ position: 'absolute', inset: 0, backgroundColor: t.overlay }} onPress={close} />
        <View style={{ height: sheetHeight, maxHeight: '85%', backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + 8 }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, gap: 8 }}>
            <Txt heading size={18} weight="600" style={{ flex: 1 }}>{label ?? placeholder}</Txt>
            {multiple && clearable ? <Button title="Bỏ chọn" variant="ghost" size="sm" disabled={!values.length} onPress={() => onChange([])} /> : null}
            <IconButton filled={false} label="Đóng danh sách" icon={<X size={20} color={t.textMuted} />} onPress={close} />
          </View>
          {open ? <SelectOptions options={options} values={values} multiple={multiple} onSelect={(value) => {
            onChange(multiple ? values.includes(value) ? values.filter((v) => v !== value) : [...values, value] : [value])
            if (!multiple) close()
          }} /> : null}
          {multiple ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Button title="Xong" onPress={close} /></View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>
}

/** Mobile dropdown with a searchable option list for larger datasets. */
export function SelectField({ value, onChange, ...props }: FieldProps & { value: string | null | undefined; onChange: (value: string | null) => void }) {
  return <SelectionField {...props} values={value == null ? [] : [value]} onChange={(values) => onChange(values[0] ?? null)} />
}

export function MultiSelectField({ values, onChange, ...props }: FieldProps & { values: string[]; onChange: (values: string[]) => void }) {
  return <SelectionField {...props} values={values} onChange={onChange} multiple />
}
