import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Target,
  UserPlus,
  Compass,
  Search,
  HeartHandshake,
  UserX,
} from 'lucide-react'
import { PageHeader, Badge, EmptyState, Skeleton, Pagination, Avatar, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import {
  UserSearchFilterBar,
  UserDirectoryCard,
  useSearchUsers,
  useConnectionSuggestions,
  useUserFollowers,
  useUserFollowing,
  useFollowUser,
  useUnfollowUser,
  type FilterState,
  type UserDirectoryResponse,
} from '@/features/user'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const INITIAL_FILTERS: FilterState = {
  query: '',
  category: 'ALL',
  role: 'ALL',
  majorId: null,
  cohort: null,
  city: '',
  skill: '',
  company: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
}

const PAGE_SIZE = 12

export function AlumniDirectoryPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [activeTab, setActiveTab] = useState<'directory' | 'suggestions' | 'network'>('directory')
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [page, setPage] = useState(0)

  const currentUserId = useAuthStore((s) => s.user?.id)

  // Khách chưa đăng nhập thì không có gợi ý kết nối hay mạng lưới cá nhân
  useEffect(() => {
    if (!isAuthenticated && activeTab !== 'directory') {
      setActiveTab('directory')
    }
  }, [isAuthenticated, activeTab])

  // 1. Dữ liệu Danh bạ thành viên (Tab 1)
  const searchParams = {
    query: filters.query.trim() || undefined,
    role: filters.role !== 'ALL' ? filters.role : undefined,
    majorId: filters.majorId || undefined,
    cohort: filters.cohort || undefined,
    city: filters.city || undefined,
    skill: filters.skill || undefined,
    company: filters.company || undefined,
    page,
    size: PAGE_SIZE,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  }

  const { data, isLoading, isError, error, refetch } = useSearchUsers(searchParams, {
    enabled: activeTab === 'directory',
  })

  const users = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = data?.totalPages || 0

  // Loại trừ tài khoản của chính mình để không tạo ô trống hoặc mất thẩm mỹ trong danh bạ
  const displayedUsers = currentUserId
    ? users.filter((u) => Number(u.userId) !== Number(currentUserId))
    : users

  // 2. Dữ liệu Gợi ý kết nối (Tab 2) - Chỉ tải khi đã đăng nhập
  const {
    data: suggestions = [],
    isLoading: isSuggestionsLoading,
    isError: isSuggestionsError,
    refetch: refetchSuggestions,
  } = useConnectionSuggestions(24, {
    enabled: activeTab === 'suggestions' && isAuthenticated,
  })

  // Loại trừ tài khoản của chính mình khỏi danh sách gợi ý
  const displayedSuggestions = currentUserId
    ? suggestions.filter((s) => Number(s.userId) !== Number(currentUserId))
    : suggestions

  // 3. Dữ liệu Mạng lưới cá nhân (Tab 3)
  const [networkSubTab, setNetworkSubTab] = useState<'following' | 'followers'>('following')
  const [networkSearch, setNetworkSearch] = useState('')

  const {
    data: followingData,
    isLoading: isFollowingLoading,
  } = useUserFollowing(Number(currentUserId) || 0, 50, {
    enabled: activeTab === 'network' && !!currentUserId && networkSubTab === 'following',
  })

  const {
    data: followersData,
    isLoading: isFollowersLoading,
  } = useUserFollowers(Number(currentUserId) || 0, 50, {
    enabled: activeTab === 'network' && !!currentUserId && networkSubTab === 'followers',
  })

  const followingUsers = followingData?.pages.flatMap((p) => p.content) || []
  const followersUsers = followersData?.pages.flatMap((p) => p.content) || []

  const activeNetworkUsers = networkSubTab === 'following' ? followingUsers : followersUsers
  const filteredNetworkUsers = activeNetworkUsers.filter((u) => {
    if (!networkSearch.trim()) return true
    const q = networkSearch.toLowerCase()
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.headline && u.headline.toLowerCase().includes(q)) ||
      (u.studentCode && u.studentCode.toLowerCase().includes(q))
    )
  })

  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(0)
  }

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* Page Header */}
      <PageHeader
        icon={<Users size={22} className="text-brand-500" />}
        title="Mạng lưới & Danh bạ AlumNect"
        subtitle="Khám phá và kết nối cùng cộng đồng hàng ngàn cựu sinh viên & sinh viên FPT University."
        actions={
          totalElements > 0 && activeTab === 'directory' ? (
            <Badge tone="brand" className="px-3.5 py-1 text-xs">
              <UserCheck size={13} /> {totalElements} Thành viên
            </Badge>
          ) : undefined
        }
      />

      {/* Main Tabs Navigation - Chỉ hiển thị khi người dùng đã đăng nhập */}
      {isAuthenticated && (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-plum-900/10 dark:border-plum-800/40 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              activeTab === 'directory'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-white/70 dark:bg-plum-950/40 text-plum-600 dark:text-plum-300 hover:bg-plum-900/[0.05] dark:hover:bg-plum-900/20',
            )}
          >
            <Compass size={17} />
            <span>Danh bạ thành viên</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              activeTab === 'suggestions'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-white/70 dark:bg-plum-950/40 text-plum-600 dark:text-plum-300 hover:bg-plum-900/[0.05] dark:hover:bg-plum-900/20',
            )}
          >
            <Target size={17} className={activeTab === 'suggestions' ? 'text-white' : 'text-brand-500'} />
            <span>Gợi ý kết nối</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              activeTab === 'network'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-white/70 dark:bg-plum-950/40 text-plum-600 dark:text-plum-300 hover:bg-plum-900/[0.05] dark:hover:bg-plum-900/20',
            )}
          >
            <HeartHandshake size={17} />
            <span>Mạng lưới của tôi</span>
          </button>
        </div>
      )}

      {/* ===================== TAB 1: DANH BẠ THÀNH VIÊN ===================== */}
      {activeTab === 'directory' && (
        <>
          {/* Filter & Search Bar */}
          <UserSearchFilterBar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex h-[360px] flex-col items-center justify-between rounded-3xl border border-plum-900/10 bg-white/60 p-5 backdrop-blur-xs"
                >
                  <div className="flex w-full flex-col items-center">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-5 w-32 rounded-lg" />
                    <Skeleton className="mt-2 h-4 w-48 rounded-lg" />
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="mt-6 flex w-full gap-2">
                    <Skeleton className="h-8 flex-1 rounded-xl" />
                    <Skeleton className="h-8 w-10 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && isError && (
            <EmptyState
              icon={<Users size={28} className="text-coral-500" />}
              title="Không thể tải danh bạ thành viên"
              description={error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi kết nối máy chủ.'}
              action={
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Thử lại
                </Button>
              }
            />
          )}

          {/* Zero Result State */}
          {!isLoading && !isError && displayedUsers.length === 0 && (
            <EmptyState
              icon={<Users size={28} className="text-brand-500" />}
              title="Không tìm thấy thành viên phù hợp"
              description="Hãy thử thay đổi từ khóa tìm kiếm, chuyên ngành hoặc mở rộng phạm vi bộ lọc."
              action={
                <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                  Xóa bộ lọc & Tìm lại
                </Button>
              }
            />
          )}

          {/* User Directory Grid */}
          {!isLoading && !isError && displayedUsers.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayedUsers.map((user) => (
                  <div key={user.userId} className="h-full animate-in fade-in-50 duration-300">
                    <UserDirectoryCard user={user} />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      {/* ===================== TAB 2: GỢI Ý KẾT NỐI ===================== */}
      {activeTab === 'suggestions' && (
        <div>
          {/* Loading Skeletons */}
          {isSuggestionsLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex h-[360px] flex-col items-center justify-between rounded-3xl border border-plum-900/10 bg-white/60 p-5 backdrop-blur-xs"
                >
                  <div className="flex w-full flex-col items-center">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-5 w-32 rounded-lg" />
                    <Skeleton className="mt-2 h-4 w-48 rounded-lg" />
                  </div>
                  <div className="mt-6 flex w-full gap-2">
                    <Skeleton className="h-8 flex-1 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isSuggestionsLoading && isSuggestionsError && (
            <EmptyState
              icon={<Users size={28} className="text-coral-500" />}
              title="Không thể tải danh sách gợi ý"
              description="Đã xảy ra lỗi khi tính toán dữ liệu đề xuất kết nối."
              action={
                <Button size="sm" variant="secondary" onClick={() => refetchSuggestions()}>
                  Thử lại
                </Button>
              }
            />
          )}

          {/* Zero Suggestions */}
          {!isSuggestionsLoading && !isSuggestionsError && displayedSuggestions.length === 0 && (
            <EmptyState
              icon={<Compass size={28} className="text-brand-500" />}
              title="Chưa có gợi ý phù hợp"
              description="Hãy hoàn thiện thông tin hồ sơ (chuyên ngành, khóa học, kinh nghiệm làm việc) để nhận được các đề xuất chính xác hơn."
              action={
                <Link to="/app/profile">
                  <Button size="sm" variant="primary">
                    Cập nhật hồ sơ
                  </Button>
                </Link>
              }
            />
          )}

          {/* Suggestions Grid */}
          {!isSuggestionsLoading && !isSuggestionsError && displayedSuggestions.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedSuggestions.map((suggestion) => (
                <div key={suggestion.userId} className="h-full animate-in fade-in-50 duration-300">
                  <UserDirectoryCard user={suggestion as unknown as UserDirectoryResponse} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: MẠNG LƯỚI CỦA TÔI ===================== */}
      {activeTab === 'network' && (
        <div>
          {/* Network Header & Sub Tabs */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNetworkSubTab('following')}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  networkSubTab === 'following'
                    ? 'bg-plum-900 text-white dark:bg-plum-100 dark:text-plum-900 shadow-xs'
                    : 'bg-plum-900/5 text-plum-600 hover:bg-plum-900/10 dark:text-plum-300',
                )}
              >
                Đang theo dõi ({followingUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setNetworkSubTab('followers')}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  networkSubTab === 'followers'
                    ? 'bg-plum-900 text-white dark:bg-plum-100 dark:text-plum-900 shadow-xs'
                    : 'bg-plum-900/5 text-plum-600 hover:bg-plum-900/10 dark:text-plum-300',
                )}
              >
                Người theo dõi ({followersUsers.length})
              </button>
            </div>

            {/* Quick Network Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-plum-400" />
              <input
                type="text"
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                placeholder="Tìm nhanh trong mạng lưới..."
                className="h-9 w-full rounded-xl border border-plum-900/15 bg-white dark:bg-plum-900/20 pl-8 pr-3 text-xs text-plum-900 dark:text-plum-100 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Network Content List */}
          {(isFollowingLoading || isFollowersLoading) && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 border border-plum-900/10">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!(isFollowingLoading || isFollowersLoading) && filteredNetworkUsers.length === 0 && (
            <EmptyState
              icon={<HeartHandshake size={28} className="text-brand-500" />}
              title={
                networkSearch
                  ? 'Không tìm thấy kết quả phù hợp'
                  : networkSubTab === 'following'
                  ? 'Bạn chưa theo dõi thành viên nào'
                  : 'Chưa có người theo dõi bạn'
              }
              description={
                networkSearch
                  ? 'Hãy thử tìm kiếm với từ khóa khác.'
                  : 'Hãy khám phá danh bạ hoặc mục Gợi ý kết nối để mở rộng mạng lưới quan hệ.'
              }
              action={
                !networkSearch ? (
                  <Button size="sm" variant="primary" onClick={() => setActiveTab('suggestions')}>
                    Khám phá gợi ý
                  </Button>
                ) : undefined
              }
            />
          )}

          {!(isFollowingLoading || isFollowersLoading) && filteredNetworkUsers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNetworkUsers.map((member) => (
                <Card
                  key={member.userId}
                  hover={false}
                  className="flex items-center justify-between p-4 border border-plum-900/10 dark:border-plum-800/40 bg-white/80 dark:bg-plum-950/60"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                    <Link to={`/app/profile?userId=${member.userId}`}>
                      <Avatar
                        src={member.avatarUrl || undefined}
                        name={member.fullName}
                        size={48}
                        verified={member.isAccountVerified}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/app/profile?userId=${member.userId}`}
                        className="block truncate text-sm font-bold text-plum-900 dark:text-plum-100 hover:text-brand-600 transition-colors"
                      >
                        {member.fullName}
                      </Link>
                      <p className="truncate text-xs text-plum-500 dark:text-plum-400 mt-0.5">
                        {member.headline || 'Thành viên AlumNect'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {member.isFollowing ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs text-plum-600 hover:text-coral-600 hover:border-coral-200"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(member.userId)}
                        leftIcon={<UserX size={13} />}
                      >
                        Hủy theo dõi
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(member.userId)}
                        leftIcon={<UserPlus size={13} />}
                      >
                        Theo dõi lại
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
