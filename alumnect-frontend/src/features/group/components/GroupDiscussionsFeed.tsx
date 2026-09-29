import { useState, useMemo } from 'react'
import { MessageSquare, Pin, Sparkles, Loader2 } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui/primitives'
import { Reveal } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useGroupPostsInfinite } from '../hooks/useGroupPosts'
import { GroupCreatePostCard } from './GroupCreatePostCard'
import { GroupPostCard } from './GroupPostCard'

interface GroupDiscussionsFeedProps {
  groupId: number
  groupName: string
  isActiveMember: boolean
  topics?: string[]
}

export function GroupDiscussionsFeed({
  groupId,
  groupName,
  isActiveMember,
  topics = [],
}: GroupDiscussionsFeedProps) {
  const [activeTopic, setActiveTopic] = useState<string>('all')

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGroupPostsInfinite(groupId, 15)

  // Gộp các trang đã tải thành một danh sách phẳng (loại trùng theo id do phân trang offset có thể lặp khi có bài mới),
  // rồi lọc theo chủ đề đang chọn (khớp trên nội dung bài viết) hoặc lấy tất cả.
  const posts = useMemo(() => {
    const seen = new Set<number>()
    const raw = (data?.pages ?? []).flatMap((pg) => pg.content).filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    if (activeTopic === 'all') return raw
    return raw.filter((p) => p.content.toLowerCase().includes(activeTopic.toLowerCase()))
  }, [data?.pages, activeTopic])

  return (
    <div className="space-y-5">
      {/* 1. Khung tạo bài viết thảo luận (chỉ cho thành viên ACTIVE) */}
      {isActiveMember ? (
        <GroupCreatePostCard
          groupId={groupId}
          groupName={groupName}
        />
      ) : (
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
              activeTopic === 'all'
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
                activeTopic === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08] dark:bg-[#3a3b3c] dark:text-[#b0b3b8]',
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* 3. Thông báo ghim chào mừng của hội nhóm */}
      <Card hover={false} className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-50/70 to-coral-50/40 p-5 shadow-card dark:border-brand-500/30 dark:from-brand-950/20 dark:to-[#242526]">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white shadow-sm">
            <Pin size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Thông báo ghim
              </span>
              <span className="text-xs text-plum-400">• Vừa cập nhật</span>
            </div>
            <h4 className="mt-1 text-sm font-extrabold text-plum-900 dark:text-white">
              Chào mừng bạn đến với cộng đồng {groupName}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
              Hãy tích cực giao lưu, chia sẻ kinh nghiệm học tập & công việc một cách cởi mở và tôn trọng quy định cộng đồng chung của cựu sinh viên FPTU.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Danh sách các bài viết / thảo luận */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Reveal key={post.id}>
              <GroupPostCard post={post} groupId={groupId} isActiveMember={isActiveMember} />
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

          {/* Trạng thái khích lệ cuối dòng feed */}
          {!hasNextPage && (
            <div className="rounded-3xl border border-dashed border-plum-900/10 p-8 text-center dark:border-[#393a3b]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20">
                <Sparkles size={22} />
              </div>
              <h4 className="mt-3 text-sm font-bold text-plum-900 dark:text-white">
                Bạn đã xem hết các thảo luận gần đây
              </h4>
              <p className="mt-1 text-xs text-plum-500 dark:text-[#b0b3b8]">
                Hãy đặt câu hỏi hoặc khởi xướng một chủ đề mới để các thành viên cùng tham gia nhé!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-plum-900/10 bg-plum-900/[0.01] p-10 text-center dark:border-[#393a3b]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20">
            <MessageSquare size={22} />
          </div>
          <h4 className="mt-3 text-sm font-bold text-plum-900 dark:text-white">
            Chưa có bài thảo luận nào
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
