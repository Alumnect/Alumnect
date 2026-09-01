import { useState } from 'react'
import { Filter, Loader2, AlertCircle, FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useAuthStore } from '@/store/authStore'
import { useUserPosts } from '../hooks/useUserPosts'
import { PostCard } from '@/pages/app/FeedPage'
import type { FeedFilter, Post } from '../model/post'
import { DeletePostModal, ShareModal } from '..'
import { ReportPostModal } from '@/features/report'

interface UserPostsViewProps {
  userId: number
}

const FILTER_TABS: { id: FeedFilter; label: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }[] = [
  { id: 'all', label: 'Tất cả', tone: 'brand' },
  { id: 'achievement', label: 'Thành tựu', tone: 'gold' },
  { id: 'recruitment', label: 'Tuyển dụng', tone: 'aqua' },
  { id: 'event', label: 'Sự kiện', tone: 'violet' },
]

export function UserPostsView({ userId }: UserPostsViewProps) {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [sharingPost, setSharingPost] = useState<Post | null>(null)
  const [reportingPost, setReportingPost] = useState<Post | null>(null)

  const viewer = useAuthStore((s) => s.user)
  const isGuest = !viewer
  const canInteract = !isGuest

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUserPosts(userId, filter)

  const pages = data?.pages ?? []
  const posts = pages.flatMap((page) => page.items)

  return (
    <div className="space-y-4 lg:space-y-6">
      <Reveal direction="down">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 sm:p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:h-12 sm:w-12">
            <Filter size={20} />
          </div>
          <div className="flex flex-1 gap-1 overflow-x-auto pb-1 scrollbar-hide sm:gap-2 sm:pb-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-all sm:px-4 ${
                  filter === tab.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Hiển thị bài viết */}
      <div className="space-y-4 lg:space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle size={24} />}
            title="Lỗi tải bảng tin"
            description="Đã xảy ra sự cố khi lấy bài viết của người dùng này. Vui lòng thử lại sau."
            action={
              <Button type="button" variant="secondary" size="md" onClick={() => refetch()}>
                Thử lại
              </Button>
            }
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="Chưa có bài viết nào"
            description="Người dùng này chưa có bài viết nào hoặc chưa phù hợp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <Stagger className="space-y-4 lg:space-y-6">
              {posts.map((post) => (
                <StaggerItem key={post.id}>
                  <PostCard
                    post={post}
                    canInteract={canInteract}
                    currentUserId={viewer?.id}
                    currentUserName={viewer?.name}
                    onDelete={setDeletingPost}
                    onShare={setSharingPost}
                    canReport={canInteract && viewer?.id !== post.authorId}
                    onReport={setReportingPost}
                  />
                </StaggerItem>
              ))}
            </Stagger>

            {hasNextPage ? (
              <div className="pt-2 text-center pb-6">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  leftIcon={isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
                >
                  {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm bài viết'}
                </Button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-plum-400">Đã hiển thị tất cả bài viết 🎉</p>
              </div>
            )}
          </>
        )}
      </div>

      {deletingPost && (
        <DeletePostModal
          open={!!deletingPost}
          onClose={() => setDeletingPost(null)}
          post={deletingPost}
          onDeleted={() => {
            setDeletingPost(null)
            refetch()
          }}
        />
      )}
      {sharingPost && (
        <ShareModal
          isOpen={!!sharingPost}
          onClose={() => setSharingPost(null)}
          post={sharingPost}
        />
      )}
      {reportingPost && (
        <ReportPostModal
          open={!!reportingPost}
          postId={reportingPost.id}
          onClose={() => setReportingPost(null)}
        />
      )}
    </div>
  )
}
