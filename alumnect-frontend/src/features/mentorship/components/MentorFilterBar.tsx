import {
  RotateCcw,
  Briefcase,
  GraduationCap,
  Laptop,
  Users,
  X,
  Filter,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    { value: '', label: t('mentoring.allFields') },
    ...industries.map((ind) => ({
      value: ind.id,
      label: ind.name,
    })),
  ]

  const majorOptions: SelectOption<number | ''>[] = [
    { value: '', label: t('mentoring.allSpecializations') },
    ...majors.map((maj) => ({
      value: maj.id,
      label: maj.name,
      sublabel: maj.code ? `(${maj.code})` : undefined,
    })),
  ]

  const workingModeOptions: SelectOption<string>[] = [
    { value: '', label: t('mentoring.workingMode') },
    { value: 'ONLINE', label: t('mentoring.workingModeOnline') },
    { value: 'OFFLINE', label: t('mentoring.workingModeOffline') },
    { value: 'BOTH', label: t('mentoring.workingModeBoth') },
  ]

  const mentoringTypeOptions: SelectOption<string>[] = [
    { value: '', label: t('mentoring.mentoringFormat') },
    { value: 'INDIVIDUAL', label: t('mentoring.mentoringFormat1on1') },
    { value: 'GROUP', label: t('mentoring.mentoringFormatGroup') },
    { value: 'BOTH', label: t('mentoring.mentoringFormatBoth') },
  ]

  return (
    <div className="relative z-10 rounded-2xl border border-border bg-surface/70 p-3 sm:p-3.5 shadow-2xs backdrop-blur-md space-y-2.5">
      {/* Tiêu đề & nút Reset bộ lọc */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-primary-solid" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t('mentoring.filterCriteria')}
          </span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-solid">
              {t('mentoring.appliedFilters', { count: activeFilterCount })}
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
            <span>{t('mentoring.clearFilter')}</span>
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
          placeholder={t('mentoring.allFields')}
          icon={<Briefcase className="h-3.5 w-3.5" />}
        />

        {/* 2. Chuyên ngành đào tạo */}
        <SelectDropdown
          value={params.majorId ?? ''}
          onChange={(val) => handleMajorChange(String(val))}
          options={majorOptions}
          placeholder={t('mentoring.allSpecializations')}
          icon={<GraduationCap className="h-3.5 w-3.5" />}
        />

        {/* 3. Hình thức làm việc */}
        <SelectDropdown
          value={params.workingMode ?? ''}
          onChange={(val) => handleWorkingModeChange(val)}
          options={workingModeOptions}
          placeholder={t('mentoring.workingMode')}
          icon={<Laptop className="h-3.5 w-3.5" />}
        />

        {/* 4. Hình thức hướng dẫn */}
        <SelectDropdown
          value={params.mentoringType ?? ''}
          onChange={(val) => handleMentoringTypeChange(val)}
          options={mentoringTypeOptions}
          placeholder={t('mentoring.mentoringFormat')}
          align="right"
          icon={<Users className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Hiển thị các Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-text-subtle">
            {t('mentoring.filteringBy')}
          </span>

          {params.keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-solid ring-1 ring-inset ring-brand-300">
              <span>{t('mentoring.keywordFilterLabel', { keyword: params.keyword })}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ keyword: undefined, page: 0 })}
                aria-label={t('mentoring.clearKeywordFilterAria')}
                className="hover:text-primary-solid"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedIndustry && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-text ring-1 ring-inset ring-plum-300">
              <span>{t('mentoring.industryFilterLabel', { name: selectedIndustry.name })}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ fieldId: undefined, page: 0 })}
                aria-label={t('mentoring.clearIndustryFilterAria')}
                className="hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedMajor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-text ring-1 ring-inset ring-plum-300">
              <span>{t('mentoring.majorFilterLabel', { name: selectedMajor.name })}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ majorId: undefined, page: 0 })}
                aria-label={t('mentoring.clearMajorFilterAria')}
                className="hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {params.workingMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-aqua-50 px-2.5 py-0.5 text-xs font-semibold text-aqua-800 ring-1 ring-inset ring-aqua-300 dark:bg-aqua-950/40 dark:text-aqua-300">
              <span>
                {t('mentoring.workingModeFilterLabel', { mode: params.workingMode === 'ONLINE' ? t('mentoring.formatOnlineShort') : params.workingMode === 'OFFLINE' ? t('mentoring.formatOfflineShort') : t('mentoring.formatHybridShort') })}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ workingMode: undefined, page: 0 })}
                aria-label={t('mentoring.clearWorkingModeFilterAria')}
                className="hover:text-aqua-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {params.mentoringType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-semibold text-info ring-1 ring-inset ring-info-border">
              <span>
                {t('mentoring.mentoringTypeFilterLabel', { type: params.mentoringType === 'INDIVIDUAL' ? t('mentoring.method1on1Short') : params.mentoringType === 'GROUP' ? t('mentoring.methodGroupShort') : t('mentoring.methodBothShort') })}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ mentoringType: undefined, page: 0 })}
                aria-label={t('mentoring.clearMentoringTypeFilterAria')}
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
