import { useState, useMemo, useEffect, useRef } from 'react'
import { Users, Loader2, UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar, Skeleton, EmptyState, Modal } from '@/components/ui'
import { useUserFollowers, useUserFollowing } from '../hooks/useUserQueries'
import { useFollowUser, useUnfollowUser } from '../hooks/useUserMutations'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { Link } from 'react-router-dom'

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
  type: 'followers' | 'following'
}

/**
 * Modal hiển thị danh sách người theo dõi (Followers) hoặc đang theo dõi (Following) của một người dùng.
 * Sử dụng phân trang vô hạn (Infinite Scroll) thông qua IntersectionObserver và useInfiniteQuery.
 */
export function FollowListModal({ isOpen, onClose, userId, type }: FollowListModalProps) {
  const pageSize = 10

  // Lấy trạng thái đăng nhập
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const triggerLoginPrompt = useLoginPrompt((s) => s.open)
  const queryClient = useQueryClient()
  const [followErrors, setFollowErrors] = useState<Record<number, string>>({})

  // [I-03] Khi modal đóng: xóa cache infinite query để lần mở tiếp theo luôn bắt đầu từ trang 1
  useEffect(() => {
    if (!isOpen) {
      queryClient.removeQueries({ queryKey: ['user-followers', userId, pageSize] })
      queryClient.removeQueries({ queryKey: ['user-following', userId, pageSize] })
    }
  }, [isOpen, userId, pageSize, queryClient])

  // Queries danh sách vô hạn (Infinite Query)
  const followersQuery = useUserFollowers(userId, pageSize, { enabled: isOpen && type === 'followers' })
  const followingQuery = useUserFollowing(userId, pageSize, { enabled: isOpen && type === 'following' })

  const activeQuery = type === 'followers' ? followersQuery : followingQuery
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = activeQuery

  // Gộp tất cả trang đã tải thành danh sách phẳng — dùng để kiểm tra empty state
  const allItems = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.content)
  }, [data?.pages])

  // [I-01] Chỉ sort trang đầu tiên (bản thân lên trên cùng),
  // giữ nguyên thứ tự thời gian từ server để tránh items nhảy vị trí (Layout Shift) khi bấm Follow/Unfollow.
  const sortedContent = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return []

    const firstPageItems = [...(data.pages[0]?.content ?? [])].sort((a, b) => {
      const aSelf = currentUserId !== undefined && String(currentUserId) === String(a.userId)
      const bSelf = currentUserId !== undefined && String(currentUserId) === String(b.userId)

      // 1. Bản thân lên đầu
      if (aSelf && !bSelf) return -1
      if (!aSelf && bSelf) return 1

      return 0
    })

    // Các trang sau giữ nguyên thứ tự server trả về
    const remainingItems = data.pages.slice(1).flatMap((page) => page.content)

    return [...firstPageItems, ...remainingItems]
  }, [data?.pages, currentUserId])

  // Sử dụng IntersectionObserver để tự động tải thêm trang mới khi cuộn đến cuối danh sách
  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !isOpen) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, isOpen, fetchNextPage])

  // Mutations follow/unfollow
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()

  const handleFollowAction = async (targetUserId: number, isCurrentlyFollowing: boolean) => {
    if (!isAuthenticated) {
      triggerLoginPrompt('Đăng nhập để theo dõi thành viên này.')
      return
    }

    setFollowErrors((prev) => ({ ...prev, [targetUserId]: '' }))
    try {
      if (isCurrentlyFollowing) {
        await unfollowMutation.mutateAsync(targetUserId)
      } else {
        await followMutation.mutateAsync(targetUserId)
      }
    } catch (err: any) {
      // [MSG_FOLLOW_04] Lưu lại lỗi inline tương ứng cho từng thành viên
      const msg = err?.message || err?.response?.data?.message || 'Có lỗi xảy ra.'
      setFollowErrors((prev) => ({ ...prev, [targetUserId]: msg }))
    }
  }

  const titleText = type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      icon={<Users size={18} />}
      footer={undefined}
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-4">
        {isLoading ? (
          // Skeletal Loading
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-white/40 rounded-2xl border border-plum-900/[0.02]">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))
        ) : error ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Đã xảy ra lỗi"
            description={error instanceof Error ? error.message : 'Không thể tải danh sách.'}
          />
        ) : allItems.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Danh sách trống"
            description={type === 'followers' ? 'Chưa có ai theo dõi thành viên này.' : 'Thành viên này chưa theo dõi ai.'}
          />
        ) : (
          <div className="space-y-3">
            {sortedContent.map((item) => {
              const isSelf = currentUserId !== undefined && String(currentUserId) === String(item.userId)
              const mutationPending =
                (followMutation.isPending && followMutation.variables === item.userId) ||
                (unfollowMutation.isPending && unfollowMutation.variables === item.userId)
              const userError = followErrors[item.userId]

              return (
                <div
                  key={item.userId}
                  className="flex flex-col gap-1.5 p-3 bg-white hover:bg-cream-100/30 rounded-2xl border border-plum-900/[0.04] transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/app/profile?userId=${item.userId}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar
                        src={item.avatarUrl || undefined}
                        name={item.fullName}
                        size={42}
                      />
                      <div className="text-left min-w-0">
                        <h4 className="text-sm font-bold text-plum-900 group-hover:text-brand-600 transition-colors truncate">
                          {item.fullName}
                        </h4>
                        <p className="text-xs text-plum-400 truncate leading-normal">
                          {item.headline || (item.email ? `@${item.email.split('@')[0]}` : '')}
                        </p>
                      </div>
                    </Link>

                    {/* Follow Button */}
                    {!isSelf && (
                      <Button
                        size="sm"
                        variant={item.isFollowing ? 'secondary' : 'primary'}
                        onClick={() => handleFollowAction(item.userId, item.isFollowing)}
                        disabled={mutationPending}
                        className="shrink-0 w-[118px] h-8 text-[11px] px-2 rounded-xl justify-center font-bold"
                        leftIcon={
                          mutationPending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : item.isFollowing ? (
                            <UserMinus size={12} />
                          ) : (
                            <UserPlus size={12} />
                          )
                        }
                      >
                        {item.isFollowing ? 'Hủy theo dõi' : 'Theo dõi'}
                      </Button>
                    )}
                  </div>
                  {/* [MSG_FOLLOW_04] Hiển thị lỗi inline tương ứng dưới mỗi user */}
                  {userError && (
                    <p className="text-[10px] text-rose-500 font-medium pl-14 text-left leading-normal">
                      {userError}
                    </p>
                  )}
                </div>
              )
            })}

            {/* Vùng check giao nhau để tự động load tiếp */}
            <div ref={observerRef} className="h-2 w-full bg-transparent" />

            {/* Spinner tải trang tiếp theo */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <Loader2 size={20} className="animate-spin text-brand-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
