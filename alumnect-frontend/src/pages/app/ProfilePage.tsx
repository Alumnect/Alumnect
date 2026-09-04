import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Mail,
  Phone,
  Edit3,
  Plus,
  Trash2,
  TrendingUp,
  Star,
  Building,
  AlertTriangle,
  Loader2,
  Camera,
  User,
  Sparkles,
  UserPlus,
  UserMinus,
  PlusSquare,
  ArrowLeft,
  Bookmark,
  MessageCircle,
} from 'lucide-react'
import axios from 'axios'
import { Avatar, Card, Skeleton, EmptyState, SmartImage, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { useAuthStore } from '@/store/authStore'
import { usePresignedUrl } from '@/features/auth/hooks/useAuth'
import { SavedPostsView, UserPostsView } from '@/features/feed'
import {
  useOwnProfile,
  useUserProfile,
  useUpdateOwnProfile,
  EditProfileView,
  ExperienceFormModal,
  useDeleteExperience,
  useFollowUser,
  useUnfollowUser,
  FollowListModal,
} from '@/features/user'

import type { ExperienceResponse } from '@/features/user'
import { useLoginPrompt } from '@/store/loginPrompt'
import { formatPeriodDate } from '@/utils/date'
import { getSocialPlatform } from '@/utils/social'
import { groupSkills } from '@/utils/profile'

const formatLocationCityOnly = (location?: string | null, locationCity?: string | null): string => {

  if (locationCity && locationCity.trim()) {
    const city = locationCity.trim()
    return city.toLowerCase().includes('thành phố') || city.toLowerCase().includes('làm việc')
      ? city
      : `Làm việc tại ${city}`
  }
  if (!location || !location.trim()) return ''
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return location

  let target = parts[parts.length - 1]
  if (parts.length >= 2 && ['việt nam', 'vietnam', 'japan', 'usa', 'united states'].includes(target.toLowerCase())) {
    target = parts[parts.length - 2]
  }

  return target.toLowerCase().includes('thành phố') || target.toLowerCase().includes('làm việc')
    ? target
    : `Làm việc tại ${target}`
}

export function ProfilePage() {

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = (() => {
    const raw = searchParams.get('userId')
    if (!raw) return null
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? null : parsed
  })()

  // Lấy thông tin tài khoản đang đăng nhập
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isOwnProfile = !userId || String(userId) === currentUserId

  // Tab đang hoạt động: 'profile' (Tất cả hồ sơ), 'posts' (Bài viết), 'about' (Giới thiệu / Chỉnh sửa), 'saved' (Bài viết đã lưu kiểu Instagram)
  const initialTab = searchParams.get('tab') === 'saved'
    ? 'saved'
    : searchParams.get('tab') === 'posts'
    ? 'posts'
    : searchParams.get('edit') === 'true'
    ? 'about'
    : 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'about' | 'saved'>(initialTab as 'profile' | 'posts' | 'about' | 'saved')

  // Cập nhật tab khi URL searchParams thay đổi
  useEffect(() => {
    const tab = searchParams.get('tab')
    const edit = searchParams.get('edit')
    if (tab === 'saved') {
      setActiveTab('saved')
    } else if (tab === 'posts') {
      setActiveTab('posts')
    } else if (edit === 'true') {
      setActiveTab('about')
    } else if (tab === 'profile') {
      setActiveTab('profile')
    }
  }, [searchParams])

  const [isExpModalOpen, setIsExpModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'promote' | 'rejoin'>('create')
  const [expToEdit, setExpToEdit] = useState<ExperienceResponse | null>(null)
  const [deleteExpId, setDeleteExpId] = useState<number | null>(null)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  const [followModalOpen, setFollowModalOpen] = useState(false)
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers')
  const [followError, setFollowError] = useState<string | null>(null)

  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const triggerLoginPrompt = useLoginPrompt((s) => s.open)

  const followPending = followMutation.isPending || unfollowMutation.isPending

  const presignedUrlMutation = usePresignedUrl()
  const updateProfileMutation = useUpdateOwnProfile()
  const deleteExpMutation = useDeleteExperience()

  // Tự động chuyển hướng về /login nếu cố tình xem hồ sơ bản thân khi chưa đăng nhập
  useEffect(() => {
    if (isOwnProfile && !isAuthenticated) {
      navigate('/login')
    }
  }, [isOwnProfile, isAuthenticated, navigate])

  // Gọi API lấy dữ liệu hồ sơ
  const ownProfileQuery = useOwnProfile({ enabled: isOwnProfile && isAuthenticated })
  const userProfileQuery = useUserProfile(userId, { enabled: !isOwnProfile })

  const activeQuery = isOwnProfile ? ownProfileQuery : userProfileQuery
  const { data: profile, isLoading, error } = activeQuery

  // Trực tiếp tải và đổi ảnh đại diện (Avatar) trên Header Facebook
  const handleAvatarUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file hình ảnh (JPG, PNG...)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setIsUploadingMedia(true)
    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'avatars',
      })
      const { uploadUrl, publicUrl } = presignedRes.data
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
      await updateProfileMutation.mutateAsync({
        fullName: profile.fullName,
        avatarUrl: publicUrl,
        coverUrl: profile.coverUrl,
        phone: profile.phone,
        headline: profile.headline,
        biography: profile.biography,
        campus: profile.campus,
        cohort: profile.cohort,
        majorId: profile.major?.id,
        graduationYear: profile.graduationYear,
        city: profile.city,
        socialLinks: profile.socialLinks,
        skills: profile.skills?.map(s => ({
          groupName: s.groupName,
          skillName: s.skillName,
          sortOrder: s.sortOrder
        }))
      })
      toast.success('Cập nhật ảnh đại diện thành công!')
    } catch (err) {
      console.error('Lỗi đổi ảnh đại diện:', err)
      toast.error('Không thể tải ảnh đại diện lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  // Trực tiếp tải và đổi ảnh bìa (Cover Photo) trên Header Facebook
  const handleCoverUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file hình ảnh (JPG, PNG...)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setIsUploadingMedia(true)
    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'covers',
      })
      const { uploadUrl, publicUrl } = presignedRes.data
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
      await updateProfileMutation.mutateAsync({
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        coverUrl: publicUrl,
        phone: profile.phone,
        headline: profile.headline,
        biography: profile.biography,
        campus: profile.campus,
        cohort: profile.cohort,
        majorId: profile.major?.id,
        graduationYear: profile.graduationYear,
        city: profile.city,
        socialLinks: profile.socialLinks,
        skills: profile.skills?.map(s => ({
          groupName: s.groupName,
          skillName: s.skillName,
          sortOrder: s.sortOrder
        }))
      })
      toast.success('Cập nhật ảnh bìa thành công!')
    } catch (err) {
      console.error('Lỗi đổi ảnh bìa:', err)
      toast.error('Không thể tải ảnh bìa lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      triggerLoginPrompt('Đăng nhập để theo dõi thành viên này.')
      return
    }
    if (!profile) return

    setFollowError(null)
    try {
      if (profile.isFollowing) {
        await unfollowMutation.mutateAsync(profile.userId)
      } else {
        await followMutation.mutateAsync(profile.userId)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
      setFollowError(msg)
    }
  }

  const handleOpenFollowModal = (type: 'followers' | 'following') => {
    setFollowModalType(type)
    setFollowModalOpen(true)
  }

  // Skeleton khi đang tải
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8">
        <Skeleton className="h-48 rounded-3xl sm:h-60" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  // Lỗi hoặc không tìm thấy
  if (error || !profile) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft size={15} />}
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Quay lại
        </Button>
        <EmptyState
          icon={<MapPin size={24} />}
          title="Không thể truy cập hồ sơ"
          description={error instanceof Error ? error.message : 'Không tìm thấy hồ sơ người dùng.'}
        />
      </div>
    )
  }

  // Dữ liệu dẫn xuất
  const isAlumni = profile.role === 'ALUMNI'

  // Sắp xếp các kinh nghiệm làm việc theo thời gian bắt đầu giảm dần (mới nhất lên đầu)
  const sortedExps = profile.experiences
    ? [...profile.experiences].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
      return dateB - dateA
    })
    : []

  const skillGroups = profile.skills?.length ? groupSkills(profile.skills) : {}

  const handleOpenCreateExp = () => {
    setFormMode('create')
    setExpToEdit(null)
    setIsExpModalOpen(true)
  }

  const handleOpenEditExp = (exp: ExperienceResponse) => {
    setFormMode('edit')
    setExpToEdit(exp)
    setIsExpModalOpen(true)
  }

  const handleOpenPromoteExp = (exp: ExperienceResponse) => {
    setExpToEdit(exp)
    setFormMode('promote')
    setIsExpModalOpen(true)
  }

  const handleOpenRejoinExp = (exp: ExperienceResponse) => {
    setExpToEdit(exp)
    setFormMode('rejoin')
    setIsExpModalOpen(true)
  }

  const handleConfirmDeleteExp = async () => {
    if (deleteExpId) {
      await deleteExpMutation.mutateAsync(deleteExpId)
      setDeleteExpId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 space-y-6">
      {/* TOP FACEBOOK PROFILE HEADER CARD (Đồng nhất cho cả View & Edit mode) */}
      <Reveal>
        <div className="bg-white rounded-3xl border border-plum-900/5 shadow-sm overflow-hidden text-left">
          {/* 1. Ảnh Bìa với Nút camera đổi ảnh bìa kiểu Facebook */}
          <div className="relative h-52 sm:h-72 w-full bg-slate-100">
            <SmartImage
              src={profile.coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200'}
              alt="Profile cover"
              className="h-full w-full"
              imgClassName="object-cover"
            />
            {isOwnProfile && (
              <label className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-plum-900 bg-white/90 hover:bg-white backdrop-blur-md rounded-2xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95">
                {isUploadingMedia ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                <span>Chỉnh sửa ảnh bìa</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUploadDirect}
                  disabled={isUploadingMedia}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 2. Ảnh Đại Diện & Thông Tin Chính */}
          <div className="px-6 pb-4 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              {/* Avatar lồng lên ảnh bìa với Nút camera kiểu Facebook */}
              <div className="relative z-10 shrink-0">
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.fullName}
                  size={140}
                  ring
                  className="bg-white shadow-xl rounded-full border-4 border-white"
                />
                {isOwnProfile && (
                  <label className="absolute bottom-2 right-2 p-2 rounded-full bg-plum-100 hover:bg-plum-200 text-plum-800 shadow-md cursor-pointer transition-all border-2 border-white hover:scale-110 active:scale-90">
                    {isUploadingMedia ? <Loader2 size={15} className="animate-spin" /> : <Camera size={16} />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUploadDirect}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Action Button bên phải */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto mb-2">
                {isOwnProfile ? (
                  <Button
                    variant={activeTab === 'about' ? 'primary' : 'secondary'}
                    size="md"
                    leftIcon={activeTab === 'about' ? <User size={16} /> : <Edit3 size={16} />}
                    onClick={() => setActiveTab(activeTab === 'about' ? 'profile' : 'about')}
                    className="rounded-2xl font-bold px-5 border border-plum-900/10 shadow-sm"
                  >
                    {activeTab === 'about' ? 'Xem trang cá nhân' : 'Chỉnh sửa hồ sơ'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<MessageCircle size={16} />}
                      onClick={() => navigate(`/app/messages?userId=${profile.userId}`)}
                      className="rounded-2xl font-bold px-5 border border-plum-900/10 shadow-sm text-sm hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      Nhắn tin
                    </Button>
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant={profile.isFollowing ? 'secondary' : 'primary'}
                        size="md"
                        onClick={handleFollowToggle}
                        disabled={followPending}
                        className="rounded-2xl font-bold px-5 shadow-sm text-sm"
                        leftIcon={
                          followPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : profile.isFollowing ? (
                            <UserMinus size={16} />
                          ) : (
                            <UserPlus size={16} />
                          )
                        }
                      >
                        {profile.isFollowing ? 'Hủy theo dõi' : 'Theo dõi'}
                      </Button>
                      {followError && (
                        <p className="text-xs text-rose-500 font-medium max-w-[200px] text-right">
                          {followError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin tên & giới thiệu ngắn */}
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-plum-900 tracking-tight">
                  {profile.fullName}
                </h1>
                {profile.isAccountVerified && (
                  <BadgeCheck className="text-brand-500 fill-brand-100" size={24} />
                )}
                {profile.studentCode && (
                  <span className="text-xs sm:text-sm font-semibold text-plum-500 bg-plum-900/[0.04] px-2.5 py-0.5 rounded-full border border-plum-900/10 self-center">
                    ({profile.studentCode})
                  </span>
                )}
              </div>

              <p className="text-sm sm:text-base font-medium text-plum-600">
                {profile.primaryExperience?.title ? (
                  <span>
                    {profile.primaryExperience.title} tại{' '}
                    <strong className="font-semibold text-plum-800">
                      {profile.primaryExperience.company}
                    </strong>
                  </span>
                ) : (
                  profile.headline || (isAlumni ? 'Cựu sinh viên FPTU' : 'Sinh viên FPTU')
                )}
              </p>

              <div className="flex items-center gap-4 text-sm text-plum-500 font-medium pt-1 pb-1">
                <button
                  onClick={() => handleOpenFollowModal('followers')}
                  className="hover:text-brand-600 transition-colors"
                >
                  <strong className="font-bold text-plum-900">{profile.followersCount || 0}</strong> người theo dõi
                </button>
                <span className="text-plum-300">•</span>
                <button
                  onClick={() => handleOpenFollowModal('following')}
                  className="hover:text-brand-600 transition-colors"
                >
                  Đang theo dõi <strong className="font-bold text-plum-900">{profile.followingCount || 0}</strong> người
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs sm:text-sm text-plum-500">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin size={15} className="text-plum-400" />{' '}
                  {profile.city ||
                    formatLocationCityOnly(profile.primaryExperience?.location, profile.primaryExperience?.locationCity) ||
                    'Đại học FPT'}
                </span>


                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap size={15} className="text-plum-400" />
                  {profile.major ? `${profile.major.name} (${profile.major.code})` : 'N/A'}
                  {profile.cohort ? ` · K${profile.cohort}` : ''}
                  {profile.graduationYear ? ` · TN ${profile.graduationYear}` : ''}
                </span>
                {profile.campus && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Building size={15} className="text-plum-400" />
                    {profile.campus}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar size={15} className="text-plum-400" />
                  Tham gia {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Navigation Tabs Bar phong cách Facebook & Instagram */}
            <div className="flex border-t border-plum-900/5 pt-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'profile'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-plum-500 hover:text-plum-800'
                  }`}
              >
                Tất cả hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'posts'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-plum-500 hover:text-plum-800'
                  }`}
              >
                Bài viết
              </button>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'about'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-plum-500 hover:text-plum-800'
                    }`}
                >
                  Giới thiệu
                </button>
              )}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'saved'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-plum-500 hover:text-plum-800'
                    }`}
                >
                  <Bookmark size={14} className={activeTab === 'saved' ? 'fill-brand-600' : ''} />
                  Bài viết đã lưu
                </button>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* MAIN BODY CONTAINER */}
      {isOwnProfile && activeTab === 'about' ? (
        /* Chế độ Chỉnh sửa Hồ sơ dạng Facebook */
        <EditProfileView
          profile={profile}
          onCancel={() => setActiveTab('profile')}
          onSuccess={() => setActiveTab('profile')}
        />
      ) : isOwnProfile && activeTab === 'saved' ? (
        /* Chế độ Xem Bài viết đã lưu dạng Instagram */
        <SavedPostsView />
      ) : activeTab === 'posts' ? (
        /* Chế độ Xem Bài viết của User */
        <UserPostsView userId={profile.userId} />
      ) : (
        /* Chế độ Xem Trang Hồ sơ bình thường */
        <div className="space-y-6">
          {/* Thông tin liên hệ */}
          <Reveal>
            <Card hover={false} className="p-6 text-left">
              <h2 className="text-lg font-bold text-plum-900">Thông tin liên hệ</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm text-plum-700">
                  <Mail size={16} className="text-plum-400" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-plum-700">
                  <Phone size={16} className="text-plum-400" />
                  <span>{profile.phone || 'Chưa cập nhật số điện thoại'}</span>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-plum-400 mb-2.5">
                    Liên kết mạng xã hội & Website
                  </p>
                  {profile.socialLinks && profile.socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.socialLinks.map((url, index) => {
                        const platform = getSocialPlatform(url)
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-semibold text-plum-600 bg-plum-50/50 border border-plum-900/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm ${platform.color}`}
                          >
                            {platform.icon}
                            <span>{platform.name}</span>
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-plum-400 italic">
                      Thành viên này chưa cập nhật liên kết mạng xã hội nào.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Reveal>

          {/* Giới thiệu */}
          <Reveal delay={0.1}>
            <Card hover={false} className="p-6 text-left">
              <h2 className="text-lg font-bold text-plum-900">Giới thiệu</h2>
              <p className="mt-3 text-sm leading-relaxed text-plum-600 whitespace-pre-line">
                {profile.biography || 'Thành viên này chưa cập nhật phần tự giới thiệu bản thân.'}
              </p>
            </Card>
          </Reveal>

          {/* Hành trình & Sự nghiệp (Career Timeline) */}
          <Reveal delay={0.2}>
            <Card hover={false} className="p-6 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={20} className="text-brand-500" />
                  <h2 className="text-lg font-bold text-plum-900">Hành trình & Sự nghiệp</h2>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    onClick={handleOpenCreateExp}
                    className="rounded-xl border border-plum-900/10 font-semibold"
                  >
                    Thêm vị trí
                  </Button>
                )}
              </div>

              {sortedExps.length > 0 ? (
                <div className="relative mt-6 pl-4 sm:pl-6 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-plum-900/10">
                  {sortedExps.map((exp) => (
                    <div key={exp.id} className="relative group">
                      {/* Biểu tượng trên Timeline */}
                      <span
                        className={`absolute -left-[21px] sm:-left-[29px] top-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-white ring-2 transition-all ${exp.isPrimary
                          ? 'bg-amber-400 ring-amber-300'
                          : exp.isCurrent
                            ? 'bg-brand-500 ring-brand-200'
                            : 'bg-plum-300 ring-plum-100'
                          }`}
                      />

                      <div className="rounded-2xl p-4 transition-all duration-200 hover:bg-plum-50/50 border border-transparent hover:border-plum-900/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-plum-900">{exp.title}</h3>
                              {exp.isPrimary && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/50">
                                  <Star size={11} className="fill-amber-500 text-amber-500" /> Vai trò chính
                                </span>
                              )}
                              {exp.isCurrent && !exp.isPrimary && (
                                <span className="inline-flex items-center rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-200/50">
                                  Hiện tại
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold text-plum-700 mt-0.5 flex items-center gap-1.5">
                              <Building size={14} className="text-plum-400" />
                              {exp.company}
                            </p>
                          </div>

                          {/* Bộ công cụ quản lý vị trí (Chỉ hiển thị cho chủ sở hữu) */}
                          {isOwnProfile && (
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">

                              {exp.isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPromoteExp(exp)}
                                  title="Thăng chức / Đổi vai trò mới tại công ty"
                                  className="p-1.5 rounded-xl text-plum-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                >
                                  <TrendingUp size={15} />
                                </button>
                              )}
                              {!exp.isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejoinExp(exp)}
                                  title="Thêm kinh nghiệm khác tại công ty này (Hiện tại hoặc Quá khứ)"
                                  className="p-1.5 rounded-xl text-plum-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                >
                                  <PlusSquare size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditExp(exp)}
                                title="Chỉnh sửa vị trí"
                                className="p-1.5 rounded-xl text-plum-400 hover:text-plum-900 hover:bg-plum-100/50 transition-all"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteExpId(exp.id)}
                                title="Xóa vị trí"
                                className="p-1.5 rounded-xl text-plum-400 hover:text-coral-600 hover:bg-coral-50 transition-all"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-plum-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} className="text-plum-400" />
                            {exp.startDate ? formatPeriodDate(exp.startDate) : ''} - {exp.isCurrent ? 'Hiện tại' : (exp.endDate ? formatPeriodDate(exp.endDate) : '')}

                          </span>
                          {(exp.locationCity || exp.location) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} className="text-plum-400" />
                              {formatLocationCityOnly(exp.location, exp.locationCity)}
                            </span>
                          )}

                        </div>

                        {exp.description && (
                          <p className="mt-2.5 text-xs leading-relaxed text-plum-600 whitespace-pre-line border-t border-plum-900/5 pt-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-plum-400 italic">
                  Thành viên này chưa thêm lịch sử làm việc nào.
                </p>
              )}
            </Card>
          </Reveal>

          {/* Kỹ năng chuyên môn */}
          {Object.keys(skillGroups).length > 0 && (
            <Reveal delay={0.3}>
              <Card hover={false} className="p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-brand-500" />
                  <h2 className="text-lg font-bold text-plum-900">Kỹ năng chuyên môn</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(skillGroups).map(([groupName, skills]) => (
                    <div key={groupName}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 mb-2">
                        {groupName}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center rounded-xl bg-plum-50/70 px-3.5 py-1.5 text-xs font-semibold text-plum-700 border border-plum-900/5 shadow-2xs"
                          >
                            {skill.skillName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}
        </div>
      )}

      {/* Modal Quản lý Kinh nghiệm (Thêm / Sửa / Thăng chức) */}
      {isOwnProfile && (
        <ExperienceFormModal
          isOpen={isExpModalOpen}
          onClose={() => setIsExpModalOpen(false)}
          mode={formMode}
          experience={expToEdit}
        />
      )}

      {/* Modal Xác nhận xóa Kinh nghiệm */}
      {deleteExpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-plum-900/5 shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-coral-600">
              <span className="p-2 rounded-2xl bg-coral-50 border border-coral-200/40">
                <AlertTriangle size={20} />
              </span>
              <h3 className="text-lg font-bold text-plum-900">Xóa kinh nghiệm</h3>
            </div>
            <p className="text-sm text-plum-600">
              Bạn có chắc muốn xóa kinh nghiệm làm việc này không?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteExpId(null)}
                disabled={deleteExpMutation.isPending}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDeleteExp}
                disabled={deleteExpMutation.isPending}
                className="rounded-xl bg-coral-500 hover:bg-coral-600 text-white"
              >
                {deleteExpMutation.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách Follower / Following */}
      {profile && (
        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={profile.userId}
          type={followModalType}
        />
      )}
    </div>
  )
}
