import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Briefcase, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlaceAutocomplete } from './PlaceAutocomplete'
import { MonthYearPicker } from './MonthYearPicker'

import {
  useCreateExperience,
  useUpdateExperience,
  usePromoteExperience,
} from '../hooks/useExperienceMutations'
import type { ExperienceResponse, ExperienceRequest } from '../model/userTypes'

interface ExperienceFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'promote' | 'rejoin'
  experience?: ExperienceResponse | null // Used for edit or promote source
}

/**
 * Modal thêm/sửa kinh nghiệm làm việc của người dùng.
 * Sử dụng component Modal dùng chung để tự động kế thừa Portal (hiển thị tràn màn hình) và AnimatePresence.
 */
export function ExperienceFormModal({
  isOpen,
  onClose,
  mode,
  experience,
}: ExperienceFormModalProps) {
  // Input fields state
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  // Month and Year states
  const [startMonth, setStartMonth] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endMonth, setEndMonth] = useState('')
  const [endYear, setEndYear] = useState('')

  const [isCurrent, setIsCurrent] = useState(false)
  const [isPrimary, setIsPrimary] = useState(false)
  const [description, setDescription] = useState('')

  // Geocoding data state
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)
  const [placeId, setPlaceId] = useState<string | undefined>(undefined)
  const [locationCity, setLocationCity] = useState<string | undefined>(undefined)
  const [locationCountry, setLocationCountry] = useState<string | undefined>(undefined)
  const [locationCountryCode, setLocationCountryCode] = useState<string | undefined>(undefined)
  const [geocodingProvider, setGeocodingProvider] = useState<string | undefined>(undefined)

  const [validationError, setValidationError] = useState<string | null>(null)

  // Current date constraints
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth() + 1
  const currentMonthStr = String(currentMonthNum).padStart(2, '0')
  const currentISOStr = `${currentYear}-${currentMonthStr}-01`

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Mutations
  const createMutation = useCreateExperience()
  const updateMutation = useUpdateExperience()
  const promoteMutation = usePromoteExperience()

  const loading = createMutation.isPending || updateMutation.isPending || promoteMutation.isPending

  // Helper parsing ISO YYYY-MM-DD to month and year
  const parseYearMonth = (dateStr?: string | null) => {
    if (!dateStr) return { month: '', year: '' }
    const parts = dateStr.split('-')
    if (parts.length >= 2) {
      return {
        year: parts[0],
        month: String(parseInt(parts[1], 10)).padStart(2, '0'),
      }
    }
    return { month: '', year: '' }
  }

  // Initialize fields on open or change
  useEffect(() => {
    if (isOpen) {
      setValidationError(null)
      if (mode === 'edit' && experience) {
        setTitle(experience.title)
        setCompany(experience.company)
        setLocation(experience.location ?? '')

        const startP = parseYearMonth(experience.startDate)
        setStartMonth(startP.month)
        setStartYear(startP.year)

        const endP = parseYearMonth(experience.endDate)
        setEndMonth(endP.month)
        setEndYear(endP.year)

        setIsCurrent(experience.isCurrent)
        setIsPrimary(experience.isPrimary)
        setDescription(experience.description ?? '')
        setLatitude(experience.latitude ?? undefined)
        setLongitude(experience.longitude ?? undefined)
        setPlaceId(experience.placeId ?? undefined)
        setLocationCity(experience.locationCity ?? undefined)
        setLocationCountry(experience.locationCountry ?? undefined)
        setLocationCountryCode(experience.locationCountryCode ?? undefined)
        setGeocodingProvider(experience.geocodingProvider ?? undefined)
      } else if (mode === 'promote' && experience) {
        setTitle('')
        setCompany(experience.company)
        setLocation(experience.location ?? '')
        setStartMonth('')
        setStartYear('')
        setEndMonth('')
        setEndYear('')
        setIsCurrent(true)
        setIsPrimary(experience.isPrimary)
        setDescription('')
        setLatitude(experience.latitude ?? undefined)
        setLongitude(experience.longitude ?? undefined)
        setPlaceId(experience.placeId ?? undefined)
        setLocationCity(experience.locationCity ?? undefined)
        setLocationCountry(experience.locationCountry ?? undefined)
        setLocationCountryCode(experience.locationCountryCode ?? undefined)
        setGeocodingProvider(experience.geocodingProvider ?? undefined)
      } else if (mode === 'rejoin' && experience) {
        setTitle('')
        setCompany(experience.company)
        setLocation(experience.location ?? '')
        setStartMonth('')
        setStartYear('')
        setEndMonth('')
        setEndYear('')
        setIsCurrent(true)
        setIsPrimary(true)
        setDescription('')
        setLatitude(experience.latitude ?? undefined)
        setLongitude(experience.longitude ?? undefined)
        setPlaceId(experience.placeId ?? undefined)
        setLocationCity(experience.locationCity ?? undefined)
        setLocationCountry(experience.locationCountry ?? undefined)
        setLocationCountryCode(experience.locationCountryCode ?? undefined)
        setGeocodingProvider(experience.geocodingProvider ?? undefined)
      } else {
        // Create mode
        setTitle('')
        setCompany('')
        setLocation('')
        setStartMonth('')
        setStartYear('')
        setEndMonth('')
        setEndYear('')
        setIsCurrent(true)
        setIsPrimary(false)
        setDescription('')
        setLatitude(undefined)
        setLongitude(undefined)
        setPlaceId(undefined)
        setLocationCity(undefined)
        setLocationCountry(undefined)
        setLocationCountryCode(undefined)
        setGeocodingProvider(undefined)
      }
    }
  }, [isOpen, mode, experience])

  const handlePlaceSelect = (data: any) => {
    if (!data) {
      setLocation('')
      setLatitude(undefined)
      setLongitude(undefined)
      setPlaceId(undefined)
      setLocationCity(undefined)
      setLocationCountry(undefined)
      setLocationCountryCode(undefined)
      setGeocodingProvider(undefined)
      return
    }
    setLocation(data.formattedAddress || data.location || '')
    setLatitude(data.latitude)
    setLongitude(data.longitude)
    setPlaceId(data.placeId)
    setLocationCity(data.locationCity)
    setLocationCountry(data.locationCountry)
    setLocationCountryCode(data.locationCountryCode)
    setGeocodingProvider(data.geocodingProvider)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const formattedStartDate = startMonth && startYear ? `${startYear}-${startMonth}-01` : ''
    const formattedEndDate = !isCurrent && endMonth && endYear ? `${endYear}-${endMonth}-01` : null

    // Validations
    if (!title.trim()) {
      setValidationError('Vui lòng nhập chức danh / vai trò')
      return
    }
    if (!company.trim()) {
      setValidationError('Vui lòng nhập tên công ty / tổ chức')
      return
    }
    if (!startMonth || !startYear) {
      setValidationError('Vui lòng chọn cả Tháng và Năm bắt đầu')
      return
    }
    if (formattedStartDate > currentISOStr) {
      setValidationError(`Tháng/năm bắt đầu không được vượt quá thời gian hiện tại (sau tháng ${currentMonthStr}/${currentYear})`)
      return
    }
    if (!isCurrent && (!endMonth || !endYear)) {
      setValidationError('Vui lòng chọn cả Tháng và Năm kết thúc khi đã kết thúc công việc')
      return
    }
    if (!isCurrent && formattedEndDate && formattedEndDate > currentISOStr) {
      setValidationError(`Tháng/năm kết thúc không được vượt quá thời gian hiện tại (sau tháng ${currentMonthStr}/${currentYear})`)
      return
    }
    if (!isCurrent && formattedEndDate && formattedStartDate && formattedEndDate < formattedStartDate) {
      setValidationError('Tháng/Năm kết thúc không được trước tháng/năm bắt đầu')
      return
    }

    if (mode === 'promote' && experience) {
      const oldStartDate = experience.startDate
      if (formattedStartDate <= oldStartDate) {
        setValidationError(`Tháng bắt đầu vai trò mới phải sau tháng bắt đầu vai trò cũ (${oldStartDate.slice(0, 7)})`)
        return
      }
    }
    const requestPayload: ExperienceRequest = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || null,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isCurrent,
      isPrimary,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      placeId: placeId ?? null,
      locationCity: locationCity ?? null,
      locationCountry: locationCountry ?? null,
      locationCountryCode: locationCountryCode ?? null,
      geocodingProvider: geocodingProvider ?? null,
      description: description.trim() || null,
    }

    try {
      if (mode === 'create' || mode === 'rejoin') {
        await createMutation.mutateAsync(requestPayload)
      } else if (mode === 'edit' && experience) {
        await updateMutation.mutateAsync({ id: experience.id, payload: requestPayload })
      } else if (mode === 'promote' && experience) {
        await promoteMutation.mutateAsync({
          id: experience.id,
          payload: {
            newTitle: title.trim(),
            newStartDate: formattedStartDate,
            description: description.trim() || null,
            reuseLocation: true,
          },
        })
      }
      onClose()
    } catch (err: any) {
      console.error('Lỗi khi lưu kinh nghiệm:', err)
      setValidationError(
        err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu thông tin kinh nghiệm'
      )
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-plum-950/50 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl overflow-hidden flex flex-col min-h-[580px] max-h-[90vh] animate-scale-up">
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-plum-900/5 bg-plum-50/50 shrink-0">
          <h2 className="text-base font-extrabold text-plum-900 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-500" />
            {mode === 'create' && 'Thêm kinh nghiệm làm việc'}
            {mode === 'edit' && 'Chỉnh sửa kinh nghiệm'}
            {mode === 'promote' && 'Thăng chức / Vai trò mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full text-plum-400 hover:text-plum-700 hover:bg-plum-900/[0.04] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
            {validationError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 border border-coral-200/40 p-3.5 text-xs text-coral-700 font-semibold">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {mode === 'promote' && experience && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50/50 border border-brand-200/20 p-3.5 text-xs text-brand-700">
                <Info size={16} className="shrink-0 mt-0.5 text-brand-500" />
                <span>
                  Thăng chức tại <strong>{experience.company}</strong>. Vai trò cũ{' '}
                  <strong>{experience.title}</strong> sẽ được kết thúc vào ngày trước tháng bắt đầu vai trò mới.
                </span>
              </div>
            )}

            {mode === 'rejoin' && experience && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50/50 border border-brand-200/20 p-3.5 text-xs text-brand-700">
                <Info size={16} className="shrink-0 mt-0.5 text-brand-500" />
                <div className="space-y-1">
                  <p>Đang thêm một vị trí khác tại <strong>{experience.company}</strong>.</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-brand-700/90">
                    <li><strong>Để quay lại làm việc tại đây:</strong> Cứ giữ nguyên dấu tích ở ô <em>Công việc hiện tại</em>.</li>
                    <li><strong>Để bổ sung công việc cũ:</strong> Hãy bỏ tích ô <em>Công việc hiện tại</em> để nhập ngày kết thúc nhé.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Row 1: Title & Company side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Chức danh / Vai trò <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Senior Frontend Developer..."
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-2.5 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Công ty / Tổ chức / CLB <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="VD: FPT Software..."
                  required
                  disabled={loading || mode === 'promote' || mode === 'rejoin'}
                  className="w-full rounded-2xl border border-plum-900/10 bg-plum-50/30 disabled:bg-plum-900/[0.03] disabled:text-plum-400 py-2.5 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Row 2: Location Autocomplete */}
            <div>
              <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                Vị trí / Địa điểm
              </label>
              {mode === 'promote' || mode === 'rejoin' ? (
                <input
                  type="text"
                  value={location}
                  disabled
                  className="w-full rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] py-2.5 px-4 text-sm text-plum-400"
                />
              ) : (
                <PlaceAutocomplete
                  value={location}
                  onChange={setLocation}
                  onSelect={handlePlaceSelect}
                  placeholder="Tìm thành phố, quốc gia..."
                />
              )}
            </div>

            {/* Row 3: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <MonthYearPicker
                label="Tháng / Năm bắt đầu"
                required
                disabled={loading}
                monthValue={startMonth}
                yearValue={startYear}
                onChange={(m, y) => {
                  setStartMonth(m)
                  setStartYear(y)
                }}
              />

              {/* End Date */}
              {!isCurrent && (
                <MonthYearPicker
                  label="Tháng / Năm kết thúc"
                  required
                  disabled={loading}
                  monthValue={endMonth}
                  yearValue={endYear}
                  onChange={(m, y) => {
                    setEndMonth(m)
                    setEndYear(y)
                  }}
                />
              )}
            </div>

            {/* Row 4: Checkboxes */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              {mode !== 'promote' && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => {
                      setIsCurrent(e.target.checked)
                      if (!e.target.checked) {
                        setIsPrimary(false)
                      }
                    }}
                    disabled={loading}
                    className="h-4.5 w-4.5 rounded border-plum-900/10 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-semibold text-plum-700">Công việc hiện tại</span>
                </label>
              )}

              {isCurrent && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    disabled={loading}
                    className="h-4.5 w-4.5 rounded border-plum-900/10 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-semibold text-plum-700">Công việc chính (Primary)</span>
                </label>
              )}
            </div>

            {/* Row 5: Description */}
            <div>
              <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả công việc, dự án đã tham gia..."
                rows={5}
                disabled={loading}
                className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[120px]"
              />
            </div>
          </div>


          {/* Footer Actions (Fixed at bottom) */}
          <div className="px-6 py-4 border-t border-plum-900/5 bg-plum-50/30 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-plum-900/10 text-plum-700 font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white shadow-sm font-semibold px-6 flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Lưu lại</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}



