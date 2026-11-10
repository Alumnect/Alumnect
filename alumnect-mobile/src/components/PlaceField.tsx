import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { CheckCircle2, MapPin } from '@/components/icons'
import { Text } from '@/components/AppText'
import { Button, Input } from './ui'
import {
  placesConfigured,
  resolvePlace,
  searchPlaces,
  type GeocodedPlace,
  type PlaceSuggestion,
} from '@/lib/places'
import { useTheme } from '@/theme'
import { errMsg } from '@/lib/toast'

export function PlaceField({
  value,
  hasCoordinates,
  onChange,
  onSelect,
  onResolving,
  label = 'Địa điểm',
  placeholder = 'Nhập địa chỉ công ty...',
  error: customError,
}: {
  value: string
  hasCoordinates?: boolean
  onChange: (text: string) => void
  onSelect: (place: GeocodedPlace) => void
  onResolving?: (loading: boolean) => void
  label?: string
  placeholder?: string
  error?: string
}) {
  const t = useTheme()
  const [edited, setEdited] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const active = useRef<AbortController | null>(null)
  const sequence = useRef(0)

  useEffect(() => {
    if (!placesConfigured || !edited || value.trim().length < 2) {
      return
    }
    const controller = new AbortController()
    active.current = controller
    const current = ++sequence.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await searchPlaces(value, controller.signal)
        if (current === sequence.current && !controller.signal.aborted) {
          setSuggestions(result)
          setSuggestionQuery(value)
        }
      } catch (e) {
        if (!controller.signal.aborted && current === sequence.current) {
          setSuggestions([])
          setError(errMsg(e))
        }
      } finally {
        if (!controller.signal.aborted && current === sequence.current) {
          setLoading(false)
        }
      }
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, edited, retry])

  useEffect(() => () => {
    active.current?.abort()
    sequence.current++
  }, [])

  const choose = async (suggestion: PlaceSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    active.current?.abort()
    const controller = new AbortController()
    const current = ++sequence.current
    active.current = controller
    setLoading(true)
    setError('')
    onResolving?.(true)
    try {
      const place = await resolvePlace(suggestion, controller.signal)
      if (current !== sequence.current || controller.signal.aborted) return
      setEdited(false)
      setSuggestions([])
      onSelect(place)
    } catch (e) {
      if (!controller.signal.aborted && current === sequence.current) {
        setError(errMsg(e))
      }
    } finally {
      if (current === sequence.current) {
        setLoading(false)
        onResolving?.(false)
      }
    }
  }

  const effectiveError = customError || error

  return (
    <View style={{ marginBottom: 14 }}>
      <Input
        label={label}
        value={value}
        onChangeText={(text) => {
          active.current?.abort()
          sequence.current++
          onResolving?.(false)
          setSuggestions([])
          setLoading(false)
          setEdited(true)
          setError('')
          onChange(text)
        }}
        placeholder={placeholder}
        error={effectiveError}
      />

      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -12, marginBottom: 8, paddingHorizontal: 4 }}>
          <ActivityIndicator size="small" color={t.primary} />
          <Text style={{ fontSize: 12, color: t.textMuted }}>Đang tìm gợi ý địa chỉ chính xác...</Text>
        </View>
      ) : hasCoordinates ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -12, marginBottom: 8, paddingHorizontal: 4 }}>
          <CheckCircle2 size={13} color={t.success} />
          <Text style={{ fontSize: 12, color: t.success, fontWeight: '500' }}>Đã xác thực vị trí trên bản đồ</Text>
        </View>
      ) : null}

      {effectiveError && !customError ? (
        <View style={{ marginTop: -8, marginBottom: 8 }}>
          <Button
            title="Tìm lại địa điểm"
            variant="ghost"
            size="sm"
            onPress={() => {
              setEdited(true)
              setRetry((n) => n + 1)
            }}
          />
        </View>
      ) : null}

      {/* Danh sách gợi ý địa chỉ xổ xuống */}
      {placesConfigured && edited && value.trim().length >= 2 && suggestionQuery === value && suggestions.length > 0 ? (
        <View
          style={{
            marginTop: -8,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 14,
            backgroundColor: t.card,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {suggestions.map((s, idx) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`Chọn địa điểm ${s.label}`}
              onPress={() => void choose(s)}
              style={({ pressed }) => ({
                minHeight: 52,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: pressed ? t.inputBg : t.card,
                borderBottomWidth: idx < suggestions.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: t.divider,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={16} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }} numberOfLines={1}>
                  {s.label.split(',')[0]}
                </Text>
                <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }} numberOfLines={1}>
                  {s.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
