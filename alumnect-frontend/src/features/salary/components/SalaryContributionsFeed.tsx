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
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { Modal, EmptyState, Pagination, SelectDropdown } from '@/components/ui'
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
  const { t, i18n } = useTranslation()
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'salaryDesc' | 'salaryAsc'>('latest')

  // Phân trang chuẩn Server-side: 6 thẻ / trang (3 hàng x 2 cột vừa vặn)
  const FEED_PAGE_SIZE = 6
  const [feedPage, setFeedPage] = useState(0)

  // Debounce tìm kiếm 350ms để không gửi request liên tục khi đang gõ phím
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Tự động trở về trang 0 khi thay đổi bất kỳ tiêu chí lọc nào
  useEffect(() => {
    setFeedPage(0)
  }, [debouncedSearch, selectedIndustry, selectedRegion, sortBy])

  const { data: industriesData } = useIndustries()

  // Ánh xạ tên ngành nghề sang industryId để lọc chuẩn dưới Database
  const selectedIndustryId = useMemo(() => {
    if (!selectedIndustry) return null
    const found = (industriesData ?? []).find(
      (ind) => ind.name.trim().toLowerCase() === selectedIndustry.trim().toLowerCase()
    )
    return found ? found.id : null
  }, [selectedIndustry, industriesData])

  // Gom bộ lọc gửi xuống Server
  const filters = useMemo(
    () => ({
      industryId: selectedIndustryId,
      region: selectedRegion || undefined,
      search: debouncedSearch || undefined,
      sortBy,
    }),
    [selectedIndustryId, selectedRegion, debouncedSearch, sortBy]
  )

  // Gọi hook lấy danh sách theo phân trang và bộ lọc trực tiếp từ Backend
  const { data, isLoading, isError, error, refetch } = useSalaryFeed(feedPage, filters, FEED_PAGE_SIZE)

  const feedItems = useMemo(() => data?.items ?? [], [data])
  const totalFeedPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const isFiltering = Boolean(searchQuery.trim() || selectedIndustry || selectedRegion || sortBy !== 'latest')

  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedIndustry('')
    setSelectedRegion('')
    setSortBy('latest')
    setFeedPage(0)
  }

  // Danh mục ngành nghề
  const industryList = useMemo(() => {
    return (industriesData ?? []).filter((ind) => ind.name.trim().toLowerCase() !== 'khác')
  }, [industriesData])

  // Danh mục khu vực theo 63 tỉnh thành chuẩn Việt Nam
  const regionList = VIETNAM_CITIES

  return (
    <>
      {/* 1. Nút góc nhỏ tinh tế (màu trắng viền cam FPT chuẩn hệ thống, không màu đen) */}
      {!isControlled && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            onClick={handleOpen}
            className="group flex items-center gap-2 rounded-full border border-primary-soft-border bg-surface px-3.5 py-2 text-xs font-semibold text-primary-solid shadow-md transition duration-200 hover:scale-105 hover:border-primary hover:bg-primary-soft cursor-pointer"
            title={t('salary.viewRecentContributionsTooltip')}
          >
            <History size={15} className="text-primary-solid transition-transform group-hover:-rotate-45" />
            <span>{t('salary.recentContributionsTitle')}</span>
            {totalElements > 0 && (
              <span className="rounded-full bg-primary-soft px-1.5 py-0.2 text-xs font-bold text-brand-800">
                {totalElements}
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
          title={t('salary.recentContributionsTitle')}
          icon={<History size={18} className="text-primary-solid" />}
          maxWidthClassName="max-w-2xl"
        >
          {/* Thanh bộ lọc tinh gọn */}
          <div className="mb-4 space-y-2.5 rounded-xl border border-border bg-brand-50/40 p-3">
            {/* Hàng 1: Tìm kiếm + Chọn ngành + Chọn khu vực */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Tìm kiếm */}
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
                <input
                  aria-label={t('salary.searchJobOrCompany')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('salary.searchJobOrCompany')}
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-7 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                />
                {searchQuery && (
                  <button aria-label={t('common.close')}
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-muted"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Chọn ngành */}
              <SelectDropdown
                value={selectedIndustry}
                onChange={(val) => setSelectedIndustry(String(val))}
                options={[{ value: '', label: t('salary.allIndustries') }, ...industryList.map((ind) => ({ value: ind.name, label: ind.name }))]}
                placeholder={t('salary.allIndustries')}
                buttonClassName="h-9 rounded-lg"
              />

              {/* Chọn khu vực */}
              <SelectDropdown
                value={selectedRegion}
                onChange={(val) => setSelectedRegion(String(val))}
                options={[{ value: '', label: t('salary.allRegions') }, ...regionList.map((city) => ({ value: city, label: city }))]}
                placeholder={t('salary.allRegions')}
                buttonClassName="h-9 rounded-lg"
              />
            </div>

            {/* Hàng 2: Sắp xếp & Nút xóa lọc */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5 text-text-subtle">
                <ArrowUpDown size={12} className="text-text-subtle" />
                <span className="text-xs text-text-subtle">{t('salary.sortBy')}</span>
                <SelectDropdown
                  value={sortBy}
                  onChange={(val) => setSortBy(val as typeof sortBy)}
                  options={[
                    { value: 'latest', label: t('salary.sortLatest') },
                    { value: 'salaryDesc', label: t('salary.sortSalaryDesc') },
                    { value: 'salaryAsc', label: t('salary.sortSalaryAsc') },
                  ]}
                  placeholder={t('salary.sortBy')}
                  className="w-44"
                  buttonClassName="h-8 rounded-lg"
                />
              </div>

              {isFiltering && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger transition-colors cursor-pointer"
                >
                  <X size={12} /> {t('common.clearFilter')}
                </button>
              )}
            </div>
          </div>

          {/* Danh sách thẻ đóng góp cuộn dọc */}
          <div className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-2" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger-soft text-danger">
                  <AlertTriangle size={18} />
                </span>
                <p className="text-xs text-text-subtle">
                  {(error as Error)?.message ?? t('salary.loadContributionsError')}
                </p>
                <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={12} />} onClick={() => refetch()}>
                  {t('common.tryAgain')}
                </Button>
              </div>
            ) : feedItems.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={22} />}
                title={isFiltering ? t('salary.noFilteredData') : t('salary.noContributionsYet')}
                description={
                  isFiltering
                    ? t('salary.noFilteredDataDesc')
                    : t('salary.beFirstToContribute')
                }
                action={isFiltering ? <Button size="sm" variant="secondary" onClick={clearFilters}>{t('common.clearFilter')}</Button> : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {feedItems.map((c) => {
                    const timeAgo = c.createdAt
                      ? (() => {
                          try {
                            return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: i18n.language === 'vi' ? vi : enUS })
                          } catch {
                            return ''
                          }
                        })()
                      : ''

                    const IndIcon = getIndustryIcon(c.industry)

                    return (
                      <div
                        key={c.id}
                        className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 shadow-xs transition hover:border-primary-soft-border"
                      >
                        <div>
                          {/* Chức danh & thời gian */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-xs font-bold text-text line-clamp-1">
                              {c.jobTitle}
                            </h4>
                            {timeAgo && (
                              <span className="shrink-0 text-xs text-text-subtle whitespace-nowrap">
                                {timeAgo}
                              </span>
                            )}
                          </div>

                          {/* Tags: Ngành nghề & Công ty */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {c.industry && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-semibold text-primary-solid border border-brand-200/50">
                                <IndIcon size={10} className="shrink-0 text-primary-solid" />
                                <span className="line-clamp-1">{c.industry}</span>
                              </span>
                            )}
                            {c.company && (
                              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border line-clamp-1">
                                {c.company}
                              </span>
                            )}
                          </div>

                          {/* Địa điểm */}
                          {c.region && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                              <MapPin size={10} className="shrink-0" />
                              <span>{c.region}</span>
                            </p>
                          )}
                        </div>

                        {/* Mức lương + Kinh nghiệm */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
                          <span className="text-xs font-extrabold text-primary-solid">
                            {c.grossAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {c.currency}
                            <span className="text-xs font-normal text-text-subtle"> {t('salary.perMonth')}</span>
                          </span>
                          {c.yearsExperience != null && (
                            <span className="rounded bg-brand-100/60 px-1.5 py-0.5 text-xs font-semibold text-primary-solid">
                              {t('salary.yearsExpShort', { count: c.yearsExperience })}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Thanh phân trang trong popup */}
                {totalFeedPages > 1 && (
                  <div className="pt-3 border-t border-border flex items-center justify-center">
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
