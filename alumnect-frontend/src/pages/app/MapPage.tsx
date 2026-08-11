/**
 * MapPage – Trang Alumni Geo-Dashboard.
 *
 * Cập nhật: Tách riêng tính năng Bản đồ cựu sinh viên (Alumni Map) khỏi Career Path.
 *
 * Kiến trúc bản đồ mới:
 * - MapLibre GL JS là engine duy nhất (một instance)
 * - VietMap style cho Việt Nam
 * - MapTiler style (hoặc CARTO fallback) cho quốc tế
 * - Filter, search, alumni list, top hubs, statistics giữ nguyên khi đổi provider
 *
 * Use cases: UC53, UC54, UC55
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Map as MapIcon, SlidersHorizontal, Search, MapPin, Loader2, GraduationCap, ChevronDown, Check } from 'lucide-react'
import { Badge, Card, EmptyState, Skeleton, Avatar } from '@/components/ui'
import { Reveal } from '@/components/motion'
import { AlumniMapLibre } from '@/features/alumnimap/components/AlumniMapLibre'
import { useAlumniMap } from '@/features/alumnimap/hooks/useAlumniMap'
import { AVAILABLE_THEMES } from '@/features/alumnimap/services/mapStyleService'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { AlumniMapItem, MapTheme, MapSwitchingState } from '@/features/alumnimap/model/alumniMapTypes'
import type { AlumniMapResponse } from '@/features/alumnimap/api/alumniMapApi'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Hằng số
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper: Ánh xạ AlumniMapResponse → AlumniMapItem
// ---------------------------------------------------------------------------

/**
 * Chuyển đổi response từ API sang AlumniMapItem chuẩn cho MapLibre.
 * Suy diễn countryCode từ tọa độ vì Backend chưa cung cấp trường này.
 */
function toAlumniMapItem(r: AlumniMapResponse): AlumniMapItem {
  const isVN =
    r.latitude >= 8.18 && r.latitude <= 23.39 &&
    r.longitude >= 102.14 && r.longitude <= 109.46

  return {
    alumniId: String(r.userId),
    majorId: r.majorId ?? undefined,
    displayName: r.fullName,
    avatarUrl: r.avatarUrl,
    currentTitle: r.title,
    companyName: r.company,
    cohort: r.cohort ?? undefined,
    city: r.location,
    locationCity: r.locationCity ?? undefined,
    locationCountry: r.locationCountry ?? undefined,
    countryCode: r.locationCountryCode ?? (isVN ? 'VN' : undefined),
    latitude: r.latitude,
    longitude: r.longitude,
  }
}

const HUB_CITY_ALIASES = [
  { label: 'Đà Nẵng, Việt Nam', patterns: ['da nang'] },
  { label: 'Hà Nội, Việt Nam', patterns: ['ha noi'] },
  { label: 'Hồ Chí Minh, Việt Nam', patterns: ['ho chi minh', 'sai gon'] },
  { label: 'Hải Phòng, Việt Nam', patterns: ['hai phong'] },
  { label: 'Cần Thơ, Việt Nam', patterns: ['can tho'] },
]

function normalizeLocation(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
}

/** Gom các địa chỉ chi tiết về cùng một thành phố để tính Top hubs. */
function getHubCity(location?: string, locationCity?: string, locationCountry?: string) {
  const rawLocation = location?.trim()
  const rawCity = locationCity?.trim()
  if (!rawLocation && !rawCity) return 'Chưa xác định'

  // Ưu tiên tên thành phố geocode, nhưng vẫn chạy qua alias để gom
  // "Đà Nẵng" và "Thành phố Đà Nẵng" thành cùng một hub.
  const normalized = normalizeLocation(rawCity ?? rawLocation ?? '')
  const alias = HUB_CITY_ALIASES.find((entry) => entry.patterns.some((pattern) => normalized.includes(pattern)))
  if (alias) return alias.label

  if (rawCity && locationCountry) return `${rawCity}, ${locationCountry}`
  return rawLocation ?? rawCity ?? 'Chưa xác định'
}

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------

export function MapPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null)
  const [isMajorMenuOpen, setIsMajorMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMapItem | null>(null)
  const majorMenuRef = useRef<HTMLDivElement>(null)
  const { data: majors = [] } = useMajors()

  useClickOutside(majorMenuRef, () => setIsMajorMenuOpen(false), isMajorMenuOpen)

  // Debounced search for database-level query optimization
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Map theme state ───────────────────────────────────────────────────────
  const [mapTheme, setMapTheme] = useState<MapTheme>('DEFAULT')
  const [switchingState, setSwitchingState] = useState<MapSwitchingState>('idle')

  // Đảm bảo MapLibre component KHÔNG remount khi đổi provider
  // (không dùng key={mapSource} nữa – MapLibre tự xử lý qua setStyle)
  const mapStableKey = useRef('alumni-map-stable').current

  // ── Fetch dữ liệu ─────────────────────────────────────────────────────────
  const { data: rawData = [], isLoading, error } = useAlumniMap({
    search: debouncedSearch.trim() || undefined,
    majorId: selectedMajorId ?? undefined,
  })
  // Keep an unfiltered result set for accurate per-major counts in the picker.
  // React Query reuses this request when no major is selected.
  const { data: rawCountData = [] } = useAlumniMap({
    search: debouncedSearch.trim() || undefined,
  })

  const alumniList = useMemo(
    () => rawData.map(toAlumniMapItem),
    [rawData]
  )

  // Lọc ngành được thực hiện tại API để map, danh sách và thống kê luôn đồng bộ.
  const filteredAlumni = alumniList

  const majorCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    rawCountData.forEach((item) => {
      if (item.majorId == null) return
      counts[item.majorId] = (counts[item.majorId] ?? 0) + 1
    })

    // Backward-compatible fallback while an older backend/cache still returns
    // map records without majorId: the active major's result set is exact.
    const hasMajorMetadata = rawCountData.some((item) => item.majorId != null)
    if (!hasMajorMetadata && selectedMajorId != null) {
      counts[selectedMajorId] = rawData.length
    }

    return counts
  }, [rawCountData, rawData, selectedMajorId])

  const sortedMajors = useMemo(
    () => [...majors].sort((a, b) => {
      const countDifference = (majorCounts[b.id] ?? 0) - (majorCounts[a.id] ?? 0)
      return countDifference || a.name.localeCompare(b.name, 'vi')
    }),
    [majors, majorCounts],
  )
  const selectedMajor = sortedMajors.find((major) => major.id === selectedMajorId)

  // ── Lọc danh sách hiển thị trên sidebar (không cần filter lại search nữa vì DB đã filter) ──
  const searchedAlumni = filteredAlumni;

  // ── Top hubs ──────────────────────────────────────────────────────────────
  const topHubs = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAlumni.forEach((a) => {
      const city = getHubCity(a.city, a.locationCity, a.locationCountry)
      counts[city] = (counts[city] || 0) + 1
    })
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredAlumni])

  // ── Thống kê ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: filteredAlumni.length,
  }), [filteredAlumni])

  // ── Tọa độ tâm bản đồ ────────────────────────────────────────────────────
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedAlumni) return [selectedAlumni.longitude, selectedAlumni.latitude]
    if (filteredAlumni.length > 0) return [filteredAlumni[0].longitude, filteredAlumni[0].latitude]
    return [108.2022, 16.0544]
  }, [selectedAlumni, filteredAlumni])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectAlumni = useCallback((alumni: AlumniMapItem) => {
    // Do not restart the map camera when the already-focused marker is clicked
    // again or when the same record is refreshed with a new object reference.
    setSelectedAlumni((current) => (
      current?.alumniId === alumni.alumniId ? current : alumni
    ))
  }, [])

  const handleCloseAlumni = useCallback(() => {
    setSelectedAlumni(null)
  }, [])

  const handleMajorChange = useCallback((majorId: number | null) => {
    setSelectedMajorId(majorId)
    setSelectedAlumni(null)
    setIsMajorMenuOpen(false)
  }, [])

  const handleThemeChange = useCallback((t: MapTheme) => {
    setMapTheme(t)
  }, [])

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <EmptyState
          icon={<MapIcon size={22} />}
          title="Lỗi tải dữ liệu"
          description={error.message || 'Không thể kết nối đến máy chủ.'}
        />
      </div>
    )
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────

  const renderTopHubs = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-plum-900 text-sm">Khu vực nổi bật</h3>
        <Badge tone="aqua">Trực tiếp</Badge>
      </div>
      {topHubs.length === 0 ? (
        <EmptyState icon={<MapIcon size={18} />} title="Chưa có dữ liệu" description="" />
      ) : (
        <ul className="max-h-[min(60vh,38rem)] space-y-3 overflow-y-auto overscroll-contain pr-1 xl:max-h-[calc(100dvh-15rem)]">
          {topHubs.map((h, i) => {
            const pct = stats.total > 0 ? (h.count / stats.total) * 100 : 0
            return (
              <li key={h.city} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-plum-900/[0.04] text-[10px] font-bold text-plum-500">{i + 1}</span>
                  <span className="flex-1 text-xs font-semibold text-plum-900 truncate">{h.city}</span>
                  <span className="text-xs font-bold text-brand-600 shrink-0">{h.count} người</span>
                </div>
                <div className="h-1.5 w-full bg-plum-950/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex min-h-0 w-full flex-col px-1 sm:px-2 xl:h-[calc(100dvh-88px)] xl:overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex w-full flex-wrap items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-600 shadow-sm">
            <MapIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-none text-plum-900 sm:text-xl">Bản đồ mạng lưới Alumni</h1>
            <p className="text-xs text-plum-400 mt-1.5 leading-none">
              Khám phá cộng đồng cựu sinh viên FPTU trên toàn cầu.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Column Grid */}
      <div className="grid min-h-0 grid-cols-1 gap-4 xl:flex-1 xl:grid-cols-5 xl:overflow-hidden">

        {/* Cột 1: Danh sách Alumni */}
        <Reveal direction="left" className="min-h-0 xl:col-span-1 xl:h-full">
          <Card hover={false} className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-plum-900/10 bg-white p-5 shadow-soft">
            <div className="mb-4 shrink-0">
              <h3 className="font-bold text-plum-900 text-sm flex items-center justify-between">
                <span>Danh sách Alumni</span>
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">
                  {searchedAlumni.length} kết quả
                </span>
              </h3>
              <div className="relative mt-3">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, công ty, vị trí..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 rounded-xl border border-plum-900/10 bg-plum-900/[0.01] pl-9 pr-3 text-xs text-plum-900 placeholder:text-plum-400 focus:border-brand-500/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>
            <div className="max-h-[min(58vh,34rem)] flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 xl:min-h-0 xl:max-h-none">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </div>
                  ))
                : searchedAlumni.length === 0
                  ? (
                    <div className="h-40 flex items-center justify-center text-xs text-plum-400 text-center">
                      Không tìm thấy alumni nào khớp với từ khóa.
                    </div>
                  )
                  : searchedAlumni.map((alumni) => {
                      const isSelected = selectedAlumni?.alumniId === alumni.alumniId
                      return (
                        <button
                          key={alumni.alumniId}
                          onClick={() => handleSelectAlumni(alumni)}
                          className={cn(
                            'w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all border border-transparent',
                            isSelected
                              ? 'bg-brand-50/70 border-brand-500/20 shadow-sm'
                              : 'hover:bg-plum-900/[0.02]'
                          )}
                        >
                          <Avatar src={alumni.avatarUrl} name={alumni.displayName} size={38} className="shrink-0" ring={isSelected} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-plum-900 truncate leading-tight">{alumni.displayName}</p>
                            <p className="text-[10px] text-plum-500 truncate mt-0.5 leading-snug">
                              {alumni.currentTitle} @ {alumni.companyName}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-plum-400 font-semibold">
                              <MapPin size={10} className="text-brand-500 shrink-0" />
                              <span className="truncate">{alumni.city || 'Chưa xác định'}</span>
                              {alumni.cohort && (
                                <>
                                  <span className="text-plum-300">•</span>
                                  <span>K{alumni.cohort}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
              }
            </div>
          </Card>
        </Reveal>

        {/* Cột 2–4: Bản đồ */}
        <Reveal className="min-h-0 xl:col-span-3 xl:h-full">
          <div className="relative h-[min(72vh,46rem)] min-h-[32rem] w-full overflow-hidden rounded-3xl border border-plum-900/10 bg-white shadow-soft xl:h-full xl:min-h-0">

            {/* Bộ lọc ngành – compact popover để giữ canvas bản đồ thoáng */}
            <div ref={majorMenuRef} className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-soft backdrop-blur-xl">
                <div className="hidden items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-plum-400 sm:flex">
                  <SlidersHorizontal size={13} className="text-brand-500" />
                  <span>Khám phá</span>
                </div>
                <button
                  type="button"
                  aria-expanded={isMajorMenuOpen}
                  aria-haspopup="listbox"
                  onClick={() => setIsMajorMenuOpen((open) => !open)}
                  className={cn(
                    'inline-flex h-8 max-w-[210px] items-center gap-2 rounded-xl px-3 text-xs font-bold transition-all',
                    selectedMajorId
                      ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-sm'
                      : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]',
                  )}
                >
                  <GraduationCap size={14} className="shrink-0" />
                  <span className="truncate">{selectedMajor ? selectedMajor.name : 'Tất cả ngành'}</span>
                  <ChevronDown size={14} className={cn('shrink-0 transition-transform', isMajorMenuOpen && 'rotate-180')} />
                </button>
                <span className="hidden min-w-7 rounded-lg bg-plum-900/[0.05] px-1.5 py-1 text-center text-[10px] font-extrabold text-plum-500 sm:inline-block">
                  {searchedAlumni.length}
                </span>
              </div>

              {isMajorMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-plum-900/10 bg-white/95 p-2 shadow-xl backdrop-blur-xl">
                  <div className="border-b border-plum-900/[0.07] px-2 pb-2 pt-1">
                    <p className="text-xs font-extrabold text-plum-900">Lọc theo ngành</p>
                    <p className="mt-0.5 text-[10px] text-plum-400">Chọn một ngành để khám phá mạng lưới</p>
                  </div>
                  <div className="mt-1 max-h-64 overflow-y-auto pr-0.5">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedMajorId === null}
                      onClick={() => handleMajorChange(null)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors',
                        selectedMajorId === null ? 'bg-brand-50 text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]',
                      )}
                    >
                      <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-brand-100 px-1.5 text-[10px] font-extrabold text-brand-600">
                        {rawCountData.length}
                      </span>
                      <span className="flex-1 font-bold">Tất cả ngành</span>
                      {selectedMajorId === null && <Check size={14} className="text-brand-600" />}
                    </button>
                    {sortedMajors.map((major) => {
                      const active = selectedMajorId === major.id
                      return (
                        <button
                          key={major.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => handleMajorChange(major.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors',
                            active ? 'bg-brand-50 text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]',
                          )}
                        >
                          <span className={cn('grid h-7 min-w-7 place-items-center rounded-lg px-1.5 text-[10px] font-extrabold', active ? 'bg-brand-100 text-brand-600' : 'bg-plum-900/[0.05] text-plum-400')}>
                            {majorCounts[major.id] ?? 0}
                          </span>
                          <span className="flex-1 truncate text-xs font-semibold">{major.name}</span>
                          {active && <Check size={14} className="shrink-0 text-brand-600" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Loading overlay khi đổi style */}
            {switchingState === 'switching' && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-plum-900/10 shadow-soft">
                <Loader2 size={13} className="animate-spin text-brand-500" />
                <span className="text-xs font-semibold text-plum-600">Đang tải bản đồ...</span>
              </div>
            )}

            {/* Map component – key ổn định, KHÔNG remount khi đổi provider */}
            {isLoading ? (
              <Skeleton className="w-full h-full bg-cream-200/50" />
            ) : (
              <AlumniMapLibre
                key={mapStableKey}
                alumniList={filteredAlumni}
                onSelectAlumni={handleSelectAlumni}
                onCloseAlumni={handleCloseAlumni}
                selectedAlumniId={selectedAlumni?.alumniId}
                mapCenter={mapCenter}
                mapProvider="MAPTILER"
                mapTheme={mapTheme}
                onSwitchingStateChange={setSwitchingState}
              />
            )}

            {/* Bộ chuyển đổi chủ đề – floating bottom-left */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-plum-900/10 shadow-soft">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-plum-400 uppercase tracking-wider pr-1">Chủ đề:</span>
                {AVAILABLE_THEMES.map((entry) => (
                  <button
                    key={entry.theme}
                    onClick={() => handleThemeChange(entry.theme)}
                    disabled={switchingState === 'switching'}
                    className={cn(
                      'rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer',
                      mapTheme === entry.theme
                        ? 'bg-plum-900 text-white shadow-sm'
                        : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.06]',
                      switchingState === 'switching' && 'opacity-60 pointer-events-none'
                    )}
                  >
                    {entry.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </Reveal>

        {/* Cột 5: Thống kê */}
        <Reveal direction="right" className="min-h-0 xl:col-span-1 xl:h-full xl:self-start xl:sticky xl:top-20">
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden xl:h-full">
            <Card hover={false} className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-plum-900/10 bg-white p-5 shadow-soft xl:max-h-[calc(100dvh-6rem)]">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-4 flex-1 rounded" />
                    </div>
                  ))}
                </div>
              ) : renderTopHubs()}
            </Card>

          </div>
        </Reveal>

      </div>
    </div>
  )
}
