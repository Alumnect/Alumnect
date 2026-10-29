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
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { X, Loader2, AlertTriangle, LayoutGrid, GraduationCap, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DialogFrame, toast } from '@/components/ui'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { createQuestionSchema, MAX_QUESTION_IMAGES } from '../model/question'
import type { CreateQuestionInput, QuestionDetail } from '../model/question'
import { useCreateQuestion, useUpdateQuestion, useTopics } from '../hooks/useQuestions'
import { forumApi } from '../api/forumApi'
import { EntitySelectField } from './EntitySelectField'
import { TopicIcon } from '../lib/topicIcons'

/** Class dùng chung cho các ô nhập liệu trong form. */
const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-primary/30'

export function AskQuestionModal({ onClose, editQuestion }: { onClose: () => void; editQuestion?: QuestionDetail }) {
  const { t } = useTranslation()
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
          toast.success(t('forum.updateQuestionSuccess'))
          onClose()
        },
        onError: (err: any) => {
          toast.error(err?.message || t('forum.updateQuestionError'))
        }
      })
    } else {
      createMut.mutate(values, {
        onSuccess: (created) => {
          toast.success(t('forum.createQuestionSuccess'))
          onClose()
          navigate(`/app/forum/${created.id}`)
        },
        onError: (err: any) => {
          toast.error(err?.message || t('forum.createQuestionError'))
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
      setUploadError(t('forum.onlyImagesAllowed'))
      return
    }
    const current = watch('imageUrls') ?? []
    if (current.length + files.length > MAX_QUESTION_IMAGES) {
      setUploadError(t('forum.maxImagesAllowed', { max: MAX_QUESTION_IMAGES }))
      return
    }

    setUploadingCount(files.length)
    try {
      const uploaded = await Promise.all(files.map((f) => forumApi.uploadQuestionImage(f)))
      setValue('imageUrls', [...current, ...uploaded], { shouldValidate: true, shouldDirty: true })
    } catch {
      setUploadError(t('forum.uploadError'))
    } finally {
      setUploadingCount(0)
    }
  }

  const removeImage = (idx: number) => {
    setValue('imageUrls', imageUrls.filter((_, i) => i !== idx), { shouldValidate: true, shouldDirty: true })
  }


  const canAddMore = imageUrls.length < MAX_QUESTION_IMAGES && uploadingCount === 0

  return (
    <DialogFrame onClose={onClose} zIndexClassName="z-50" maxWidthClassName="max-w-xl" className="overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{isEdit ? t('forum.editQuestion') : t('forum.postQuestion')}</h2>
          <button type="button" onClick={onClose} data-dialog-close aria-label={t('common.close')} className="grid h-10 w-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text">
            <X size={18} />
          </button>
        </div>

        {/* Lỗi nghiệp vụ từ backend (VD 403 không phải tác giả) */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">{t('forum.questionTitle')}</label>
            <input {...register('title')} placeholder={t('forum.questionTitlePlaceholder')} className={`h-11 ${FIELD_CLASS}`} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          {/* Thể loại + Ngành (đều tùy chọn) — 2 field tách biệt, mỗi câu hỏi gắn tối đa 1 mỗi loại */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-text">{t('forum.topicOptional')}</label>
              <EntitySelectField
                items={topics}
                value={topicId ?? null}
                onChange={(id) => setValue('topicId', id, { shouldDirty: true })}
                placeholder={t('forum.noTopicSelected')}
                buttonIcon={<LayoutGrid size={16} className="shrink-0 text-text-subtle" />}
                itemIcon={(name) => <TopicIcon name={name} size={16} className="shrink-0 text-primary-solid" />}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-text">{t('forum.majorOptional')}</label>
              <EntitySelectField
                items={majors}
                value={majorId ?? null}
                onChange={(id) => setValue('majorId', id, { shouldDirty: true })}
                placeholder={t('forum.noMajorSelected')}
                searchPlaceholder={t('forum.searchMajorPlaceholder')}
                searchable
                buttonIcon={<GraduationCap size={16} className="shrink-0 text-text-subtle" />}
                itemIcon={() => <GraduationCap size={16} className="shrink-0 text-primary-solid" />}
              />
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">{t('forum.content')}</label>
            <textarea {...register('body')} rows={6} placeholder={t('forum.contentPlaceholder')} className={`py-3 ${FIELD_CLASS}`} />
            {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
          </div>

          {/* Ảnh đính kèm (tùy chọn) */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">
              {t('forum.attachedImagesOptional')} <span className="font-normal text-text-subtle">· {imageUrls.length}/{MAX_QUESTION_IMAGES}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {imageUrls.map((url, idx) => (
                <div key={url + idx} className="group relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-inset ring-border">
                  <img src={url} alt={t('forum.imageIndex', { index: idx + 1 })} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={t('forum.deleteImage')}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition hover:scale-110 hover:opacity-90"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              {/* Ô upload — hiển thị spinner khi đang tải, ẩn khi đủ số ảnh tối đa */}
              {uploadingCount > 0 && (
                <div className="grid h-20 w-20 place-items-center rounded-xl bg-surface-2 ring-1 ring-border">
                  <Loader2 size={20} className="animate-spin text-text-subtle" />
                </div>
              )}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-20 w-20 place-items-center gap-1 rounded-xl border border-dashed border-border-strong text-text-subtle transition-colors hover:border-brand-400/60 hover:text-primary-solid"
                >
                  <ImagePlus size={20} />
                  <span className="text-xs font-semibold">{t('forum.addImage')}</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            {(uploadError || errors.imageUrls) && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs font-medium text-danger">
                <AlertTriangle size={13} className="shrink-0" /> {uploadError ?? (errors.imageUrls?.message as string)}
              </p>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending || uploadingCount > 0}
              leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
            >
              {isEdit ? (isPending ? t('forum.saving') : t('forum.saveChanges')) : isPending ? t('forum.posting') : t('forum.postQuestion')}
            </Button>
          </div>
        </form>
    </DialogFrame>
  )
}
