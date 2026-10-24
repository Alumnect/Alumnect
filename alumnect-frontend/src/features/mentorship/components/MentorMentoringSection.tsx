import React, { useState, useRef, useEffect } from 'react'
import {
  Compass,
  Globe,
  MapPin,
  Users,
  User,
  Plus,
  X,
  Layers,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react'
import type {
  MentoringWorkingMode,
  MentoringType,
  SupportedIndustryItem,
} from '../model/mentorRegistrationTypes'

interface Props {
  workingMode: MentoringWorkingMode | null
  mentoringType: MentoringType | null
  supportedIndustryIds: number[]
  mentoringTopics: string[]
  availableIndustries: SupportedIndustryItem[]
  onWorkingModeChange: (mode: MentoringWorkingMode | null) => void
  onMentoringTypeChange: (type: MentoringType | null) => void
  onIndustryToggle: (id: number) => void
  onAddTopic: (topic: string) => void
  onRemoveTopic: (index: number) => void
}

export const MentorMentoringSection: React.FC<Props> = ({
  workingMode,
  mentoringType,
  supportedIndustryIds,
  mentoringTopics,
  availableIndustries,
  onWorkingModeChange,
  onMentoringTypeChange,
  onIndustryToggle,
  onAddTopic,
  onRemoveTopic,
}) => {
  const [topicInput, setTopicInput] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddTopic = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    e.preventDefault()
    const trimmed = topicInput.trim()
    if (trimmed && !mentoringTopics.includes(trimmed)) {
      onAddTopic(trimmed)
      setTopicInput('')
    }
  }

  // Danh sách ngành nghề lọc theo từ khóa tìm kiếm
  const filteredIndustries = availableIndustries.filter((ind) =>
    ind.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  // Danh sách các ngành nghề đã chọn
  const selectedIndustries = availableIndustries.filter((ind) =>
    supportedIndustryIds.includes(ind.id)
  )

  return (
    <div className="bg-surface rounded-2xl border border-cream-300/80 dark:border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-border dark:border-border mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-solid flex items-center justify-center font-bold">
          3
        </div>
        <div>
          <h3 className="font-semibold text-text text-lg">Hình thức & Lĩnh vực</h3>
          <p className="text-xs text-text-subtle">Cách thức kết nối và đồng hành</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hình thức hướng dẫn (Working Mode) */}
        <div>
          <label className="block text-sm font-semibold text-text-muted mb-2">
            Hình thức hướng dẫn <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: 'ONLINE' as MentoringWorkingMode,
                label: 'Trực tuyến',
                desc: 'Meet, Zoom, Teams',
                icon: Globe,
              },
              {
                value: 'OFFLINE' as MentoringWorkingMode,
                label: 'Trực tiếp',
                desc: 'Gặp mặt',
                icon: MapPin,
              },
              {
                value: 'BOTH' as MentoringWorkingMode,
                label: 'Cả hai',
                desc: 'Linh hoạt',
                icon: Compass,
              },
            ].map((item) => {
              const Icon = item.icon
              const isSelected = workingMode === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onWorkingModeChange(isSelected ? null : item.value)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${isSelected
                    ? 'border-primary bg-brand-50/70 dark:bg-brand-600/15 ring-2 ring-brand-600/20 shadow-sm'
                    : 'border-border dark:border-border hover:border-border-strong bg-surface hover:bg-cream-100/50 dark:hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-600 text-white' : 'bg-cream-200 dark:bg-surface-2 text-plum-500 dark:text-text-muted'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${isSelected ? 'border-primary bg-primary-solid' : 'border-border-strong'
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? 'text-brand-700 dark:text-primary' : 'text-plum-800 dark:text-text'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-text-subtle block mt-0.5">{item.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Loại hình hướng dẫn (Mentoring Type) */}
        <div>
          <label className="block text-sm font-semibold text-text-muted mb-2">
            Loại hình hướng dẫn <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: 'INDIVIDUAL' as MentoringType,
                label: 'Cá nhân 1-1',
                desc: 'Hướng dẫn 1 người',
                icon: User,
              },
              {
                value: 'GROUP' as MentoringType,
                label: 'Theo nhóm',
                desc: 'Nhóm từ 2 - 5 người',
                icon: Users,
              },
              {
                value: 'BOTH' as MentoringType,
                label: 'Cả hai',
                desc: 'Linh hoạt cả hai hình thức',
                icon: Layers,
              },
            ].map((item) => {
              const Icon = item.icon
              const isSelected = mentoringType === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onMentoringTypeChange(isSelected ? null : item.value)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${isSelected
                    ? 'border-primary bg-brand-50/70 dark:bg-brand-600/15 ring-2 ring-brand-600/20 shadow-sm'
                    : 'border-border dark:border-border hover:border-border-strong bg-surface hover:bg-cream-100/50 dark:hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-600 text-white' : 'bg-cream-200 dark:bg-surface-2 text-plum-500 dark:text-text-muted'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${isSelected ? 'border-primary bg-primary-solid' : 'border-border-strong'
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-surface" />}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? 'text-brand-700 dark:text-primary' : 'text-plum-800 dark:text-text'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-text-subtle block mt-0.5">{item.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lĩnh vực ngành nghề hỗ trợ (Dropdown Multi-Select) */}
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-text-muted">
              Lĩnh vực hỗ trợ <span className="text-danger">*</span>
            </label>
            {supportedIndustryIds.length > 0 && (
              <span className="text-xs font-semibold text-primary-solid bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary-soft-border">
                Đã chọn {supportedIndustryIds.length}
              </span>
            )}
          </div>
          <p className="text-xs text-text-subtle mb-2.5">
            Nhấp vào ô chọn để mở danh mục và chọn các lĩnh vực ngành nghề bạn có thể hướng dẫn
          </p>

          {/* Trigger Dropdown Box */}
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`min-h-[46px] w-full px-3.5 py-2 rounded-xl border bg-white dark:bg-bg cursor-pointer transition flex items-center justify-between gap-2 ${isDropdownOpen
              ? 'border-primary ring-2 ring-brand-600/20'
              : 'border-border dark:border-border hover:border-border-strong'
              }`}
          >
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {selectedIndustries.length === 0 ? (
                <span className="text-sm text-text-subtle dark:text-text-subtle">
                  Chọn các lĩnh vực ngành nghề hỗ trợ...
                </span>
              ) : (
                selectedIndustries.map((ind) => (
                  <span
                    key={ind.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onIndustryToggle(ind.id)
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-soft text-primary-solid border border-brand-200/80 dark:border-brand-500/30 hover:bg-primary-soft transition-colors"
                  >
                    <span>{ind.name}</span>
                    <X className="w-3 h-3 hover:text-danger transition-colors" />
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-1 text-text-subtle dark:text-text-subtle shrink-0">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180 text-primary-solid' : ''
                  }`}
              />
            </div>
          </div>

          {/* Dropdown Menu Popup */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface rounded-2xl border border-border dark:border-border shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
              {/* Search input in dropdown */}
              <div className="p-3 border-b border-border dark:border-border bg-cream-100/60 dark:bg-bg flex items-center gap-2">
                <Search className="w-4 h-4 text-text-subtle shrink-0" />
                <input
                  aria-label="Tìm kiếm..."
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-text focus:outline-none placeholder:text-text-subtle dark:placeholder:text-text-subtle"
                  autoFocus
                />
                {searchQuery && (
                  <button aria-label="Đóng"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-text-subtle hover:text-text-muted p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-cream-100 dark:divide-border">
                {filteredIndustries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-subtle dark:text-text-subtle">
                    Không tìm thấy ngành nghề phù hợp
                  </div>
                ) : (
                  filteredIndustries.map((ind) => {
                    const isChecked = supportedIndustryIds.includes(ind.id)
                    return (
                      <div
                        key={ind.id}
                        onClick={() => onIndustryToggle(ind.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isChecked
                          ? 'bg-primary-soft text-primary-solid'
                          : 'hover:bg-surface-2 text-text-muted'
                          }`}
                      >
                        <span className="text-sm font-medium">{ind.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${isChecked
                            ? 'border-primary bg-primary-solid text-on-primary'
                            : 'border-border-strong bg-surface'
                            }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer info */}
              <div className="p-2.5 border-t border-border dark:border-border bg-surface-2 flex items-center justify-between text-xs text-text-subtle">
                <span>
                  Đã chọn {supportedIndustryIds.length}/{availableIndustries.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-3 py-1 bg-primary-solid hover:bg-primary-hover text-on-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chủ đề cố vấn chuyên sâu tự do (Topics) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-text-muted">
              Chủ đề hướng dẫn
            </label>
          </div>
          <p className="text-xs text-text-subtle mb-2">
            Thêm các chủ đề bạn có thể hỗ trợ
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="VD: Hướng dẫn làm dự án, định hướng nghề nghiệp, phỏng vấn thử..."
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleAddTopic}
              className="flex-1 px-3.5 py-2 rounded-xl border border-border dark:border-border-strong bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-primary placeholder:text-text-subtle dark:placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={!topicInput.trim()}
              className="px-4 py-2 rounded-xl bg-plum-800 dark:bg-surface-2 text-white text-xs font-semibold hover:bg-plum-900 dark:hover:bg-surface-3 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {mentoringTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {mentoringTopics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary-solid border border-brand-200/80 dark:border-brand-700/60"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => onRemoveTopic(index)}
                    className="grid h-7 w-7 place-items-center rounded-full text-primary-solid transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger cursor-pointer"
                    aria-label={`Xóa chủ đề ${topic}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
