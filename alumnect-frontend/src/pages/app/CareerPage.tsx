import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Route as RouteIcon,
  Search,
  Building2,
  MapPin,
  User,
  Briefcase,
  ArrowRight,
  Loader2,
  X,
  Calendar,
  Star,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import { PageHeader, Card, Avatar, Skeleton, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useNavigate } from 'react-router-dom'
import { useCareerPaths, useCareerPathDetail } from '@/features/careerpath/hooks/useCareerPath'
import { useMajors } from '@/features/auth/hooks/useAuth'
import type { CareerPathSummaryResponse, ExperienceTimelineResponse } from '@/features/careerpath/api/careerPathApi'
import { formatPeriodDate } from '@/utils/date'
import { AnimatePresence, motion } from 'framer-motion'

const formatLocationCityOnly = (location?: string | null): string => {
  if (!location || !location.trim()) return ''
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return location
  let target = parts[parts.length - 1]
  if (parts.length >= 2 && ['việt nam', 'vietnam', 'japan', 'usa', 'united states'].includes(target.toLowerCase())) {
    target = parts[parts.length - 2]
  }
  return target
}

export function CareerPage() {

  const { data: majors = [] } = useMajors()
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [cohort, setCohort] = useState<number | ''>('')
  const [majorId, setMajorId] = useState<number | ''>('')
  const [page, setPage] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  const activeFilterCount =
    (title ? 1 : 0) +
    (company ? 1 : 0) +
    (location ? 1 : 0) +
    (cohort !== '' ? 1 : 0) +
    (majorId !== '' ? 1 : 0)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [debouncedFilters, setDebouncedFilters] = useState({
    search: '', title: '', company: '', location: '',
    cohort: undefined as number | undefined,
    majorId: undefined as number | undefined,
    page: 0,
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters({
        search: search.trim(), title: title.trim(),
        company: company.trim(), location: location.trim(),
        cohort: cohort === '' ? undefined : Number(cohort),
        majorId: majorId === '' ? undefined : Number(majorId),
        page,
      })
    }, 400)
    return () => clearTimeout(t)
  }, [search, title, company, location, cohort, majorId, page])

  useEffect(() => { setPage(0) }, [search, title, company, location, cohort, majorId])

  const { data: pageData, isLoading, error } = useCareerPaths({
    search: debouncedFilters.search || undefined,
    title: debouncedFilters.title || undefined,
    company: debouncedFilters.company || undefined,
    location: debouncedFilters.location || undefined,
    cohort: debouncedFilters.cohort,
    majorId: debouncedFilters.majorId,
    page: debouncedFilters.page,
    size: 10,
  })

  const [selectedAlumni, setSelectedAlumni] = useState<CareerPathSummaryResponse | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedAlumni(null)
  }, [])

  useEffect(() => {
    if (selectedAlumni) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedAlumni, handleKeyDown])

  const handleClearFilters = () => {
    setSearch(''); setTitle(''); setCompany(''); setLocation(''); setCohort(''); setMajorId(''); setPage(0)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 text-left">
      <PageHeader
        icon={<RouteIcon size={20} />}
        title="Lộ trình sự nghiệp"
        subtitle="Khám phá hành trình thực tế các cựu sinh viên FPTU đã đi qua để đạt được vị trí hiện tại."
      />

      {/* Search & Filter */}
      <Reveal>
        <Card hover={false} className="mb-6 p-4 sm:p-5 border border-plum-900/10 shadow-soft bg-white rounded-3xl">
          {/* Main search bar + Filter toggle button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-plum-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cựu sinh viên theo tên, ngành học, chức danh, công ty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] pl-11 pr-10 text-sm text-plum-900 placeholder:text-plum-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-plum-400 hover:bg-plum-900/10 hover:text-plum-700 transition-colors"
                  title="Xóa từ khóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant={showAdvanced || activeFilterCount > 0 ? 'primary' : 'secondary'}
              size="md"
              leftIcon={<SlidersHorizontal size={16} />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-12 px-5 rounded-2xl shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
            >
              <span>Bộ lọc nâng cao</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-600 shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced collapsible filter section */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-plum-900/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-plum-500 mb-1.5 flex items-center gap-1">
                        <BookOpen size={12} className="text-blue-500" /> Chuyên ngành
                      </label>
                      <select
                        value={majorId}
                        onChange={(e) => setMajorId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-10 rounded-xl border border-plum-900/10 bg-white px-2.5 text-xs text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Tất cả chuyên ngành</option>
                        {majors.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-plum-500 mb-1.5 flex items-center gap-1">
                        <Briefcase size={12} className="text-brand-500" /> Chức danh
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Frontend Developer..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-10 rounded-xl border border-plum-900/10 bg-white px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-plum-500 mb-1.5 flex items-center gap-1">
                        <Building2 size={12} className="text-violet-500" /> Công ty
                      </label>
                      <input
                        type="text"
                        placeholder="VD: FPT Software, VNG..."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full h-10 rounded-xl border border-plum-900/10 bg-white px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-plum-500 mb-1.5 flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-500" /> Địa điểm
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Hà Nội, TP.HCM..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-10 rounded-xl border border-plum-900/10 bg-white px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-plum-500 mb-1.5 flex items-center gap-1">
                        <GraduationCap size={12} className="text-amber-500" /> Khóa học
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 14, 15, 16..."
                        value={cohort}
                        onChange={(e) => setCohort(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-10 rounded-xl border border-plum-900/10 bg-white px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-plum-400">
                      Kết hợp các tiêu chí để lọc lộ trình chính xác nhất.
                    </p>
                    {!!(search || title || company || location || cohort || majorId) && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        <RotateCcw size={12} /> Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Reveal>

      {/* Cards list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl w-full" />)}
        </div>
      ) : error ? (
        <EmptyState icon={<RouteIcon size={22} />} title="Lỗi tải dữ liệu" description={error.message || 'Không thể kết nối đến máy chủ.'} />
      ) : !pageData || pageData.content.length === 0 ? (
        <EmptyState
          icon={<RouteIcon size={22} />}
          title="Không tìm thấy lộ trình phù hợp"
          description="Thử thay đổi từ khóa hoặc bộ lọc của bạn để có kết quả tốt hơn."
          action={<Button variant="secondary" size="sm" onClick={handleClearFilters}>Đặt lại bộ lọc</Button>}
        />
      ) : (
        <div className="space-y-3">
          <Stagger className="space-y-3" gap={0.06}>
            {pageData.content.map((alumni: CareerPathSummaryResponse) => {
              const isActive = selectedAlumni?.userId === alumni.userId
              return (
                <StaggerItem key={alumni.userId}>
                  <motion.div
                    onClick={() => setSelectedAlumni(alumni)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className={`cursor-pointer rounded-2xl border bg-white transition-shadow duration-200 select-none group ${
                      isActive
                        ? 'border-brand-300 shadow-[0_0_0_2px_rgb(124_134_238/0.15),0_8px_32px_-12px_rgb(124_134_238/0.35)]'
                        : 'border-plum-900/6 shadow-sm hover:border-brand-200/80 hover:shadow-[0_6px_28px_-10px_rgb(120_100_140/0.3)]'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <Avatar
                          src={alumni.avatarUrl}
                          name={alumni.fullName}
                          size={52}
                          verified={alumni.verifiedStatus}
                          className="rounded-xl shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-plum-900 truncate">{alumni.fullName}</h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-plum-400 mt-0.5">
                            <span className="font-medium text-plum-500">{alumni.major || 'Đại học FPT'}</span>
                            {alumni.cohort && (<><span className="opacity-40">·</span><span>K{alumni.cohort}</span></>)}
                          </div>
                          {(alumni.currentTitle || alumni.currentCompany) && (
                            <p className="text-[11px] text-plum-500 mt-1.5 flex items-center gap-1.5 min-w-0">
                              <Briefcase size={11} className="text-brand-400 shrink-0" />
                              <span className="truncate">
                                <span className="font-semibold text-plum-700">{alumni.currentTitle}</span>
                                {alumni.currentCompany && <> tại <span className="font-semibold text-plum-800">{alumni.currentCompany}</span></>}
                                {alumni.currentLocation && <span className="text-plum-400 font-normal"> · {formatLocationCityOnly(alumni.currentLocation)}</span>}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Career preview + CTA */}
                      <div className="flex flex-col items-end gap-2 shrink-0 max-w-[240px] sm:max-w-[300px]">
                        {alumni.careerPreview && alumni.careerPreview.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {alumni.careerPreview.slice(0, 3).map((step, idx) => (
                              <React.Fragment key={step.experienceId}>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium truncate max-w-[85px] ${
                                    step.isCurrent ? 'bg-brand-100 text-brand-700 font-semibold' : 'bg-plum-50 text-plum-500'
                                  }`}
                                  title={`${step.title} @ ${step.company}`}
                                >
                                  {step.title}
                                </span>
                                {idx < alumni.careerPreview.slice(0, 3).length - 1 && (
                                  <ArrowRight size={9} className="text-plum-300 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                            {alumni.careerPreview.length > 3 && (
                              <span className="text-[10px] text-plum-400 font-medium">+{alumni.careerPreview.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                          isActive ? 'text-brand-600' : 'text-plum-400'
                        }`}>
                          <span>{alumni.totalExperiences} vai trò</span>
                          <ChevronRight size={13} className={`transition-transform duration-200 ${isActive ? 'rotate-90 text-brand-500' : 'group-hover:translate-x-0.5'}`} />
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </Stagger>

          {pageData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-xl font-bold">Trước</Button>
              <span className="text-xs text-plum-500 font-bold px-3 py-1 bg-plum-100/50 rounded-xl">{page + 1} / {pageData.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={pageData.last} onClick={() => setPage((p) => p + 1)} className="rounded-xl font-bold">Sau</Button>
            </div>
          )}
        </div>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {selectedAlumni && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setSelectedAlumni(null)}
                className="fixed inset-0 z-[100] bg-plum-900/25 backdrop-blur-[2px]"
              />

              {/* Side Drawer Panel */}
              <motion.aside
                key="drawer"
                initial={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
                animate={{ x: 0, y: 0 }}
                exit={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 40, mass: 0.85 }}
                className={`fixed z-[110] flex flex-col bg-white ${
                  isMobile
                    ? 'bottom-0 left-0 right-0 top-auto h-[85vh] w-full rounded-t-3xl border-t'
                    : 'top-0 right-0 bottom-0 h-full w-full max-w-[460px] rounded-l-3xl border-l'
                }`}
                style={{
                  boxShadow: isMobile
                    ? '0 -10px 40px -12px rgb(50 44 63 / 0.16)'
                    : '-20px 0 60px -16px rgb(50 44 63 / 0.22)',
                  borderColor: 'rgb(50 44 63 / 0.07)'
                }}
              >
                {isMobile && (
                  <div className="shrink-0 flex justify-center py-2 bg-gradient-to-b from-[#f2f3ff] to-transparent">
                    <div className="w-10 h-1 rounded-full bg-plum-300/40" />
                  </div>
                )}
                {/* ── Gradient Header ── */}
                <div
                  className="relative shrink-0 px-6 pt-6 pb-5 overflow-hidden"
                  style={{ background: 'linear-gradient(140deg, #f2f3ff 0%, #faf4ec 60%, #fff0f8 100%)', borderBottom: '1px solid rgb(50 44 63 / 0.06)' }}
                >
                  {/* Decorative glow blobs */}
                  <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, #bcc0fb, transparent 70%)' }} />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #ffc8ba, transparent 70%)' }} />

                  {/* Close */}
                  <button
                    onClick={() => setSelectedAlumni(null)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-plum-400 hover:text-plum-900 hover:bg-white/80 active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>

                  {/* Avatar + Name */}
                  <div className="flex items-start gap-4 pr-8">
                    <Avatar
                      src={selectedAlumni.avatarUrl}
                      name={selectedAlumni.fullName}
                      size={66}
                      verified={selectedAlumni.verifiedStatus}
                      className="rounded-2xl"
                      ring
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h2 className="text-lg font-extrabold text-plum-900 leading-tight">{selectedAlumni.fullName}</h2>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                        <span className="inline-block text-[11px] font-bold text-brand-700 bg-brand-100 border border-brand-200/50 px-2.5 py-0.5 rounded-full">
                          {selectedAlumni.major || 'Đại học FPT'}
                        </span>
                        {selectedAlumni.cohort && (
                          <span className="text-[11px] text-plum-500 font-semibold">Khóa K{selectedAlumni.cohort}</span>
                        )}
                      </div>
                      {(selectedAlumni.currentTitle || selectedAlumni.currentCompany) && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <Briefcase size={11} className="text-brand-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-plum-600 leading-snug">
                            <span className="font-bold text-plum-800">{selectedAlumni.currentTitle}</span>
                            {selectedAlumni.currentCompany && <> · <span className="font-medium">{selectedAlumni.currentCompany}</span></>}
                            {selectedAlumni.currentLocation && <span className="text-plum-400"> · {selectedAlumni.currentLocation}</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stat chips */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/75 border border-plum-900/[0.07] px-3 py-1.5 shadow-sm">
                      <Star size={11} className="text-gold-500" />
                      <span className="text-[11px] font-bold text-plum-700">{selectedAlumni.totalExperiences} vai trò</span>
                    </div>
                    {selectedAlumni.cohort && (
                      <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/75 border border-plum-900/[0.07] px-3 py-1.5 shadow-sm">
                        <Calendar size={11} className="text-brand-400" />
                        <span className="text-[11px] font-bold text-plum-700">Khóa K{selectedAlumni.cohort}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Scrollable Timeline ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <CareerDetailTimeline userId={selectedAlumni.userId} />
                </div>

                {/* ── Footer CTA ── */}
                <div
                  className="shrink-0 px-6 py-4 flex items-center justify-between gap-3"
                  style={{ borderTop: '1px solid rgb(50 44 63 / 0.06)', background: 'linear-gradient(to top, #fff 70%, transparent)' }}
                >
                  <p className="text-[10px] text-plum-400 font-medium">Nhấn Esc để đóng</p>
                  <ViewProfileButton userId={selectedAlumni.userId} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
function ViewProfileButton({ userId }: { userId: number }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/app/profile?userId=${userId}`)}
      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white text-xs font-bold px-4 py-2 transition-all duration-200 cursor-pointer"
      style={{ boxShadow: '0 4px 16px -4px rgb(124 134 238 / 0.5)' }}
    >
      <User size={12} />
      Xem hồ sơ
      <ExternalLink size={10} className="opacity-70" />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
function CareerDetailTimeline({ userId }: { userId: number }) {
  const { data: detail, isLoading, error } = useCareerPathDetail(userId)

  if (isLoading) {
    return (
      <div className="space-y-3 pt-1">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl w-full" />)}
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 size={15} className="animate-spin text-brand-400" />
          <span className="text-xs text-plum-400 font-medium">Đang tải lộ trình...</span>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-coral-50 flex items-center justify-center mb-3">
          <RouteIcon size={20} className="text-coral-400" />
        </div>
        <p className="text-sm font-semibold text-plum-700">Không thể tải dữ liệu</p>
        <p className="text-xs text-plum-400 mt-1">Lỗi khi tải chi tiết lộ trình.</p>
      </div>
    )
  }

  type GroupedRole = { id: number; title: string; period: string; description?: string | null; isCurrent: boolean; isPrimary: boolean }
  type GroupedCompany = { company: string; location?: string | null; roles: GroupedRole[] }

  const groupedTimeline: GroupedCompany[] = []
  detail.experiences.forEach((exp: ExperienceTimelineResponse) => {
    const lastGroup = groupedTimeline[groupedTimeline.length - 1]
    const start = exp.startDate ? formatPeriodDate(exp.startDate) : ''
    const end = exp.isCurrent ? 'Hiện tại' : exp.endDate ? formatPeriodDate(exp.endDate) : ''
    const roleObj: GroupedRole = {
      id: exp.id, title: exp.title, period: `${start} – ${end}`,
      description: exp.description, isCurrent: exp.isCurrent, isPrimary: exp.isPrimary,
    }
    if (lastGroup && lastGroup.company.toLowerCase().trim() === exp.company.toLowerCase().trim()) {
      lastGroup.roles.push(roleObj)
    } else {
      groupedTimeline.push({ company: exp.company, location: exp.location, roles: [roleObj] })
    }
  })

  return (
    <div className="text-left">
      {/* Label divider */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-plum-900/[0.05]" />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-plum-300 px-1">Lộ trình sự nghiệp</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-plum-900/[0.05]" />
      </div>

      {/* Timeline */}
      <ol className="space-y-0">
        {groupedTimeline.map((group, gIdx) => {
          const isLast = gIdx === groupedTimeline.length - 1
          return (
            <li key={gIdx} className="relative pl-9">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[13.5px] top-7 bottom-0 w-px bg-gradient-to-b from-brand-200/70 via-plum-200/40 to-transparent" />
              )}

              {/* Company node icon */}
              <div className="absolute left-0 top-1 w-7 h-7 rounded-xl flex items-center justify-center shadow-sm border border-brand-200/60" style={{ background: 'linear-gradient(135deg, #e8e9ff, #f2f3ff)' }}>
                <Building2 size={13} className="text-brand-500" />
              </div>

              <div className="mb-5">
                {/* Company header */}
                <p className="font-bold text-sm text-plum-900 leading-snug">{group.company}</p>
                {group.location && (
                  <span className="flex items-center gap-1 text-[10px] text-plum-400 mt-0.5">
                    <MapPin size={9} />{group.location}
                  </span>
                )}

                {/* Role cards */}
                <div className="mt-2.5 space-y-2">
                  {group.roles.map((role, rIdx) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gIdx * 0.05 + rIdx * 0.03, duration: 0.3 }}
                      className={`relative rounded-xl px-3.5 py-2.5 border transition-colors ${
                        role.isCurrent
                          ? 'bg-gradient-to-br from-brand-50/80 to-white border-brand-200/60'
                          : 'bg-plum-50/25 border-plum-900/[0.05]'
                      }`}
                    >
                      {/* Pulsing dot for current role */}
                      {role.isCurrent && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-50" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-2 pr-5">
                        <p className="text-xs font-bold text-plum-800 leading-snug">{role.title}</p>
                        {role.isPrimary && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-gold-300/35 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-gold-700 border border-gold-300/50">
                            <Star size={7} className="fill-gold-600 text-gold-600" />
                            Chính
                          </span>
                        )}
                      </div>

                      <p className="flex items-center gap-1 text-[10px] text-plum-400 mt-1">
                        <Calendar size={9} />{role.period}
                      </p>

                      {role.description && (
                        <p className="mt-2 text-[11px] leading-relaxed text-plum-500 border-t border-plum-900/[0.05] pt-2 whitespace-pre-line">
                          {role.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {groupedTimeline.length === 0 && (
        <p className="text-xs text-plum-400 text-center py-10">Chưa có dữ liệu lộ trình.</p>
      )}
    </div>
  )
}
