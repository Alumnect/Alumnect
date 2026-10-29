import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  GraduationCap,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  Check,
  X,
  Phone,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, toast, SelectDropdown, FadeSwitch } from '@/components/ui'
import { ProvinceSelect } from './ProvinceSelect'
import { CampusSelect } from './CampusSelect'
import { useMajors } from '@/features/auth/hooks/useAuth'

import { useUpdateOwnProfile } from '../hooks/useUserMutations'
import type { UserProfileResponse, UpdateProfileRequest, UserSkillRequest } from '../model/userTypes'

interface EditProfileViewProps {
  profile: UserProfileResponse
  onCancel: () => void
  onSuccess: () => void
}

export function EditProfileView({ profile, onCancel, onSuccess }: EditProfileViewProps) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<'overview' | 'academic' | 'contact' | 'skills'>('overview')

  // Form states
  const [fullName, setFullName] = useState('')
  const [biography, setBiography] = useState('')

  const [campus, setCampus] = useState('')
  const [majorId, setMajorId] = useState<number | undefined>(undefined)
  const [cohort, setCohort] = useState<number | undefined>(undefined)
  const [graduationYear, setGraduationYear] = useState<number | undefined>(undefined)

  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [socialLinks, setSocialLinks] = useState<string[]>([])
  const [newSocialLink, setNewSocialLink] = useState('')

  const [skills, setSkills] = useState<UserSkillRequest[]>([])
  const [newGroupName, setNewGroupName] = useState('Khác')
  const [newSkillName, setNewSkillName] = useState('')

  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: majors } = useMajors()
  const updateProfileMutation = useUpdateOwnProfile()
  const loading = updateProfileMutation.isPending

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (profile && !isInitialized) {
      setValidationError(null)
      setFullName(profile.fullName || '')
      setBiography(profile.biography || '')

      setCampus(profile.campus || '')
      setMajorId(profile.major?.id)
      setCohort(profile.cohort ?? undefined)
      setGraduationYear(profile.graduationYear ?? undefined)

      setPhone(profile.phone || '')
      setCity(profile.city || '')
      setSocialLinks(profile.socialLinks ? [...profile.socialLinks] : [])

      if (profile.skills) {
        setSkills(
          profile.skills.map((s) => ({
            groupName: s.groupName,
            skillName: s.skillName,
            sortOrder: s.sortOrder,
          }))
        )
      } else {
        setSkills([])
      }
      setIsInitialized(true)
    }
  }, [profile, isInitialized])


  const handleAddSocialLink = () => {
    if (!newSocialLink.trim()) return
    const link = newSocialLink.trim()
    
    try {
      new URL(link)
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        throw new Error()
      }
    } catch {
      setValidationError(t('profile.invalidSocialLink', 'Liên kết cá nhân không hợp lệ. Vui lòng bắt đầu bằng http:// hoặc https:// (VD: https://linkedin.com/...)'))
      return
    }

    if (socialLinks.includes(link)) {
      setValidationError(t('profile.duplicateSocialLink', 'Liên kết cá nhân này đã tồn tại'))
      return
    }
    
    setValidationError(null)
    setSocialLinks([...socialLinks, link])
    setNewSocialLink('')
  }

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return
    const group = newGroupName.trim() || 'Khác'
    const skill = newSkillName.trim()
    if (skills.some((s) => s.groupName === group && s.skillName === skill)) return
    setSkills([
      ...skills,
      {
        groupName: group,
        skillName: skill,
        sortOrder: skills.length + 1,
      },
    ])
    setNewSkillName('')
  }

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const name = fullName.trim()
    if (!name) {
      setValidationError(t('profile.fullNameRequired', 'Họ và tên không được để trống'))
      return
    }
    if (name.length < 2 || name.length > 50) {
      setValidationError(t('profile.fullNameLength', 'Họ và tên hiển thị phải có độ dài từ 2 đến 50 ký tự'))
      return
    }
    if (/\d/.test(name)) {
      setValidationError(t('profile.fullNameNoNumbers', 'Họ và tên hiển thị không được chứa số'))
      return
    }

    if (cohort) {
      if (cohort < 1 || cohort > 50) {
        setValidationError(t('profile.invalidCohort', 'Khóa học không hợp lệ (nhập số từ 1 đến 50)'))
        return
      }
    }

    if (graduationYear) {
      const currentYear = new Date().getFullYear()
      if (graduationYear < 2006 || graduationYear > currentYear + 10) {
        setValidationError(`${t('profile.invalidGraduationYear', 'Năm tốt nghiệp không hợp lệ')} (từ 2006 đến ${currentYear + 10})`)
        return
      }
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/
      if (!phoneRegex.test(phone.trim())) {
        setValidationError(t('profile.invalidPhone', 'Số điện thoại không hợp lệ (phải là định dạng số điện thoại Việt Nam)'))
        return
      }
    }

    if (biography && biography.trim().length > 500) {
      setValidationError(t('profile.bioTooLong', 'Tiểu sử / Giới thiệu bản thân không được vượt quá 500 ký tự'))
      return
    }

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      avatarUrl: profile.avatarUrl || null,
      coverUrl: profile.coverUrl || null,
      // Web không có ô sửa headline: gửi lại giá trị cũ để backend (ghi đè toàn bộ) không xoá mất.
      headline: profile.headline || null,

      phone: phone.trim() || null,
      biography: biography.trim() || null,
      campus: campus.trim() || null,
      cohort: cohort || null,
      majorId: majorId || null,
      graduationYear: graduationYear || null,
      city: city.trim() || null,
      socialLinks: socialLinks.length > 0 ? socialLinks : [],
      skills: skills.length > 0 ? skills : [],
    }

    try {
      await updateProfileMutation.mutateAsync(payload)
      toast.success(t('profile.saveProfileSuccess', 'Đã lưu thông tin hồ sơ thành công!'))
      onSuccess()
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || t('common.errorOccurred', 'Có lỗi xảy ra khi cập nhật hồ sơ'))
    }
  }


  const navItems = [
    { id: 'overview', label: t('profile.basicInfoSection', 'Thông tin cá nhân cơ bản'), icon: <User size={18} /> },
    { id: 'academic', label: t('profile.academicSection', 'Thông tin học tập tại FPT University'), icon: <GraduationCap size={18} /> },
    { id: 'contact', label: t('profile.contactSection', 'Thông tin liên hệ & Mạng xã hội'), icon: <Phone size={18} /> },
    { id: 'skills', label: t('profile.skills', 'Kỹ năng chuyên môn'), icon: <Sparkles size={18} /> },
  ]

  return (
    <div className="space-y-6 text-left animate-fade-in">


      {validationError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-danger-soft border border-danger-border p-4 text-sm font-semibold text-danger">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Facebook-Style 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Sidebar Menu */}
        <div className="md:col-span-4 bg-surface rounded-3xl p-4 border border-border shadow-sm space-y-1.5 sticky top-20">
          <h3 className="text-xs font-extrabold text-text-subtle uppercase tracking-wider px-3 pt-2 pb-1">
            {t('profile.about', 'Giới thiệu')}
          </h3>
          {navItems.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition text-left ${active
                  ? 'bg-primary-soft text-primary-solid border border-brand-200/40 shadow-xs'
                  : 'text-text-muted hover:bg-plum-50/70 hover:text-text'
                  }`}
              >
                <span className={active ? 'text-primary-solid' : 'text-text-subtle'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>


        {/* Right Content Editor Cards */}
        <div className="md:col-span-8 space-y-6">
          {/* Section 1: Overview / Basic Info */}
          <FadeSwitch id={activeSection}>
{activeSection === 'overview' && (
            <Card hover={false} className="p-6 space-y-5">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                  <User size={18} className="text-primary-solid" /> {t('profile.basicInfoSection', 'Thông tin cá nhân cơ bản')}
                </h3>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.title', 'Họ và tên hiển thị')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.namePlaceholder', 'Nhập họ và tên...')}
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text font-semibold focus:border-primary focus:outline-none"
                />
              </div>

              {/* Tiểu sử */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.bio', 'Tiểu sử / Giới thiệu bản thân')}
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder={t('profile.bioPlaceholder', 'Mô tả bản thân, phong cách làm việc, sở thích...')}
                  rows={4}
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
            </Card>
          )}

          {/* Section 2: Academic Info */}
          {activeSection === 'academic' && (
            <Card hover={false} className="p-6 space-y-5 !overflow-visible">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary-solid" /> {t('profile.academicSection', 'Thông tin học tập tại FPT University')}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.campus', 'Cơ sở đào tạo')}
                </label>
                <CampusSelect
                  value={campus}
                  onChange={setCampus}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.major', 'Chuyên ngành học')}
                </label>
                <SelectDropdown<string | number>
                  value={majorId ?? ''}
                  onChange={(val) => setMajorId(val === '' ? undefined : Number(val))}
                  options={[{ value: '', label: t('profile.selectMajor', '-- Chọn Chuyên ngành --') }, ...(majors ?? []).map((m) => ({ value: m.id, label: `${m.name} (${m.code})` }))]}
                  placeholder={t('profile.selectMajor', '-- Chọn Chuyên ngành --')}
                  disabled={loading}
                  buttonClassName="h-12 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    {t('profile.cohort', 'Khóa học')}
                  </label>
                  <input
                    type="number"
                    value={cohort || ''}
                    onChange={(e) => setCohort(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 15, 16, 17..."
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    {t('profile.graduationYear', 'Năm tốt nghiệp / Dự kiến tốt nghiệp')}
                  </label>
                  <input
                    type="number"
                    value={graduationYear || ''}
                    onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 2024, 2025..."
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Section 3: Contact Info */}
          {activeSection === 'contact' && (
            <Card hover={false} className="p-6 space-y-5 !overflow-visible">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                  <Phone size={18} className="text-primary-solid" /> {t('profile.contactSection', 'Thông tin liên hệ & Mạng xã hội')}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.phone', 'Số điện thoại liên hệ')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0905123456"
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.city', 'Tỉnh / Thành phố hiện tại')}
                </label>
                <ProvinceSelect
                  value={city}
                  onChange={setCity}
                  disabled={loading}
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.socialLinks', 'Liên kết cá nhân (LinkedIn, GitHub, Portfolio...)')}
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-border bg-surface py-2.5 px-4 text-sm text-text focus:border-primary focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSocialLink}
                    disabled={loading}
                    className="rounded-xl px-4 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={15} /> {t('common.add', 'Thêm')}
                  </Button>
                </div>

                <div className="space-y-2">
                  {socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-2 border border-border text-xs text-text-muted">
                      <span className="truncate flex-1 mr-2 flex items-center gap-1.5 font-medium">
                        <LinkIcon size={14} className="text-text-subtle shrink-0" />
                        {link}
                      </span>
                      <button aria-label={t('common.delete', 'Xóa')}
                        type="button"
                        onClick={() => handleRemoveSocialLink(idx)}
                        className="text-danger hover:text-danger p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Section 4: Skills */}
          {activeSection === 'skills' && (
            <Card hover={false} className="p-6 space-y-5">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-solid" /> {t('profile.skills', 'Kỹ năng chuyên môn')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                    {t('profile.skillGroup', 'Nhóm kỹ năng')}
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="VD: Programming"
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-surface py-2.5 px-3 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                    {t('profile.skillName', 'Tên kỹ năng')}
                  </label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="VD: ReactJS, Java"
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-surface py-2.5 px-3 text-xs text-text"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSkill}
                    disabled={loading}
                    className="w-full rounded-xl py-2.5 flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> {t('profile.addSkill', 'Thêm kỹ năng')}
                  </Button>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">
                  {t('profile.declaredSkills', 'Danh sách kỹ năng đã khai báo')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-text-muted border border-border shadow-2xs"
                    >
                      <span className="text-text-subtle font-normal">[{skill.groupName}]</span> {skill.skillName}
                      <button aria-label={t('common.close', 'Đóng')}
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-text-subtle hover:text-danger ml-1.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}
</FadeSwitch>

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-end gap-3 bg-surface p-5 rounded-3xl border border-border shadow-sm">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={loading}
              className="rounded-2xl border border-border text-text-muted font-semibold px-5"
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              variant="primary"
              size="md"
              disabled={loading}
              className="rounded-2xl bg-primary-solid hover:bg-primary-hover text-on-primary font-bold px-8 flex items-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{t('common.saveChanges', 'Lưu thay đổi')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
