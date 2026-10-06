import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Clock,
  Loader2,
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

  // Form State - Thông tin cá nhân cơ bản (chỉnh sửa trực tiếp tại Section 1)
  const [fullName, setFullName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [campus, setCampus] = useState<string>('')
  const [graduationYear, setGraduationYear] = useState<number | null>(null)

  // Form State - Chuyên môn & Định hướng cố vấn
  const [yearsOfExperience, setYearsOfExperience] = useState<number | null>(null)
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
      // Section 1: Thông tin cá nhân
      if (data.personalInfo) {
        if (data.personalInfo.fullName) setFullName(data.personalInfo.fullName)
        if (data.personalInfo.phone) setPhone(data.personalInfo.phone)
        if (data.personalInfo.campus) setCampus(data.personalInfo.campus)
        if (data.personalInfo.graduationYear !== undefined) {
          setGraduationYear(data.personalInfo.graduationYear)
        }
      }

      // Section 2: Chuyên môn & Kinh nghiệm
      if (data.professionalInfo?.yearsOfExperience !== undefined) {
        setYearsOfExperience(data.professionalInfo.yearsOfExperience)
      }
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
      fullName: fullName ? fullName.trim() : null,
      phone: phone ? phone.trim() : null,
      campus: campus ? campus.trim() : null,
      graduationYear: graduationYear === null || graduationYear === undefined ? null : Number(graduationYear),
      yearsOfExperience:
        yearsOfExperience === null || yearsOfExperience === undefined
          ? null
          : Number(yearsOfExperience),
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
    if (!fullName || !fullName.trim()) {
      missing.push('Họ và tên')
    }
    if (!data?.professionalInfo?.reusedFromProfile?.currentPosition) {
      missing.push('Chức danh công việc hiện tại (hãy cập nhật tại Profile)')
    }
    if (yearsOfExperience === null || yearsOfExperience === undefined || yearsOfExperience < 0) {
      missing.push('Số năm kinh nghiệm')
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#f27024] mb-3" />
        <p className="text-sm font-medium">Đang tải...</p>
      </div>
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
      {/* Header Banner: Gradient trắng bên trái, cam bên phải (#f27024) */}
      <div className="bg-gradient-to-r from-white via-[#fff5ee] to-[#f27024] rounded-3xl p-8 border border-orange-200/80 shadow-md relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 backdrop-blur-[2px] pointer-events-none transform -skew-x-12 translate-x-12" />

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isActive ? 'Hồ sơ người hướng dẫn' : 'Đăng ký làm người hướng dẫn'}
          </h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {isActive
              ? 'Cập nhật thông tin hướng dẫn, lĩnh vực hỗ trợ và tài khoản nhận thanh toán của bạn.'
              : 'Chia sẻ kinh nghiệm, định hướng nghề nghiệp và đồng hành cùng mọi người trên hành trình phát triển.'}
          </p>
        </div>

        {/* Trạng thái hồ sơ */}
        <div className="mt-6 pt-4 border-t border-orange-200/80 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Trạng thái hồ sơ:</span>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Đang hoạt động
              </span>
            ) : isPendingPayment ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-700" /> Chờ kích hoạt gói
              </span>
            ) : data?.hasExistingRegistration ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#d45105] border border-orange-200 text-xs font-bold shadow-sm">
                <FileCheck2 className="w-3.5 h-3.5 text-[#f27024]" /> Bản nháp
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-xs font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Chưa tạo hồ sơ
              </span>
            )}
          </div>

          {isActive ? (
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/subscription')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold shadow-md transition-colors"
            >
              <span>Quản lý gói dịch vụ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : isPendingPayment ? (
            <button
              type="button"
              onClick={() => navigate('/app/mentoring/packages')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold shadow-md transition-colors"
            >
              <span>Chọn gói</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Form Sections */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Phần 1: Thông tin cá nhân cơ bản (chỉnh sửa trực tiếp tại chỗ) */}
        <MentorPersonalInfoSection
          personalInfo={data?.personalInfo}
          fullName={fullName}
          phone={phone}
          campus={campus}
          graduationYear={graduationYear}
          onFullNameChange={setFullName}
          onPhoneChange={setPhone}
          onCampusChange={setCampus}
          onGraduationYearChange={setGraduationYear}
        />

        {/* Phần 2: Thông tin chuyên môn & kinh nghiệm */}
        <MentorProfessionalSection
          professionalInfo={data?.professionalInfo}
          yearsOfExperience={yearsOfExperience}
          bio={bio}
          onYearsChange={setYearsOfExperience}
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
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-xl flex items-center justify-end gap-4">

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-500" />
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
