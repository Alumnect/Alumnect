import React, { useState, useEffect } from 'react'
import { X, User, GraduationCap, MapPin, Plus, Trash2, AlertTriangle, Loader2, Link as LinkIcon, Sparkles, Upload, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Avatar, SmartImage } from '@/components/ui'
import { useMajors, usePresignedUrl } from '@/features/auth/hooks/useAuth'
import { useUpdateOwnProfile } from '../hooks/useUserMutations'
import type { UserProfileResponse, UpdateProfileRequest, UserSkillRequest } from '../model/userTypes'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfileResponse
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
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
  const [newGroupName, setNewGroupName] = useState('Khác')
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
      setValidationError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải ảnh đại diện lên Cloudflare R2')
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
      setValidationError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải ảnh bìa lên Cloudflare R2')
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

    if (!fullName.trim()) {
      setValidationError('Họ và tên không được để trống')
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
      onClose()
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật hồ sơ')
    }
  }

  const campusOptions = [
    'FPT University Đà Nẵng',
    'FPT University Hà Nội (Hòa Lạc)',
    'FPT University TP. Hồ Chí Minh',
    'FPT University Cần Thơ',
    'FPT University Quy Nhơn',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-plum-900/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-plum-900/5 bg-cream-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <User size={18} />
            </span>
            <h3 className="text-lg font-bold text-plum-900">Chỉnh sửa hồ sơ cá nhân</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-plum-400 hover:text-plum-700 hover:bg-plum-900/[0.04] transition-all"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-plum-900/5 px-6 gap-2 bg-white">
          {[
            { id: 'basic', label: 'Cơ bản', icon: <User size={14} /> },
            { id: 'academic', label: 'Học tập FPTU', icon: <GraduationCap size={14} /> },
            { id: 'contact', label: 'Liên hệ', icon: <MapPin size={14} /> },
            { id: 'skills', label: 'Kỹ năng', icon: <Sparkles size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-plum-400 hover:text-plum-600'
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
            <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 border border-coral-200/40 p-3.5 text-xs font-semibold text-coral-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tab 1: Basic Info */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Họ và tên <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Dòng giới thiệu ngắn (Headline)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="VD: Software Engineer Intern | Frontend Developer..."
                  disabled={loading}
                  maxLength={160}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Avatar Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Ảnh đại diện (Avatar)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-plum-50/50 border border-plum-900/5">
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
                        placeholder="Dán link ảnh URL..."
                        disabled={loading}
                        className="flex-1 rounded-xl border border-plum-900/10 bg-white py-2 px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl cursor-pointer transition-all shrink-0">
                        {isUploadingAvatar ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{isUploadingAvatar ? 'Đang tải...' : 'Tải từ máy'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-plum-400">Tải ảnh từ thiết bị lên Cloudflare R2 hoặc dán URL trực tiếp.</p>
                  </div>
                </div>
              </div>

              {/* Cover Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Ảnh bìa hồ sơ (Cover Photo)
                </label>
                <div className="p-4 rounded-2xl bg-plum-50/50 border border-plum-900/5 space-y-3">
                  {coverUrl ? (
                    <SmartImage
                      src={coverUrl}
                      alt="Cover preview"
                      className="h-24 w-full rounded-xl object-cover border border-plum-900/5"
                    />
                  ) : (
                    <div className="h-20 w-full rounded-xl bg-plum-100/50 flex items-center justify-center text-plum-400 text-xs font-medium">
                      <ImageIcon size={18} className="mr-1.5" /> Chưa cài đặt ảnh bìa
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Dán link ảnh bìa URL..."
                      disabled={loading}
                      className="flex-1 rounded-xl border border-plum-900/10 bg-white py-2 px-3 text-xs text-plum-900 focus:border-brand-500 focus:outline-none"
                    />
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl cursor-pointer transition-all shrink-0">
                      {isUploadingCover ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>{isUploadingCover ? 'Đang tải...' : 'Tải từ máy'}</span>
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
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Tiểu sử / Giới thiệu bản thân
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Mô tả bản thân, định hướng nghề nghiệp..."
                  rows={4}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Academic Info */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Cơ sở đào tạo (Campus)
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Chọn Cơ sở FPT University --</option>
                  {campusOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Chuyên ngành học (Major)
                </label>
                <select
                  value={majorId || ''}
                  onChange={(e) => setMajorId(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Chọn Chuyên ngành --</option>
                  {majors?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                    Khóa học (Cohort)
                  </label>
                  <input
                    type="number"
                    value={cohort || ''}
                    onChange={(e) => setCohort(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 15, 16, 17..."
                    disabled={loading}
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                    Năm tốt nghiệp / Dự kiến tốt nghiệp
                  </label>
                  <input
                    type="number"
                    value={graduationYear || ''}
                    onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="VD: 2024, 2025..."
                    disabled={loading}
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Contact & Links */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0905123456"
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Tỉnh / Thành phố hiện tại
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="VD: Đà Nẵng, Hà Nội..."
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Liên kết cá nhân (LinkedIn, GitHub, Website...)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-plum-900/10 bg-white py-2.5 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSocialLink}
                    disabled={loading}
                    className="rounded-xl px-4 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={15} /> Thêm
                  </Button>
                </div>

                <div className="space-y-2">
                  {socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-plum-50/50 border border-plum-900/5 text-xs text-plum-700">
                      <span className="truncate flex-1 mr-2 flex items-center gap-1.5">
                        <LinkIcon size={14} className="text-plum-400 shrink-0" />
                        {link}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(idx)}
                        className="text-coral-500 hover:text-coral-700 p-1"
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
                  <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-1">
                    Nhóm kỹ năng
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="VD: Programming"
                    disabled={loading}
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-2.5 px-3 text-xs text-plum-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-1">
                    Tên kỹ năng
                  </label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="VD: ReactJS, Java"
                    disabled={loading}
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-2.5 px-3 text-xs text-plum-900"
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
                    <Plus size={14} /> Thêm kỹ năng
                  </Button>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-plum-400 mb-2">
                  Danh sách kỹ năng hiện tại
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700 border border-plum-900/5"
                    >
                      <span className="text-plum-400 font-normal">[{skill.groupName}]</span> {skill.skillName}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-plum-400 hover:text-coral-500 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

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
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
