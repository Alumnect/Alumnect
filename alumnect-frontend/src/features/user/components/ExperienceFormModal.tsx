import React, { useState, useEffect } from 'react'
import { Briefcase, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlaceAutocomplete } from './PlaceAutocomplete'
import {
  useCreateExperience,
  useUpdateExperience,
  usePromoteExperience,
} from '../hooks/useExperienceMutations'
import type { ExperienceResponse, ExperienceRequest } from '../model/userTypes'
import { Avatar, Skeleton, EmptyState, Modal } from '@/components/ui'

interface ExperienceFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'promote'
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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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

  // Mutations
  const createMutation = useCreateExperience()
  const updateMutation = useUpdateExperience()
  const promoteMutation = usePromoteExperience()

  const loading = createMutation.isPending || updateMutation.isPending || promoteMutation.isPending

  // Initialize fields on open or change
  useEffect(() => {
    if (isOpen) {
      setValidationError(null)
      if (mode === 'edit' && experience) {
        setTitle(experience.title)
        setCompany(experience.company)
        setLocation(experience.location ?? '')
        setStartDate(experience.startDate)
        setEndDate(experience.endDate ?? '')
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
        setStartDate('')
        setEndDate('')
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
      } else {
        // Create mode
        setTitle('')
        setCompany('')
        setLocation('')
        setStartDate('')
        setEndDate('')
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
    setLocation(data.formattedAddress)
    setLatitude(data.latitude)
    setLongitude(data.longitude)
    setPlaceId(data.placeId)
    setLocationCity(data.city)
    setLocationCountry(data.country)
    setLocationCountryCode(data.countryCode)
    setGeocodingProvider(data.provider)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!title.trim()) {
      setValidationError('Vui lòng nhập chức danh / vai trò')
      return
    }
    if (!company.trim()) {
      setValidationError('Vui lòng nhập tên công ty / tổ chức')
      return
    }
    if (!startDate) {
      setValidationError('Vui lòng nhập ngày bắt đầu')
      return
    }
    if (!isCurrent && !endDate) {
      setValidationError('Vui lòng nhập ngày kết thúc')
      return
    }
    if (!isCurrent && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setValidationError('Ngày bắt đầu không được lớn hơn ngày kết thúc')
      return
    }

    const requestPayload: ExperienceRequest = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || null,
      startDate,
      endDate: isCurrent ? null : endDate,
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
      if (mode === 'create') {
        await createMutation.mutateAsync(requestPayload)
      } else if (mode === 'edit' && experience) {
        await updateMutation.mutateAsync({ id: experience.id, payload: requestPayload })
      } else if (mode === 'promote' && experience) {
        await promoteMutation.mutateAsync({
          id: experience.id,
          payload: {
            newTitle: title.trim(),
            newStartDate: startDate,
            description: description.trim() || null,
            reuseLocation: true,
          },
        })
      }
      onClose()
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu dữ liệu')
    }
  }

  const getTitleText = () => {
    if (mode === 'create') return 'Thêm kinh nghiệm làm việc'
    if (mode === 'edit') return 'Chỉnh sửa kinh nghiệm làm việc'
    return 'Thăng chức / Đổi vai trò cùng công ty'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitleText()}
      icon={<Briefcase size={18} />}
      maxWidthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {validationError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 border border-coral-200/40 p-3.5 text-xs font-semibold text-coral-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {mode === 'promote' && experience && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50/50 border border-brand-200/20 p-3.5 text-xs text-brand-700">
            <Info size={16} className="shrink-0 mt-0.5 text-brand-500" />
            <span>
              Thăng chức tại <strong>{experience.company}</strong>. Vai trò cũ{' '}
              <strong>{experience.title}</strong> sẽ được kết thúc vào ngày trước ngày bắt đầu vai trò mới.
            </span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
            Chức danh / Vai trò <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Senior Frontend Developer, Core Member..."
            required
            disabled={loading}
            className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
            Công ty / Tổ chức / Câu lạc bộ <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="VD: FPT Software, FPT Developer Club..."
            required
            disabled={loading || mode === 'promote'}
            className="w-full rounded-2xl border border-plum-900/10 bg-plum-50/30 disabled:bg-plum-900/[0.03] disabled:text-plum-400 py-3 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Location Autocomplete */}
        <div>
          <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
            Vị trí / Địa điểm (Geocoded)
          </label>
          {mode === 'promote' ? (
            <input
              type="text"
              value={location}
              disabled
              className="w-full rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] py-3 px-4 text-sm text-plum-400"
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

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
              Ngày bắt đầu <span className="text-coral-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {!isCurrent && (
            <div>
              <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                Ngày kết thúc <span className="text-coral-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={!isCurrent}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
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
              <span className="text-sm font-semibold text-plum-700">Kinh nghiệm chính (Primary)</span>
            </label>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
            Mô tả chi tiết
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả công việc, dự án đã tham gia..."
            rows={3}
            disabled={loading}
            className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 placeholder-plum-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-plum-900/5 mt-6">
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
    </Modal>
  )
}
