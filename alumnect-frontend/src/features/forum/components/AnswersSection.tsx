/**
 * AnswersSection — Khu vực câu trả lời dưới một câu hỏi (Forum).
 * Áp dụng phong cách bình luận hội nhóm (bong bóng bo tròn, thanh pill thanh lịch, nhánh cây cho câu trả lời con).
 *
 * Trách nhiệm:
 *  - Hiển thị danh sách câu trả lời GỐC (infinite scroll), mỗi câu kèm các reply lồng bên dưới.
 *  - Cho Student/Alumni: gửi câu trả lời mới (UC41), reply một câu trả lời, và SỬA câu trả lời của mình (UC48).
 *  - Xử lý đầy đủ trạng thái: loading / rỗng / lỗi / thành công; RBAC + quyền sở hữu.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare, Loader2, AlertTriangle, Inbox, Send, Pencil, Trash2, X, ChevronUp, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useAnswers, useCreateAnswer, useUpdateAnswer, useToggleVoteAnswer } from '../hooks/useAnswers'
import { createAnswerSchema } from '../model/answer'
import type { Answer, CreateAnswerInput } from '../model/answer'
import { DeleteAnswerModal } from './DeleteAnswerModal'

/** Giới hạn ký tự nội dung câu trả lời (khớp Backend @Size max=10000). */
const MAX_BODY = 10000

/**
 * Thời gian tương đối tính từ mốc tạo THẬT (ISO-8601).
 */
function relativeTime(iso: string, t: (key: string, opt?: any) => string, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return t('forum.justNow')
  const min = Math.floor(sec / 60)
  if (min < 60) return t('forum.minutesShort', { count: min })
  const hour = Math.floor(min / 60)
  if (hour < 24) return t('forum.hoursShort', { count: hour })
  const day = Math.floor(hour / 24)
  if (day < 7) return t('forum.daysShort', { count: day })
  if (day < 30) return t('forum.weeksShort', { count: Math.floor(day / 7) })
  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Ngày giờ tuyệt đối (tooltip khi hover) từ mốc tạo THẬT. */
function absoluteTime(iso: string, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Làm sạch nội dung câu trả lời, loại bỏ các chuỗi @tên lặp lại ở đầu nếu đã hiển thị qua tag parentAuthor.
 */
function cleanAnswerBody(body: string, parentAuthor?: string): { mention?: string; cleanText: string } {
  if (!body) return { cleanText: '' }
  let text = body.trim()
  let mention = parentAuthor

  // Nếu body bắt đầu bằng @Tên, bóc tách ra nếu chưa có parentAuthor
  const match = text.match(/^@([^\s\n]+(?:\s+[^\s\n]+)?)\s*([\s\S]*)$/)
  if (match) {
    if (!mention) {
      mention = match[1]
    }
  }

  // Nếu có mention (hoặc parentAuthor), loại bỏ toàn bộ các tiền tố @mention lặp lại ở đầu text
  if (mention) {
    const escaped = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`^(@${escaped}\\s*)+`, 'i'), '').trim()
  }

  return { mention, cleanText: text || body }
}

/**
 * Form gọn dùng cho SỬA câu trả lời (UC48) và REPLY một câu trả lời gốc.
 */
function InlineAnswerForm({
  questionId,
  mode,
  answerId,
  parentId,
  initialBody = '',
  replyingToName,
  onDone,
}: {
  questionId: string
  mode: 'edit' | 'reply'
  answerId?: string
  parentId?: string
  initialBody?: string
  replyingToName?: string
  onDone: () => void
}) {
  const create = useCreateAnswer(questionId)
  const update = useUpdateAnswer(questionId)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAnswerInput>({
    resolver: zodResolver(createAnswerSchema),
    defaultValues: { body: initialBody },
  })
  const { t } = useTranslation()
  const isPending = mode === 'edit' ? update.isPending : create.isPending
  const error = mode === 'edit' ? update.error : create.error
  const bodyLength = watch('body')?.length ?? 0

  const onSubmit = (values: CreateAnswerInput) => {
    if (mode === 'edit') update.mutate({ answerId: answerId as string, input: values }, { onSuccess: onDone })
    else create.mutate({ input: values, parentId }, { onSuccess: onDone })
  }

  const placeholder =
    mode === 'edit'
      ? t('forum.editAnswerPlaceholder')
      : replyingToName
      ? t('forum.replyToPlaceholder', { name: replyingToName })
      : t('forum.writeReplyPlaceholder')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger">
          <AlertTriangle size={14} className="shrink-0" /> {(error as Error).message}
        </div>
      )}
      <textarea
        {...register('body')}
        autoFocus
        rows={mode === 'edit' ? 3 : 2}
        maxLength={MAX_BODY}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {errors.body && <p className="text-xs text-danger">{errors.body.message}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-text-subtle hover:bg-surface-2 transition-colors cursor-pointer"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending || bodyLength === 0}
          className="rounded-xl bg-primary-solid px-3.5 py-1.5 text-xs font-semibold text-on-primary shadow-2xs hover:bg-primary-hover disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-1.5"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : mode === 'edit' ? null : (
            <Send size={13} />
          )}
          <span>{mode === 'edit' ? (isPending ? t('forum.saving') : t('forum.saveChanges')) : isPending ? t('forum.sendingAnswer') : t('forum.sendAnswer')}</span>
        </button>
      </div>
    </form>
  )
}

/**
 * Một câu trả lời dạng "comment bubble" bo tròn phong cách hội nhóm.
 * Kèm nút "Trả lời", "Chỉnh sửa", "Xóa", chip upvote, và các phản hồi lồng bên dưới.
 */
function AnswerBubble({
  a,
  questionId,
  parentAuthor,
  isReply = false,
}: {
  a: Answer
  questionId: string
  parentAuthor?: string
  isReply?: boolean
}) {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const canEdit = !!user && !!a.authorId && String(user.id) === a.authorId
  const canReply = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')
  const canVote = canReply
  const [editing, setEditing] = useState(false)
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const profileLink = a.authorId ? `/app/profile?userId=${a.authorId}` : '/app/profile'
  const replyCount = a.replies?.length ?? 0
  const replyParentId = isReply ? (a.parentId ?? undefined) : a.id

  const [voted, setVoted] = useState(a.voted)
  const [votes, setVotes] = useState(a.votes)
  useEffect(() => {
    setVoted(a.voted)
    setVotes(a.votes)
  }, [a.voted, a.votes])

  const promptLogin = useLoginPrompt((s) => s.open)
  const toggleVote = useToggleVoteAnswer(questionId)

  const handleVote = () => {
    if (!canVote) {
      promptLogin(t('forum.promptLoginVote'))
      return
    }
    const next = !voted
    setVoted(next)
    setVotes((v) => v + (next ? 1 : -1))
    toggleVote.mutate(
      { answerId: a.id, vote: next },
      {
        onSuccess: (data) => {
          setVoted(data.voted)
          setVotes(data.voteCount)
        },
        onError: () => {
          setVoted(!next)
          setVotes((v) => v + (next ? -1 : 1))
        },
      },
    )
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 transition duration-300',
        isReply &&
          'relative ml-8 border-l-2 border-primary-soft-border pl-4 before:absolute before:-left-0.5 before:top-0 before:h-4 before:w-4 before:-translate-x-full before:rounded-bl-xl before:border-b-2 before:border-l-2 before:border-brand-500/20'
      )}
    >
      <Link to={profileLink} className="shrink-0 hover:opacity-85 transition-opacity">
        <Avatar src={a.avatar} name={a.author} size={isReply ? 28 : 32} verified={a.verified} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={profileLink} className="text-xs font-bold text-text hover:underline transition-colors">
                {a.author}
              </Link>
              {a.authorHeadline && (
                <span className="text-xs font-medium text-primary-solid bg-primary-soft px-1.5 py-0.5 rounded-md">
                  {a.authorHeadline}
                </span>
              )}
              {(a.createdAt || a.time) && (
                <span className="shrink-0 text-xs text-text-subtle dark:text-text-subtle" title={absoluteTime(a.createdAt, i18n.language)}>
                  • {relativeTime(a.createdAt, t, i18n.language) || a.time}
                </span>
              )}
              {a.edited && (
                <span className="text-xs text-text-subtle dark:text-text-subtle">• {t('forum.editedBadge')}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-text-subtle transition-colors hover:bg-surface-2 hover:text-primary-solid"
                  aria-label={t('forum.editAnswerAria')}
                >
                  <Pencil size={13} />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                  aria-label={t('forum.deleteAnswerAria')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <InlineAnswerForm
              questionId={questionId}
              mode="edit"
              answerId={a.id}
              initialBody={a.body}
              onDone={() => setEditing(false)}
            />
          ) : (
            (() => {
              const { mention, cleanText } = cleanAnswerBody(a.body, parentAuthor)
              return (
                <div className="mt-1 text-xs text-text leading-relaxed">
                  {mention && (
                    <span className="mr-1.5 font-semibold text-primary-solid">
                      @{mention}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-words">
                    {cleanText}
                  </span>
                </div>
              )
            })()
          )}

          {/* Action Row: vote button & reply button */}
          {!editing && (
            <div className="mt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleVote}
                aria-pressed={voted}
                aria-label={voted ? t('forum.unvoteAnswerAria') : t('forum.voteAnswerAria')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition cursor-pointer',
                  voted
                    ? 'bg-primary-soft text-primary-solid'
                    : 'bg-surface-2 text-text-subtle hover:bg-surface-3 hover:text-primary-solid'
                )}
              >
                <ChevronUp size={13} strokeWidth={2.5} />
                <span>{votes}</span>
              </button>

              {canReply && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="text-xs font-semibold text-primary-solid hover:underline cursor-pointer"
                >
                  {t('forum.reply')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Form reply lồng */}
        {replying && (
          <div className="relative ml-8 border-l-2 border-primary-soft-border pl-4 before:absolute before:-left-0.5 before:top-0 before:h-4 before:w-4 before:-translate-x-full before:rounded-bl-xl before:border-b-2 before:border-l-2 before:border-brand-500/20 pt-1">
            <div className="rounded-2xl bg-surface-2 p-3">
              <div className="flex items-center justify-between text-xs text-text-subtle mb-1">
                <span>
                  {t('forum.replyingTo')} <strong className="text-primary-solid">@{a.author}</strong>
                </span>
                <button aria-label={t('common.close')} type="button" onClick={() => setReplying(false)} className="hover:text-text cursor-pointer">
                  <X size={13} />
                </button>
              </div>
              <InlineAnswerForm
                questionId={questionId}
                mode="reply"
                parentId={replyParentId}
                replyingToName={a.author}
                initialBody=""
                onDone={() => {
                  setReplying(false)
                  if (!isReply) setShowReplies(true)
                }}
              />
            </div>
          </div>
        )}

        {/* Reply list lồng (2 cấp) */}
        {replyCount > 0 && (
          <div className="mt-2 space-y-2.5">
            {!showReplies ? (
              <button
                type="button"
                onClick={() => setShowReplies(true)}
                className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-primary-solid hover:underline cursor-pointer"
              >
                <span className="h-3 w-3.5 shrink-0 rounded-bl-lg border-b-2 border-l-2 border-primary-soft-border" />
                {t('forum.viewReplies', { count: replyCount })}
              </button>
            ) : (
              <div className="space-y-2.5">
                {a.replies.map((r) => (
                  <AnswerBubble
                    key={r.id}
                    a={{ ...r, replies: [] }}
                    questionId={questionId}
                    parentAuthor={a.author}
                    isReply
                  />
                ))}
                {replyCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowReplies(false)}
                    className="ml-8 text-xs font-semibold text-text-subtle hover:text-text-muted dark:text-text-subtle cursor-pointer"
                  >
                    {t('forum.hideReplies')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {deleting && (
        <DeleteAnswerModal
          questionId={questionId}
          answerId={a.id}
          onClose={() => setDeleting(false)}
          onDeleted={() => setDeleting(false)}
        />
      )}
    </div>
  )
}

/** Form gửi câu trả lời GỐC mới — dạng pill thanh lịch phong cách hội nhóm. */
function AnswerForm({ questionId }: { questionId: string }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { mutate, isPending, error } = useCreateAnswer(questionId)
  const [body, setBody] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || isPending) return
    mutate(
      { input: { body: trimmed } },
      {
        onSuccess: () => {
          setBody('')
        },
      }
    )
  }

  return (
    <div className="mb-4">
      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger">
          <AlertTriangle size={14} className="shrink-0" /> {(error as Error).message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <Avatar src={user?.avatarUrl} name={user?.name ?? t('forum.you')} size={32} verified={user?.verified} className="shrink-0" />
        <div className="relative flex-1">
          <input
            aria-label={t('forum.shareAnswerPlaceholder')}
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_BODY}
            placeholder={t('forum.shareAnswerPlaceholder')}
            className="w-full rounded-2xl border border-border bg-surface py-2 pl-3.5 pr-10 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle transition shadow-2xs"
          />
          <button
            type="submit"
            disabled={!body.trim() || isPending}
            aria-label={t('messages.send')}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center text-primary-solid transition-colors hover:text-primary-solid disabled:opacity-40 cursor-pointer"
          >
            {isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * Khu vực câu trả lời của một câu hỏi (Forum).
 * @param questionId ID câu hỏi
 * @param count Số câu trả lời (lấy từ chi tiết câu hỏi) để hiển thị huy hiệu đếm
 */
export function AnswersSection({ questionId, count }: { questionId: string; count: number }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const promptLogin = useLoginPrompt((s) => s.open)
  const canAnswer = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAnswers(questionId)
  const answers = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? count

  return (
    <section id="answers" className="scroll-mt-24">
      {/* Tiêu đề khu vực + huy hiệu số câu trả lời */}
      <div className="mb-4 flex items-center gap-2.5">
        <MessageSquare size={18} className="text-primary-solid" />
        <h2 className="text-lg font-extrabold text-text">{t('forum.answers')}</h2>
        <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-primary-soft px-2 text-xs font-bold text-primary-solid">{total}</span>
      </div>

      {/* Form gửi câu trả lời (chỉ Student/Alumni); khách được mời đăng nhập */}
      {canAnswer ? (
        <AnswerForm questionId={questionId} />
      ) : !user ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-surface p-3 border border-border shadow-2xs">
          <p className="text-xs text-text-subtle">{t('auth.loginToAnswer')}</p>
          <button
            type="button"
            onClick={() => promptLogin()}
            className="text-xs font-bold text-primary-solid hover:underline flex items-center gap-1 cursor-pointer"
          >
            {t('common.login')} <ArrowRight size={12} />
          </button>
        </div>
      ) : null}

      {/* Danh sách câu trả lời theo trạng thái */}
      {isLoading ? (
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-full bg-border animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-14 w-full rounded-2xl bg-surface-2 animate-pulse" />
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-full bg-border animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-14 w-full rounded-2xl bg-surface-2 animate-pulse" />
            </div>
          </div>
        </div>
      ) : isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle size={22} />
          </span>
          <p className="text-sm text-text-subtle">{(error as Error)?.message ?? t('forum.loadAnswersError')}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </Card>
      ) : answers.length === 0 ? (
        <Card hover={false} className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-text-subtle">
            <Inbox size={22} />
          </span>
          <p className="text-sm text-text-subtle">{t('forum.noAnswersYet')}</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {answers.map((a) => (
              <AnswerBubble key={a.id} a={a} questionId={questionId} />
            ))}
          </div>
          {hasNextPage && (
            <div className="pt-3 text-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <Loader2 size={15} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? t('common.loading') : t('forum.loadMoreAnswers')}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

