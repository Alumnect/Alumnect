import { useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  X, Image as ImageIcon, Loader2, Globe, Users, Award, Briefcase, CalendarPlus, FileText, AlertCircle, Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/store/authStore'
import { feedApi } from '../api/feedApi'
import { useCreatePost } from '../hooks/useCreatePost'
import { createPostSchema, POST_TYPE_LABELS, POST_CONTENT_MAX } from '../model/createPost'
import type { CreatePostInput } from '../model/createPost'
import { POST_TYPES } from '../model/post'

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
}: {
  open: boolean
  onClose: () => void
  viewer: AuthUser
}) {
  const createMutation = useCreatePost()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema) as never,
    defaultValues: { content: '', type: 'normal', visibility: 'public', imageUrl: undefined },
  })

  const type = watch('type')
  const visibility = watch('visibility')
  const imageUrl = watch('imageUrl')
  const content = watch('content') ?? ''

  if (!open) return null

  /** Đóng modal và dọn sạch trạng thái form/lỗi. */
  const close = () => {
    reset()
    setUploadError(null)
    createMutation.reset()
    onClose()
  }

  /** Gửi bài viết; đóng modal khi thành công (lỗi hiển thị qua createMutation.error). */
  const onSubmit = async (values: CreatePostInput) => {
    try {
      await createMutation.mutateAsync(values)
      close()
    } catch {
      /* Lỗi nghiệp vụ từ Backend hiển thị qua createMutation.isError bên dưới. */
    }
  }

  /** Tải ảnh đính kèm lên R2 và gán URL công khai vào form. */
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setIsUploading(true)
    try {
      const url = await feedApi.uploadPostImage(file)
      setValue('imageUrl', url, { shouldValidate: true })
    } catch {
      setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-plum-900/5 animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-plum-900">Tạo bài viết</h3>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tác giả + chọn phạm vi hiển thị */}
        <div className="mt-4 flex items-center gap-3">
          <Avatar src={viewer.avatarUrl ?? ''} name={viewer.name} size={44} verified={viewer.verified} />
          <div className="min-w-0">
            <p className="truncate font-bold text-plum-900">{viewer.name}</p>
            <div className="mt-1 inline-flex rounded-lg bg-plum-900/[0.05] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setValue('visibility', 'public')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
                  visibility === 'public' ? 'bg-white text-plum-900 shadow-sm' : 'text-plum-500',
                )}
              >
                <Globe size={12} /> Công khai
              </button>
              <button
                type="button"
                onClick={() => setValue('visibility', 'members')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
                  visibility === 'members' ? 'bg-white text-plum-900 shadow-sm' : 'text-plum-500',
                )}
              >
                <Users size={12} /> Chỉ thành viên
              </button>
            </div>
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
              const active = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-sm'
                      : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.07] hover:text-plum-900',
                  )}
                >
                  <Icon size={15} /> {POST_TYPE_LABELS[t]}
                </button>
              )
            })}
          </div>

          {/* Ảnh đính kèm (tùy chọn) */}
          {imageUrl ? (
            <div className="relative">
              <img src={imageUrl} alt="Ảnh đính kèm bài viết" className="max-h-56 w-full rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => setValue('imageUrl', undefined)}
                aria-label="Xóa ảnh"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-coral-500 shadow hover:bg-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-plum-900/15 px-4 py-3 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.03]">
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang tải ảnh lên…
                </>
              ) : (
                <>
                  <ImageIcon size={16} className="text-aqua-500" /> Thêm ảnh (tùy chọn)
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          )}
          {uploadError && <p className="text-xs font-medium text-coral-500">{uploadError}</p>}

          {/* Thông điệp lỗi nghiệp vụ từ Backend */}
          {createMutation.isError && (
            <div className="flex items-start gap-2 rounded-xl border border-coral-200/50 bg-coral-50 p-3 text-xs text-coral-600">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{(createMutation.error as Error).message}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={close}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isUploading}
              leftIcon={createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Đang đăng…' : 'Đăng bài'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
