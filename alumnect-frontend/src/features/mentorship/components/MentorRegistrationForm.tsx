import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Clock,
  FileCheck2,
} from 'lucide-react'
import {
  useMentorRegistration,
  useMentorIndustries,
  useSaveMentorRegistration,
} from '../hooks/useMentorRegistration'
import { MentorPersonalInfoSection } from './MentorPersonalInfoSection'
import { MentorProfessionalSection } from './MentorProfessionalSection'
import { MentorMentoringSection } from './MentorMentoringSection'
import { MentorCvSection } from './MentorCvSection'
import { MentorPayoutBankSection } from './MentorPayoutBankSection'
import { MentorshipLoadingSkeleton } from './MentorshipLoadingSkeleton'
import type {
  MentoringWorkingMode,
  MentoringType,
  MentorRegistrationRequest,
} from '../model/mentorRegistrationTypes'
import { toast } from '@/components/ui'

export const MentorRegistrationForm: React.FC = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useMentorRegistration()
  const { data: industries = [] } = useMentorIndustries()
  const saveMutation = useSaveMentorRegistration()


  // Form State - Chuyên môn & Định hướng cố vấn
  const [bio, setBio] = useState<string>('')
  const [workingMode, setWorkingMode] = useState<MentoringWorkingMode | null>(null)
  const [mentoringType, setMentoringType] = useState<MentoringType | null>(null)
  const [supportedIndustryIds, setSupportedIndustryIds] = useState<number[]>([])
  const [mentoringTopics, setMentoringTopics] = useState<string[]>([])
  const [cvFileKey, setCvFileKey] = useState<string>('')
  const [bankName, setBankName] = useState<string>('')
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('')
  const [bankAccountHolder, setBankAccountHolder] = useState<string>('')

  // Đồng bộ dữ liệu từ server khi fetch thành công
  useEffect(() => {
    if (data) {

      // Section 2: Chuyên môn & Kinh nghiệm
      if (data.professionalInfo?.bio) {
        setBio(data.professionalInfo.bio)
      }

      // Section 3: Hình thức & Lĩnh vực
      if (data.mentoringInfo?.workingMode) {
        setWorkingMode(data.mentoringInfo.workingMode)
      }
      if (data.mentoringInfo?.mentoringType) {
        setMentoringType(data.mentoringInfo.mentoringType)
      }
      if (data.mentoringInfo?.supportedIndustries) {
        setSupportedIndustryIds(data.mentoringInfo.supportedIndustries.map((ind) => ind.id))
      }
      if (data.mentoringInfo?.mentoringTopics) {
        setMentoringTopics(data.mentoringInfo.mentoringTopics)
      }

      // Section 4: CV
      if (data.cvInfo?.cvFileKey) {
        setCvFileKey(data.cvInfo.cvFileKey)
      }

      // Section 5: Ngân hàng
      if (data.payoutAccount?.bankName) {
        setBankName(data.payoutAccount.bankName)
      }
      if (data.payoutAccount?.bankAccountNumber) {
        setBankAccountNumber(data.payoutAccount.bankAccountNumber)
      }
      if (data.payoutAccount?.bankAccountHolder) {
        setBankAccountHolder(data.payoutAccount.bankAccountHolder)
      }
    }
  }, [data])

  // Toggle chọn ngành nghề
  const handleIndustryToggle = (id: number) => {
    setSupportedIndustryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Thêm / Xóa chủ đề cố vấn
  const handleAddTopic = (topic: string) => {
    setMentoringTopics((prev) => [...prev, topic])
  }

  const handleRemoveTopic = (index: number) => {
    setMentoringTopics((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Chuẩn bị payload gửi lên server
  const buildPayload = (): MentorRegistrationRequest => {
    return {
      fullName: data?.personalInfo?.fullName || null,
      phone: data?.personalInfo?.phone || null,
      campus: data?.personalInfo?.campus || null,
      graduationYear: data?.personalInfo?.graduationYear ?? null,
      bio: bio || null,
      workingMode: workingMode || null,
      mentoringType: mentoringType || null,
      supportedIndustryIds: supportedIndustryIds.length > 0 ? supportedIndustryIds : [],
      mentoringTopics: mentoringTopics.length > 0 ? mentoringTopics : [],
      cvFileKey: cvFileKey || null,
      bankName: bankName ? bankName.trim() : null,
      bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : null,
      bankAccountHolder: bankAccountHolder ? bankAccountHolder.trim().toUpperCase() : null,
    }
  }

  // Xử lý Lưu nháp (Save Draft)
  const handleSaveDraft = async () => {
    const payload = buildPayload()
    try {
      await saveMutation.mutateAsync(payload)
    } catch {
      // Error handled by hook
    }
  }

  // Xử lý Hoàn tất đăng ký (Complete Registration)
  const handleComplete = async () => {
    // 1. Kiểm tra nhanh tại Client để hỗ trợ người dùng
    const missing: string[] = []
    if (!data?.personalInfo?.fullName || !data.personalInfo.fullName.trim()) {
      missing.push('Họ và tên (vui lòng cập nhật tại hồ sơ cá nhân)')
    }
    if (!data?.professionalInfo?.reusedFromProfile?.currentPosition) {
      missing.push('Chức danh công việc hiện tại (vui lòng cập nhật tại hồ sơ cá nhân)')
    }
    if (!workingMode) {
      missing.push('Hình thức hướng dẫn')
    }
    if (!mentoringType) {
      missing.push('Loại hình hướng dẫn')
    }
    if (supportedIndustryIds.length === 0) {
      missing.push('Ít nhất 1 lĩnh vực ngành nghề hỗ trợ')
    }
    if (!cvFileKey) {
      missing.push('Tệp CV đính kèm')
    }
    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      missing.push('Thông tin tài khoản ngân hàng nhận chi trả')
    }

    if (missing.length > 0) {
      toast.error(`Bạn cần điền đủ: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`)
      return
    }

    const payload = buildPayload()
    try {
      const res = await saveMutation.mutateAsync(payload)
      if (data?.mentorStatus === 'ACTIVE') {
        toast.success('Đã cập nhật hồ sơ Mentor thành công!')
        return
      }
      if (res.isComplete || res.mentorStatus === 'PAYMENT_PENDING') {
        // Chuyển tiếp tới bước chọn gói Mentor (UC92)
        navigate('/app/mentoring/packages')
      }
    } catch {
      // Error handled by hook
    }
  }

  if (isLoading) {
    return (
      <MentorshipLoadingSkeleton variant="registration" />
    )
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-semibold text-rose-900 text-base mb-1">Không thể tải thông tin đăng ký</h3>
        <p className="text-xs text-rose-700 mb-4">{error?.message || 'Đã có lỗi xảy ra.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          Tải lại trang
        </button>
      </div>
    )
  }

  const isPendingPayment = data?.mentorStatus === 'PAYMENT_PENDING'
  const isActive = data?.mentorStatus === 'ACTIVE'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner: Alumnect Mentorship Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/60 dark:from-brand-950/40 dark:via-[#242526] dark:to-[#1e1f20] dark:border-[#393a3b] p-6 sm:p-8 shadow-sm">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {isActive ? 'Hồ sơ Mentor' : 'Đăng ký làm Mentor'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#b0b3b8] font-medium leading-relaxed">
            {isActive
              ? 'Cập nhật thông tin Mentor, lĩnh vực hỗ trợ và tài khoản nhận thanh toán của bạn.'
              : 'Hỗ trợ, hướng dẫn và đồng hành cùng mọi người trên hành trình phát triển.'}
          </p>
        </div>

        {/* Trạng thái hồ sơ & Hành động nhanh */}
        <div className="mt-6 pt-4 border-t border-brand-500/15 dark:border-[#393a3b] flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8]">Trạng thái hồ sơ:</span>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Đang hoạt động</span>
              </span>
            ) : isPendingPayment ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Chờ kích hoạt gói</span>
              </span>
            ) : data?.hasExistingRegistration ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-[#d45105] dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold shadow-xs">
                <FileCheck2 className="w-3.5 h-3.5 text-[#f27024]" />
                <span>Bản nháp</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#f0f2f5] border border-slate-200 dark:border-[#4e4f50] text-xs font-semibold">
                Chưa tạo hồ sơ
              </span>
            )}
          </div>

          {isActive ? (
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/subscription')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f27024] hover:bg-[#d45105] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Quản lý gói dịch vụ</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          ) : isPendingPayment ? (
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/packages')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f27024] hover:bg-[#d45105] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Chọn gói & Kích hoạt</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Form Sections */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Phần 1: Thông tin cá nhân cơ bản (đồng bộ từ Hồ sơ cá nhân) */}
        <MentorPersonalInfoSection personalInfo={data?.personalInfo} />

        {/* Phần 2: Thông tin chuyên môn & kinh nghiệm */}
        <MentorProfessionalSection
          professionalInfo={data?.professionalInfo}
          bio={bio}
          onBioChange={setBio}
        />

        {/* Phần 3: Thiết lập hình thức & lĩnh vực */}
        <MentorMentoringSection
          workingMode={workingMode}
          mentoringType={mentoringType}
          supportedIndustryIds={supportedIndustryIds}
          mentoringTopics={mentoringTopics}
          availableIndustries={industries}
          onWorkingModeChange={setWorkingMode}
          onMentoringTypeChange={setMentoringType}
          onIndustryToggle={handleIndustryToggle}
          onAddTopic={handleAddTopic}
          onRemoveTopic={handleRemoveTopic}
        />

        {/* Phần 4: Đính kèm Hồ sơ năng lực / CV (Tách riêng) */}
        <MentorCvSection
          cvFileKey={cvFileKey}
          cvDownloadUrl={data?.cvInfo?.cvDownloadUrl}
          onCvUploaded={setCvFileKey}
        />

        {/* Phần 5: Thông tin tài khoản nhận chi trả (Tách riêng) */}
        <MentorPayoutBankSection
          bankName={bankName}
          bankAccountNumber={bankAccountNumber}
          bankAccountHolder={bankAccountHolder}
          onBankNameChange={setBankName}
          onBankAccountNumberChange={setBankAccountNumber}
          onBankAccountHolderChange={setBankAccountHolder}
        />

        {/* Action Buttons Bar */}
        <div className="sticky bottom-6 z-20 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-[#393a3b] p-4 shadow-xl flex items-center justify-end gap-4">

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#4e4f50] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#f0f2f5] font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-500 dark:text-[#b0b3b8]" />
              <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}</span>
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#f27024] hover:bg-[#d45105] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white">{isActive ? 'Lưu hồ sơ' : 'Hoàn tất'}</span>
              <ArrowRight className="w-4 h-4 ml-0.5 text-white" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
