import { useState, useMemo } from 'react'
import {
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

import type { FeedFilter, Post } from '../model/post'
import { useUserPosts } from '../hooks/useUserPosts'
import { useAuthStore } from '@/store/authStore'
import { CreatePostModal, DeletePostModal, RepostModal } from '@/features/feed'

// Import PostCard from FeedPage
import { PostCard } from '@/pages/app/FeedPage'

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'achievement', label: 'Thành tựu' },
  { key: 'recruitment', label: 'Tuyển dụng' },
  { key: 'event', label: 'Sự kiện' },
]

export function UserPostsView({ userId }: { userId: string | number }) {
  const [filter, setFilter] = useState<FeedFilter>('all')

  const { data, isLoading, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserPosts(userId, filter)

  // Auth Store for PostCard interaction
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isAlumni = user?.role === 'ALUMNI'
  const isStudent = user?.role === 'STUDENT'
  const canInteract = isAuthenticated && (isAlumni || isStudent)

  // Modal States
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [repostingPost, setRepostingPost] = useState<Post | null>(null)

  const posts: Post[] = useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data])

  return (
    <div className="space-y-6 text-left">
      {/* Header Filters */}
      <Reveal>
        <div className="rounded-2xl bg-white p-4 sm:p-5 border border-plum-900/10 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2',
                    active
                      ? 'bg-brand-500 text-white shadow-xs shadow-brand-500/20'
                      : 'bg-slate-100/80 text-plum-600 hover:bg-slate-200/80 hover:text-plum-900',
                  )}
                >
                  <span>{f.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      {/* Feed List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} hover={false} className="p-5 h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center rounded-2xl">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-300/40 text-coral-600">
            <AlertTriangle size={24} />
          </span>
          <p className="font-bold text-plum-900">Không tải được danh sách bài viết</p>
          <p className="text-xs text-plum-500">{(error as Error)?.message}</p>
          <Button size="sm" onClick={() => refetch()}>Thử lại</Button>
        </Card>
      ) : posts.length === 0 ? (
        <Card hover={false} className="rounded-2xl p-10 text-center bg-white border border-plum-900/10">
          <EmptyState
            icon={<FileText size={32} className="text-brand-500" />}
            title={filter === 'all' ? 'Chưa có bài viết nào' : `Không có bài viết loại "${FILTERS.find(f => f.key === filter)?.label}"`}
            description="Thành viên này chưa đăng tải bài viết nào hoặc bài viết đã bị ẩn."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Stagger className="space-y-6 flex flex-col gap-6">
            {posts.map((post) => (
              <StaggerItem key={post.id}>
                <PostCard
                  post={post}
                  canInteract={canInteract}
                  currentUserId={user?.id}
                  currentUserName={user?.name}
                  onEdit={setEditingPost}
                  onDelete={setDeletingPost}
                  canReport={isAuthenticated && user?.id !== post.authorId}
                  onRepost={setRepostingPost}
                />
              </StaggerItem>
            ))}
          </Stagger>

          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2 rounded-xl cursor-pointer px-5 py-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang tải thêm…
                  </>
                ) : (
                  'Tải thêm bài viết'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {editingPost && (
        <CreatePostModal
          isOpen={true}
          onClose={() => setEditingPost(null)}
          postToEdit={editingPost}
        />
      )}

      {deletingPost && (
        <DeletePostModal
          isOpen={true}
          onClose={() => setDeletingPost(null)}
          post={deletingPost}
        />
      )}

      {repostingPost && (
        <RepostModal
          isOpen={true}
          onClose={() => setRepostingPost(null)}
          post={repostingPost}
        />
      )}
    </div>
  )
}
