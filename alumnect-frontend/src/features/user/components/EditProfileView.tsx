import React, { useState, useEffect } from 'react'
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
import { Card } from '@/components/ui'
import { ProvinceSelect } from './ProvinceSelect'
import { useMajors } from '@/features/auth/hooks/useAuth'

import { useUpdateOwnProfile } from '../hooks/useUserMutations'
import type { UserProfileResponse, UpdateProfileRequest, UserSkillRequest } from '../model/userTypes'

interface EditProfileViewProps {
  profile: UserProfileResponse
  onCancel: () => void
  onSuccess: () => void
}

export function EditProfileView({ profile, onCancel, onSuccess }: EditProfileViewProps) {
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
      avatarUrl: profile.avatarUrl || null,
      coverUrl: profile.coverUrl || null,

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
      onSuccess()
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

  const navItems = [
    { id: 'overview', label: 'Thông tin cá nhân', icon: <User size={18} /> },
    { id: 'academic', label: 'Học tập tại FPTU', icon: <GraduationCap size={18} /> },
    { id: 'contact', label: 'Thông tin liên hệ', icon: <Phone size={18} /> },
    { id: 'skills', label: 'Kỹ năng chuyên môn', icon: <Sparkles size={18} /> },
  ]

  return (
    <div className="space-y-6 text-left animate-fade-in">


      {validationError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 border border-coral-200/40 p-4 text-sm font-semibold text-coral-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Facebook-Style 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Sidebar Menu */}
        <div className="md:col-span-4 bg-white rounded-3xl p-4 border border-plum-900/5 shadow-sm space-y-1.5 sticky top-20">
          <h3 className="text-xs font-extrabold text-plum-400 uppercase tracking-wider px-3 pt-2 pb-1">
            Giới thiệu
          </h3>
          {navItems.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-left ${active
                  ? 'bg-brand-50 text-brand-600 border border-brand-200/40 shadow-xs'
                  : 'text-plum-700 hover:bg-plum-50/70 hover:text-plum-900'
                  }`}
              >
                <span className={active ? 'text-brand-600' : 'text-plum-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>


        {/* Right Content Editor Cards */}
        <div className="md:col-span-8 space-y-6">
          {/* Section 1: Overview / Basic Info */}
          {activeSection === 'overview' && (
            <Card hover={false} className="p-6 space-y-5">
              <div className="border-b border-plum-900/5 pb-3">
                <h3 className="text-lg font-extrabold text-plum-900 flex items-center gap-2">
                  <User size={18} className="text-brand-500" /> Thông tin cá nhân cơ bản
                </h3>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Họ và tên hiển thị <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 font-semibold focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Tiểu sử */}
              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Tiểu sử / Giới thiệu bản thân
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Mô tả bản thân, phong cách làm việc, sở thích..."
                  rows={4}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </Card>
          )}

          {/* Section 2: Academic Info */}
          {activeSection === 'academic' && (
            <Card hover={false} className="p-6 space-y-5">
              <div className="border-b border-plum-900/5 pb-3">
                <h3 className="text-lg font-extrabold text-plum-900 flex items-center gap-2">
                  <GraduationCap size={18} className="text-brand-500" /> Thông tin học tập tại FPT University
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Cơ sở đào tạo (Campus)
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 font-semibold focus:border-brand-500 focus:outline-none"
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
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 font-semibold focus:border-brand-500 focus:outline-none"
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
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none"
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
                    className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Section 3: Contact Info */}
          {activeSection === 'contact' && (
            <Card hover={false} className="p-6 space-y-5 !overflow-visible">
              <div className="border-b border-plum-900/5 pb-3">
                <h3 className="text-lg font-extrabold text-plum-900 flex items-center gap-2">
                  <Phone size={18} className="text-brand-500" /> Thông tin liên hệ & Mạng xã hội
                </h3>
              </div>

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
                  className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Tỉnh / Thành phố hiện tại
                </label>
                <ProvinceSelect
                  value={city}
                  onChange={setCity}
                  disabled={loading}
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-plum-700 uppercase tracking-wider mb-2">
                  Liên kết cá nhân (LinkedIn, GitHub, Portfolio...)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-plum-900/10 bg-white py-2.5 px-4 text-sm text-plum-900 focus:border-brand-500 focus:outline-none"
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
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-plum-50/50 border border-plum-900/5 text-xs text-plum-700">
                      <span className="truncate flex-1 mr-2 flex items-center gap-1.5 font-medium">
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
            </Card>
          )}

          {/* Section 4: Skills */}
          {activeSection === 'skills' && (
            <Card hover={false} className="p-6 space-y-5">
              <div className="border-b border-plum-900/5 pb-3">
                <h3 className="text-lg font-extrabold text-plum-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-500" /> Kỹ năng chuyên môn
                </h3>
              </div>

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
                  Danh sách kỹ năng đã khai báo
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-plum-50 px-3.5 py-1.5 text-xs font-semibold text-plum-700 border border-plum-900/5 shadow-2xs"
                    >
                      <span className="text-plum-400 font-normal">[{skill.groupName}]</span> {skill.skillName}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-plum-400 hover:text-coral-500 ml-1.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-end gap-3 bg-white p-5 rounded-3xl border border-plum-900/5 shadow-sm">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={loading}
              className="rounded-2xl border border-plum-900/10 text-plum-700 font-semibold px-5"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              variant="primary"
              size="md"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white font-bold px-8 flex items-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
