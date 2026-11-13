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
 * Làm sạch nội dung câu trả lời, ưu tiên bóc tách đúng tên người được @mention trong luồng,
 * nếu không có tiền tố @tên rõ ràng thì dùng parentAuthor mặc định.
 */
function cleanAnswerBody(
  body: string,
  parentAuthor?: string,
  knownAuthors?: string[]
): { mention?: string; cleanText: string } {
  if (!body) return { cleanText: '' }
  let text = body.trim()
  let mention: string | undefined

  const candidates = Array.from(
    new Set([...(knownAuthors ?? []), ...(parentAuthor ? [parentAuthor] : [])].filter(Boolean))
  ).sort((a, b) => b.length - a.length)

  for (const name of candidates) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const prefixRegex = new RegExp(`^(@${escaped}(?:\\s+|$))+`, 'i')
    if (prefixRegex.test(text)) {
      mention = name
      text = text.replace(prefixRegex, '').trim()
      break
    }
  }

  if (!mention) {
    const match = text.match(/^@([^\s\n]+(?:\s+[^\s\n]+)?)\s+([\s\S]*)$/)
    if (match) {
      mention = match[1]
      text = match[2].trim()
    } else if (parentAuthor) {
      mention = parentAuthor
    }
  }

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
    if (mode === 'edit') {
      update.mutate({ answerId: answerId as string, input: values }, { onSuccess: onDone })
    } else {
      const trimmed = values.body.trim()
      const finalBody =
        replyingToName && !trimmed.toLowerCase().startsWith(`@${replyingToName.toLowerCase()}`)
          ? `@${replyingToName} ${trimmed}`
          : trimmed
      create.mutate({ input: { ...values, body: finalBody }, parentId }, { onSuccess: onDone })
    }
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
  knownAuthors,
  isReply = false,
}: {
  a: Answer
  questionId: string
  parentAuthor?: string
  knownAuthors?: string[]
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
  const threadAuthors = isReply
    ? knownAuthors
    : Array.from(new Set([a.author, ...(a.replies?.map((r) => r.author) ?? [])]))

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

  const hasRootThread = !isReply && (replying || replyCount > 0)

  return (
    <div>
      <div className="group flex items-start gap-3 transition duration-300">
        <div className="flex shrink-0 flex-col items-center self-stretch">
          <Link to={profileLink} className="mt-0.5 flex shrink-0 rounded-full transition-opacity hover:opacity-85">
            <Avatar src={a.avatar} name={a.author} size={isReply ? 30 : 36} verified={a.verified} />
          </Link>
          {hasRootThread && (
            <div className="mt-1.5 w-0.5 flex-1 rounded-full bg-border-strong/80 dark:bg-border-strong" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-2xs transition-colors dark:border-border dark:bg-surface-2/80">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link to={profileLink} className="text-[13.5px] font-bold leading-5 text-text transition-colors hover:text-primary-solid hover:underline">
                {a.author}
              </Link>
              {a.authorHeadline && (
                <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-solid">
                  {a.authorHeadline}
                </span>
              )}
              {(a.createdAt || a.time) && (
                <span className="shrink-0 text-xs font-medium text-text-subtle" title={absoluteTime(a.createdAt, i18n.language)}>
                  · {relativeTime(a.createdAt, t, i18n.language) || a.time}
                </span>
              )}
              {a.edited && (
                <span className="text-xs text-text-subtle">· {t('forum.editedBadge')}</span>
              )}
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
                const { mention, cleanText } = cleanAnswerBody(a.body, parentAuthor, threadAuthors)
                return (
                  <div className="mt-1 text-[13.5px] sm:text-sm leading-relaxed text-text">
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
          </div>

          {/* Action Row: vote button, reply, edit, delete */}
          {!editing && (
            <div className="mt-1.5 flex items-center gap-3 pl-1 text-xs">
              <button
                type="button"
                onClick={handleVote}
                aria-pressed={voted}
                aria-label={voted ? t('forum.unvoteAnswerAria') : t('forum.voteAnswerAria')}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold transition',
                  voted
                    ? 'border-primary-soft-border bg-primary-soft text-primary-solid'
                    : 'border-border bg-surface text-text-subtle hover:border-border-strong hover:text-primary-solid dark:bg-surface-2/80'
                )}
              >
                <ChevronUp size={13} strokeWidth={2.5} />
                <span>{votes}</span>
              </button>

              {canReply && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="cursor-pointer font-semibold text-text-muted transition-colors hover:text-primary-solid"
                >
                  {t('forum.reply')}
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label={t('forum.editAnswerAria')}
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-text-subtle transition-colors hover:text-primary-solid"
                >
                  <Pencil size={11} />
                  <span>{t('common.edit')}</span>
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  aria-label={t('forum.deleteAnswerAria')}
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-text-subtle transition-colors hover:text-danger"
                >
                  <Trash2 size={11} />
                  <span>{t('common.delete')}</span>
                </button>
              )}
            </div>
          )}

          {/* Form reply khi bấm Trả lời trực tiếp trên một reply con */}
          {isReply && replying && (
            <div className="mt-2.5 rounded-2xl border border-border bg-surface p-3.5 shadow-2xs dark:border-border dark:bg-surface-2/80">
              <div className="mb-1 flex items-center justify-between text-xs text-text-subtle">
                <span className="font-medium text-text-muted">
                  <strong className="text-primary-solid">{t('forum.replyingTo', { name: a.author })}</strong>
                </span>
                <button aria-label={t('common.close')} type="button" onClick={() => setReplying(false)} className="cursor-pointer rounded-md p-0.5 hover:bg-surface-2 hover:text-text">
                  <X size={14} />
                </button>
              </div>
              <InlineAnswerForm
                questionId={questionId}
                mode="reply"
                parentId={replyParentId}
                replyingToName={a.author}
                initialBody=""
                onDone={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nhánh cây phản hồi (2 cấp) dưới câu trả lời gốc */}
      {hasRootThread && (
        <div className="ml-[17px]">
          {replyCount > 0 && !showReplies && (
            <div className="relative pl-6 pt-2.5">
              {replying && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-border-strong/80 dark:bg-border-strong"
                />
              )}
              <span
                aria-hidden
                className="absolute left-0 top-0 h-[20px] w-4 rounded-bl-xl border-b-2 border-l-2 border-border-strong/80 dark:border-border-strong"
              />
              <button
                type="button"
                onClick={() => setShowReplies(true)}
                className="cursor-pointer text-xs font-semibold text-primary-solid hover:underline"
              >
                {t('forum.viewReplies', { count: replyCount })}
              </button>
            </div>
          )}

          {replyCount > 0 && showReplies && (
            <>
              {a.replies.map((r, idx) => {
                const isLastReplyNode = idx === a.replies.length - 1 && !replying
                return (
                  <div key={r.id} className="relative pl-6 pt-2.5">
                    {!isLastReplyNode && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-border-strong/80 dark:bg-border-strong"
                      />
                    )}
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-[27px] w-4 rounded-bl-xl border-b-2 border-l-2 border-border-strong/80 dark:border-border-strong"
                    />
                    <AnswerBubble
                      a={{ ...r, replies: [] }}
                      questionId={questionId}
                      parentAuthor={a.author}
                      knownAuthors={threadAuthors}
                      isReply
                    />
                  </div>
                )
              })}
              {replyCount > 1 && (
                <div className="pl-6 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowReplies(false)}
                    className="cursor-pointer text-xs font-semibold text-text-subtle hover:text-text-muted"
                  >
                    {t('forum.hideReplies')}
                  </button>
                </div>
              )}
            </>
          )}

          {replying && (
            <div className="relative pl-6 pt-2.5">
              <span
                aria-hidden
                className="absolute left-0 top-0 h-[24px] w-4 rounded-bl-xl border-b-2 border-l-2 border-border-strong/80 dark:border-border-strong"
              />
              <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-2xs dark:border-border dark:bg-surface-2/80">
                <div className="mb-1 flex items-center justify-between text-xs text-text-subtle">
                  <span className="font-medium text-text-muted">
                    <strong className="text-primary-solid">{t('forum.replyingTo', { name: a.author })}</strong>
                  </span>
                  <button aria-label={t('common.close')} type="button" onClick={() => setReplying(false)} className="cursor-pointer rounded-md p-0.5 hover:bg-surface-2 hover:text-text">
                    <X size={14} />
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
                    setShowReplies(true)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

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

  const hasText = body.trim().length > 0

  return (
    <div className="mb-5">
      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger">
          <AlertTriangle size={14} className="shrink-0" /> {(error as Error).message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Avatar src={user?.avatarUrl} name={user?.name ?? t('forum.you')} size={36} verified={user?.verified} className="shrink-0" />
        <div className="relative flex-1">
          <input
            aria-label={t('forum.shareAnswerPlaceholder')}
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_BODY}
            placeholder={t('forum.shareAnswerPlaceholder')}
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-4 pr-11 text-sm text-text shadow-2xs transition placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle"
          />
          <button
            type="submit"
            disabled={!hasText || isPending}
            aria-label={t('messages.send')}
            className={cn(
              'absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-all',
              hasText
                ? 'bg-primary-solid text-on-primary shadow-2xs hover:bg-primary-hover'
                : 'text-text-subtle opacity-45 disabled:cursor-not-allowed'
            )}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
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
          <div className="space-y-4">
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

