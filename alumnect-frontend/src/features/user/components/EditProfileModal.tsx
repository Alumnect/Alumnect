import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, User, GraduationCap, MapPin, Plus, Trash2, AlertTriangle, Loader2, Link as LinkIcon, Sparkles, Upload, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Avatar, SmartImage, toast, SelectDropdown, DialogFrame, FadeSwitch } from '@/components/ui'
import { useMajors, usePresignedUrl } from '@/features/auth/hooks/useAuth'
import { useUpdateOwnProfile } from '../hooks/useUserMutations'
import { CampusSelect } from './CampusSelect'
import type { UserProfileResponse, UpdateProfileRequest, UserSkillRequest } from '../model/userTypes'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfileResponse
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'contact' | 'skills'>('basic')

  // Form states
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [headline, setHeadline] = useState('')
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
  const [newGroupName, setNewGroupName] = useState('')
  const [newSkillName, setNewSkillName] = useState('')

  const [validationError, setValidationError] = useState<string | null>(null)

  // Uploading states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  const { data: majors } = useMajors()
  const presignedUrlMutation = usePresignedUrl()
  const updateProfileMutation = useUpdateOwnProfile()
  const loading = updateProfileMutation.isPending || isUploadingAvatar || isUploadingCover

  useEffect(() => {
    if (isOpen && profile) {
      setValidationError(null)
      setFullName(profile.fullName || '')
      setAvatarUrl(profile.avatarUrl || '')
      setCoverUrl(profile.coverUrl || '')
      setHeadline(profile.headline || '')
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
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  // Tải ảnh đại diện từ máy lên Cloudflare R2
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    setValidationError(null)

    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'avatars',
      })

      const { uploadUrl, publicUrl } = presignedRes.data

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      })

      setAvatarUrl(publicUrl)
    } catch (err: any) {
      console.error('Lỗi upload avatar:', err)
      setValidationError(err.response?.data?.message || err.message || t('profile.updateAvatarError', 'Có lỗi xảy ra khi tải ảnh đại diện lên Cloudflare R2'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Tải ảnh bìa từ máy lên Cloudflare R2
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    setValidationError(null)

    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'covers',
      })

      const { uploadUrl, publicUrl } = presignedRes.data

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      })

      setCoverUrl(publicUrl)
    } catch (err: any) {
      console.error('Lỗi upload cover:', err)
      setValidationError(err.response?.data?.message || err.message || t('profile.updateCoverError', 'Có lỗi xảy ra khi tải ảnh bìa lên Cloudflare R2'))
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleAddSocialLink = () => {
    if (!newSocialLink.trim()) return
    if (socialLinks.includes(newSocialLink.trim())) return
    setSocialLinks([...socialLinks, newSocialLink.trim()])
    setNewSocialLink('')
  }

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return
    const group = newGroupName.trim() || t('common.other', 'Khác')
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

    if (!fullName.trim()) {
      setValidationError(t('profile.fullNameRequired', 'Họ và tên không được để trống'))
      return
    }

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      avatarUrl: avatarUrl.trim() || null,
      coverUrl: coverUrl.trim() || null,
      phone: phone.trim() || null,
      headline: headline.trim() || null,
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
      toast.success(t('profile.updateProfileSuccess', 'Đã cập nhật hồ sơ cá nhân thành công!'))
      onClose()
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || t('common.errorOccurred', 'Có lỗi xảy ra khi cập nhật hồ sơ'))
    }
  }


  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-50"
      maxWidthClassName="max-w-2xl"
      className="overflow-hidden flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border bg-cream-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-soft text-primary-solid">
              <User size={18} />
            </span>
            <h3 className="text-lg font-bold text-text">{t('profile.editProfileTitle', 'Chỉnh sửa hồ sơ cá nhân')}</h3>
          </div>
          <button aria-label={t('common.close', 'Đóng')}
            onClick={onClose}
            className="p-1.5 rounded-full text-text-subtle hover:text-text-muted hover:bg-surface-2 transition"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-6 gap-2 bg-surface">
          {[
            { id: 'basic', label: t('profile.tabBasic', 'Cơ bản'), icon: <User size={14} /> },
            { id: 'academic', label: t('profile.tabAcademic', 'Học tập FPTU'), icon: <GraduationCap size={14} /> },
            { id: 'contact', label: t('profile.tabContact', 'Liên hệ'), icon: <MapPin size={14} /> },
            { id: 'skills', label: t('profile.tabSkills', 'Kỹ năng'), icon: <Sparkles size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary-solid'
                  : 'border-transparent text-text-subtle hover:text-text-muted'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
          {validationError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-danger-soft border border-danger-border p-3.5 text-xs font-semibold text-danger">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tab 1: Basic Info */}
          <FadeSwitch id={activeTab}>
{activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.title', 'Họ và tên')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.namePlaceholder', 'Nhập họ và tên...')}
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.headline', 'Dòng giới thiệu ngắn')}
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="VD: Software Engineer Intern | Frontend Developer..."
                  disabled={loading}
                  maxLength={160}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Avatar Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.avatar', 'Ảnh đại diện')}
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-surface-2 border border-border">
                  <Avatar
                    src={avatarUrl}
                    name={fullName || 'Avatar'}
                    size={64}
                    className="shrink-0 shadow-sm"
                  />
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder={t('profile.avatarUrlPlaceholder', 'Dán link ảnh URL...')}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-border bg-surface py-2 px-3 text-xs text-text focus:border-primary focus:outline-none"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-solid bg-primary-soft hover:bg-primary-soft rounded-xl cursor-pointer transition shrink-0">
                        {isUploadingAvatar ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{isUploadingAvatar ? t('profile.uploading', 'Đang tải...') : t('profile.uploadFromDevice', 'Tải từ máy')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-text-subtle">{t('profile.avatarHint', 'Tải ảnh từ thiết bị lên Cloudflare R2 hoặc dán URL trực tiếp.')}</p>
                  </div>
                </div>
              </div>

              {/* Cover Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.coverPhoto', 'Ảnh bìa hồ sơ')}
                </label>
                <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-3">
                  {coverUrl ? (
                    <SmartImage
                      src={coverUrl}
                      alt="Cover preview"
                      className="h-24 w-full rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="h-20 w-full rounded-xl bg-plum-100/50 flex items-center justify-center text-text-subtle text-xs font-medium">
                      <ImageIcon size={18} className="mr-1.5" /> {t('profile.noCoverYet', 'Chưa cài đặt ảnh bìa')}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder={t('profile.coverUrlPlaceholder', 'Dán link ảnh bìa URL...')}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-border bg-surface py-2 px-3 text-xs text-text focus:border-primary focus:outline-none"
                    />
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-solid bg-primary-soft hover:bg-primary-soft rounded-xl cursor-pointer transition shrink-0">
                      {isUploadingCover ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>{isUploadingCover ? t('profile.uploading', 'Đang tải...') : t('profile.uploadFromDevice', 'Tải từ máy')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Tiểu sử */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.bio', 'Tiểu sử / Giới thiệu bản thân')}
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder={t('profile.bioPlaceholder', 'Mô tả bản thân, định hướng nghề nghiệp...')}
                  rows={4}
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Academic Info */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
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
                    className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                    className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Contact & Links */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
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
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.city', 'Tỉnh / Thành phố hiện tại')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('profile.cityPlaceholder', 'VD: Đà Nẵng, Hà Nội...')}
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-surface py-3 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {t('profile.socialLinks', 'Liên kết cá nhân (LinkedIn, GitHub, Website...)')}
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-border bg-surface py-2.5 px-4 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-border text-xs text-text-muted">
                      <span className="truncate flex-1 mr-2 flex items-center gap-1.5">
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
            </div>
          )}

          {/* Tab 4: Skills */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
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
                  {t('profile.currentSkills', 'Danh sách kỹ năng hiện tại')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1 text-xs font-semibold text-text-muted border border-border"
                    >
                      <span className="text-text-subtle font-normal">[{skill.groupName}]</span> {skill.skillName}
                      <button aria-label={t('common.close', 'Đóng')}
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-text-subtle hover:text-danger ml-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
</FadeSwitch>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border text-text-muted font-semibold"
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="rounded-xl bg-primary-solid hover:bg-primary-hover text-on-primary shadow-sm font-semibold px-6 flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{t('common.saveChanges', 'Lưu thay đổi')}</span>
            </Button>
          </div>
        </form>
      </DialogFrame>
  )
}
