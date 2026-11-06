import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, MessageCircle, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Skeleton, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
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
  const { t } = useTranslation()
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
      promptLogin(t('auth.loginToComment'))
      return
    }

    createComment.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setContent('')
          toast.success(t('feed.commentSent'))
          onCommentAdded?.()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || t('common.error')
          toast.error(msg)
        },
      }
    )
  }

  const hasText = content.trim().length > 0

  return (
    <div className="border-t border-border bg-surface-2/50 px-5 py-4 space-y-3.5 dark:bg-[#1c1d1f]/80">
      {/* Quick Comment Input */}
      {canInteract && viewer ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={32} verified={viewer.verified} className="shrink-0" />
          <div className="relative flex-1">
            <input
              aria-label={t('feed.writePublicComment')}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              placeholder={t('feed.writePublicComment')}
              className="w-full rounded-full border border-border bg-surface py-2 pl-4 pr-10 text-[13px] text-text shadow-2xs transition placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle"
            />
            <button
              type="submit"
              disabled={!hasText || createComment.isPending}
              aria-label={t('feed.sendComment')}
              className={cn(
                'absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-all',
                hasText
                  ? 'bg-primary-solid text-on-primary shadow-2xs hover:bg-primary-hover'
                  : 'text-text-subtle opacity-45 disabled:cursor-not-allowed'
              )}
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
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-2xs">
          <p className="text-xs text-text-subtle">{t('auth.loginToComment')}</p>
          <button
            type="button"
            onClick={() => promptLogin(t('auth.loginToComment'))}
            className="flex cursor-pointer items-center gap-1 text-xs font-bold text-primary-solid hover:underline"
          >
            {t('common.login')} <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2.5 py-1">
          <div className="flex gap-3 items-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-12 flex-1 rounded-2xl" />
          </div>
          <div className="flex gap-3 items-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-12 flex-1 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <p className="text-xs text-text-subtle py-1 text-center dark:text-text-subtle">{t('feed.commentError')}</p>
      )}

      {/* Comment List (Top 3) */}
      {!isLoading && displayComments.length > 0 && (
        <div className="space-y-3 pt-0.5">
          {displayComments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Link
                to={c.authorId ? `/app/profile?userId=${c.authorId}` : '/app/profile'}
                className="mt-0.5 flex shrink-0 rounded-full transition-opacity hover:opacity-85"
              >
                <Avatar src={c.avatar} name={c.author} size={32} verified={c.verified} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-2xs dark:border-border dark:bg-surface-2/80">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Link
                      to={c.authorId ? `/app/profile?userId=${c.authorId}` : '/app/profile'}
                      className="truncate text-[13px] font-bold leading-5 text-text transition-colors hover:text-primary-solid hover:underline"
                    >
                      {c.author}
                    </Link>
                    {c.role && (
                      <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-solid">
                        {c.role}
                      </span>
                    )}
                    <span className="shrink-0 text-xs font-medium text-text-subtle">
                      · {c.time}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-text whitespace-pre-wrap break-words leading-relaxed">
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
                {t('feed.viewAllComments', { count: totalComments })} <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty comments */}
      {!isLoading && !isError && displayComments.length === 0 && (
        <p className="text-center text-xs text-text-subtle py-1">
          {t('feed.noComments')}
        </p>
      )}
    </div>
  )
}
