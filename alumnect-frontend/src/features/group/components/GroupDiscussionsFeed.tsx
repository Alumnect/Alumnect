import { useState, useMemo, useEffect } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui/primitives'
import { Reveal } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useGroupPostDetail, useGroupPostsInfinite } from '../hooks/useGroupPosts'
import { GroupCreatePostCard } from './GroupCreatePostCard'
import { GroupPostCard } from './GroupPostCard'

interface GroupDiscussionsFeedProps {
  groupId: number
  groupName: string
  isActiveMember: boolean
  isGroupActive: boolean
  topics?: string[]
  sharedPostId?: number
}

export function GroupDiscussionsFeed({
  groupId,
  groupName,
  isActiveMember,
  isGroupActive,
  topics = [],
  sharedPostId,
}: GroupDiscussionsFeedProps) {
  const [activeTopic, setActiveTopic] = useState<string>('all')
  const visibleTopic = topics.includes(activeTopic) ? activeTopic : 'all'

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGroupPostsInfinite(groupId, 15, visibleTopic === 'all' ? '' : visibleTopic)
  const { data: sharedPost, isError: sharedPostError } = useGroupPostDetail(groupId, sharedPostId)
  const displayedSharedPostId = sharedPostError ? undefined : sharedPost?.id

  useEffect(() => {
    if (displayedSharedPostId) document.getElementById(`group-post-${displayedSharedPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [displayedSharedPostId])

  // Gộp các trang đã tải, loại trùng theo id do phân trang offset có thể lặp khi có bài mới.
  const posts = useMemo(() => {
    const seen = new Set<number>()
    return (data?.pages ?? []).flatMap((pg) => pg.content).filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [data?.pages])

  return (
    <div className="space-y-5">
      {sharedPostId && sharedPostError && (
        <Card hover={false} className="rounded-2xl border border-plum-900/10 p-4 text-sm text-plum-500 dark:border-[#393a3b] dark:bg-[#242526]">
          Bài viết được chia sẻ không còn khả dụng.
        </Card>
      )}
      {sharedPost && !sharedPostError && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-600">Bài viết được chia sẻ</p>
          <GroupPostCard post={sharedPost} groupId={groupId} isActiveMember={isActiveMember} isGroupActive={isGroupActive} topics={topics} />
        </div>
      )}
      {/* 1. Khung tạo bài viết thảo luận (chỉ cho thành viên ACTIVE) */}
      {isActiveMember && isGroupActive ? (
        <GroupCreatePostCard
          groupId={groupId}
          groupName={groupName}
          topics={topics}
        />
      ) : !isGroupActive ? null : (
        <Card hover={false} className="rounded-3xl border border-brand-500/20 bg-gradient-to-r from-brand-50/50 to-coral-50/30 p-5 shadow-card dark:border-brand-500/30 dark:from-brand-950/20 dark:to-[#242526]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-plum-900 dark:text-white">
                Tham gia {groupName} để cùng thảo luận
              </h4>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
                Trở thành thành viên để đăng bài viết, bình luận và kết nối với các cựu sinh viên khác.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Bộ lọc chủ đề nhanh */}
      {topics && topics.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTopic('all')}
            className={cn(
              'rounded-full px-3.5 py-1 text-xs font-bold transition-colors',
              visibleTopic === 'all'
                ? 'bg-plum-900 text-white dark:bg-white dark:text-plum-900'
                : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08] dark:bg-[#3a3b3c] dark:text-[#b0b3b8]',
            )}
          >
            Tất cả
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTopic(t)}
              className={cn(
                'rounded-full px-3.5 py-1 text-xs font-bold transition-colors',
                visibleTopic === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08] dark:bg-[#3a3b3c] dark:text-[#b0b3b8]',
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* 3. Danh sách các bài viết / thảo luận */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.filter((post) => post.id !== displayedSharedPostId).map((post) => (
            <Reveal key={post.id}>
              <GroupPostCard post={post} groupId={groupId} isActiveMember={isActiveMember} isGroupActive={isGroupActive} topics={topics} />
            </Reveal>
          ))}

          {/* Phân trang / Xem thêm: nối thêm trang kế tiếp vào cuối danh sách */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-2xl px-6 py-2 text-xs font-bold"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Đang tải thêm...
                  </>
                ) : (
                  'Xem thêm thảo luận cũ hơn'
                )}
              </Button>
            </div>
          )}

          {/* Trạng thái tinh gọn cuối dòng feed */}
          {!hasNextPage && (
            <div className="flex items-center justify-center gap-2.5 py-6 text-xs text-plum-400 dark:text-[#b0b3b8]">
              <span className="h-px w-12 bg-plum-900/10 dark:bg-[#393a3b]" />
              <span className="font-medium">Đã xem hết thảo luận gần đây</span>
              <span className="h-px w-12 bg-plum-900/10 dark:bg-[#393a3b]" />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-plum-900/10 bg-plum-900/[0.01] p-10 text-center dark:border-[#393a3b]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20">
            <MessageSquare size={22} />
          </div>
          <h4 className="mt-3 text-sm font-bold text-plum-900 dark:text-white">
            {visibleTopic === 'all' ? 'Chưa có bài thảo luận nào' : `Chưa có bài thảo luận về ${visibleTopic}`}
          </h4>
          <p className="mt-1 text-xs text-plum-500 dark:text-[#b0b3b8]">
            {isActiveMember
              ? 'Hãy là người đầu tiên đăng bài viết khởi động các cuộc thảo luận sôi nổi trong nhóm!'
              : 'Hãy tham gia nhóm để bắt đầu chia sẻ và trao đổi cùng mọi người.'}
          </p>
        </div>
      )}
    </div>
  )
}
