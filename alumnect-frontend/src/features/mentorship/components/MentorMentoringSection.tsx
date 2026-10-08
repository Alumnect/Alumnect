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
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#393a3b] mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#f27024] dark:text-orange-400 flex items-center justify-center font-bold">
          3
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-[#f0f2f5] text-lg">Hình thức & Lĩnh vực</h3>
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">Cách thức kết nối và đồng hành</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hình thức hướng dẫn (Working Mode) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-[#f0f2f5] mb-2">
            Hình thức hướng dẫn <span className="text-rose-500">*</span>
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
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${isSelected
                    ? 'border-[#f27024] bg-orange-50/70 dark:bg-[#f27024]/15 ring-2 ring-[#f27024]/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#393a3b] hover:border-slate-300 dark:hover:border-[#4e4f50] bg-white dark:bg-[#18191a] hover:bg-slate-50/50 dark:hover:bg-[#242526]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#f27024] text-white' : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-500 dark:text-[#b0b3b8]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-[#f27024] bg-[#f27024]' : 'border-slate-300 dark:border-[#4e4f50]'
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? 'text-[#d45105] dark:text-[#ff8c38]' : 'text-slate-800 dark:text-[#f0f2f5]'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-[#b0b3b8] block mt-0.5">{item.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Loại hình hướng dẫn (Mentoring Type) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-[#f0f2f5] mb-2">
            Loại hình hướng dẫn <span className="text-rose-500">*</span>
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
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${isSelected
                    ? 'border-[#f27024] bg-orange-50/70 dark:bg-[#f27024]/15 ring-2 ring-[#f27024]/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#393a3b] hover:border-slate-300 dark:hover:border-[#4e4f50] bg-white dark:bg-[#18191a] hover:bg-slate-50/50 dark:hover:bg-[#242526]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#f27024] text-white' : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-500 dark:text-[#b0b3b8]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-[#f27024] bg-[#f27024]' : 'border-slate-300 dark:border-[#4e4f50]'
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? 'text-[#d45105] dark:text-[#ff8c38]' : 'text-slate-800 dark:text-[#f0f2f5]'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-[#b0b3b8] block mt-0.5">{item.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lĩnh vực ngành nghề hỗ trợ (Dropdown Multi-Select) */}
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-[#f0f2f5]">
              Lĩnh vực hỗ trợ <span className="text-rose-500">*</span>
            </label>
            {supportedIndustryIds.length > 0 && (
              <span className="text-xs font-semibold text-[#f27024] bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-800/60">
                Đã chọn {supportedIndustryIds.length}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mb-2.5">
            Nhấp vào ô chọn để mở danh mục và chọn các lĩnh vực ngành nghề bạn có thể hướng dẫn
          </p>

          {/* Trigger Dropdown Box */}
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`min-h-[46px] w-full px-3.5 py-2 rounded-xl border bg-white dark:bg-[#18191a] cursor-pointer transition-all flex items-center justify-between gap-2 ${isDropdownOpen
              ? 'border-[#f27024] ring-2 ring-[#f27024]/20'
              : 'border-slate-200 dark:border-[#393a3b] hover:border-slate-300 dark:hover:border-[#4e4f50]'
              }`}
          >
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {selectedIndustries.length === 0 ? (
                <span className="text-sm text-slate-400 dark:text-[#8a8d91]">
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 dark:bg-[#f27024]/20 text-[#d45105] dark:text-orange-300 border border-orange-200/80 dark:border-orange-500/30 hover:bg-orange-100 dark:hover:bg-[#f27024]/30 transition-colors"
                  >
                    <span>{ind.name}</span>
                    <X className="w-3 h-3 hover:text-rose-600 transition-colors" />
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 dark:text-[#8a8d91] shrink-0">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180 text-[#f27024]' : ''
                  }`}
              />
            </div>
          </div>

          {/* Dropdown Menu Popup */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#393a3b] shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
              {/* Search input in dropdown */}
              <div className="p-3 border-b border-slate-100 dark:border-[#393a3b] bg-slate-50/60 dark:bg-[#18191a] flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-[#f0f2f5] focus:outline-none placeholder:text-slate-400 dark:placeholder:text-[#8a8d91]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-[#f0f2f5] p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50 dark:divide-[#393a3b]">
                {filteredIndustries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-[#8a8d91]">
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
                          ? 'bg-orange-50 dark:bg-[#f27024]/20 text-[#d45105] dark:text-orange-300'
                          : 'hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#f0f2f5]'
                          }`}
                      >
                        <span className="text-sm font-medium">{ind.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked
                            ? 'border-[#f27024] bg-[#f27024] text-white'
                            : 'border-slate-300 dark:border-[#4e4f50] bg-white dark:bg-[#18191a]'
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
              <div className="p-2.5 border-t border-slate-100 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] flex items-center justify-between text-xs text-slate-500 dark:text-[#b0b3b8]">
                <span>
                  Đã chọn {supportedIndustryIds.length}/{availableIndustries.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-3 py-1 bg-[#f27024] hover:bg-[#d45105] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-[#f0f2f5]">
              Chủ đề hướng dẫn
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mb-2">
            Thêm các chủ đề bạn có thể hỗ trợ
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="VD: Hướng dẫn làm dự án, định hướng nghề nghiệp, phỏng vấn thử..."
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleAddTopic}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-slate-800 dark:text-[#f0f2f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91]"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={!topicInput.trim()}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-[#3a3b3c] text-white text-xs font-semibold hover:bg-slate-900 dark:hover:bg-[#4e4f50] disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {mentoringTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {mentoringTopics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-[#d45105] dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => onRemoveTopic(index)}
                    className="hover:text-rose-600 rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
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
