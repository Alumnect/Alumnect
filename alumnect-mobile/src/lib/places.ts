import type { ExperienceLocation } from '@/api/explore'

export interface GeocodedPlace extends ExperienceLocation {
  location: string
  latitude: number
  longitude: number
}
export interface PlaceSuggestion {
  id: string
  label: string
  provider: 'VIETMAP' | 'MAPTILER'
  refId?: string
  place?: GeocodedPlace
}

const vietmapKey = (process.env.EXPO_PUBLIC_VIETMAP_API_KEY ?? '').trim()
const maptilerKey = (process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? '').trim()
export const placesConfigured = !!(vietmapKey || maptilerKey)

async function getJson(url: string, signal: AbortSignal) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal.addEventListener('abort', abort)
  if (signal.aborted) abort()
  const timeout = setTimeout(abort, 12000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('Không thể tra cứu địa điểm. Vui lòng thử lại.')
    return await response.json()
  } catch (e) {
    if (signal.aborted) throw e
    throw new Error(controller.signal.aborted ? 'Dịch vụ địa điểm phản hồi chậm. Vui lòng thử lại.' : 'Không thể tra cứu địa điểm. Vui lòng thử lại.')
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort) }
}
function coordinates(latitude: unknown, longitude: unknown) {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') throw new Error('Địa điểm chưa có tọa độ hợp lệ.')
  const lat = Number(latitude), lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Địa điểm chưa có tọa độ hợp lệ.')
  return { latitude: lat, longitude: lng }
}

/** Configured providers only; no public Nominatim autocomplete or bundled API keys. */
export async function searchPlaces(query: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2) return []
  if (vietmapKey) {
    const data = await getJson(`https://maps.vietmap.vn/api/autocomplete/v4?apikey=${encodeURIComponent(vietmapKey)}&text=${encodeURIComponent(query.trim())}&display_type=5`, signal)
    if (!Array.isArray(data)) throw new Error('Dịch vụ địa điểm trả về dữ liệu không hợp lệ.')
    return data.filter((p) => p.ref_id && (p.display || p.name)).slice(0, 6).map((p) => ({ id: String(p.ref_id), refId: String(p.ref_id), label: String(p.display || p.name), provider: 'VIETMAP' }))
  }
  if (!maptilerKey) throw new Error('Gợi ý địa điểm chưa sẵn sàng. Bạn vẫn có thể nhập địa chỉ.')
  const data = await getJson(`https://api.maptiler.com/geocoding/${encodeURIComponent(query.trim())}.json?key=${encodeURIComponent(maptilerKey)}&language=vi,en&limit=6&autocomplete=true`, signal)
  if (!Array.isArray(data.features)) throw new Error('Dịch vụ địa điểm trả về dữ liệu không hợp lệ.')
  return data.features.flatMap((p: any) => {
    try {
      const point = coordinates(p.center?.[1], p.center?.[0])
      const country = p.context?.find((c: any) => String(c.id).startsWith('country.'))
      const city = p.context?.find((c: any) => /^(place|municipality|region)\./.test(String(c.id)))
      const label = String(p.place_name || p.text || '')
      if (!label || !p.id) return []
      return [{ id: String(p.id), label, provider: 'MAPTILER' as const, place: { location: label, ...point, placeId: String(p.id), locationCity: city?.text ?? null, locationCountry: country?.text ?? null, locationCountryCode: country?.short_code?.toUpperCase() ?? null, geocodingProvider: 'MAPTILER' } }]
    } catch { return [] }
  })
}

export async function resolvePlace(suggestion: PlaceSuggestion, signal: AbortSignal): Promise<GeocodedPlace> {
  if (suggestion.place) return suggestion.place
  if (suggestion.provider !== 'VIETMAP' || !suggestion.refId || !vietmapKey) throw new Error('Không thể lấy vị trí đã chọn.')
  // Autocomplete v4 references must be resolved with Place v4, not Place v3.
  const detail = await getJson(`https://maps.vietmap.vn/api/place/v4?apikey=${encodeURIComponent(vietmapKey)}&refid=${encodeURIComponent(suggestion.refId)}`, signal)
  return { location: detail.display || suggestion.label, ...coordinates(detail.lat, detail.lng), placeId: suggestion.refId, locationCity: detail.city || null, locationCountry: 'Việt Nam', locationCountryCode: 'VN', geocodingProvider: 'VIETMAP' }
}
