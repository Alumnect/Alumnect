import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Save,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Clock,
  FileCheck2,
} from 'lucide-react'
import { MentorPageHeader } from './MentorPageHeader'
import { brandButtonClass } from '@/components/brand/brandClasses'
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
  const { t } = useTranslation()
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
  const [bankBin, setBankBin] = useState<string>('')
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
      if (data.payoutAccount?.bankBin) {
        setBankBin(data.payoutAccount.bankBin)
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
      bankBin: bankBin || null,
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
      missing.push(t('mentoring.missingFullName'))
    }
    if (!data?.professionalInfo?.reusedFromProfile?.currentPosition) {
      missing.push(t('mentoring.missingCurrentPosition'))
    }
    if (!workingMode) {
      missing.push(t('mentoring.missingWorkingMode'))
    }
    if (!mentoringType) {
      missing.push(t('mentoring.missingMentoringType'))
    }
    if (supportedIndustryIds.length === 0) {
      missing.push(t('mentoring.missingSupportedIndustries'))
    }
    if (!cvFileKey) {
      missing.push(t('mentoring.missingCvFile'))
    }
    if (!bankName || !bankBin || !bankAccountNumber || !bankAccountHolder) {
      missing.push(t('mentoring.missingBankAccount'))
    }

    if (missing.length > 0) {
      toast.error(t('mentoring.pleaseFillRequiredFields', { fields: missing.slice(0, 3).join(', ') + (missing.length > 3 ? '...' : '') }))
      return
    }

    const payload = buildPayload()
    try {
      const res = await saveMutation.mutateAsync(payload)
      if (data?.mentorStatus === 'ACTIVE') {
        toast.success(t('mentoring.profileUpdatedSuccess'))
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
      <div className="max-w-2xl mx-auto p-6 bg-danger-soft border border-danger-border rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
        <h3 className="font-semibold text-danger text-base mb-1">{t('mentoring.cannotLoadRegistrationInfo')}</h3>
        <p className="text-xs text-danger mb-4">{error?.message || t('mentoring.anErrorOccurred')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-danger text-text-inverse rounded-xl text-xs font-semibold hover:opacity-90 transition-colors"
        >
          {t('common.reloadPage')}
        </button>
      </div>
    )
  }

  const isPendingPayment = data?.mentorStatus === 'PAYMENT_PENDING'
  const isActive = data?.mentorStatus === 'ACTIVE'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Dải đầu trang: trạng thái hồ sơ + hành động tiếp theo */}
      <MentorPageHeader
        scene="profile"
        title={isActive ? t('mentoring.manageMentorProfileTitle') : t('mentoring.registerMentorTitle')}
        description={
          <span className="inline-flex items-center gap-2.5">
            <span className="text-xs font-semibold text-text-muted">{t('mentoring.profileStatusPrefix')}</span>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-3 py-1 text-xs font-bold text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('mentoring.statusActiveBadge')}
              </span>
            ) : isPendingPayment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-bold text-warning">
                <Clock className="h-3.5 w-3.5" />
                {t('mentoring.statusPendingPaymentBadge')}
              </span>
            ) : data?.hasExistingRegistration ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-soft-border bg-primary-soft px-3 py-1 text-xs font-bold text-primary-solid">
                <FileCheck2 className="h-3.5 w-3.5" />
                {t('mentoring.statusDraftBadge')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-3 px-3 py-1 text-xs font-semibold text-text-muted dark:bg-surface-2">
                {t('mentoring.statusNotCreatedBadge')}
              </span>
            )}
          </span>
        }
        actions={
          isActive ? (
            <button type="button" onClick={() => navigate('/app/mentoring/subscription')} className={brandButtonClass}>
              {t('mentoring.manageSubscriptionBtn')}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : isPendingPayment ? (
            <button type="button" onClick={() => navigate('/app/mentoring/packages')} className={brandButtonClass}>
              {t('mentoring.selectAndActivatePackage')}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />
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
          bankBin={bankBin}
          bankAccountNumber={bankAccountNumber}
          bankAccountHolder={bankAccountHolder}
          onBankNameChange={setBankName}
          onBankBinChange={setBankBin}
          onBankAccountNumberChange={setBankAccountNumber}
          onBankAccountHolderChange={setBankAccountHolder}
        />

        {/* Action Buttons Bar */}
        <div className="rounded-2xl border border-cream-300/80 bg-surface p-4 shadow-sm sm:sticky sm:bottom-4 sm:z-20 sm:bg-white/95 sm:backdrop-blur-md dark:border-border sm:dark:bg-surface/95 flex items-center justify-end gap-4">

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border-strong hover:bg-surface-2 text-text-muted font-semibold text-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-text-subtle" />
              <span>{saveMutation.isPending ? t('mentoring.savingDraft') : t('mentoring.saveDraft')}</span>
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-solid hover:bg-primary-hover text-on-primary font-semibold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white">{isActive ? t('mentoring.saveProfile') : t('mentoring.completeRegistration')}</span>
              <ArrowRight className="w-4 h-4 ml-0.5 text-white" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
