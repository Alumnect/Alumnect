import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, MessageCircle, ArrowRight } from 'lucide-react'
import { Avatar, Skeleton, toast } from '@/components/ui'
import { useComments, useCreateComment } from '@/features/post'
import { useLoginPrompt } from '@/store/loginPrompt'
import type { AuthUser } from '@/store/authStore'

interface InlineCommentsProps {
  postId: string
  totalComments: number
  viewer: AuthUser | null
  canInteract: boolean
  onCommentAdded?: () => void
}

export function InlineComments({
  postId,
  totalComments,
  viewer,
  canInteract,
  onCommentAdded,
}: InlineCommentsProps) {
  const [content, setContent] = useState('')
  const promptLogin = useLoginPrompt((s) => s.open)

  const { data, isLoading, isError } = useComments(postId)
  const createComment = useCreateComment(postId)

  // Flatten comments from the first page (up to 3 most recent)
  const allComments = data?.pages.flatMap((page) => page.items) || []
  const displayComments = allComments.slice(0, 3)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    if (!canInteract) {
      promptLogin('Đăng nhập để bình luận về bài viết.')
      return
    }

    createComment.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setContent('')
          toast.success('Đã gửi bình luận!')
          onCommentAdded?.()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Không thể gửi bình luận. Vui lòng thử lại.'
          toast.error(msg)
        },
      }
    )
  }

  return (
    <div className="border-t border-border bg-surface-2 p-4 space-y-3 dark:bg-[#1f2022]/60">
      {/* Quick Comment Input */}
      {canInteract && viewer ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={32} verified={viewer.verified} className="shrink-0" />
          <div className="relative flex-1">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              placeholder="Viết phản hồi công khai..."
              className="w-full rounded-2xl border border-border bg-surface py-2 pl-3.5 pr-10 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!content.trim() || createComment.isPending}
              aria-label="Gửi bình luận"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center text-primary-solid transition-colors hover:text-primary-solid disabled:opacity-40 cursor-pointer"
            >
              {createComment.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-surface p-3 border border-border shadow-2xs">
          <p className="text-xs text-text-subtle">Đăng nhập để tham gia bình luận.</p>
          <button
            type="button"
            onClick={() => promptLogin('Đăng nhập để tham gia bình luận.')}
            className="text-xs font-bold text-primary-solid hover:underline flex items-center gap-1 cursor-pointer"
          >
            Đăng nhập <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2.5 py-1">
          <div className="flex gap-2.5 items-center">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-8 flex-1 rounded-2xl" />
          </div>
          <div className="flex gap-2.5 items-center">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-8 flex-1 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <p className="text-xs text-text-subtle py-1 text-center dark:text-text-subtle">Không thể tải bình luận lúc này.</p>
      )}

      {/* Comment List (Top 3) */}
      {!isLoading && displayComments.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {displayComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Link
                to={c.authorId ? `/app/profile?userId=${c.authorId}` : '/app/profile'}
                className="shrink-0 hover:opacity-85 transition-opacity"
              >
                <Avatar src={c.avatar} name={c.author} size={28} verified={c.verified} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={c.authorId ? `/app/profile?userId=${c.authorId}` : '/app/profile'}
                        className="truncate text-xs font-bold text-text hover:underline transition-colors"
                      >
                        {c.author}
                      </Link>
                      {c.role && (
                        <span className="text-xs font-medium text-primary-solid bg-primary-soft px-1.5 py-0.2 rounded-md">
                          {c.role}
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-text-subtle dark:text-text-subtle">
                        • {c.time}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-text whitespace-pre-wrap break-words leading-relaxed">
                    {c.text}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Link to see all comments */}
          {totalComments > displayComments.length && (
            <div className="pt-1 text-center">
              <Link
                to={`/app/posts/${postId}#comments`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-solid hover:underline"
              >
                <MessageCircle size={13} />
                Xem tất cả {totalComments} bình luận <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty comments */}
      {!isLoading && !isError && displayComments.length === 0 && (
        <p className="text-center text-xs text-text-subtle py-1">
          Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!
        </p>
      )}
    </div>
  )
}
