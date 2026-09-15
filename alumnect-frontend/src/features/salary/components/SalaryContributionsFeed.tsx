/**
 * SalaryContributionsFeed — Popup hiển thị danh sách các lượt đóng góp lương gần đây.
 * - Thiết kế theo hệ thống giao diện AlumNect (FPT Orange + Trắng tinh tế, không màu đen xám).
 * - Nội dung súc tích, loại bỏ hoàn toàn các câu chữ rườm rà.
 * - Tích hợp bộ lọc trực quan: Tìm kiếm, Ngành nghề (kèm icon), Tỉnh/thành phố, Sắp xếp mức lương.
 */
import { useState, useMemo, useEffect } from 'react'
import {
  History,
  Search,
  MapPin,
  RefreshCw,
  X,
  ArrowUpDown,
  Building2,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Modal, EmptyState, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useSalaryFeed, useIndustries } from '../hooks/useSalary'
import { getIndustryIcon, VIETNAM_CITIES } from '../model/salary'

interface SalaryContributionsFeedProps {
  isOpen?: boolean
  onClose?: () => void
}

export function SalaryContributionsFeed({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: SalaryContributionsFeedProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  // Điều khiển đóng mở (hỗ trợ cả tự quản lý hoặc qua props từ header trang)
  const isControlled = typeof externalIsOpen === 'boolean'
  const isOpen = isControlled ? externalIsOpen : internalIsOpen
  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose()
    } else {
      setInternalIsOpen(false)
    }
  }
  const handleOpen = () => {
    if (!isControlled) {
      setInternalIsOpen(true)
    }
  }

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'salaryDesc' | 'salaryAsc'>('latest')

  const { data: industriesData } = useIndustries()
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSalaryFeed()

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

  // Lọc danh sách
  const filteredItems = useMemo(() => {
    return allItems
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchTitle = item.jobTitle?.toLowerCase().includes(q)
          const matchCompany = item.company?.toLowerCase().includes(q)
          if (!matchTitle && !matchCompany) return false
        }
        if (selectedIndustry) {
          if ((item.industry || '').trim().toLowerCase() !== selectedIndustry.trim().toLowerCase()) {
            return false
          }
        }
        if (selectedRegion) {
          if ((item.region || '').trim().toLowerCase() !== selectedRegion.trim().toLowerCase()) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'salaryDesc') return b.grossAmount - a.grossAmount
        if (sortBy === 'salaryAsc') return a.grossAmount - b.grossAmount
        return 0
      })
  }, [allItems, searchQuery, selectedIndustry, selectedRegion, sortBy])

  const isFiltering = Boolean(searchQuery.trim() || selectedIndustry || selectedRegion || sortBy !== 'latest')

  // Phân trang trong popup: 6 thẻ / trang (3 hàng x 2 cột vừa vặn)
  const FEED_PAGE_SIZE = 6
  const [feedPage, setFeedPage] = useState(0)

  // Tự động trở về trang đầu khi đổi bộ lọc
  useEffect(() => {
    setFeedPage(0)
  }, [searchQuery, selectedIndustry, selectedRegion, sortBy])

  const totalFeedPages = Math.ceil(filteredItems.length / FEED_PAGE_SIZE)
  const paginatedFeedItems = useMemo(() => {
    const start = feedPage * FEED_PAGE_SIZE
    return filteredItems.slice(start, start + FEED_PAGE_SIZE)
  }, [filteredItems, feedPage])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedIndustry('')
    setSelectedRegion('')
    setSortBy('latest')
    setFeedPage(0)
  }

  // Danh mục ngành nghề
  const industryList = useMemo(() => {
    return (industriesData ?? []).filter((ind) => ind.name.trim().toLowerCase() !== 'khác')
  }, [industriesData])

  // Danh mục khu vực
  const regionList = useMemo(() => {
    const fromItems = allItems.map((i) => i.region).filter(Boolean) as string[]
    return Array.from(new Set([...fromItems, ...VIETNAM_CITIES])).sort()
  }, [allItems])

  return (
    <>
      {/* 1. Nút góc nhỏ tinh tế (màu trắng viền cam FPT chuẩn hệ thống, không màu đen) */}
      {!isControlled && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            onClick={handleOpen}
            className="group flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-700 shadow-md transition-all duration-200 hover:scale-105 hover:border-brand-400 hover:bg-brand-50 hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer"
            title="Xem các lượt đóng góp lương gần đây"
          >
            <History size={15} className="text-brand-600 transition-transform group-hover:-rotate-45" />
            <span>Đóng góp gần đây</span>
            {allItems.length > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] font-bold text-brand-800">
                {allItems.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. Popup Modal chuẩn hệ thống AlumNect */}
      {isOpen && (
        <Modal
          isOpen
          onClose={handleClose}
          title="Đóng góp gần đây"
          icon={<History size={18} className="text-brand-600" />}
          maxWidthClassName="max-w-2xl"
        >
          {/* Thanh bộ lọc tinh gọn */}
          <div className="mb-4 space-y-2.5 rounded-xl border border-plum-900/8 bg-brand-50/40 p-3">
            {/* Hàng 1: Tìm kiếm + Chọn ngành + Chọn khu vực */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Tìm kiếm */}
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm chức danh, công ty…"
                  className="h-9 w-full rounded-lg border border-plum-900/10 bg-white pl-9 pr-7 text-xs text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-plum-400 hover:text-plum-700"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Chọn ngành */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="h-9 w-full truncate rounded-lg border border-plum-900/10 bg-white px-2.5 text-xs text-plum-800 font-medium focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả ngành nghề</option>
                {industryList.map((ind) => (
                  <option key={ind.id} value={ind.name}>
                    {ind.name}
                  </option>
                ))}
              </select>

              {/* Chọn khu vực */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-9 w-full truncate rounded-lg border border-plum-900/10 bg-white px-2.5 text-xs text-plum-800 font-medium focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả khu vực</option>
                {regionList.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Hàng 2: Sắp xếp & Nút xóa lọc */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5 text-plum-500">
                <ArrowUpDown size={12} className="text-plum-400" />
                <span className="text-[11px] text-plum-400">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent font-semibold text-plum-800 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="latest">Mới nhất</option>
                  <option value="salaryDesc">Lương: Cao → Thấp</option>
                  <option value="salaryAsc">Lương: Thấp → Cao</option>
                </select>
              </div>

              {isFiltering && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X size={12} /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Danh sách thẻ đóng góp cuộn dọc */}
          <div className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-plum-900/[0.04]" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
                  <AlertTriangle size={18} />
                </span>
                <p className="text-xs text-plum-500">
                  {(error as Error)?.message ?? 'Không tải được danh sách đóng góp.'}
                </p>
                <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={12} />} onClick={() => refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={22} />}
                title={isFiltering ? 'Không có dữ liệu khớp bộ lọc' : 'Chưa có lượt đóng góp nào'}
                description={
                  isFiltering
                    ? 'Hãy thử thay đổi hoặc xóa bớt điều kiện tìm kiếm.'
                    : 'Hãy là người đầu tiên đóng góp dữ liệu lương.'
                }
                action={isFiltering ? <Button size="sm" variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button> : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paginatedFeedItems.map((c) => {
                    const timeAgo = c.createdAt
                      ? (() => {
                          try {
                            return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: vi })
                          } catch {
                            return ''
                          }
                        })()
                      : ''

                    const IndIcon = getIndustryIcon(c.industry)

                    return (
                      <div
                        key={c.id}
                        className="flex flex-col justify-between rounded-xl border border-plum-900/8 bg-white p-3 shadow-xs transition-all hover:border-brand-300 hover:shadow-sm"
                      >
                        <div>
                          {/* Chức danh & thời gian */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-xs font-bold text-plum-900 line-clamp-1">
                              {c.jobTitle}
                            </h4>
                            {timeAgo && (
                              <span className="shrink-0 text-[10px] text-plum-400 whitespace-nowrap">
                                {timeAgo}
                              </span>
                            )}
                          </div>

                          {/* Tags: Ngành nghề & Công ty */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {c.industry && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200/50">
                                <IndIcon size={10} className="shrink-0 text-brand-600" />
                                <span className="line-clamp-1">{c.industry}</span>
                              </span>
                            )}
                            {c.company && (
                              <span className="rounded-md bg-plum-900/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-plum-600 border border-plum-900/5 line-clamp-1">
                                {c.company}
                              </span>
                            )}
                          </div>

                          {/* Địa điểm */}
                          {c.region && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-plum-400">
                              <MapPin size={10} className="shrink-0" />
                              <span>{c.region}</span>
                            </p>
                          )}
                        </div>

                        {/* Mức lương + Kinh nghiệm */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-plum-900/5 pt-2">
                          <span className="text-xs font-extrabold text-brand-600">
                            {c.grossAmount.toLocaleString('vi-VN')} {c.currency}
                            <span className="text-[10px] font-normal text-plum-400"> / tháng</span>
                          </span>
                          {c.yearsExperience != null && (
                            <span className="rounded bg-brand-100/60 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">
                              {c.yearsExperience} năm KN
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Thanh phân trang trong popup */}
                {totalFeedPages > 1 && (
                  <div className="pt-3 border-t border-plum-900/5 flex items-center justify-center">
                    <Pagination
                      page={feedPage}
                      totalPages={totalFeedPages}
                      onPageChange={setFeedPage}
                      scrollToTop={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
