import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, X, RotateCcw, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { useMajors } from '@/features/auth/hooks/useAuth'

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

const QUICK_CATEGORIES = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Kỹ thuật phần mềm', value: 'SE', majorCode: 'SE' },
  { label: 'Trí tuệ nhân tạo', value: 'AI', majorCode: 'AI' },
  { label: 'An toàn thông tin', value: 'IA', majorCode: 'IA' },
  { label: 'Thiết kế đồ họa', value: 'GD', majorCode: 'GD' },
  { label: 'Kinh doanh quốc tế', value: 'IB', majorCode: 'IB' },
  { label: 'Marketing', value: 'MKT', majorCode: 'MKT' },
]

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Quy Nhơn']
const COHORTS = [19, 18, 17, 16, 15, 14, 13, 12]

export function UserSearchFilterBar({ filters, onChange, onReset }: UserSearchFilterBarProps) {
  const [localQuery, setLocalQuery] = useState(filters.query)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: majors = [] } = useMajors()
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
  const handleSelectCategory = (cat: typeof QUICK_CATEGORIES[0]) => {
    if (cat.value === 'ALL') {
      onChange({ ...filters, category: 'ALL', majorId: null })
    } else {
      const foundMajor = majors.find((m) => m.code === cat.majorCode)
      onChange({
        ...filters,
        category: cat.value,
        majorId: foundMajor ? foundMajor.id : null,
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
          <Search size={18} className="pointer-events-none absolute left-3.5 text-plum-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Tìm theo tên, chức danh, kỹ năng, công ty hoặc mã SV..."
            className="h-12 w-full rounded-2xl border border-plum-900/10 bg-white/70 pl-10 pr-10 text-sm text-plum-900 placeholder:text-plum-400 shadow-sm backdrop-blur-sm transition-all focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('')
                onChange({ ...filters, query: '' })
              }}
              className="absolute right-3.5 rounded-full p-1 text-plum-400 hover:bg-plum-900/10 hover:text-plum-700"
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
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-600 shadow-sm">
              {activeAdvancedFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-plum-400 mr-1">
          <Sparkles size={13} className="text-brand-500" /> Gợi ý:
        </span>
        {QUICK_CATEGORIES.map((cat) => {
          const isSelected = filters.category === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs',
                isSelected
                  ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-brand-500/20 ring-2 ring-brand-400/40'
                  : 'bg-white/80 text-plum-600 border border-plum-900/10 hover:bg-white hover:border-brand-300',
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
        <p className="mb-4 text-xs text-plum-500">
          Tùy chỉnh các tiêu chí để tìm kiếm cựu sinh viên & sinh viên chính xác nhất.
        </p>
        <div className="space-y-5 py-2">
          {/* Vai trò */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-plum-500">
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
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-plum-900/10 bg-white text-plum-600 hover:border-plum-900/20',
                  )}
                >
                  {filters.role === r.value && <Check size={13} className="text-brand-500" />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chuyên ngành FPTU */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-plum-500">
              Chuyên ngành học
            </label>
            <select
              value={filters.majorId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null
                onChange({ ...filters, majorId: val, category: 'ALL' })
              }}
              className="h-10 w-full rounded-xl border border-plum-900/15 bg-white px-3 text-xs font-medium text-plum-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Tất cả chuyên ngành (24 ngành FPTU)</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Niên khóa & Tỉnh thành */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-plum-500">
                Khóa nhập học (Cohort)
              </label>
              <select
                value={filters.cohort || ''}
                onChange={(e) => onChange({ ...filters, cohort: e.target.value ? Number(e.target.value) : null })}
                className="h-10 w-full rounded-xl border border-plum-900/15 bg-white px-3 text-xs font-medium text-plum-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Tất cả các khóa</option>
                {COHORTS.map((c) => (
                  <option key={c} value={c}>
                    Khóa K{c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-plum-500">
                Tỉnh / Thành phố
              </label>
              <select
                value={filters.city}
                onChange={(e) => onChange({ ...filters, city: e.target.value })}
                className="h-10 w-full rounded-xl border border-plum-900/15 bg-white px-3 text-xs font-medium text-plum-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Tất cả địa điểm</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sắp xếp kết quả */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-plum-500">
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
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-plum-900/10 bg-white text-plum-600 hover:border-plum-900/20',
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
        <div className="mt-6 flex items-center justify-between border-t border-plum-900/10 pt-4">
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
