import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'

interface PlaceData {
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
  initialLocationCity?: string
  initialLocationCountry?: string
  initialLocationCountryCode?: string
}

export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Tìm địa điểm, thành phố...',
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_API_KEY ?? '').trim()

  // Debounce logic
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!value || value.length < 2) {
      setSuggestions([])
      return
    }

    // Don't search if the input exactly matches a selected place name (to avoid searching again after select)
    const isExactMatch = suggestions.some(s => s.place_name === value)
    if (isExactMatch) return

    const timer = setTimeout(() => {
      fetchSuggestions(value)
    }, 400)

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

  const fetchSuggestions = async (query: string) => {
    if (!MAPTILER_KEY) return

    setLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5`,
        { signal: controller.signal }
      )
      const data = await res.json()
      if (data && data.features) {
        setSuggestions(data.features)
        setOpen(true)
      } else {
        setSuggestions([])
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Lỗi khi tìm kiếm địa điểm:', err)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const handleSelect = (feature: any) => {
    const coords = feature.geometry?.coordinates ?? [0, 0]
    const lng = coords[0]
    const lat = coords[1]
    const name = feature.place_name ?? ''

    // Parse context for city and country
    let city = feature.text ?? ''
    let country = ''
    let countryCode = ''

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id?.startsWith('country')) {
          country = ctx.text ?? ''
          countryCode = ctx.short_code ?? ''
        }
        if (ctx.id?.startsWith('place') || ctx.id?.startsWith('city')) {
          city = ctx.text ?? ''
        }
      }
    }

    const place: PlaceData = {
      location: name,
      latitude: lat,
      longitude: lng,
      placeId: feature.id ?? '',
      locationCity: city,
      locationCountry: country,
      locationCountryCode: countryCode,
      geocodingProvider: 'MAPTILER',
    }

    onChange(name)
    onSelect(place)
    setSuggestions([])
    setOpen(false)
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
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 pl-10 pr-10 text-sm text-plum-900 placeholder-plum-400 shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {loading && (
          <span className="absolute right-10 text-plum-400">
            <Loader2 size={16} className="animate-spin" />
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
        <ul className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-2xl border border-plum-900/5 bg-white p-2.5 shadow-lg list-none">
          {suggestions.map((s) => (
            <li
              key={s.id}
              onClick={() => handleSelect(s)}
              className="flex items-start gap-3 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-plum-50/50 transition-colors"
            >
              <span className="mt-0.5 text-brand-500 shrink-0">
                <MapPin size={16} />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-plum-900">{s.text}</p>
                <p className="text-xs text-plum-400 mt-0.5 leading-normal">{s.place_name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
