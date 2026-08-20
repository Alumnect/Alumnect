/**
 * AnswersSection — Khu vực câu trả lời dưới một câu hỏi.
 *
 * Trách nhiệm:
 *  - Hiển thị danh sách câu trả lời GỐC (infinite scroll), mỗi câu kèm các reply lồng bên dưới.
 *  - Cho Student/Alumni: gửi câu trả lời mới (UC41), reply một câu trả lời, và SỬA câu trả lời của mình (UC48).
 *  - Xử lý đầy đủ trạng thái: loading / rỗng / lỗi / thành công; RBAC + quyền sở hữu.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare, Loader2, AlertTriangle, Inbox, Send, Pencil } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useAnswers, useCreateAnswer, useUpdateAnswer } from '../hooks/useAnswers'
import { createAnswerSchema } from '../model/answer'
import type { Answer, CreateAnswerInput } from '../model/answer'

/** Giới hạn ký tự nội dung câu trả lời (khớp Backend @Size max=10000). */
const MAX_BODY = 10000

/**
 * Form gọn dùng cho SỬA câu trả lời (UC48) và REPLY một câu trả lời gốc.
 * Cùng validate Zod với form tạo mới; tự chọn mutation theo `mode`.
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
  const user = useAuthStore((s) => s.user)
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
  const isPending = mode === 'edit' ? update.isPending : create.isPending
  const error = mode === 'edit' ? update.error : create.error
  const bodyLength = watch('body')?.length ?? 0

  const onSubmit = (values: CreateAnswerInput) => {
    if (mode === 'edit') update.mutate({ answerId: answerId as string, input: values }, { onSuccess: onDone })
    else create.mutate({ input: values, parentId }, { onSuccess: onDone })
  }

  const formInner = (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 flex-1">
      {mode === 'reply' && replyingToName && (
        <p className="mb-1 pl-1 text-xs text-plum-400">
          Đang trả lời <span className="font-semibold text-plum-600">{replyingToName}</span>
        </p>
      )}
      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600">
          <AlertTriangle size={14} className="shrink-0" /> {(error as Error).message}
        </div>
      )}
      <textarea
        {...register('body')}
        autoFocus
        rows={mode === 'edit' ? 3 : 2}
        maxLength={MAX_BODY}
        placeholder={mode === 'edit' ? 'Chỉnh sửa câu trả lời…' : 'Viết phản hồi của bạn…'}
        className="w-full resize-y rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] px-3.5 py-2.5 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      {errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body.message}</p>}
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onDone} disabled={isPending}>
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isPending || bodyLength === 0}
          leftIcon={isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
        >
          {mode === 'edit' ? (isPending ? 'Đang lưu…' : 'Lưu') : isPending ? 'Đang gửi…' : 'Gửi'}
        </Button>
      </div>
    </form>
  )

  // Chế độ SỬA: form thay thế bong bóng tại chỗ (không thêm avatar).
  // Chế độ REPLY: kèm avatar người trả lời bên trái như ô bình luận Facebook.
  if (mode === 'edit') return <div className="mt-2">{formInner}</div>
  return (
    <div className="mt-2 flex gap-2.5">
      <Avatar src={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={30} verified={user?.verified} />
      {formInner}
    </div>
  )
}

/**
 * Một câu trả lời dạng "comment bubble" (giống Facebook): avatar ngoài, nội dung trong bong bóng.
 * Kèm nút "Trả lời" (chỉ với câu trả lời gốc) + "Chỉnh sửa" (chỉ tác giả), và các reply lồng bên dưới.
 */
function AnswerBubble({ a, questionId, isReply = false }: { a: Answer; questionId: string; isReply?: boolean }) {
  const user = useAuthStore((s) => s.user)
  const canEdit = !!user && !!a.authorId && String(user.id) === a.authorId
  const canReply = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')
  const [editing, setEditing] = useState(false)
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const profileLink = a.authorId ? `/app/profile?userId=${a.authorId}` : '/app/profile'
  const replyCount = a.replies.length

  return (
    <div className="flex gap-2.5">
      <Link to={profileLink} className="shrink-0">
        <Avatar src={a.avatar} name={a.author} size={isReply ? 30 : 38} verified={a.verified} />
      </Link>
      <div className="min-w-0 flex-1">
        {editing ? (
          <InlineAnswerForm questionId={questionId} mode="edit" answerId={a.id} initialBody={a.body} onDone={() => setEditing(false)} />
        ) : (
          <>
            {/* Bong bóng nội dung (gọn kiểu bình luận FB): tên + headline + nội dung */}
            <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-plum-900/[0.05] px-3.5 py-2">
              <Link to={profileLink} className="hover:underline">
                <span className="text-[13px] font-bold text-plum-900 hover:text-brand-600">{a.author}</span>
              </Link>
              {a.authorHeadline ? <p className="truncate text-[11px] text-plum-400">{a.authorHeadline}</p> : null}
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-plum-800">{a.body}</p>
            </div>

            {/* Hàng hành động kiểu FB: Trả lời · Chỉnh sửa · thời gian · Đã chỉnh sửa */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-2 text-xs">
              {canReply && !isReply && (
                <button type="button" onClick={() => setReplying((v) => !v)} className="font-semibold text-plum-500 transition-colors hover:text-brand-600">
                  Trả lời
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => setEditing(true)} className="font-semibold text-plum-500 transition-colors hover:text-brand-600">
                  Chỉnh sửa
                </button>
              )}
              <span className="text-plum-400">{a.time}</span>
            </div>
          </>
        )}

        {/* Form reply cho câu trả lời gốc này (mở reply thì tự bung danh sách reply) */}
        {replying && (
          <InlineAnswerForm
            questionId={questionId}
            mode="reply"
            parentId={a.id}
            replyingToName={a.author}
            onDone={() => {
              setReplying(false)
              setShowReplies(true)
            }}
          />
        )}

        {/* Reply lồng (2 cấp) — thu gọn mặc định, kiểu "Xem N phản hồi" của FB/TikTok */}
        {replyCount > 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <button
                type="button"
                onClick={() => setShowReplies(true)}
                className="ml-1 flex items-center gap-2 text-xs font-semibold text-plum-500 transition-colors hover:text-brand-600"
              >
                <span className="h-3.5 w-4 shrink-0 rounded-bl-lg border-b-2 border-l-2 border-plum-900/15" />
                Xem {replyCount} phản hồi
              </button>
            ) : (
              <div className="space-y-3 border-l-2 border-plum-900/[0.06] pl-3.5">
                {a.replies.map((r) => (
                  <AnswerBubble key={r.id} a={{ ...r, replies: [] }} questionId={questionId} isReply />
                ))}
                <button type="button" onClick={() => setShowReplies(false)} className="text-xs font-semibold text-plum-400 transition-colors hover:text-plum-700">
                  Ẩn phản hồi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Form gửi câu trả lời GỐC mới — chỉ dành cho Student/Alumni (ô thu gọn kiểu bình luận FB/IG). */
function AnswerForm({ questionId }: { questionId: string }) {
  const user = useAuthStore((s) => s.user)
  const [expanded, setExpanded] = useState(false)
  const { mutate, isPending, error } = useCreateAnswer(questionId)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateAnswerInput>({
    resolver: zodResolver(createAnswerSchema),
    defaultValues: { body: '' },
  })
  const bodyLength = watch('body')?.length ?? 0

  /** Thu gọn form về ô "Viết câu trả lời…" và xóa nội dung/lỗi đang nhập. */
  const collapse = () => {
    reset()
    setExpanded(false)
  }

  const onSubmit = (values: CreateAnswerInput) => {
    mutate({ input: values }, { onSuccess: () => collapse() })
  }

  // Trạng thái THU GỌN: một ô bấm để mở form (avatar + placeholder dạng pill).
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl card-surface p-3.5 text-left transition-colors hover:bg-plum-900/[0.02]"
      >
        <Avatar src={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={36} verified={user?.verified} />
        <span className="flex-1 rounded-full bg-plum-900/[0.05] px-4 py-2.5 text-sm text-plum-400">Viết câu trả lời của bạn…</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600">
          <Pencil size={16} />
        </span>
      </button>
    )
  }

  // Trạng thái MỞ RỘNG: form nhập đầy đủ với nút Hủy / Gửi.
  return (
    <Card hover={false} className="mb-5 p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar src={user?.avatarUrl} name={user?.name ?? 'Bạn'} size={34} verified={user?.verified} />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-plum-900">Câu trả lời của bạn</h3>
          <p className="text-xs text-plum-400">Chia sẻ kiến thức hoặc kinh nghiệm của bạn</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          {...register('body')}
          autoFocus
          rows={4}
          maxLength={MAX_BODY}
          placeholder="Chia sẻ câu trả lời của bạn…"
          className="w-full resize-y rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 py-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body.message}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-plum-400">
            {bodyLength.toLocaleString('vi-VN')}/{MAX_BODY.toLocaleString('vi-VN')}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" onClick={collapse} disabled={isPending}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending || bodyLength === 0}
              leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            >
              {isPending ? 'Đang gửi…' : 'Gửi câu trả lời'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

/**
 * Khu vực câu trả lời của một câu hỏi.
 * @param questionId ID câu hỏi
 * @param count Số câu trả lời (lấy từ chi tiết câu hỏi) để hiển thị huy hiệu đếm
 */
export function AnswersSection({ questionId, count }: { questionId: string; count: number }) {
  const user = useAuthStore((s) => s.user)
  const canAnswer = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAnswers(questionId)
  const answers = data?.pages.flatMap((p) => p.items) ?? []
  // Số câu trả lời GỐC thực tế từ API (khớp danh sách bên dưới); khi chưa tải xong thì tạm dùng `count`.
  const total = data?.pages[0]?.total ?? count

  return (
    <section id="answers" className="scroll-mt-24">
      {/* Tiêu đề khu vực + huy hiệu số câu trả lời */}
      <div className="mb-4 flex items-center gap-2.5">
        <MessageSquare size={18} className="text-brand-600" />
        <h2 className="text-lg font-extrabold text-plum-900">Câu trả lời</h2>
        <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-500/10 px-2 text-xs font-bold text-brand-700">{total}</span>
      </div>

      {/* Form gửi câu trả lời (chỉ Student/Alumni); khách được mời đăng nhập */}
      {canAnswer ? (
        <AnswerForm questionId={questionId} />
      ) : !user ? (
        <Card hover={false} className="mb-5 p-4 text-center text-sm text-plum-500">
          Đăng nhập bằng tài khoản Sinh viên/Cựu sinh viên để trả lời câu hỏi này.
        </Card>
      ) : null}

      {/* Danh sách câu trả lời theo trạng thái */}
      {isLoading ? (
        <Card hover={false} className="p-5">
          <div className="space-y-2.5">
            <div className="h-4 w-40 animate-pulse rounded bg-plum-900/[0.06]" />
            <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.05]" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-plum-900/[0.05]" />
          </div>
        </Card>
      ) : isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={22} />
          </span>
          <p className="text-sm text-plum-500">{(error as Error)?.message ?? 'Không tải được câu trả lời.'}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : answers.length === 0 ? (
        <Card hover={false} className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
            <Inbox size={22} />
          </span>
          <p className="text-sm text-plum-500">Chưa có câu trả lời nào. Hãy là người đầu tiên trả lời!</p>
        </Card>
      ) : (
        <>
          <div className="space-y-5">
            {answers.map((a) => (
              <AnswerBubble key={a.id} a={a} questionId={questionId} />
            ))}
          </div>
          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm câu trả lời'}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
