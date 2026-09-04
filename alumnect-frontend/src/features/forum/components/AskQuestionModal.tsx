/**
 * AskQuestionModal — Modal đặt câu hỏi mới (UC40) HOẶC chỉnh sửa câu hỏi (UC46) trên diễn đàn Q&A.
 *
 * Trách nhiệm:
 *  - Form tiêu đề + nội dung + thể loại + ngành + ảnh đính kèm, validate bằng Zod (khớp Backend).
 *  - Chế độ TẠO (mặc định): gọi `useCreateQuestion`, thành công thì điều hướng sang trang chi tiết.
 *  - Chế độ SỬA (truyền `editQuestion`): điền sẵn dữ liệu, gọi `useUpdateQuestion`, thành công thì đóng
 *    modal (trang chi tiết tự làm mới qua invalidate cache). Chỉ tác giả mới mở được (nút "Chỉnh sửa" đã ẩn).
 *  - Ảnh: chọn nhiều ảnh, upload qua presigned URL, xem trước và xóa từng ảnh, tối đa MAX_QUESTION_IMAGES.
 */
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Loader2, AlertTriangle, LayoutGrid, GraduationCap, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { createQuestionSchema, MAX_QUESTION_IMAGES } from '../model/question'
import type { CreateQuestionInput, QuestionDetail } from '../model/question'
import { useCreateQuestion, useUpdateQuestion, useTopics } from '../hooks/useQuestions'
import { forumApi } from '../api/forumApi'
import { EntitySelectField } from './EntitySelectField'
import { TopicIcon } from '../lib/topicIcons'

/** Class dùng chung cho các ô nhập liệu trong form. */
const FIELD_CLASS =
  'w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

export function AskQuestionModal({ onClose, editQuestion }: { onClose: () => void; editQuestion?: QuestionDetail }) {
  const isEdit = !!editQuestion
  const navigate = useNavigate()
  const { data: topics } = useTopics()
  const { data: majors } = useMajors()
  const createMut = useCreateQuestion()
  const updateMut = useUpdateQuestion(editQuestion?.id ?? '')
  const { isPending, error } = isEdit ? updateMut : createMut

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      title: editQuestion?.title ?? '',
      body: editQuestion?.body ?? '',
      topicId: editQuestion?.topicId ?? null,
      majorId: editQuestion?.majorId ?? null,
      imageUrls: editQuestion?.images ?? [],
    },
  })

  const topicId = watch('topicId')
  const majorId = watch('majorId')
  const imageUrls = watch('imageUrls') ?? []

  const onSubmit = (values: CreateQuestionInput) => {
    if (isEdit) {
      updateMut.mutate(values, {
        onSuccess: () => {
          toast.success('Đã cập nhật câu hỏi thành công!')
          onClose()
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Không thể cập nhật câu hỏi.')
        }
      })
    } else {
      createMut.mutate(values, {
        onSuccess: (created) => {
          toast.success('Đã đăng câu hỏi thành công!')
          onClose()
          navigate(`/app/forum/${created.id}`)
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Không thể đăng câu hỏi, vui lòng thử lại.')
        }
      })
    }
  }

  /** Chọn & tải nhiều ảnh lên storage, thêm URL vào form (tối đa MAX_QUESTION_IMAGES ảnh). */
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // reset để chọn lại cùng file vẫn kích hoạt onChange
    if (!files.length) return

    setUploadError(null)
    if (files.some((f) => !f.type.startsWith('image/'))) {
      setUploadError('Chỉ được đính kèm tệp ảnh')
      return
    }
    const current = watch('imageUrls') ?? []
    if (current.length + files.length > MAX_QUESTION_IMAGES) {
      setUploadError(`Chỉ được đính kèm tối đa ${MAX_QUESTION_IMAGES} ảnh`)
      return
    }

    setUploadingCount(files.length)
    try {
      const uploaded = await Promise.all(files.map((f) => forumApi.uploadQuestionImage(f)))
      setValue('imageUrls', [...current, ...uploaded], { shouldValidate: true, shouldDirty: true })
    } catch {
      setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingCount(0)
    }
  }

  const removeImage = (idx: number) => {
    setValue('imageUrls', imageUrls.filter((_, i) => i !== idx), { shouldValidate: true, shouldDirty: true })
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

  const canAddMore = imageUrls.length < MAX_QUESTION_IMAGES && uploadingCount === 0

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
          <h2 className="text-xl font-extrabold text-plum-900">{isEdit ? 'Chỉnh sửa câu hỏi' : 'Đặt câu hỏi'}</h2>
          <button onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
            <X size={18} />
          </button>
        </div>

        {/* Lỗi nghiệp vụ từ backend (VD 403 không phải tác giả) */}
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

          {/* Ảnh đính kèm (tùy chọn) */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">
              Ảnh đính kèm (tùy chọn) <span className="font-normal text-plum-400">· {imageUrls.length}/{MAX_QUESTION_IMAGES}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {imageUrls.map((url, idx) => (
                <div key={url + idx} className="group relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-inset ring-plum-900/10">
                  <img src={url} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label="Xóa ảnh"
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-plum-900/60 text-white shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-rose-500"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              {/* Ô upload — hiển thị spinner khi đang tải, ẩn khi đủ số ảnh tối đa */}
              {uploadingCount > 0 && (
                <div className="grid h-20 w-20 place-items-center rounded-xl bg-plum-900/[0.04] ring-1 ring-plum-900/10">
                  <Loader2 size={20} className="animate-spin text-plum-400" />
                </div>
              )}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-20 w-20 place-items-center gap-1 rounded-xl border border-dashed border-plum-900/20 text-plum-400 transition-colors hover:border-brand-400/60 hover:text-brand-600"
                >
                  <ImagePlus size={20} />
                  <span className="text-[10px] font-semibold">Thêm ảnh</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            {(uploadError || errors.imageUrls) && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-600">
                <AlertTriangle size={13} className="shrink-0" /> {uploadError ?? (errors.imageUrls?.message as string)}
              </p>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending || uploadingCount > 0}
              leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
            >
              {isEdit ? (isPending ? 'Đang lưu…' : 'Lưu thay đổi') : isPending ? 'Đang đăng…' : 'Đăng câu hỏi'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
