import {
  RotateCcw,
  Briefcase,
  GraduationCap,
  Laptop,
  Users,
  X,
  Filter,
} from 'lucide-react'
import { SelectDropdown, type SelectOption } from '@/components/ui'
import type {
  MentorFilterOptions,
  MentorSearchParams,
  MentoringWorkingMode,
  MentoringType,
} from '../model/mentorSearchTypes'

interface MentorFilterBarProps {
  options?: MentorFilterOptions
  params: MentorSearchParams
  onFilterChange: (updates: Partial<MentorSearchParams>) => void
  onClearFilters: () => void
  activeFilterCount: number
}

/**
 * Thanh bộ lọc đa tiêu chí cho tìm kiếm Mentor (UC98).
 * Hỗ trợ lọc theo:
 * 1. Ngành nghề / Lĩnh vực (Field / Industry)
 * 2. Chuyên ngành (Specialization / Major)
 * 3. Hình thức làm việc (Working Mode: Online / Offline / Both)
 * 4. Hình thức hướng dẫn (Mentoring Type: 1-1 / Group / Both)
 */
export function MentorFilterBar({
  options,
  params,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: MentorFilterBarProps) {
  const handleFieldChange = (val: string) => {
    const fieldId = val ? Number(val) : undefined
    onFilterChange({ fieldId, page: 0 })
  }

  const handleMajorChange = (val: string) => {
    const majorId = val ? Number(val) : undefined
    onFilterChange({ majorId, page: 0 })
  }

  const handleWorkingModeChange = (val: string) => {
    const workingMode = (val || undefined) as MentoringWorkingMode | undefined
    onFilterChange({ workingMode, page: 0 })
  }

  const handleMentoringTypeChange = (val: string) => {
    const mentoringType = (val || undefined) as MentoringType | undefined
    onFilterChange({ mentoringType, page: 0 })
  }

  // Đảm bảo an toàn khi options đang tải (tránh crash khi options là undefined)
  const industries = options?.industries ?? []
  const majors = options?.specializations ?? options?.majors ?? []

  // Lấy tên hiển thị cho active tags
  const selectedIndustry = industries.find((i) => i.id === params.fieldId)
  const selectedMajor = majors.find((m) => m.id === params.majorId)

  // Chuẩn bị danh sách options cho các dropdown tùy chỉnh
  const industryOptions: SelectOption<number | ''>[] = [
    { value: '', label: 'Tất cả lĩnh vực' },
    ...industries.map((ind) => ({
      value: ind.id,
      label: ind.name,
    })),
  ]

  const majorOptions: SelectOption<number | ''>[] = [
    { value: '', label: 'Tất cả chuyên ngành' },
    ...majors.map((maj) => ({
      value: maj.id,
      label: maj.name,
      sublabel: maj.code ? `(${maj.code})` : undefined,
    })),
  ]

  const workingModeOptions: SelectOption<string>[] = [
    { value: '', label: 'Hình thức làm việc' },
    { value: 'ONLINE', label: 'Trực tuyến (Online)' },
    { value: 'OFFLINE', label: 'Trực tiếp (Offline)' },
    { value: 'BOTH', label: 'Linh hoạt (Cả hai)' },
  ]

  const mentoringTypeOptions: SelectOption<string>[] = [
    { value: '', label: 'Hình thức hướng dẫn' },
    { value: 'INDIVIDUAL', label: '1 kèm 1' },
    { value: 'GROUP', label: 'Theo nhóm' },
    { value: 'BOTH', label: 'Cả 1-1 & Nhóm' },
  ]

  return (
    <div className="relative z-10 rounded-2xl border border-border bg-surface/70 p-3 sm:p-3.5 shadow-2xs backdrop-blur-md space-y-2.5">
      {/* Tiêu đề & nút Reset bộ lọc */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-primary-solid" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Bộ lọc tiêu chí
          </span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-solid">
              {activeFilterCount} đang áp dụng
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-solid transition-colors hover:text-primary-solid cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      {/* Grid 4 dropdowns chuẩn đồng bộ với hệ thống */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Lĩnh vực / Ngành nghề */}
        <SelectDropdown
          value={params.fieldId ?? ''}
          onChange={(val) => handleFieldChange(String(val))}
          options={industryOptions}
          placeholder="Tất cả lĩnh vực"
          icon={<Briefcase className="h-3.5 w-3.5" />}
        />

        {/* 2. Chuyên ngành đào tạo */}
        <SelectDropdown
          value={params.majorId ?? ''}
          onChange={(val) => handleMajorChange(String(val))}
          options={majorOptions}
          placeholder="Tất cả chuyên ngành"
          icon={<GraduationCap className="h-3.5 w-3.5" />}
        />

        {/* 3. Hình thức làm việc */}
        <SelectDropdown
          value={params.workingMode ?? ''}
          onChange={(val) => handleWorkingModeChange(val)}
          options={workingModeOptions}
          placeholder="Hình thức làm việc"
          icon={<Laptop className="h-3.5 w-3.5" />}
        />

        {/* 4. Hình thức hướng dẫn */}
        <SelectDropdown
          value={params.mentoringType ?? ''}
          onChange={(val) => handleMentoringTypeChange(val)}
          options={mentoringTypeOptions}
          placeholder="Hình thức hướng dẫn"
          align="right"
          icon={<Users className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Hiển thị các Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-text-subtle">
            Đang lọc theo:
          </span>

          {params.keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-solid ring-1 ring-inset ring-brand-300">
              <span>Từ khóa: &quot;{params.keyword}&quot;</span>
              <button
                type="button"
                onClick={() => onFilterChange({ keyword: undefined, page: 0 })}
                aria-label="Xóa lọc từ khóa"
                className="hover:text-primary-solid"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedIndustry && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-text ring-1 ring-inset ring-plum-300">
              <span>Lĩnh vực: {selectedIndustry.name}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ fieldId: undefined, page: 0 })}
                aria-label="Xóa lọc lĩnh vực"
                className="hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedMajor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-text ring-1 ring-inset ring-plum-300">
              <span>Ngành: {selectedMajor.name}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ majorId: undefined, page: 0 })}
                aria-label="Xóa lọc chuyên ngành"
                className="hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {params.workingMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-aqua-50 px-2.5 py-0.5 text-xs font-semibold text-aqua-800 ring-1 ring-inset ring-aqua-300 dark:bg-aqua-950/40 dark:text-aqua-300">
              <span>
                Hình thức: {params.workingMode === 'ONLINE' ? 'Trực tuyến' : params.workingMode === 'OFFLINE' ? 'Trực tiếp' : 'Linh hoạt'}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ workingMode: undefined, page: 0 })}
                aria-label="Xóa lọc hình thức làm việc"
                className="hover:text-aqua-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {params.mentoringType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-semibold text-info ring-1 ring-inset ring-info-border">
              <span>
                Phương thức: {params.mentoringType === 'INDIVIDUAL' ? '1 kèm 1' : params.mentoringType === 'GROUP' ? 'Theo nhóm' : '1-1 & Nhóm'}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ mentoringType: undefined, page: 0 })}
                aria-label="Xóa lọc phương thức hướng dẫn"
                className="hover:text-info"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
