import React, { useDeferredValue, useMemo, useState } from 'react'
import { Image, Keyboard, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Landmark, X } from '@/components/icons'
import { IconButton, SearchBar, Txt } from './ui'
import { SelectTrigger } from './SelectField'
import { SheetModal } from './SheetModal'
import { MeetupRadio } from './MeetupRadio'
import { normalize } from '@/constants/filters'
import { useTheme } from '@/theme'

/** Ngân hàng nhận chuyển khoản nhanh (VietQR) — cùng nguồn với web. */
export interface PayoutBank {
  bin: string
  /** Tên ngắn lưu vào tài khoản, VD: "Vietcombank" */
  name: string
  fullName?: string
  logo?: string
}

const FALLBACK_BANKS: PayoutBank[] = [
  { bin: '970416', name: 'ACB' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970432', name: 'VPBank' },
]

async function fetchPayoutBanks(): Promise<PayoutBank[]> {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks')
    const body = (await res.json()) as {
      code: string
      data: { bin: string; shortName: string; name: string; logo: string; transferSupported: number }[]
    }
    const list = (body.data ?? [])
      .filter((b) => b.transferSupported === 1 && /^\d{6}$/.test(b.bin))
      .map((b) => ({ bin: b.bin, name: b.shortName, fullName: b.name, logo: b.logo }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    return list.length ? list : FALLBACK_BANKS
  } catch {
    return FALLBACK_BANKS
  }
}

export function usePayoutBanks() {
  const q = useQuery({ queryKey: ['vietqr-banks-full'], queryFn: fetchPayoutBanks, staleTime: Infinity })
  return { banks: q.data ?? [], isLoading: q.isLoading }
}

function BankLogo({ bank, size = 28 }: { bank?: PayoutBank; size?: number }) {
  const t = useTheme()
  const box = { width: size * 1.6, height: size, borderRadius: 6, borderWidth: 1, borderColor: t.border, backgroundColor: '#FFFFFF', alignItems: 'center' as const, justifyContent: 'center' as const }
  return bank?.logo ? (
    <View style={box}>
      <Image source={{ uri: bank.logo }} style={{ width: size * 1.5, height: size - 4 }} resizeMode="contain" />
    </View>
  ) : (
    <View style={box}>
      <Landmark size={size * 0.55} color={t.textMuted} />
    </View>
  )
}

/**
 * Dropdown chọn ngân hàng (logo + tên ngắn + tên đầy đủ, có tìm kiếm) giống web.
 * Chọn xong trả về đủ bin + name; dưới ô hiển thị tên đầy đủ và BIN.
 */
export function BankSelectField({ label = 'Ngân hàng', value, savedName, onChange, error }: {
  label?: string
  /** BIN đang chọn */
  value: string | null | undefined
  /** Tên đã lưu (khi BIN không có trong danh sách VietQR) */
  savedName?: string | null
  onChange: (bank: PayoutBank) => void
  error?: string
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const { banks, isLoading } = usePayoutBanks()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)

  const selected = banks.find((b) => b.bin === value) ?? (value ? { bin: value, name: savedName || value } : undefined)
  const filtered = useMemo(() => {
    const key = normalize(deferred)
    return key ? banks.filter((b) => normalize(`${b.name} ${b.fullName ?? ''} ${b.bin}`).includes(key)) : banks
  }, [banks, deferred])

  const close = () => {
    Keyboard.dismiss()
    setOpen(false)
    setQuery('')
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: t.text, fontWeight: '500', marginBottom: 8, fontSize: 14 }}>{label}</Text>
      <SelectTrigger
        label={label}
        summary={selected?.name ?? ''}
        placeholder={isLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng'}
        expanded={open}
        error={error}
        onPress={() => !isLoading && setOpen(true)}
      />
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      {selected ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <BankLogo bank={selected} size={20} />
          <Txt size={12} weight="600" style={{ flex: 1 }} numberOfLines={2}>
            {selected.fullName || selected.name}
          </Txt>
          <View style={{ backgroundColor: t.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Txt size={11} weight="700" muted>
              BIN {selected.bin}
            </Txt>
          </View>
        </View>
      ) : null}

      <SheetModal visible={open} onClose={close} height={height * 0.8} maxHeight={0.85}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, gap: 8 }}>
          <Txt heading size={18} weight="600" style={{ flex: 1 }}>
            Chọn ngân hàng
          </Txt>
          <IconButton filled={false} label="Đóng danh sách" icon={<X size={20} color={t.textMuted} />} onPress={close} />
        </View>
        <View style={{ flex: 1, paddingBottom: insets.bottom + 8 }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm ngân hàng (VCB, MB, Techcombank...)" style={{ paddingHorizontal: 16, marginBottom: 8 }} />
          <FlashList
            style={{ flex: 1 }}
            data={filtered}
            extraData={value}
            keyExtractor={(b) => b.bin}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => {
              const active = item.bin === value
              const pick = () => {
                onChange(item)
                close()
              }
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={item.fullName ? `${item.name} — ${item.fullName}` : item.name}
                  onPress={pick}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: pressed ? t.inputBg : active ? t.surface : t.card,
                  })}
                >
                  <BankLogo bank={item} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt weight={active ? '700' : '600'} numberOfLines={1}>
                      {item.name}
                    </Txt>
                    {item.fullName ? (
                      <Txt size={12} muted numberOfLines={1}>
                        {item.fullName}
                      </Txt>
                    ) : null}
                  </View>
                  <MeetupRadio checked={active} onPress={pick} size={20} />
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <Txt muted style={{ textAlign: 'center', padding: 24 }}>
                Không tìm thấy ngân hàng phù hợp.
              </Txt>
            }
          />
        </View>
      </SheetModal>
    </View>
  )
}
