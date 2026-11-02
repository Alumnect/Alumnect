import { useState, useEffect, useRef } from 'react'
import { Filter, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { useAuthStore } from '@/store/authStore'
import { useUserPosts } from '../hooks/useUserPosts'
import { PostCard } from '@/pages/app/FeedPage'
import type { FeedFilter, Post } from '../model/post'
import { DeletePostModal, ShareModal, CreatePostModal } from '..'
import { ReportPostModal } from '@/features/report'
import { CancelEventModal, useCancelEvent } from '@/features/event'

interface UserPostsViewProps {
  userId: number
}

const FILTER_TAB_DEFS: { id: FeedFilter; labelKey: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }[] = [
  { id: 'all', labelKey: 'common.all', tone: 'brand' },
  { id: 'achievement', labelKey: 'feed.achievement', tone: 'gold' },
  { id: 'recruitment', labelKey: 'feed.recruitment', tone: 'aqua' },
  { id: 'event', labelKey: 'feed.event', tone: 'violet' },
]

export function UserPostsView({ userId }: UserPostsViewProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [sharingPost, setSharingPost] = useState<Post | null>(null)
  const [reportingPost, setReportingPost] = useState<Post | null>(null)
  const [cancelEventTarget, setCancelEventTarget] = useState<{ id: string | number; title?: string } | null>(null)

  const cancelEventMutation = useCancelEvent()

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

  // Tự động tải thêm bài viết (Infinite Scroll) khi cuộn tới cuối
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    )

    const currentTarget = loadMoreRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="space-y-4 lg:space-y-6">
      <Reveal direction="down">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface p-2 shadow-sm ring-1 ring-border sm:p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-solid sm:h-12 sm:w-12">
            <Filter size={20} />
          </div>
          <div className="flex flex-1 gap-1 overflow-x-auto pb-1 scrollbar-hide sm:gap-2 sm:pb-0">
            {FILTER_TAB_DEFS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  filter === tab.id
                    ? 'bg-primary-solid text-on-primary shadow-md'
                    : 'bg-transparent text-text-subtle hover:bg-surface-2 hover:text-text'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Hiển thị bài viết */}
      <div className="space-y-4 lg:space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle size={24} />}
            title={t('feed.loadError')}
            description={t('feed.loadErrorDesc')}
            action={
              <Button type="button" variant="secondary" size="md" onClick={() => refetch()}>
                {t('common.tryAgain')}
              </Button>
            }
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title={t('feed.noUserPosts')}
            description={t('feed.noUserPostsDesc')}
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
                    onEdit={setEditingPost}
                    onDelete={setDeletingPost}
                    onShare={setSharingPost}
                    onCancelEvent={(p) => {
                      if (p.event) {
                        setCancelEventTarget({
                          id: p.event.id ?? p.eventId ?? p.id,
                          title: p.event.title,
                        })
                      }
                    }}
                    canReport={canInteract && viewer?.id !== post.authorId}
                    onReport={setReportingPost}
                  />
                </StaggerItem>
              ))}
            </Stagger>

            {/* Vùng tự động tải thêm bài viết (Infinite scroll sentinel) */}
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 text-sm text-text-subtle">
                  <Loader2 size={18} className="animate-spin text-primary-solid" />
                  <span>{t('feed.loadingMore')}</span>
                </div>
              )}
              {!hasNextPage && posts.length > 0 && (
                <p className="text-sm text-text-subtle">{t('feed.endOfFeed')}</p>
              )}
            </div>
          </>
        )}
      </div>

      {editingPost && viewer && (
        <CreatePostModal
          open={!!editingPost}
          onClose={() => setEditingPost(null)}
          viewer={viewer}
          editPost={editingPost}
        />
      )}
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
      {cancelEventTarget && (
        <CancelEventModal
          isOpen={!!cancelEventTarget}
          onClose={() => setCancelEventTarget(null)}
          onConfirm={() => {
            if (cancelEventTarget) {
              cancelEventMutation.mutate({ eventId: cancelEventTarget.id }, {
                onSuccess: () => {
                  setCancelEventTarget(null)
                  refetch()
                },
              })
            }
          }}
          isPending={cancelEventMutation.isPending}
          eventTitle={cancelEventTarget.title}
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
