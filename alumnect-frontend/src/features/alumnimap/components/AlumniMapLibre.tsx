/**
 * AlumniMapLibre – Component bản đồ Alumni sử dụng MapLibre GL JS làm engine duy nhất.
 *
 * Kiến trúc:
 * - Một map instance duy nhất trong suốt vòng đời component
 * - VietMap style cho khu vực Việt Nam
 * - MapTiler style (hoặc CARTO raster fallback) cho quốc tế
 * - Alumni markers dùng HTML Marker với Avatar portal
 * - GeoJSON source cho alumni data (tái dùng sau khi đổi style)
 * - Compatibility: Tương thích cả VietMap style JSON lẫn MapTiler style JSON
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Avatar } from '@/components/ui'
import { AlumniDetailCard } from './AlumniDetailCard'
import {
  resolveMapStyle,
  resolveEffectiveProvider,
  isCoordinateInVietnam,
  AVAILABLE_THEMES,
  type StyleEntry,
} from '../services/mapStyleService'
import type { MapProvider, MapTheme, AlumniMapItem, MapSwitchingState } from '../model/alumniMapTypes'

// ---------------------------------------------------------------------------
// Map Context – chia sẻ map instance với các component con
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Hằng số GeoJSON source/layer IDs
// ---------------------------------------------------------------------------

// Hằng số IDs dùng cho GeoJSON source/layer – sẽ dùng khi mở rộng cluster
// hiện tại markers dùng HTML Marker API
// const ALUMNI_SOURCE_ID = 'alumni-source'
// const ALUMNI_CLUSTER_LAYER_ID = 'alumni-clusters'
// const ALUMNI_CLUSTER_COUNT_LAYER_ID = 'alumni-cluster-count'
// const ALUMNI_POINT_LAYER_ID = 'alumni-points'
/** ID source overlay Hoàng Sa/Trường Sa */
const VIETNAM_ISLANDS_SOURCE_ID = 'vietnam-islands'
/** ID layer nhãn Hoàng Sa/Trường Sa */
const VIETNAM_ISLANDS_LABEL_LAYER_ID = 'vietnam-islands-labels'

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface AlumniMapLibreProps {
  /** Danh sách alumni hiển thị trên bản đồ */
  alumniList: AlumniMapItem[]
  /** Callback khi người dùng click vào marker alumni */
  onSelectAlumni: (alumni: AlumniMapItem) => void
  /** Callback khi người dùng đóng popup */
  onCloseAlumni?: () => void
  /** ID của alumni đang được chọn (để highlight marker) */
  selectedAlumniId?: string
  /** Tọa độ tâm bản đồ [longitude, latitude] */
  mapCenter?: [number, number]
  /** Provider bản đồ do MapPage điều khiển */
  mapProvider: MapProvider
  /** Chủ đề bản đồ */
  mapTheme: MapTheme
  /** Callback khi trạng thái switching thay đổi (để hiển thị loading indicator) */
  onSwitchingStateChange?: (state: MapSwitchingState) => void
}

// ---------------------------------------------------------------------------
// AlumniMapLibre Component
// ---------------------------------------------------------------------------

/**
 * Component bản đồ cựu sinh viên – sử dụng MapLibre GL JS làm engine duy nhất.
 * VietMap và MapTiler chỉ đóng vai trò cung cấp style và tile data.
 */
export function AlumniMapLibre({
  alumniList,
  onSelectAlumni,
  onCloseAlumni,
  selectedAlumniId,
  mapCenter,
  mapProvider,
  mapTheme,
  onSwitchingStateChange,
}: AlumniMapLibreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  /** Token chống race condition khi người dùng đổi provider liên tục */
  const styleRequestIdRef = useRef(0)
  /** Provider đang thực sự đang dùng (để tránh setStyle không cần thiết) */
  const currentProviderRef = useRef<string>('')

  // ---------------------------------------------------------------------------
  // Khởi tạo map một lần duy nhất
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Xác định style khởi tạo dựa trên trạng thái ban đầu
    const initialProvider = resolveEffectiveProvider(mapProvider)
    const initialStyle = resolveMapStyle(initialProvider, mapTheme)
    currentProviderRef.current = initialProvider

    console.info('[AlumniMapLibre] Khởi tạo MapLibre GL JS instance với provider:', initialProvider)

    const map = new maplibregl.Map({
      container: containerRef.current,
      // @ts-expect-error – MapLibre chấp nhận cả string URL lẫn style object
      style: initialStyle,
      center: mapCenter ?? [108.2022, 16.0544], // Mặc định: Đà Nẵng
      zoom: 5.5,
      attributionControl: {},
    })

    // Thêm nút điều hướng (zoom in/out, compass)
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    map.on('load', () => {
      console.info('[AlumniMapLibre] Map đã load xong')
      setIsMapLoaded(true)
    })

    map.on('error', (e) => {
      console.error('[AlumniMapLibre] Lỗi map:', e?.error?.message ?? e)
    })

    mapRef.current = map
    setMapInstance(map)

    return () => {
      console.info('[AlumniMapLibre] Unmount – hủy map instance')
      map.remove()
      mapRef.current = null
      setMapInstance(null)
      setIsMapLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Chỉ khởi tạo một lần – KHÔNG thêm dependency

  // ---------------------------------------------------------------------------
  // Chuyển đổi provider (khi mapProvider hoặc tọa độ alumni được chọn thay đổi)
  // ---------------------------------------------------------------------------

  /**
   * Token tracking fly-to destination đang pending.
   * Khi style load xong, nếu có pending target, thực hiện flyTo.
   */
  const pendingFlyToRef = useRef<{ center: [number, number]; zoom: number } | null>(null)

  const switchProvider = useCallback(
    async (targetProvider: Exclude<MapProvider, 'AUTO'>, theme: MapTheme) => {
      const map = mapRef.current
      if (!map) return

      const styleKey = `${targetProvider}-${theme}`

      // Tránh đổi style nếu đang dùng cùng provider+theme
      if (currentProviderRef.current === styleKey) return

      // Tăng request ID – để hủy bỏ các request cũ hơn
      const requestId = ++styleRequestIdRef.current

      console.info(`[AlumniMapLibre] Chuyển sang ${targetProvider} / ${theme}`)
      onSwitchingStateChange?.('switching')

      const newStyle = resolveMapStyle(targetProvider, theme)

      try {
        await new Promise<void>((resolve, reject) => {
          // @ts-expect-error – MapLibre chấp nhận cả string URL lẫn style object
          map.setStyle(newStyle, { diff: false })

          const onStyleLoad = () => {
            if (requestId !== styleRequestIdRef.current) { resolve(); return }
            map.off('error', onStyleError)
            resolve()
          }

          const onStyleError = (e: maplibregl.ErrorEvent) => {
            if (requestId !== styleRequestIdRef.current) return
            map.off('style.load', onStyleLoad)
            reject(e.error)
          }

          map.once('style.load', onStyleLoad)
          map.once('error', onStyleError)
        })

        if (requestId !== styleRequestIdRef.current) return

        currentProviderRef.current = styleKey

        // NOTE: Không cần jumpTo – MapLibre tự preserve camera khi setStyle.
        // pendingFlyToRef sẽ được xử lý trong flyTo effect riêng.

        onSwitchingStateChange?.('idle')
      } catch (err) {
        if (requestId !== styleRequestIdRef.current) return
        console.error('[AlumniMapLibre] Lỗi khi đổi style:', err)
        // Fallback: vẫn đặt idle để UI không bị block
        onSwitchingStateChange?.('idle')
      }
    },
    [onSwitchingStateChange]
  )

  // ---------------------------------------------------------------------------
  // Theo dõi thay đổi provider/theme từ MapPage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    // Tính provider thực tế (resolve AUTO nếu cần)
    const selectedAlumni = alumniList.find((a) => a.alumniId === selectedAlumniId)
    const effectiveProvider = resolveEffectiveProvider(
      mapProvider,
      selectedAlumni?.latitude,
      selectedAlumni?.longitude,
      selectedAlumni?.countryCode,
    )

    switchProvider(effectiveProvider, mapTheme)
  }, [mapProvider, mapTheme, selectedAlumniId, isMapLoaded, switchProvider, alumniList])

  // ---------------------------------------------------------------------------
  // FlyTo khi alumni được chọn
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !selectedAlumniId) return

    const alumni = alumniList.find((a) => a.alumniId === selectedAlumniId)
    if (!alumni) return

    // Tọa độ MapLibre phải theo thứ tự [longitude, latitude]
    const isVN = isCoordinateInVietnam(alumni.longitude, alumni.latitude)
    const targetZoom = isVN ? 11 : 10
    const targetCenter: [number, number] = [alumni.longitude, alumni.latitude]

    const fly = () => {
      mapRef.current?.flyTo({
        center: targetCenter,
        zoom: targetZoom,
        duration: 1200,
        essential: true,
      })
      pendingFlyToRef.current = null
    }

    // Nếu style đã load xong: flyTo ngay
    if (mapRef.current.isStyleLoaded()) {
      fly()
    } else {
      // Style đang switch – lưu pending target và chờ style.load
      pendingFlyToRef.current = { center: targetCenter, zoom: targetZoom }
      mapRef.current.once('style.load', fly)
    }
  }, [selectedAlumniId, isMapLoaded, alumniList])

  // ---------------------------------------------------------------------------
  // Theo dõi mapCenter từ bên ngoài (khi không có selectedAlumni)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !mapCenter || selectedAlumniId) return

    const currentCenter = mapRef.current.getCenter()
    const diffLng = Math.abs(currentCenter.lng - mapCenter[0])
    const diffLat = Math.abs(currentCenter.lat - mapCenter[1])

    if (diffLng > 0.001 || diffLat > 0.001) {
      mapRef.current.flyTo({ center: mapCenter, zoom: 5.5, duration: 800 })
    }
  }, [mapCenter, isMapLoaded, selectedAlumniId])

  // ---------------------------------------------------------------------------
  // Load Vietnam Islands overlay (Hoàng Sa/Trường Sa)
  // ---------------------------------------------------------------------------

  const ensureVietnamIslandsOverlay = useCallback(async (map: maplibregl.Map) => {
    let geojsonUrl = (import.meta.env.VITE_VIETNAM_ISLANDS_GEOJSON_URL ?? '').trim()
    if (!geojsonUrl) {
      geojsonUrl = '/vietnam-islands.geojson'
    }

    try {
      if (map.getSource(VIETNAM_ISLANDS_SOURCE_ID)) {
        // Source đã tồn tại – không thêm lại
        return
      }

      const res = await fetch(geojsonUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      map.addSource(VIETNAM_ISLANDS_SOURCE_ID, { type: 'geojson', data })

      // Vẽ vòng tròn màu đỏ rose-500 để biểu thị các đảo rõ ràng trên bản đồ
      map.addLayer({
        id: 'vietnam-islands-points',
        type: 'circle',
        source: VIETNAM_ISLANDS_SOURCE_ID,
        paint: {
          'circle-radius': 5,
          'circle-color': '#f43f5e', // Màu rose-500 nổi bật
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Vẽ nhãn chữ hiển thị chủ quyền Việt Nam cho Hoàng Sa/Trường Sa
      map.addLayer({
        id: VIETNAM_ISLANDS_LABEL_LAYER_ID,
        type: 'symbol',
        source: VIETNAM_ISLANDS_SOURCE_ID,
        minzoom: 3,
        layout: {
          'text-field': ['get', 'nameVi'],
          // Không định nghĩa text-font cứng để tránh lỗi font fallback trên các style khác nhau
          'text-size': 11,
          'text-offset': [0, 0.9],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#be123c', // rose-700
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      })

      console.info('[AlumniMapLibre] Đã load Vietnam Islands overlay thành công')
    } catch (err) {
      console.warn('[AlumniMapLibre] Không thể load Vietnam Islands GeoJSON:', err)
    }
  }, [])

  // Load islands overlay khi map sẵn sàng hoặc khi thay đổi style
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return
    const map = mapRef.current

    // Nạp ngay lúc khởi đầu
    ensureVietnamIslandsOverlay(map)

    // Đăng ký sự kiện style.load để nạp lại mỗi khi chuyển style
    const handleStyleLoad = () => {
      console.info('[AlumniMapLibre] Style loaded event - reload Vietnam Islands overlay')
      ensureVietnamIslandsOverlay(map)
    }

    map.on('style.load', handleStyleLoad)

    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [isMapLoaded, ensureVietnamIslandsOverlay])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px]"
      style={{ position: 'relative' }}
    >
      {/* Các marker và popup được render qua Portal khi map đã load */}
      {mapInstance && isMapLoaded && (
        <AlumniMarkersLayer
          map={mapInstance}
          alumniList={alumniList}
          selectedAlumniId={selectedAlumniId}
          onSelectAlumni={onSelectAlumni}
          onCloseAlumni={onCloseAlumni}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AlumniMarkersLayer – Quản lý vòng đời markers
// ---------------------------------------------------------------------------

interface AlumniMarkersLayerProps {
  map: maplibregl.Map
  alumniList: AlumniMapItem[]
  selectedAlumniId?: string
  onSelectAlumni: (alumni: AlumniMapItem) => void
  onCloseAlumni?: () => void
}

/**
 * Component quản lý tập hợp markers alumni trên bản đồ.
 * Sử dụng Map<id, Marker> để tránh tạo lại marker không cần thiết.
 */
function AlumniMarkersLayer({
  map,
  alumniList,
  selectedAlumniId,
  onSelectAlumni,
  onCloseAlumni,
}: AlumniMarkersLayerProps) {
  return (
    <>
      {alumniList.map((alumni) => (
        <AlumniMarker
          key={alumni.alumniId}
          map={map}
          alumni={alumni}
          isSelected={selectedAlumniId === alumni.alumniId}
          onSelect={onSelectAlumni}
        />
      ))}
      <AlumniPopupController
        map={map}
        alumniList={alumniList}
        selectedAlumniId={selectedAlumniId}
        onCloseAlumni={onCloseAlumni}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// AlumniMarker – Marker đơn lẻ với Avatar
// ---------------------------------------------------------------------------

interface AlumniMarkerProps {
  map: maplibregl.Map
  alumni: AlumniMapItem
  isSelected: boolean
  onSelect: (alumni: AlumniMapItem) => void
}

/**
 * Marker HTML hiển thị avatar cựu sinh viên trên bản đồ.
 * Dùng React Portal để render React content vào DOM element của MapLibre Marker.
 */
function AlumniMarker({ map, alumni, isSelected, onSelect }: AlumniMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const el = document.createElement('div')
    el.style.cursor = 'pointer'
    elementRef.current = el

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([alumni.longitude, alumni.latitude])
      .addTo(map)

    markerRef.current = marker
    forceUpdate((n) => n + 1) // Trigger re-render để Portal được gắn

    return () => {
      marker.remove()
      markerRef.current = null
      elementRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]) // Chỉ tạo lại khi map thay đổi

  // Cập nhật vị trí nếu tọa độ thay đổi
  useEffect(() => {
    markerRef.current?.setLngLat([alumni.longitude, alumni.latitude])
  }, [alumni.longitude, alumni.latitude])

  if (!elementRef.current) return null

  return createPortal(
    <div
      className="relative group flex flex-col items-center"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(alumni)
      }}
    >
      {/* Vòng sáng khi được chọn */}
      <div
        className={`
          flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-soft
          transition-all duration-300 transform group-hover:scale-110
          ${isSelected
            ? 'ring-4 ring-brand-500 scale-110 shadow-glow'
            : 'border border-plum-900/10 hover:border-brand-300'
          }
        `}
      >
        <Avatar
          src={alumni.avatarUrl}
          name={alumni.displayName}
          size={36}
          className="h-9 w-9 rounded-full object-cover"
        />
      </div>
      {/* Mũi tên chỉ xuống */}
      <div
        className={`
          h-2.5 w-2.5 rotate-45 -mt-1.5 transition-all duration-300
          ${isSelected ? 'bg-brand-500' : 'bg-white border-r border-b border-plum-900/10'}
        `}
      />
    </div>,
    elementRef.current
  )
}

// ---------------------------------------------------------------------------
// AlumniPopupController – Quản lý popup khi click marker
// ---------------------------------------------------------------------------

interface AlumniPopupControllerProps {
  map: maplibregl.Map
  alumniList: AlumniMapItem[]
  selectedAlumniId?: string
  onCloseAlumni?: () => void
}

/**
 * Quản lý hiển thị popup thông tin khi alumni được chọn.
 * Dùng maplibregl.Popup với DOM content để tích hợp React component.
 */
function AlumniPopupController({
  map,
  alumniList,
  selectedAlumniId,
  onCloseAlumni,
}: AlumniPopupControllerProps) {
  const activePopupRef = useRef<maplibregl.Popup | null>(null)
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    // Dọn dẹp popup cũ
    if (activePopupRef.current) {
      activePopupRef.current.remove()
      activePopupRef.current = null
      setPopupContainer(null)
    }

    const selectedAlumni = alumniList.find((a) => a.alumniId === selectedAlumniId)
    if (!selectedAlumni) return

    const div = document.createElement('div')
    div.style.width = '380px'

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'bottom',
      offset: [0, -25],
      maxWidth: '400px',
    })
      .setLngLat([selectedAlumni.longitude, selectedAlumni.latitude])
      .setDOMContent(div)
      .addTo(map)

    popup.on('close', () => {
      if (activePopupRef.current === popup) {
        activePopupRef.current = null
        setPopupContainer(null)
        onCloseAlumni?.()
      }
    })

    activePopupRef.current = popup
    setPopupContainer(div)

    return () => {
      popup.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedAlumniId, alumniList])

  // Đóng popup khi click vào vùng trống
  useEffect(() => {
    if (!onCloseAlumni) return

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const target = e.originalEvent?.target as HTMLElement | null
      if (target?.closest('.maplibregl-marker') || target?.closest('.maplibregl-popup')) return
      onCloseAlumni()
    }

    map.on('click', handleMapClick)
    return () => { map.off('click', handleMapClick) }
  }, [map, onCloseAlumni])

  if (!popupContainer || !selectedAlumniId) return null

  const selectedAlumni = alumniList.find((a) => a.alumniId === selectedAlumniId) ?? null

  return createPortal(
    <AlumniDetailCard
      alumni={selectedAlumni ? {
        userId: parseInt(selectedAlumni.alumniId) || 0,
        fullName: selectedAlumni.displayName,
        avatarUrl: selectedAlumni.avatarUrl ?? '',
        currentPosition: selectedAlumni.currentTitle ?? '',
        currentCompany: selectedAlumni.companyName ?? '',
        city: selectedAlumni.city ?? '',
        latitude: selectedAlumni.latitude,
        longitude: selectedAlumni.longitude,
      } : null}
      onClose={() => {
        activePopupRef.current?.remove()
      }}
    />,
    popupContainer
  )
}

// ---------------------------------------------------------------------------
// Re-exports tiện ích cho MapPage
// ---------------------------------------------------------------------------

export { resolveEffectiveProvider, AVAILABLE_THEMES, type StyleEntry }
export type { MapProvider, MapTheme, AlumniMapItem, MapSwitchingState }
