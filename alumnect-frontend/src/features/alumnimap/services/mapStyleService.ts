/**
 * Map Style Service – Quản lý tập trung logic URL bản đồ nền.
 *
 * Service này đóng gói toàn bộ logic liên quan đến:
 * - Xây dựng URL style cho VietMap và MapTiler
 * - Ánh xạ provider + theme sang style URL cụ thể
 * - Xác định provider hiệu quả (resolve AUTO)
 * - Kiểm tra tọa độ có thuộc lãnh thổ Việt Nam không
 */

import type { MapProvider, MapTheme } from '../model/alumniMapTypes'

// ---------------------------------------------------------------------------
// Bounding box lãnh thổ Việt Nam
// ---------------------------------------------------------------------------

/** Vĩ độ tối thiểu của Việt Nam (cực Nam) */
const VN_LAT_MIN = 8.18
/** Vĩ độ tối đa của Việt Nam (cực Bắc) */
const VN_LAT_MAX = 23.39
/** Kinh độ tối thiểu của Việt Nam (cực Tây) */
const VN_LNG_MIN = 102.14
/** Kinh độ tối đa của Việt Nam (cực Đông) */
const VN_LNG_MAX = 109.46

// ---------------------------------------------------------------------------
// Ma trận style URL
// ---------------------------------------------------------------------------


/**
 * Lấy MapTiler API key từ environment variable.
 * Trả về null nếu không có key hợp lệ.
 */
function getMapTilerKey(): string | null {
  const key = (import.meta.env.VITE_MAPTILER_API_KEY ?? '').trim()
  if (!key || key.toLowerCase().includes('your_')) return null
  return key
}

/**
 * Xây dựng URL style MapTiler từ style ID và API key.
 * @param styleId Mã style MapTiler (ví dụ: 'streets-v4', 'basic-v2')
 * @param apiKey MapTiler API key
 */
export function buildMapTilerStyleUrl(styleId: string, apiKey: string): string {
  return `https://api.maptiler.com/maps/${styleId}/style.json?key=${apiKey}`
}

/**
 * Ma trận ánh xạ (Provider + Theme) → Style ID/URL fragment.
 * Sử dụng constant để dễ maintain và tránh hardcode rải rác.
 */
const MAP_STYLE_MATRIX = {
  VIETMAP: {
    DEFAULT: 'tm',   // Đường phố VietMap
    MINIMAL: 'lm',   // Light map
    DARK:    'dm',   // Dark map
    PASTEL:  'lm',
    SATELLITE: 'tm',
  },
  MAPTILER: {
    DEFAULT: 'streets-v4',    // Đường phố toàn cầu
    MINIMAL: 'basic-v2',      // Tối giản
    DARK:    'dataviz-dark',  // Đêm tối
    PASTEL:  'pastel',        // Pastel dịu nhẹ (Premium design)
    SATELLITE: 'hybrid',       // Vệ tinh địa hình
  },
} as const satisfies Record<Exclude<MapProvider, 'AUTO'>, Record<MapTheme, string>>

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Kiểm tra xem tọa độ có nằm trong lãnh thổ Việt Nam không.
 * Dùng bounding box gần đúng – đủ để phân loại provider AUTO.
 *
 * @param lng Kinh độ (Longitude)
 * @param lat Vĩ độ (Latitude)
 * @returns true nếu tọa độ thuộc Việt Nam
 */
export function isCoordinateInVietnam(lng: number, lat: number): boolean {
  return (
    lat >= VN_LAT_MIN &&
    lat <= VN_LAT_MAX &&
    lng >= VN_LNG_MIN &&
    lng <= VN_LNG_MAX
  )
}

/**
 * Xác định provider hiệu quả từ yêu cầu và thông tin vị trí.
 * Trong chế độ AUTO, suy diễn từ tọa độ (fallback) hoặc countryCode (ưu tiên).
 *
 * @param requested Provider được người dùng yêu cầu (có thể là AUTO)
 * @param lat Vĩ độ – dùng để resolve AUTO
 * @param lng Kinh độ – dùng để resolve AUTO
 * @param countryCode Mã quốc gia ISO alpha-2 (tùy chọn, ưu tiên hơn tọa độ)
 * @returns Provider thực tế (không phải AUTO)
 */
export function resolveEffectiveProvider(
  _requested: MapProvider,
  _lat?: number,
  _lng?: number,
  _countryCode?: string,
): Exclude<MapProvider, 'AUTO'> {
  // Chỉ sử dụng duy nhất MapTiler
  return 'MAPTILER'
}

/**
 * Resolve URL style bản đồ hoàn chỉnh từ provider và theme.
 *
 * Ghi chú kỹ thuật (Compatibility Spike result):
 * - VietMap cung cấp vector tiles ở định dạng proprietary (tile types 3, 4, 6, 7)
 *   không được MapLibre GL JS (standard) parse được.
 * - MapLibre chỉ hỗ trợ MVT (Mapbox Vector Tile) chuẩn OpenMapTiles.
 * - Do đó, VietMap provider hiện dùng CARTO raster tiles cho khu vực VN.
 * - Khi VietMap cung cấp raster tile endpoint hoặc MVT-compatible style,
 *   thay thế phần VIETMAP bằng URL thực tế.
 *
 * @param provider Provider đã được resolve (không phải AUTO)
 * @param theme Chủ đề bản đồ
 * @returns URL style JSON hoặc inline style object
 */
export function resolveMapStyle(
  _provider: Exclude<MapProvider, 'AUTO'>,
  theme: MapTheme,
): string | Record<string, unknown> {
  // Chỉ sử dụng MapTiler theo yêu cầu của hệ thống (MapTiler làm map engine duy nhất)
  const key = getMapTilerKey()
  if (key) {
    const styleId = MAP_STYLE_MATRIX.MAPTILER[theme]
    return buildMapTilerStyleUrl(styleId, key)
  }
  
  // Fallback về CARTO raster tiles khi không có MapTiler key
  console.warn('[MapStyleService] Thiếu VITE_MAPTILER_API_KEY – fallback sang CARTO raster tiles')
  return buildCartoRasterFallback(theme)
}

// ---------------------------------------------------------------------------
// CARTO Raster Fallback (khi không có MapTiler key)
// ---------------------------------------------------------------------------

/**
 * Xây dựng inline raster style object sử dụng CARTO tiles.
 * Dùng làm fallback khi không có MapTiler API key.
 * VietmapGL/MapLibre hỗ trợ raster source type hoàn toàn.
 *
 * @param theme Chủ đề bản đồ
 */
function buildCartoRasterFallback(theme: MapTheme): Record<string, unknown> {
  if (theme === 'SATELLITE') {
    return {
      version: 8,
      sources: {
        'satellite-raster': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles © Esri — Source: Esri, GIS User Community',
        },
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-raster',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }
  }

  const configs: Record<Exclude<MapTheme, 'SATELLITE'>, { path: string; name: string }> = {
    DEFAULT: { path: 'rastertiles/voyager',    name: 'voyager' },
    MINIMAL: { path: 'light_all',               name: 'light' },
    DARK:    { path: 'dark_all',                name: 'dark' },
    PASTEL:  { path: 'light_all',               name: 'pastel' },
  }
  const { path, name } = configs[theme]
  const subdomains = ['a', 'b', 'c']

  return {
    version: 8,
    sources: {
      'carto-raster': {
        type: 'raster',
        tiles: subdomains.map((s) => `https://${s}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}@2x.png`),
        tileSize: 256,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: `carto-raster-${name}`,
        type: 'raster',
        source: 'carto-raster',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Style Entries (dùng cho UI theme switcher)
// ---------------------------------------------------------------------------

/**
 * Thông tin một theme style – dùng để render UI buttons.
 */
export interface StyleEntry {
  /** ID duy nhất để compare active state */
  theme: MapTheme
  /** Nhãn hiển thị cho người dùng */
  name: string
}

/** Danh sách các chủ đề có sẵn cho UI switcher */
export const AVAILABLE_THEMES: StyleEntry[] = [
  { theme: 'DEFAULT', name: 'Đường phố' },
  { theme: 'MINIMAL', name: 'Tối giản' },
  { theme: 'DARK',    name: 'Đêm tối' },
  { theme: 'PASTEL',  name: 'Pastel' },
  { theme: 'SATELLITE', name: 'Vệ tinh' },
]
