/**
 * AskQuestionModal — Modal đặt câu hỏi mới trên diễn đàn Q&A (UC40 - Ask a question).
 *
 * Trách nhiệm:
 *  - Form tiêu đề + nội dung + chủ đề (tùy chọn), validate bằng Zod (khớp Backend).
 *  - Gọi API tạo câu hỏi qua `useCreateQuestion`; hiển thị lỗi nghiệp vụ từ backend.
 *  - Thành công: đóng modal + điều hướng sang trang chi tiết câu hỏi vừa tạo.
 *  - Chỉ Student/Alumni mới mở được modal này (nút "Đặt câu hỏi" đã ẩn với Guest/Admin).
 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Loader2, AlertTriangle, LayoutGrid, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { createQuestionSchema } from '../model/question'
import type { CreateQuestionInput } from '../model/question'
import { useCreateQuestion, useTopics } from '../hooks/useQuestions'
import { EntitySelectField } from './EntitySelectField'
import { TopicIcon } from '../lib/topicIcons'

/** Class dùng chung cho các ô nhập liệu trong form. */
const FIELD_CLASS =
  'w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

export function AskQuestionModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { data: topics } = useTopics()
  const { data: majors } = useMajors()
  const { mutate, isPending, error } = useCreateQuestion()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: { title: '', body: '', topicId: null, majorId: null },
  })

  const topicId = watch('topicId')
  const majorId = watch('majorId')

  const onSubmit = (values: CreateQuestionInput) => {
    mutate(values, {
      onSuccess: (created) => {
        onClose()
        navigate(`/app/forum/${created.id}`)
      },
    })
  }

  // Khóa cuộn nền + đóng bằng phím Esc khi modal đang mở.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Portal ra thẳng <body> để thoát khỏi ancestor có transform/filter (motion.div bọc <Outlet/>
  // trong AppShell) — nếu không, `fixed inset-0` sẽ neo theo phần tử đó thay vì viewport.
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl card-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-plum-900">Đặt câu hỏi</h2>
          <button onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
            <X size={18} />
          </button>
        </div>

        {/* Lỗi nghiệp vụ từ backend (VD 403 sai vai trò) */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">Tiêu đề</label>
            <input {...register('title')} placeholder="Câu hỏi của bạn là gì?" className={`h-11 ${FIELD_CLASS}`} />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}
          </div>

          {/* Thể loại + Ngành (đều tùy chọn) — 2 field tách biệt, mỗi câu hỏi gắn tối đa 1 mỗi loại */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-plum-900">Thể loại (tùy chọn)</label>
              <EntitySelectField
                items={topics}
                value={topicId ?? null}
                onChange={(id) => setValue('topicId', id, { shouldDirty: true })}
                placeholder="— Chưa chọn thể loại —"
                buttonIcon={<LayoutGrid size={16} className="shrink-0 text-plum-400" />}
                itemIcon={(name) => <TopicIcon name={name} size={16} className="shrink-0 text-brand-600" />}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-plum-900">Ngành (tùy chọn)</label>
              <EntitySelectField
                items={majors}
                value={majorId ?? null}
                onChange={(id) => setValue('majorId', id, { shouldDirty: true })}
                placeholder="— Chưa chọn ngành —"
                searchPlaceholder="Tìm ngành…"
                searchable
                buttonIcon={<GraduationCap size={16} className="shrink-0 text-plum-400" />}
                itemIcon={() => <GraduationCap size={16} className="shrink-0 text-brand-600" />}
              />
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">Nội dung</label>
            <textarea {...register('body')} rows={6} placeholder="Mô tả chi tiết câu hỏi của bạn…" className={`py-3 ${FIELD_CLASS}`} />
            {errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body.message}</p>}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isPending} leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}>
              {isPending ? 'Đang đăng…' : 'Đăng câu hỏi'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
