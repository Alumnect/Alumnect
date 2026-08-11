import { useState, useEffect, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  X, Image as ImageIcon, Loader2, Award, Briefcase, CalendarPlus, FileText, AlertCircle, Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar, ImageCarousel } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/store/authStore'
import { feedApi } from '../api/feedApi'
import { useCreatePost } from '../hooks/useCreatePost'
import { useEditPost } from '../hooks/useEditPost'
import { createPostSchema, POST_TYPE_LABELS, POST_CONTENT_MAX } from '../model/createPost'
import type { CreatePostInput } from '../model/createPost'
import { POST_TYPES } from '../model/post'
import type { Post, PostType } from '../model/post'

/** Biểu tượng cho từng loại bài viết trong bộ chọn loại. */
const TYPE_ICONS: Record<string, LucideIcon> = {
  normal: FileText,
  achievement: Award,
  recruitment: Briefcase,
  event: CalendarPlus,
}

/**
 * Modal soạn & đăng bài viết mới (UC14 - Create a post on the Feed).
 * Chỉ dùng cho thành viên Student/Alumni (FeedPage đã kiểm soát hiển thị).
 * Xử lý đầy đủ: validate client (Zod), chọn loại/phạm vi hiển thị, tải ảnh tùy chọn,
 * trạng thái loading/lỗi và hiển thị thông điệp lỗi nghiệp vụ từ Backend.
 *
 * @param open    Cờ mở/đóng modal
 * @param onClose Hàm đóng modal
 * @param viewer  Người dùng hiện tại (hiển thị avatar/tên tác giả)
 */
export function CreatePostModal({
  open,
  onClose,
  viewer,
  editPost,
  defaultType = 'normal',
}: {
  open: boolean
  onClose: () => void
  viewer: AuthUser
  editPost?: Post
  defaultType?: PostType
}) {
  const createMutation = useCreatePost()
  const editMutation = useEditPost()
  const activeMutation = editPost ? editMutation : createMutation

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema) as any,
    defaultValues: { content: '', type: 'normal', imageUrl: undefined },
  })

  useEffect(() => {
    if (open) {
      if (editPost) {
        reset({
          content: editPost.text,
          type: editPost.type,
          imageUrl: undefined,
          mediaUrls: editPost.images && editPost.images.length > 0
            ? editPost.images
            : editPost.image ? [editPost.image] : [],
          // Pre-fill job data if editing a recruitment post
          job: editPost.job ? {
            title: editPost.job.title ?? '',
            company: editPost.job.company ?? '',
            employmentType: (editPost.job.employmentType as 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT') ?? 'FULL_TIME',
            location: editPost.job.location ?? '',
            salaryMin: editPost.job.salaryMin ?? undefined,
            salaryMax: editPost.job.salaryMax ?? undefined,
            contactEmail: editPost.job.contactEmail ?? '',
            applyUrl: editPost.job.applyUrl ?? '',
          } : undefined,
          // Pre-fill event data if editing an event post
          event: editPost.event ? {
            title: editPost.event.title ?? '',
            location: editPost.event.location ?? '',
            // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
            startTime: editPost.event.startTime
              ? new Date(editPost.event.startTime).toISOString().slice(0, 16)
              : undefined,
            endTime: editPost.event.endTime
              ? new Date(editPost.event.endTime).toISOString().slice(0, 16)
              : undefined,
            capacity: editPost.event.capacity ?? undefined,
          } : undefined,
        })
      } else {
        reset({ content: '', type: defaultType, imageUrl: undefined })
      }
    }
  }, [open, editPost, defaultType, reset])

  const type = watch('type')
  const mediaUrls = watch('mediaUrls') ?? []
  const imageUrl = watch('imageUrl') // legacy, keep for compat
  const allImages = mediaUrls.length > 0 ? mediaUrls : (imageUrl ? [imageUrl] : [])
  const content = watch('content') ?? ''

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  /** Đóng modal và dọn sạch trạng thái form/lỗi. */
  const close = () => {
    reset()
    setUploadError(null)
    createMutation.reset()
    editMutation.reset()
    onClose()
  }

  /** Gửi bài viết; đóng modal khi thành công. */
  const onSubmit = async (values: CreatePostInput) => {
    try {
      const payload = { ...values }
      
      // Auto-fill content for Job/Event if user left it empty (Backend @NotBlank constraint)
      if (!payload.content.trim()) {
        if (payload.type === 'recruitment') {
          payload.content = `Tuyển dụng: ${payload.job?.title || 'Vị trí mới'} tại ${payload.job?.company || 'công ty'}`
        } else if (payload.type === 'event') {
          payload.content = `Sự kiện: ${payload.event?.title || 'Sự kiện mới'}`
        } else if (payload.type === 'achievement') {
          payload.content = 'Thành tựu mới'
        }
      }

      if (payload.type === 'event' && payload.event) {
        if (payload.event.startTime) {
          payload.event.startTime = new Date(payload.event.startTime).toISOString()
        }
        if (payload.event.endTime) {
          payload.event.endTime = new Date(payload.event.endTime).toISOString()
        }
      }

      if (editPost) {
        await editMutation.mutateAsync({ postId: editPost.id, input: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      close()
    } catch {
      /* Lỗi nghiệp vụ từ Backend hiển thị qua activeMutation.isError bên dưới. */
    }
  }

  /** Tải nhiều ảnh đính kèm lên R2 và thêm vào mảng mediaUrls. */
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadError(null)
    setIsUploading(true)
    setUploadingCount(files.length)
    try {
      const current = (watch('mediaUrls') ?? []).filter(Boolean)
      if (current.length + files.length > 10) {
        setUploadError('Tối đa 10 ảnh mỗi bài viết.')
        return
      }
      const uploaded = await Promise.all(files.map((f) => feedApi.uploadPostImage(f)))
      setValue('mediaUrls', [...current, ...uploaded], { shouldValidate: true })
      // Clear legacy imageUrl
      setValue('imageUrl', undefined)
    } catch {
      setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
      setUploadingCount(0)
      e.target.value = ''
    }
  }

  /** Xóa ảnh tại vị trí idx khỏi danh sách. */
  const removeImage = (idx: number) => {
    const current = watch('mediaUrls') ?? []
    setValue('mediaUrls', current.filter((_, i) => i !== idx), { shouldValidate: true })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex overflow-y-auto bg-plum-900/40 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div className="relative m-auto w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-plum-900/5 animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-plum-900">
            {editPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tác giả */}
        <div className="mt-4 flex items-center gap-3">
          <Avatar src={viewer.avatarUrl ?? ''} name={viewer.name} size={44} verified={viewer.verified} />
          <div className="min-w-0">
            <p className="truncate font-bold text-plum-900">{viewer.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          {/* Nội dung */}
          <div>
            <textarea
              {...register('content')}
              rows={5}
              maxLength={POST_CONTENT_MAX}
              placeholder="Bạn muốn chia sẻ điều gì với cộng đồng?"
              className="w-full resize-none rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 text-[15px] leading-relaxed text-plum-800 outline-none transition-colors placeholder:text-plum-400 focus:border-brand-400 focus:bg-white"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.content ? (
                <span className="text-xs font-medium text-coral-500">{errors.content.message}</span>
              ) : (
                <span />
              )}
              <span className="text-xs text-plum-400">
                {content.length}/{POST_CONTENT_MAX}
              </span>
            </div>
          </div>

          {/* Chọn loại bài viết */}
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t] ?? FileText
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                    type === t
                      ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
                  )}
                >
                  <Icon size={15} /> {POST_TYPE_LABELS[t]}
                </button>
              )
            })}
          </div>

          {/* Form Tuyển dụng */}
          {type === 'recruitment' && (
            <div className="space-y-4 rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Chức danh *</label>
                  <input {...register('job.title')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: Senior Frontend Developer" />
                  {errors.job?.title && <p className="mt-1 text-xs text-coral-500">{errors.job.title.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Công ty *</label>
                  <input {...register('job.company')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: FPT Software" />
                  {errors.job?.company && <p className="mt-1 text-xs text-coral-500">{errors.job.company.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Loại hình</label>
                  <select {...register('job.employmentType')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none bg-white">
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Địa điểm</label>
                  <input {...register('job.location')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: Hà Nội, Remote" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Mức lương tối thiểu (VND)</label>
                  <input type="number" {...register('job.salaryMin', { valueAsNumber: true })} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: 10000000" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Mức lương tối đa (VND)</label>
                  <input type="number" {...register('job.salaryMax', { valueAsNumber: true })} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: 20000000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Email liên hệ</label>
                  <input {...register('job.contactEmail')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="hr@company.com" />
                  {errors.job?.contactEmail && <p className="mt-1 text-xs text-coral-500">{errors.job.contactEmail.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Link ứng tuyển</label>
                  <input {...register('job.applyUrl')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="https://" />
                </div>
              </div>
            </div>
          )}

          {/* Form Sự kiện */}
          {type === 'event' && (
            <div className="space-y-4 rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-4 animate-fade-in">
              <div>
                <label className="mb-1 block text-xs font-semibold text-plum-900">Tên sự kiện *</label>
                <input {...register('event.title')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: Hội thảo công nghệ 2024" />
                {errors.event?.title && <p className="mt-1 text-xs text-coral-500">{errors.event.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Thời gian bắt đầu *</label>
                  <input type="datetime-local" {...register('event.startTime')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none bg-white" />
                  {errors.event?.startTime && <p className="mt-1 text-xs text-coral-500">{errors.event.startTime.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Thời gian kết thúc</label>
                  <input type="datetime-local" {...register('event.endTime')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Địa điểm</label>
                  <input {...register('event.location')} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="VD: Tòa nhà Alpha, ĐH FPT" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-plum-900">Sức chứa (số người)</label>
                  <input type="number" {...register('event.capacity', { valueAsNumber: true })} className="w-full rounded-lg border border-plum-900/10 p-2 text-sm focus:border-brand-400 focus:outline-none" placeholder="Không giới hạn thì để trống" />
                </div>
              </div>
            </div>
          )}

          {/* Ảnh đính kèm — Instagram carousel preview */}
          {allImages.length > 0 && (
            <div className="space-y-2">
              <ImageCarousel
                images={allImages}
                height={280}
                altPrefix="Ảnh xem trước"
                className="rounded-xl"
              />
              {/* Thumbnail strip — hover để xóa từng ảnh */}
              <div className="flex gap-1.5 flex-wrap">
                {allImages.map((url, idx) => (
                  <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={url} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Xóa ảnh ${idx + 1}`}
                    >
                      <Trash2 size={13} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút thêm ảnh */}
          {allImages.length < 10 && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-plum-900/15 px-4 py-3 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.03]">
              {isUploading ? (
                <><Loader2 size={16} className="animate-spin" /> Đang tải {uploadingCount} ảnh lên…</>
              ) : (
                <><ImageIcon size={16} className="text-aqua-500" /> {allImages.length > 0 ? 'Thêm ảnh khác' : 'Thêm ảnh (tùy chọn)'}</>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          )}
          {uploadError && <p className="text-xs font-medium text-coral-500">{uploadError}</p>}

          {/* Thông điệp lỗi nghiệp vụ từ Backend */}
          {activeMutation.isError && (
            <div className="flex items-start gap-2 rounded-xl border border-coral-200/50 bg-coral-50 p-3 text-xs text-coral-600">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{(activeMutation.error as Error).message}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={close}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={activeMutation.isPending || isUploading}
              leftIcon={activeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
            >
              {editPost
                ? activeMutation.isPending
                  ? 'Đang lưu…'
                  : 'Lưu thay đổi'
                : activeMutation.isPending
                ? 'Đang đăng…'
                : 'Đăng bài'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
