import React, { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button, Input, Txt } from './ui'
import { placesConfigured, resolvePlace, searchPlaces, type GeocodedPlace, type PlaceSuggestion } from '@/lib/places'
import { useTheme } from '@/theme'
import { errMsg } from '@/lib/toast'

export function PlaceField({ value, hasCoordinates, onChange, onSelect, onResolving }: {
  value: string; hasCoordinates?: boolean; onChange: (text: string) => void; onSelect: (place: GeocodedPlace) => void; onResolving?: (loading: boolean) => void
}) {
  const t = useTheme()
  const [edited, setEdited] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const active = useRef<AbortController | null>(null)
  const sequence = useRef(0)

  useEffect(() => {
    if (!placesConfigured || !edited || value.trim().length < 2) return
    const controller = new AbortController()
    active.current = controller
    const current = ++sequence.current
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try { const result = await searchPlaces(value, controller.signal); if (current === sequence.current && !controller.signal.aborted) setSuggestions(result) }
      catch (e) { if (!controller.signal.aborted && current === sequence.current) { setSuggestions([]); setError(errMsg(e)) } }
      finally { if (!controller.signal.aborted && current === sequence.current) setLoading(false) }
    }, 400)
    return () => { clearTimeout(timer); controller.abort() }
  }, [value, edited, retry])

  useEffect(() => () => { active.current?.abort(); sequence.current++ }, [])

  const choose = async (suggestion: PlaceSuggestion) => {
    active.current?.abort()
    const controller = new AbortController(), current = ++sequence.current
    active.current = controller
    setLoading(true); setError(''); onResolving?.(true)
    try {
      const place = await resolvePlace(suggestion, controller.signal)
      if (current !== sequence.current || controller.signal.aborted) return
      setEdited(false); setSuggestions([]); onSelect(place)
    } catch (e) { if (!controller.signal.aborted && current === sequence.current) setError(errMsg(e)) }
    finally { if (current === sequence.current) { setLoading(false); onResolving?.(false) } }
  }
  return <View style={{ marginBottom: 12 }}>
    <Input label="Địa điểm" value={value} onChangeText={(text) => { active.current?.abort(); sequence.current++; onResolving?.(false); setSuggestions([]); setLoading(false); setEdited(true); setError(''); onChange(text) }} placeholder="Nhập địa chỉ công ty..." />
    {loading ? <Txt muted size={12}>Đang tìm vị trí...</Txt> : hasCoordinates ? <Txt muted size={12}>Đã gắn vị trí trên bản đồ.</Txt> : value ? <Txt muted size={12}>{placesConfigured ? 'Chọn gợi ý để gắn vị trí trên bản đồ.' : 'Bạn có thể lưu địa chỉ; gợi ý vị trí hiện chưa sẵn sàng.'}</Txt> : null}
    {error ? <><Txt color={t.danger} size={12}>{error}</Txt><Button title="Tìm lại địa điểm" variant="ghost" onPress={() => { setEdited(true); setRetry((n) => n + 1) }} /></> : null}
    {suggestions.length ? <View style={{ marginTop: 8, borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
      {suggestions.map((s) => <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`Chọn địa điểm ${s.label}`} onPress={() => void choose(s)} style={({ pressed }) => ({ minHeight: 48, padding: 12, backgroundColor: pressed ? t.inputBg : t.card })}><Txt size={13}>{s.label}</Txt></Pressable>)}
    </View> : null}
  </View>
}
