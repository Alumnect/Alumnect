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
  useMemo,
} from 'react'
import { createPortal } from 'react-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Users } from 'lucide-react'
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

const CLUSTER_ZOOM_THRESHOLD = 14.5

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
    // The initial map already uses this provider + theme. Keep the full style
    // key so the first selection does not trigger a redundant setStyle while
    // the initial style is still settling.
    currentProviderRef.current = `${initialProvider}-${mapTheme}`

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
  /** Token huỷ flyTo cũ khi user bị bỏ chọn hoặc được chọn lại. */
  const flyToRequestIdRef = useRef(0)

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
    const requestId = ++flyToRequestIdRef.current

    // Deselecting must also cancel any flyTo that was waiting for style.load.
    if (!isMapLoaded || !mapRef.current || !selectedAlumniId) {
      pendingFlyToRef.current = null
      return
    }

    const alumni = alumniList.find((a) => a.alumniId === selectedAlumniId)
    if (!alumni) {
      pendingFlyToRef.current = null
      return
    }

    // Tọa độ MapLibre phải theo thứ tự [longitude, latitude]
    const isVN = isCoordinateInVietnam(alumni.longitude, alumni.latitude)
    // Focus at street/building level when a user is selected. Respect the
    // map's own limit so the camera never overshoots the available tiles.
    const targetZoom = Math.min(mapRef.current.getMaxZoom(), isVN ? 18 : 17)
    const targetCenter: [number, number] = [alumni.longitude, alumni.latitude]

    const currentCenter = mapRef.current.getCenter()
    const centerDistance = Math.hypot(
      currentCenter.lng - targetCenter[0],
      currentCenter.lat - targetCenter[1],
    )
    const zoomDistance = Math.abs(mapRef.current.getZoom() - targetZoom)

    // Avoid restarting the camera animation when React re-renders with the
    // same selected alumni (for example after a data refresh).
    if (centerDistance < 0.001 && zoomDistance < 0.15) {
      pendingFlyToRef.current = null
      return
    }

    const fly = () => {
      if (requestId !== flyToRequestIdRef.current || !mapRef.current) return

      // Replace, rather than stack, camera animations when switching users.
      mapRef.current.stop()
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
  // Camera behavior
  // ---------------------------------------------------------------------------
  // `mapCenter` is used as the initial camera only. Do not synchronize it
  // after mount: closing a popup clears `selectedAlumniId`, which changes the
  // derived center in MapPage and used to force an immediate zoom-out. The
  // map should keep the camera chosen by the user while they pan/zoom.

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
  const coordinateGroups = useMemo(() => {
    const groups = new Map<string, AlumniMapItem[]>()

    alumniList.forEach((alumni) => {
      const key = `${alumni.latitude.toFixed(6)}:${alumni.longitude.toFixed(6)}`
      const group = groups.get(key) ?? []
      group.push(alumni)
      groups.set(key, group)
    })

    return groups
  }, [alumniList])

  const groupByAlumniId = useMemo(() => {
    const result = new Map<string, { size: number; index: number }>()

    coordinateGroups.forEach((group) => {
      group.forEach((alumni, index) => {
        result.set(alumni.alumniId, { size: group.length, index })
      })
    })

    return result
  }, [coordinateGroups])

  const [displayCoordinates, setDisplayCoordinates] = useState<Record<string, [number, number]>>({})
  const [zoom, setZoom] = useState(() => map.getZoom())
  const isClustered = zoom < CLUSTER_ZOOM_THRESHOLD

  useEffect(() => {
    const updateSpiderfyPositions = () => {
      setZoom(map.getZoom())
      const nextCoordinates: Record<string, [number, number]> = {}

      coordinateGroups.forEach((group) => {
        const first = group[0]
        if (group.length === 1) {
          nextCoordinates[first.alumniId] = [first.longitude, first.latitude]
          return
        }

        const center = map.project([first.longitude, first.latitude])
        const radius = 32

        group.forEach((alumni, index) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * index) / group.length
          const point = map.unproject([
            center.x + Math.cos(angle) * radius,
            center.y + Math.sin(angle) * radius,
          ])
          nextCoordinates[alumni.alumniId] = [point.lng, point.lat]
        })
      })

      setDisplayCoordinates(nextCoordinates)
    }

    updateSpiderfyPositions()
    map.on('move', updateSpiderfyPositions)
    map.on('resize', updateSpiderfyPositions)
    map.on('zoom', updateSpiderfyPositions)

    return () => {
      map.off('move', updateSpiderfyPositions)
      map.off('resize', updateSpiderfyPositions)
      map.off('zoom', updateSpiderfyPositions)
    }
  }, [map, coordinateGroups])

  useEffect(() => {
    if (isClustered && selectedAlumniId) onCloseAlumni?.()
  }, [isClustered, selectedAlumniId, onCloseAlumni])

  const handleExpandGroup = useCallback((group: AlumniMapItem[]) => {
    const first = group[0]
    const nextZoom = Math.min(
      map.getMaxZoom(),
      Math.max(map.getZoom() + 3, CLUSTER_ZOOM_THRESHOLD + 0.5),
    )

    map.easeTo({
      center: [first.longitude, first.latitude],
      zoom: nextZoom,
      duration: 550,
      essential: true,
    })
  }, [map])

  return (
    <>
      {isClustered
        ? Array.from(coordinateGroups.values()).map((group) => (
            group.length > 1 ? (
              <AlumniClusterMarker
                key={`cluster-${group[0].alumniId}`}
                map={map}
                alumni={group[0]}
                count={group.length}
                onExpand={() => handleExpandGroup(group)}
              />
            ) : (
              <AlumniMarker
                key={group[0].alumniId}
                map={map}
                alumni={group[0]}
                isSelected={selectedAlumniId === group[0].alumniId}
                onSelect={onSelectAlumni}
              />
            )
          ))
        : alumniList.map((alumni) => (
            <AlumniMarker
              key={alumni.alumniId}
              map={map}
              alumni={alumni}
              isSelected={selectedAlumniId === alumni.alumniId}
              onSelect={onSelectAlumni}
              displayCoordinates={displayCoordinates[alumni.alumniId]}
              groupSize={groupByAlumniId.get(alumni.alumniId)?.size ?? 1}
              isGroupLead={(groupByAlumniId.get(alumni.alumniId)?.index ?? 0) === 0}
            />
          ))}
      <AlumniPopupController
        map={map}
        alumniList={alumniList}
        selectedAlumniId={selectedAlumniId}
        displayCoordinates={displayCoordinates}
        onCloseAlumni={onCloseAlumni}
      />
    </>
  )
}

interface AlumniClusterMarkerProps {
  map: maplibregl.Map
  alumni: AlumniMapItem
  count: number
  onExpand: () => void
}

function AlumniClusterMarker({ map, alumni, count, onExpand }: AlumniClusterMarkerProps) {
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
    forceUpdate((n) => n + 1)

    return () => {
      marker.remove()
      markerRef.current = null
      elementRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    markerRef.current?.setLngLat([alumni.longitude, alumni.latitude])
  }, [alumni.longitude, alumni.latitude])

  if (!elementRef.current) return null

  return createPortal(
    <button
      type="button"
      title={`${count} alumni tại ${alumni.companyName || 'khu vực này'}`}
      onClick={(event) => {
        event.stopPropagation()
        onExpand()
      }}
      className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-violet-100 text-brand-600">
        <Users size={23} strokeWidth={2.2} />
      </span>
      <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-extrabold text-white shadow-sm ring-2 ring-white">
        {count}
      </span>
      <span className="absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-white bg-white" />
    </button>,
    elementRef.current,
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
  displayCoordinates?: [number, number]
  groupSize?: number
  isGroupLead?: boolean
}

/**
 * Marker HTML hiển thị avatar cựu sinh viên trên bản đồ.
 * Dùng React Portal để render React content vào DOM element của MapLibre Marker.
 */
function AlumniMarker({
  map,
  alumni,
  isSelected,
  onSelect,
  displayCoordinates,
  groupSize = 1,
  isGroupLead = false,
}: AlumniMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const el = document.createElement('div')
    el.style.cursor = 'pointer'
    elementRef.current = el

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(displayCoordinates ?? [alumni.longitude, alumni.latitude])
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

  // Cập nhật vị trí hiển thị, trong khi popup vẫn dùng tọa độ thật của alumni.
  useEffect(() => {
    markerRef.current?.setLngLat(displayCoordinates ?? [alumni.longitude, alumni.latitude])
  }, [alumni.longitude, alumni.latitude, displayCoordinates])

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
      {isGroupLead && groupSize > 1 && (
        <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white">
          {groupSize}
        </span>
      )}
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
  displayCoordinates: Record<string, [number, number]>
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
  displayCoordinates,
  onCloseAlumni,
}: AlumniPopupControllerProps) {
  const activePopupRef = useRef<maplibregl.Popup | null>(null)
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null)
  const selectedDisplayCoordinates = selectedAlumniId
    ? displayCoordinates[selectedAlumniId]
    : undefined

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
      offset: [0, -34],
      maxWidth: '400px',
    })
      .setLngLat(selectedDisplayCoordinates ?? [selectedAlumni.longitude, selectedAlumni.latitude])
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

  // Khi marker được tách khỏi nhóm hoặc map đang di chuyển, giữ popup bám
  // đúng avatar đã click thay vì bám vào tâm tọa độ ban đầu.
  useEffect(() => {
    if (activePopupRef.current && selectedDisplayCoordinates) {
      activePopupRef.current.setLngLat(selectedDisplayCoordinates)
    }
  }, [selectedDisplayCoordinates?.[0], selectedDisplayCoordinates?.[1]])

  // Đóng popup khi click vào vùng trống
  useEffect(() => {
    if (!onCloseAlumni || !selectedAlumniId) return

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const target = e.originalEvent?.target as HTMLElement | null
      if (target?.closest('.maplibregl-marker') || target?.closest('.maplibregl-popup')) return
      // A map click can happen while a flyTo is still running. Stop at the
      // current camera position before closing so the map never snaps to a
      // stale destination after the popup disappears.
      map.stop()
      onCloseAlumni()
    }

    map.on('click', handleMapClick)
    return () => { map.off('click', handleMapClick) }
  }, [map, onCloseAlumni, selectedAlumniId])

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
        map.stop()
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
