import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Loader2,
  User,
  FileText,
  Repeat,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar, Card, Skeleton, EmptyState, SmartImage } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useOwnProfile, useUserProfile, useFollowUser, useUnfollowUser, FollowListModal } from '@/features/user'
import { useLoginPrompt } from '@/store/loginPrompt'
import { formatPeriodDate } from '@/utils/date'
import { getSocialPlatform } from '@/utils/social'
import { groupSkills } from '@/utils/profile'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = (() => {
    const raw = searchParams.get('userId')
    if (!raw) return null
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? null : parsed
  })()

  const [followModalOpen, setFollowModalOpen] = useState(false)
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers')
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'reposts'>('profile')
  const [followError, setFollowError] = useState<string | null>(null)

  // Lấy thông tin tài khoản đang đăng nhập
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isOwnProfile = !userId || String(userId) === currentUserId

  // Tự động chuyển hướng về /login nếu cố tình xem hồ sơ bản thân khi chưa đăng nhập
  useEffect(() => {
    if (isOwnProfile && !isAuthenticated) {
      navigate('/login')
    }
  }, [isOwnProfile, isAuthenticated, navigate])

  // Tự động chuẩn hóa URL: Nếu xem hồ sơ của chính mình mà URL có ?userId=... -> Tự động làm sạch về /app/profile
  useEffect(() => {
    if (userId && currentUserId && String(userId) === String(currentUserId)) {
      navigate('/app/profile', { replace: true })
    }
  }, [userId, currentUserId, navigate])

  // Gọi API lấy dữ liệu hồ sơ
  const ownProfileQuery = useOwnProfile({ enabled: isOwnProfile && isAuthenticated })
  const userProfileQuery = useUserProfile(userId, { enabled: !isOwnProfile })

  const activeQuery = isOwnProfile ? ownProfileQuery : userProfileQuery
  const { data: profile, isLoading, error } = activeQuery

  // Mutations
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const triggerLoginPrompt = useLoginPrompt((s) => s.open)

  const followPending = followMutation.isPending || unfollowMutation.isPending

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
      // [MSG_FOLLOW_04] Hiển thị lỗi inline từ Backend (tài khoản bị khóa, đã follow, v.v.)
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
  const isStudent = profile.role === 'STUDENT'

  // Sắp xếp các kinh nghiệm làm việc theo thời gian bắt đầu giảm dần (mới nhất lên đầu)
  const sortedExps = profile.experiences
    ? [...profile.experiences].sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateB - dateA
      })
    : []

  const skillGroups = profile.skills?.length ? groupSkills(profile.skills) : {}

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      {/* Nút quay lại (chỉ hiển thị khi xem hồ sơ người khác) */}
      {!isOwnProfile && (
        <div className="mb-4">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
        </div>
      )}

      {/* Ảnh bìa */}
      <Reveal>
        <SmartImage
          src={profile.coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200'}
          alt="Profile cover"
          className="h-48 rounded-3xl sm:h-60 border border-plum-900/5"
          imgClassName="object-cover"
        />
      </Reveal>

      {/* Header hồ sơ */}
      <div className="relative p-6 bg-white rounded-3xl border border-plum-900/5 shadow-sm mt-6">
        <div className="relative -mt-20 sm:-mt-24 z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex justify-start">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size={140}
              ring
              className="bg-cream-50 shadow-md rounded-full"
            />
          </div>

          {!isOwnProfile && (
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 pb-2">
              <Button
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                onClick={handleFollowToggle}
                disabled={followPending}
                className="rounded-xl shadow-sm text-sm font-semibold min-w-[120px]"
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
              {/* [MSG_FOLLOW_04] Inline error hiển thị đúng dưới nút khi API trả về lỗi */}
              {followError && (
                <p className="text-xs text-rose-500 font-medium max-w-[200px] text-right">
                  {followError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3.5 text-left">
          {/* Tên & Trạng thái xác minh */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-plum-900 tracking-tight">
              {profile.fullName}
            </h1>
            {profile.isAccountVerified && (
              <BadgeCheck className="text-brand-500 fill-brand-100" size={24} />
            )}
          </div>

          {/* Chức danh / Vai trò hiện tại */}
          <p className="text-base sm:text-lg font-semibold text-plum-700">
            {profile.primaryExperience?.title ? (
              <span>
                {profile.primaryExperience.title} tại{' '}
                <strong className="font-bold text-plum-900">
                  {profile.primaryExperience.company}
                </strong>
              </span>
            ) : (
              profile.headline || (isAlumni ? 'Cựu sinh viên FPTU' : 'Sinh viên FPTU')
            )}
          </p>

          {/* Chỉ số Follower & Following (Instagram / Twitter style) */}
          <div className="flex items-center gap-4 text-sm text-plum-500 font-medium pt-0.5">
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

          {/* Thông tin Meta: Vị trí, Ngành học, Ngày tham gia (Twitter style - Dọc gọn gàng) */}
          <div className="space-y-1.5 pt-1 text-xs sm:text-sm text-plum-500">
            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-plum-400 shrink-0" />
              <span>{profile.primaryExperience?.location || profile.city || 'Đại học FPT'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <GraduationCap size={14} className="text-plum-400 shrink-0" />
              <span>
                {profile.major ? `${profile.major.name} (${profile.major.code})` : 'N/A'}
                {profile.cohort ? ` · Khóa K${profile.cohort}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-plum-400 shrink-0" />
              <span>Đã tham gia vào {new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Điều hướng kiểu Instagram - Tab Bar */}
      <div className="flex border-b border-plum-900/5 mt-8 justify-center gap-8 sm:gap-12 shrink-0">
        {[
          { id: 'profile', label: 'Hồ sơ', icon: User },
          { id: 'posts', label: 'Bài viết', icon: FileText },
          { id: 'reposts', label: 'Chia sẻ', icon: Repeat },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 font-bold text-sm transition-all focus:outline-none cursor-pointer",
                isActive
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-plum-400 hover:text-plum-700"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Nội dung chi tiết - Hiển thị theo Tab được chọn */}
      <div className="mt-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Giới thiệu */}
              <Reveal>
                <Card hover={false} className="p-6">
                  <h2 className="text-lg font-bold text-plum-900">Giới thiệu</h2>
                  <p className="mt-3 text-sm leading-relaxed text-plum-600 whitespace-pre-line text-left">
                    {profile.biography || 'Thành viên này chưa cập nhật phần tự giới thiệu bản thân.'}
                  </p>
                </Card>
              </Reveal>

              {/* Thông tin liên hệ */}
              <Reveal>
                <Card hover={false} className="p-6">
                  <h2 className="text-lg font-bold text-plum-900">Thông tin liên hệ</h2>
                  <div className="mt-4 space-y-4 text-left">
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

              {/* Hành trình & Sự nghiệp */}
              <Reveal>
                <Card hover={false} className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-plum-900">Hành trình & Sự nghiệp</h2>
                  </div>

                  {sortedExps.length === 0 && !profile.major ? (
                    <EmptyState
                      icon={<Briefcase size={22} />}
                      title="Chưa cập nhật hành trình sự nghiệp"
                      description="Hãy thêm các kinh nghiệm làm việc hoặc hoạt động của bạn."
                    />
                  ) : (
                    <ol className="space-y-0 text-left">
                      {/* Render Work/Club/Volunteer Experiences */}
                      {sortedExps.map((exp, i) => {
                        const start = exp.startDate ? formatPeriodDate(exp.startDate) : ''
                        const end = exp.isCurrent ? 'Hiện tại' : exp.endDate ? formatPeriodDate(exp.endDate) : ''

                        return (
                          <li key={exp.id} className="relative flex gap-4 pb-6 last:pb-0">
                            <div className="flex flex-col items-center">
                              <span
                                className={`grid h-9 w-9 place-items-center rounded-full ${
                                  exp.isCurrent
                                    ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white'
                                    : 'bg-plum-900/[0.05] text-plum-400'
                                }`}
                              >
                                <Briefcase size={15} />
                              </span>
                              {/* Line connector */}
                              {(i < sortedExps.length - 1 || profile.major) && (
                                <span className="mt-1 w-px flex-1 bg-plum-900/[0.07]" />
                              )}
                            </div>
                            <div className="pb-1 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-bold text-plum-900">
                                    {exp.title}
                                    {exp.isPrimary && (
                                      <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600 ml-2 border border-brand-200/20">
                                        Chính
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-plum-500">
                                    {exp.company}
                                    {exp.location ? ` · ${exp.location}` : ''}
                                  </p>
                                  <p className="text-xs text-plum-400">
                                    {start} – {end}
                                  </p>
                                  {exp.location && exp.latitude && (
                                    <span className="text-[10px] text-plum-400 block mt-0.5">
                                      Geocoded ({exp.latitude.toFixed(4)}, {exp.longitude?.toFixed(4)})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {exp.description && (
                                <p className="mt-2.5 text-xs text-plum-600 leading-relaxed bg-plum-50/50 p-2.5 rounded-xl border border-plum-900/[0.03] whitespace-pre-line">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          </li>
                        )
                      })}

                      {/* Render Education step at the bottom */}
                      {profile.major && (
                        <li className="relative flex gap-4 pb-0">
                          <div className="flex flex-col items-center">
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-full ${
                                isStudent
                                  ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white'
                                  : 'bg-plum-900/[0.05] text-plum-400'
                              }`}
                            >
                              <GraduationCap size={16} />
                            </span>
                          </div>
                          <div className="pb-1 flex-1">
                            <p className="font-bold text-plum-900">
                              {isAlumni
                                ? `Cựu sinh viên ngành ${profile.major.name}`
                                : `Sinh viên ngành ${profile.major.name}`}
                            </p>
                            <p className="text-sm text-plum-500">Đại học FPT</p>
                            <p className="text-xs text-plum-400">
                              {isAlumni
                                ? profile.cohort
                                  ? `Đã tốt nghiệp (Khóa K${profile.cohort})`
                                  : 'Đã tốt nghiệp'
                                : profile.cohort
                                  ? `Đang học (Khóa K${profile.cohort})`
                                  : 'Đang học'}
                            </p>
                          </div>
                        </li>
                      )}
                    </ol>
                  )}
                </Card>
              </Reveal>

              {/* Kỹ năng nổi bật */}
              {Object.keys(skillGroups).length > 0 && (
                <Reveal>
                  <Card hover={false} className="p-6">
                    <h2 className="text-lg font-bold text-plum-900 text-left">Kỹ năng nổi bật</h2>
                    <div className="mt-4 space-y-4 text-left">
                      {Object.entries(skillGroups).map(([group, skills]) => (
                        <div key={group} className="space-y-2">
                          <h3 className="text-xs font-semibold text-plum-500 uppercase tracking-wider">
                            {group}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="inline-flex items-center rounded-xl bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700 border border-plum-900/5 hover:bg-brand-50 hover:text-brand-700 transition-colors"
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
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              key="posts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                icon={<FileText size={22} />}
                title="Chưa có bài viết nào"
                description="Các bài viết do thành viên này đăng tải sẽ xuất hiện tại đây."
              />
            </motion.div>
          )}

          {activeTab === 'reposts' && (
            <motion.div
              key="reposts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                icon={<Repeat size={22} />}
                title="Chưa có bài chia sẻ nào"
                description="Các bài viết được thành viên này chia sẻ lại sẽ xuất hiện tại đây."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal danh sách Follower / Following */}
      <FollowListModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        userId={profile.userId}
        type={followModalType}
      />
    </div>
  )
}
