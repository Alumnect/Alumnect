import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, X, RotateCcw, Check, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectDropdown } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { useUserFilterOptions } from '../hooks/useUserQueries'

export interface FilterState {
  query: string
  category: string
  role: string
  majorId: number | null
  cohort: number | null
  city: string
  skill: string
  company: string
  sortBy: string
  sortDirection: string
}

interface UserSearchFilterBarProps {
  filters: FilterState
  onChange: (newFilters: FilterState) => void
  onReset: () => void
}

// Giá trị phòng hờ (fallback) khi API đang tải hoặc mất kết nối:
// 1. Dải khóa học FPTU đầy đủ từ K21 đến K1
const DEFAULT_COHORTS = Array.from({ length: 21 }, (_, i) => 21 - i)

// 2. Danh sách 63 tỉnh / thành phố Việt Nam (sắp xếp A-Z)
const DEFAULT_CITIES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre',
  'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cần Thơ', 'Cao Bằng',
  'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai',
  'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang',
  'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng',
  'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế',
  'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
]


export function UserSearchFilterBar({ filters, onChange, onReset }: UserSearchFilterBarProps) {
  const [localQuery, setLocalQuery] = useState(filters.query)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: majors = [] } = useMajors()
  const { data: filterOptions } = useUserFilterOptions()

  // Ưu tiên nạp dữ liệu động từ DB, tự động fallback nếu chưa có dữ liệu
  const cohorts = filterOptions?.cohorts && filterOptions.cohorts.length > 0
    ? filterOptions.cohorts
    : DEFAULT_COHORTS

  const cities = filterOptions?.cities && filterOptions.cities.length > 0
    ? filterOptions.cities
    : DEFAULT_CITIES

  // Danh mục chuyên ngành gợi ý nhanh được sinh động từ DB
  const quickCategories = [
    { label: 'Tất cả', fullName: 'Tất cả', value: 'ALL', majorId: null },
    ...majors.slice(0, 6).map((m) => ({
      label: m.name.replace(/\s*\([^)]*\)/g, '').trim(),
      fullName: m.name,
      value: m.code,
      majorId: m.id,
    })),
  ]

  const filtersRef = useRef(filters)


  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Đồng bộ local query khi filters từ bên ngoài thay đổi
  useEffect(() => {
    setLocalQuery(filters.query)
  }, [filters.query])

  // Debounce search query input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== filtersRef.current.query) {
        onChange({ ...filtersRef.current, query: localQuery })
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [localQuery, onChange])

  // Xử lý chọn Quick Category
  const handleSelectCategory = (cat: { label: string; value: string; majorId: number | null }) => {
    if (cat.value === 'ALL') {
      onChange({ ...filters, category: 'ALL', majorId: null })
    } else {
      onChange({
        ...filters,
        category: cat.value,
        majorId: cat.majorId,
      })
    }
  }


  // Đếm số lượng bộ lọc nâng cao đang áp dụng
  const activeAdvancedFilterCount = [
    filters.role !== 'ALL' && filters.role,
    filters.cohort !== null,
    filters.city !== '',
    filters.majorId !== null && filters.category === 'ALL',
    filters.company !== '',
    filters.skill !== '',
  ].filter(Boolean).length

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Search Input Bar & Advanced Filter Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex flex-1 items-center">
          <Search size={18} className="pointer-events-none absolute left-3.5 text-text-subtle" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Tìm theo tên, chức danh, kỹ năng, công ty hoặc mã SV..."
            className="h-12 w-full rounded-2xl border border-border bg-surface/70 pl-10 pr-10 text-sm text-text placeholder:text-text-subtle shadow-sm backdrop-blur-sm transition-all focus:border-brand-400/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('')
                onChange({ ...filters, query: '' })
              }}
              className="absolute right-3.5 rounded-full p-1 text-text-subtle hover:bg-surface-3 hover:text-text-muted"
            >
              <X size={15} />
            </button>
          )}
        </label>

        <Button
          variant={activeAdvancedFilterCount > 0 ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<SlidersHorizontal size={16} />}
          onClick={() => setIsModalOpen(true)}
          className="relative shrink-0"
        >
          <span>Bộ lọc</span>
          {activeAdvancedFilterCount > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary-solid shadow-sm">
              {activeAdvancedFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-text-subtle mr-1">
          <Compass size={13} className="text-primary-solid" /> Ngành:
        </span>
        {quickCategories.map((cat) => {
          const isSelected = filters.category === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              title={cat.fullName || cat.label}
              onClick={() => handleSelectCategory(cat)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs',
                isSelected
                  ? 'bg-primary-solid text-on-primary shadow-raised ring-2 ring-brand-400/40'
                  : 'bg-surface/80 text-text-muted border border-border hover:bg-surface hover:border-primary-soft-border',
              )}
            >
              {cat.label}
            </button>
          )
        })}

      </div>

      {/* Advanced Filter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Bộ lọc danh bạ chi tiết"
        maxWidthClassName="max-w-lg"
      >
        <p className="mb-4 text-xs text-text-subtle">
          Tùy chỉnh các tiêu chí để tìm kiếm cựu sinh viên & sinh viên chính xác nhất.
        </p>
        <div className="space-y-5 py-2">
          {/* Vai trò */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-subtle">
              Vai trò thành viên
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tất cả vai trò', value: 'ALL' },
                { label: 'Cựu sinh viên', value: 'ALUMNI' },
                { label: 'Sinh viên', value: 'STUDENT' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onChange({ ...filters, role: r.value })}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all',
                    filters.role === r.value
                      ? 'border-primary bg-primary-soft text-primary-solid shadow-sm'
                      : 'border-border bg-surface text-text-muted hover:border-border-strong',
                  )}
                >
                  {filters.role === r.value && <Check size={13} className="text-primary-solid" />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chuyên ngành FPTU */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-subtle">
              Chuyên ngành học
            </label>
            <SelectDropdown<string | number>
              value={filters.majorId ?? ''}
              onChange={(val) => onChange({ ...filters, majorId: val === '' ? null : Number(val), category: 'ALL' })}
              options={[{ value: '', label: 'Tất cả chuyên ngành' }, ...majors.map((m) => ({ value: m.id, label: `[${m.code}] ${m.name}` }))]}
              placeholder="Tất cả chuyên ngành"
            />
          </div>

          {/* Niên khóa & Tỉnh thành */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-subtle">
                Khóa nhập học
              </label>
              <SelectDropdown<string | number>
                value={filters.cohort ?? ''}
                onChange={(val) => onChange({ ...filters, cohort: val === '' ? null : Number(val) })}
                options={[{ value: '', label: 'Tất cả các khóa' }, ...cohorts.map((c) => ({ value: c, label: `Khóa K${c}` }))]}
                placeholder="Tất cả các khóa"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-subtle">
                Tỉnh / Thành phố
              </label>
              <SelectDropdown<string | number>
                value={filters.city}
                onChange={(val) => onChange({ ...filters, city: String(val) })}
                options={[{ value: '', label: 'Tất cả địa điểm' }, ...cities.map((c) => ({ value: c, label: c }))]}
                placeholder="Tất cả địa điểm"
              />
            </div>
          </div>


          {/* Sắp xếp kết quả */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-subtle">
              Sắp xếp theo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Mới nhất', sortBy: 'createdAt', sortDirection: 'DESC' },
                { label: 'Họ tên A-Z', sortBy: 'fullName', sortDirection: 'ASC' },
                { label: 'Khóa học', sortBy: 'cohort', sortDirection: 'DESC' },
              ].map((s) => {
                const isSelected = filters.sortBy === s.sortBy && filters.sortDirection === s.sortDirection
                return (
                  <button
                    key={s.sortBy + s.sortDirection}
                    type="button"
                    onClick={() => onChange({ ...filters, sortBy: s.sortBy, sortDirection: s.sortDirection })}
                    className={cn(
                      'rounded-xl border p-2.5 text-center text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-primary bg-primary-soft text-primary-solid'
                        : 'border-border bg-surface text-text-muted hover:border-border-strong',
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={onReset}
          >
            Đặt lại bộ lọc
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(false)}
          >
            Áp dụng bộ lọc
          </Button>
        </div>
      </Modal>
    </div>
  )
}
