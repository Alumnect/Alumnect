import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PlaceData {
  location: string
  latitude: number
  longitude: number
  placeId: string
  locationCity?: string
  locationCountry?: string
  locationCountryCode?: string
  geocodingProvider: string
}

interface PlaceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (place: PlaceData | null) => void
  placeholder?: string
  inputClassName?: string
}

interface SuggestionItem {
  id: string
  refId?: string
  title: string
  subtitle: string
  fullLocation: string
  lat: number
  lng: number
  city?: string
  country?: string
  countryCode?: string
  provider: 'VIETMAP' | 'NOMINATIM' | 'MAPTILER'
}

// Hàm chuẩn hóa & ghép số nhà (nếu có trong ô tìm kiếm) vào tên địa chỉ gợi ý từ Vietmap/Nominatim
function getFormattedSuggestionName(sugName: string, searchQuery: string): string {
  let displayAddress = sugName.trim()
  const houseNumberRegex = /^((?:kiệt|k|hẻm|ngõ)?\s*\d+[\w\/\-\.]*)/i
  const queryMatch = searchQuery.trim().match(houseNumberRegex)

  if (queryMatch) {
    const houseNumber = queryMatch[1]
    const cleanDisplayName = displayAddress.trim()

    const digitMatch = houseNumber.match(/\d+/)
    const digitPart = digitMatch ? digitMatch[0] : null

    let alreadyHasHouseNumber = false
    if (digitPart) {
      const checkRegex = new RegExp(`\\b${digitPart}(?!\\d)`, 'i')
      alreadyHasHouseNumber = checkRegex.test(cleanDisplayName)
    } else {
      alreadyHasHouseNumber = cleanDisplayName.toLowerCase().includes(houseNumber.toLowerCase())
    }

    if (!alreadyHasHouseNumber) {
      const sugMatch = cleanDisplayName.match(/^(\d+[\w\/\-\.]*)\s*,?\s*/)
      if (sugMatch) {
        displayAddress = `${houseNumber}, ${cleanDisplayName.slice(sugMatch[0].length)}`
      } else {
        displayAddress = `${houseNumber} ${cleanDisplayName}`
      }
    }
  }
  return displayAddress
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nhập số nhà, tên tòa nhà, địa chỉ công ty...',
  inputClassName,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const VIETMAP_KEY = (
    import.meta.env.VITE_VIETMAP_API_KEY || '5ccc4cd6f70448296dcc3ce29a3d34958dd4b86eef43fa46'
  ).trim()
  const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_API_KEY || '').trim()


  // Debounce logic khi nhập
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([])
      return
    }

    // Không tìm kiếm lại nếu input trùng với địa chỉ vừa chọn
    const isExactMatch = suggestions.some((s) => s.fullLocation === value || s.title === value)
    if (isExactMatch) return

    const timer = setTimeout(() => {
      fetchVietmapSuggestions(value.trim())
    }, 350)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const fetchVietmapSuggestions = async (query: string) => {
    setLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    const results: SuggestionItem[] = []

    try {
      // 1. Thử gọi Vietmap Autocomplete v4 (Chuẩn địa chỉ Việt Nam 100%)
      if (VIETMAP_KEY) {
        try {
          const res = await fetch(
            `https://maps.vietmap.vn/api/autocomplete/v4?apikey=${VIETMAP_KEY}&text=${encodeURIComponent(
              query
            )}&display_type=2`,
            { signal: controller.signal }
          )
          const data = await res.json()

          if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              let city = ''
              if (item.boundaries && Array.isArray(item.boundaries)) {
                for (const b of item.boundaries) {
                  if (b.type === 0) city = b.full_name || b.name || ''
                }
              } else if (item.data_old) {
                city = item.data_old.city || ''
              }

              const rawDisplay =
                item.display ||
                (item.name && item.address ? `${item.name}, ${item.address}` : item.name || item.address || '')

              const formattedDisplay = getFormattedSuggestionName(rawDisplay, query)
              const titleName = getFormattedSuggestionName(item.name || item.address || rawDisplay, query)

              results.push({
                id: `vietmap-${item.ref_id || Math.random()}`,
                refId: item.ref_id,
                title: titleName,
                subtitle: formattedDisplay,
                fullLocation: formattedDisplay,
                lat: parseFloat(item.lat || item.lng ? item.lat : '0'),
                lng: parseFloat(item.lng || item.lat ? item.lng : '0'),
                city: city || 'Việt Nam',
                country: 'Việt Nam',
                countryCode: 'vn',
                provider: 'VIETMAP',
              })
            }
          }
        } catch (e: any) {
          if (e.name === 'AbortError') throw e
          console.warn('Vietmap autocomplete error, trying fallback:', e)
        }
      }

      // 2. VietMap tập trung vào Việt Nam. Nếu kết quả không thực sự khớp
      // với từ khóa (ví dụ nhập "San Jose" nhưng trả về "Joseph's" ở Hà Nội),
      // chuyển sang Nominatim để tìm kiếm toàn cầu.
      const normalizedQuery = normalizeSearchText(query)
      const hasRelevantVietmapResult = results.some((result) => {
        const queryTokens = normalizedQuery.split(' ').filter(Boolean)
        const locationTokens = new Set(normalizeSearchText(result.fullLocation).split(' ').filter(Boolean))
        return queryTokens.length > 0 && queryTokens.every((token) => locationTokens.has(token))
      })

      if (!hasRelevantVietmapResult) {
        results.length = 0

        // 3. Nếu không phải địa chỉ Việt Nam, dùng MapTiler Geocoding API
        // để tìm kiếm toàn cầu.
        if (MAPTILER_KEY) {
          try {
            const mapTilerRes = await fetch(
              `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&autocomplete=true&limit=6&language=vi,en`,
              { signal: controller.signal }
            )
            const mapTilerData = await mapTilerRes.json()
            const features = Array.isArray(mapTilerData?.features) ? mapTilerData.features : []

            for (const feature of features) {
              const coordinates = feature.geometry?.coordinates
              if (!Array.isArray(coordinates) || coordinates.length < 2) continue

              const context = Array.isArray(feature.context) ? feature.context : []
              const cityContext = context.find((item: any) =>
                /^(place|locality|municipality|region)\./.test(item.id || '')
              )
              const countryContext = context.find((item: any) => /^country\./.test(item.id || ''))
              const shortCode = String(
                feature.properties?.short_code || countryContext?.short_code || ''
              ).split('-').pop()?.toUpperCase() || ''
              const city = feature.place_type?.includes('place')
                ? feature.text
                : cityContext?.text || feature.text || ''
              const country = countryContext?.text || (
                feature.place_type?.includes('country') ? feature.text : ''
              )
              const displayName = feature.place_name || feature.text || query

              results.push({
                id: `maptiler-${feature.id || Math.random()}`,
                title: feature.text || displayName.split(',')[0],
                subtitle: displayName,
                fullLocation: displayName,
                lat: Number(coordinates[1]),
                lng: Number(coordinates[0]),
                city,
                country,
                countryCode: shortCode,
                provider: 'MAPTILER',
              })
            }
          } catch (e: any) {
            if (e.name === 'AbortError') throw e
            console.warn('MapTiler geocoding error, trying Nominatim fallback:', e)
          }
        }

        // 4. Fallback cuối cùng cho trường hợp MapTiler không có kết quả.
        try {
          let nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&addressdetails=1&limit=6&accept-language=vi,en`,
            {
              signal: controller.signal,
              headers: { 'User-Agent': 'AlumNectApp/1.0' },
            }
          )
          let nomData = await nomRes.json()

          // Nếu không ra kết quả, tự động bóc tách số nhà (VD: "108 Nam Kỳ Khởi Nghĩa" -> bóc "108" search "Nam Kỳ Khởi Nghĩa")
          if (!Array.isArray(nomData) || nomData.length === 0) {
            const houseNumberRegex = /^((?:kiệt|k|hẻm|ngõ)?\s*\d+[\w\/\-\.]*)\s+/i
            const match = query.match(houseNumberRegex)
            if (match) {
              const strippedQuery = query.slice(match[0].length).trim()
              if (strippedQuery) {
                const fallbackRes = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    strippedQuery
                  )}&addressdetails=1&limit=6&accept-language=vi,en`,
                  {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'AlumNectApp/1.0' },
                  }
                )
                nomData = await fallbackRes.json()
              }
            }
          }

          if (Array.isArray(nomData)) {
            for (const item of nomData) {
              const formattedDisplay = getFormattedSuggestionName(item.display_name, query)
              const titleName = getFormattedSuggestionName(item.display_name.split(',')[0], query)

              results.push({
                id: `nominatim-${item.place_id}`,
                title: titleName,
                subtitle: formattedDisplay,
                fullLocation: formattedDisplay,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                city: item.address?.city || item.address?.town || item.address?.village || item.address?.state || '',
                country: item.address?.country || '',
                countryCode: item.address?.country_code?.toUpperCase() || '',
                provider: 'NOMINATIM',
              })
            }
          }
        } catch (e: any) {
          if (e.name === 'AbortError') throw e
          console.warn('Nominatim geocoding fallback error:', e)
        }
      }

      setSuggestions(results)
      setOpen(prev => prev ? results.length > 0 : false)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Lỗi khi tìm địa điểm Vietmap:', err)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const handleSelectSuggestion = async (s: SuggestionItem) => {
    let lat = s.lat
    let lng = s.lng
    let city = s.city || ''
    let displayLocation = s.fullLocation

    // Nếu là gợi ý từ Vietmap và có refId, lấy thông tin chi tiết qua Place v3 API
    if (s.provider === 'VIETMAP' && s.refId && VIETMAP_KEY) {
      try {
        setLoading(true)
        const detailsRes = await fetch(
          `https://maps.vietmap.vn/api/place/v3?apikey=${VIETMAP_KEY}&refid=${encodeURIComponent(s.refId)}`
        )
        const details = await detailsRes.json()
        if (details) {
          if (details.lat != null && details.lng != null) {
            lat = details.lat
            lng = details.lng
          }
          if (details.city) city = details.city
          const rawDetailAddress = details.display || details.address || s.fullLocation
          displayLocation = getFormattedSuggestionName(rawDetailAddress, value)
        }
      } catch (err) {
        console.error('Lỗi Vietmap Place details API:', err)
      } finally {
        setLoading(false)
      }
    }

    const place: PlaceData = {
      location: displayLocation,
      latitude: lat,
      longitude: lng,
      placeId: s.id,
      locationCity: city,
      locationCountry: s.country || 'Việt Nam',
      locationCountryCode: s.countryCode || 'vn',
      geocodingProvider: s.provider,
    }

    onChange(displayLocation)
    onSelect(place)
    setSuggestions([])
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    onChange(text)
    setOpen(true)
  }

  const handleClear = () => {
    onChange('')
    onSelect(null)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-plum-400">
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          placeholder={placeholder}
          className={cn("w-full rounded-2xl border border-plum-900/10 bg-white py-3 pl-10 pr-10 text-sm text-plum-900 placeholder-plum-400 shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500", inputClassName)}
        />
        {loading && (
          <span className="absolute right-10 text-plum-400">
            <Loader2 size={16} className="animate-spin text-brand-500" />
          </span>
        )}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-plum-400 hover:text-plum-700 hover:bg-plum-900/[0.04]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full max-h-72 overflow-y-auto rounded-2xl border border-plum-900/5 bg-white p-2.5 shadow-xl list-none text-left">
          {suggestions.map((s) => (
            <li
              key={s.id}
              onClick={() => handleSelectSuggestion(s)}
              className="flex items-start gap-3 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-plum-50/70 transition-colors"
            >
              <span className="mt-0.5 text-brand-500 shrink-0">
                <MapPin size={16} />
              </span>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-plum-900 break-words">{s.title}</p>
                <p className="text-xs text-plum-500 mt-0.5 leading-relaxed break-words">
                  {s.subtitle}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
