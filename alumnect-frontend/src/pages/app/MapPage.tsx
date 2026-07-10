/**
 * MapPage – Trang Alumni Geo-Dashboard.
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
import { Map as MapIcon, Filter, Search, Building, Users, MapPin, Loader2 } from 'lucide-react'
import { Badge, Card, EmptyState, Skeleton, Avatar } from '@/components/ui'
import { Reveal } from '@/components/motion'
import { AlumniMapLibre } from '@/features/alumnimap/components/AlumniMapLibre'
import { useAlumniMap } from '@/features/alumnimap/hooks/useAlumniMap'
import { AVAILABLE_THEMES } from '@/features/alumnimap/services/mapStyleService'
import type { AlumniMapItem, MapTheme, MapSwitchingState } from '@/features/alumnimap/model/alumniMapTypes'
import type { AlumniMapResponse } from '@/features/alumnimap/api/alumniMapApi'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Hằng số
// ---------------------------------------------------------------------------

const COHORTS = ['All cohorts', 'K11–K13', 'K14–K16', 'K17+']

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
    displayName: r.fullName,
    avatarUrl: r.avatarUrl,
    currentTitle: r.title,
    companyName: r.company,
    cohort: r.cohort ?? undefined,
    city: r.location,
    countryCode: isVN ? 'VN' : undefined, // Suy diễn từ tọa độ
    latitude: r.latitude,
    longitude: r.longitude,
  }
}

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------

export function MapPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedCohort, setSelectedCohort] = useState('All cohorts')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMapItem | null>(null)

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
    search: debouncedSearch.trim() || undefined
  })

  const alumniList = useMemo(
    () => rawData.map(toAlumniMapItem),
    [rawData]
  )

  // ── Lọc theo cohort (giữ nguyên client-side range check cho cohort groups) ───────
  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      if (selectedCohort === 'All cohorts') return true
      const v = a.cohort
      if (!v) return false
      if (selectedCohort === 'K11–K13') return v >= 11 && v <= 13
      if (selectedCohort === 'K14–K16') return v >= 14 && v <= 16
      if (selectedCohort === 'K17+')    return v >= 17
      return true
    })
  }, [alumniList, selectedCohort])

  // ── Lọc danh sách hiển thị trên sidebar (không cần filter lại search nữa vì DB đã filter) ──
  const searchedAlumni = filteredAlumni;

  // ── Top hubs ──────────────────────────────────────────────────────────────
  const topHubs = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAlumni.forEach((a) => {
      const city = a.city || 'Chưa xác định'
      counts[city] = (counts[city] || 0) + 1
    })
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAlumni])

  // ── Thống kê ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: alumniList.length,
    cities: new Set(alumniList.map((a) => a.city).filter(Boolean)).size,
    topCompany: 'FPT Software',
  }), [alumniList])

  // ── Tọa độ tâm bản đồ ────────────────────────────────────────────────────
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedAlumni) return [selectedAlumni.longitude, selectedAlumni.latitude]
    if (filteredAlumni.length > 0) return [filteredAlumni[0].longitude, filteredAlumni[0].latitude]
    return [108.2022, 16.0544]
  }, [selectedAlumni, filteredAlumni])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectAlumni = useCallback((alumni: AlumniMapItem) => {
    setSelectedAlumni(alumni)
  }, [])

  const handleCloseAlumni = useCallback(() => {
    setSelectedAlumni(null)
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
        <h3 className="font-bold text-plum-900 text-sm">Top hubs</h3>
        <Badge tone="aqua">Live</Badge>
      </div>
      {topHubs.length === 0 ? (
        <EmptyState icon={<MapIcon size={18} />} title="Chưa có dữ liệu" description="" />
      ) : (
        <ul className="space-y-3.5">
          {topHubs.map((h, i) => {
            const pct = stats.total > 0 ? (h.count / stats.total) * 100 : 0
            return (
              <li key={h.city} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-plum-900/[0.04] text-[10px] font-bold text-plum-500">{i + 1}</span>
                  <span className="flex-1 text-xs font-semibold text-plum-900 truncate">{h.city}</span>
                  <span className="text-xs font-bold text-brand-600 shrink-0">{h.count} alumni</span>
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
    <div className="mx-auto w-full px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-600 shadow-sm">
            <MapIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-plum-900 leading-none">Alumni Geo-Dashboard</h1>
            <p className="text-xs text-plum-400 mt-1.5 leading-none">
              Mạng lưới cựu sinh viên FPTU hoạt động trên toàn cầu.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5 h-[calc(100vh-140px)] min-h-[500px]">

        {/* Cột 1: Danh sách Alumni */}
        <Reveal direction="left" className="xl:col-span-1 h-full">
          <Card hover={false} className="p-5 border border-plum-900/10 shadow-soft bg-white rounded-3xl h-full flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
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
        <Reveal className="xl:col-span-3 h-full">
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-soft border border-plum-900/10 bg-white">

            {/* Bộ lọc cohort – floating top-left */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-plum-900/10 shadow-soft">
              <Filter size={14} className="text-plum-400 mr-1" />
              {COHORTS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedCohort(c)
                    setSelectedAlumni(null)
                  }}
                  className={cn(
                    'rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                    selectedCohort === c
                      ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-sm'
                      : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
                  )}
                >{c}</button>
              ))}
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
            ) : filteredAlumni.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-cream-50">
                <EmptyState icon={<MapIcon size={32} />} title="Chưa có dữ liệu" description="Không tìm thấy cựu sinh viên nào có tọa độ địa lý." />
              </div>
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
        <Reveal direction="right" className="xl:col-span-1 h-full">
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            <Card hover={false} className="p-5 border border-plum-900/10 shadow-soft bg-white rounded-3xl flex-1 overflow-y-auto">
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

            <Card hover={false} className="p-5 border border-plum-900/10 shadow-soft bg-white rounded-3xl shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-plum-400 mb-3 flex items-center gap-1.5">
                <Users size={13} className="text-brand-500" />
                <span>Chỉ số mạng lưới</span>
              </h4>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-plum-900/[0.03] p-3 rounded-2xl border border-plum-900/[0.04]">
                    <p className="text-[10px] font-bold text-plum-400 uppercase leading-none">Alumni</p>
                    <p className="text-lg font-extrabold text-plum-900 mt-1 leading-none">{stats.total}</p>
                  </div>
                  <div className="bg-plum-900/[0.03] p-3 rounded-2xl border border-plum-900/[0.04]">
                    <p className="text-[10px] font-bold text-plum-400 uppercase leading-none">Thành phố</p>
                    <p className="text-lg font-extrabold text-plum-900 mt-1 leading-none">{stats.cities}</p>
                  </div>
                  <div className="bg-plum-900/[0.03] p-3 rounded-2xl border border-plum-900/[0.04] col-span-2 flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
                      <Building size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-plum-400 uppercase leading-none">Cơ quan hàng đầu</p>
                      <p className="text-xs font-bold text-plum-900 mt-1 leading-none truncate">{stats.topCompany}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </Reveal>

      </div>
    </div>
  )
}
