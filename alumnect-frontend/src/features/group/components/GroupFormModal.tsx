/**
 * GroupFormModal — Modal TẠO hội nhóm mới HOẶC CHỈNH SỬA thông tin hội nhóm (truyền `editGroup`).
 *
 * Trách nhiệm:
 *  - Form tên, danh mục, loại hội nhóm (công khai/riêng tư), chủ đề, mô tả, quy định tham gia, ảnh bìa (tùy chọn).
 *  - Validate bằng Zod (khớp Backend); chủ đề nhập dạng "AI, Machine Learning" (tối đa 5, mỗi chủ đề ≤ 50 ký tự).
 *  - Chế độ TẠO: thành công thì điều hướng sang trang chi tiết nhóm vừa tạo; chế độ SỬA: thành công thì đóng modal.
 *  - Ảnh bìa: upload qua presigned URL, xem trước và gỡ được.
 */
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TRANSITION } from '@/lib/motion'
import { AlertTriangle, Check, ChevronDown, Globe, ImagePlus, Loader2, Lock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { groupApi } from '../api/groupApi'
import { useCreateGroup, useUpdateGroup } from '../hooks/useGroupActions'
import {
  GROUP_CATEGORIES,
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  GROUP_RULES_MAX,
  GROUP_TOPIC_MAX_LENGTH,
  categoryLabel,
  groupFormSchema,
  parseTopics,
  validateTopics,
} from '../model/group'
import type { GroupDetail, GroupFormValues, GroupInput } from '../model/group'
import { GroupCover } from './GroupCover'

const FIELD_CLASS =
  'w-full rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] px-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-white dark:placeholder:text-[#8a8d91]'

export function GroupFormModal({ onClose, editGroup }: { onClose: () => void; editGroup?: GroupDetail }) {
  const isEdit = !!editGroup
  const navigate = useNavigate()
  const createMut = useCreateGroup()
  const updateMut = useUpdateGroup(editGroup?.id ?? 0)
  const isPending = isEdit ? updateMut.isPending : createMut.isPending

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [topicsError, setTopicsError] = useState<string | null>(null)
  const [topics, setTopics] = useState<string[]>(editGroup?.topics ?? [])
  const [topicInput, setTopicInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: editGroup?.name ?? '',
      description: editGroup?.description ?? '',
      category: editGroup?.category ?? '',
      topicsText: (editGroup?.topics ?? []).join(', '),
      privacy: editGroup?.privacy ?? 'PUBLIC',
      joinRules: editGroup?.joinRules ?? '',
      coverImageUrl: editGroup?.coverImageUrl ?? null,
    },
  })

  const privacy = watch('privacy')
  const coverImageUrl = watch('coverImageUrl')
  const nameValue = watch('name')
  const categoryValue = watch('category')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!categoryOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [categoryOpen])

  const updateTopics = (nextTopics: string[]) => {
    setTopics(nextTopics)
    setValue('topicsText', nextTopics.join(', '), { shouldDirty: true, shouldValidate: true })
  }

  const addTopics = () => {
    const candidates = parseTopics(topicInput)
    if (candidates.length === 0) return

    const nextTopics = [...topics]
    for (const candidate of candidates) {
      if (nextTopics.some((topic) => topic.toLowerCase() === candidate.toLowerCase())) continue
      nextTopics.push(candidate)
    }

    const topicMessage = validateTopics(nextTopics.join(', '))
    setTopicsError(topicMessage)
    if (topicMessage) return

    updateTopics(nextTopics)
    setTopicInput('')
  }

  const removeTopic = (topicToRemove: string) => {
    updateTopics(topics.filter((topic) => topic !== topicToRemove))
    setTopicsError(null)
  }

  const onSubmit = (values: GroupFormValues) => {
    const submittedTopics = [...topics]
    for (const candidate of parseTopics(topicInput)) {
      if (!submittedTopics.some((topic) => topic.toLowerCase() === candidate.toLowerCase())) submittedTopics.push(candidate)
    }
    const topicMessage = validateTopics(submittedTopics.join(', '))
    setTopicsError(topicMessage)
    if (topicMessage) return

    const input: GroupInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category,
      topics: submittedTopics,
      privacy: values.privacy,
      joinRules: values.joinRules.trim() ? values.joinRules.trim() : null,
      coverImageUrl: values.coverImageUrl,
    }

    if (isEdit) {
      updateMut.mutate(input, {
        onSuccess: () => {
          toast.success('Đã cập nhật hội nhóm thành công!')
          onClose()
        },
        onError: (err) => toast.error((err as Error).message || 'Không thể cập nhật hội nhóm.'),
      })
    } else {
      createMut.mutate(input, {
        onSuccess: (created) => {
          toast.success('Đã tạo hội nhóm thành công!')
          onClose()
          navigate(`/app/groups/${created.id}`)
        },
        onError: (err) => toast.error((err as Error).message || 'Không thể tạo hội nhóm, vui lòng thử lại.'),
      })
    }
  }

  /** Chọn & tải ảnh bìa lên storage, lưu URL vào form. */
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ được chọn tệp ảnh')
      return
    }
    setUploading(true)
    try {
      const url = await groupApi.uploadCover(file)
      setValue('coverImageUrl', url, { shouldDirty: true })
    } catch {
      setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
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

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={TRANSITION.overlay} className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={TRANSITION.pop}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl card-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-plum-900">{isEdit ? 'Chỉnh sửa hội nhóm' : 'Tạo hội nhóm mới'}</h2>
          <button onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Ảnh nhóm */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">Ảnh nhóm</label>
            <div className="relative overflow-hidden rounded-xl ring-1 ring-inset ring-plum-900/10">
              <GroupCover url={coverImageUrl} name={nameValue || 'Hội nhóm'} className="aspect-[21/9]" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setValue('coverImageUrl', null, { shouldDirty: true })}
                    className="rounded-lg bg-plum-900/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-rose-500"
                  >
                    Gỡ ảnh
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-plum-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                  {coverImageUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                </button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {uploadError && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-600">
                <AlertTriangle size={13} className="shrink-0" /> {uploadError}
              </p>
            )}
          </div>

          {/* Tên */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">
              Tên hội nhóm <span className="text-rose-500">*</span>
            </label>
            <input {...register('name')} maxLength={GROUP_NAME_MAX} placeholder="VD: Cộng đồng AI FPTU" className={`h-11 ${FIELD_CLASS}`} />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          {/* Danh mục + loại hội nhóm */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div ref={categoryRef} className="relative">
              <label className="mb-1 block text-sm font-semibold text-plum-900">
                Danh mục hoạt động <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setCategoryOpen((prev) => !prev)}
                className={cn(
                  'flex h-11 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm transition-all cursor-pointer',
                  errors.category
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 dark:border-rose-500/50 dark:bg-rose-950/20 dark:text-rose-200'
                    : 'border-plum-900/10 bg-plum-900/[0.03] text-plum-900 hover:border-brand-500/40 hover:bg-white focus:outline-none dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-white dark:hover:border-brand-500/50',
                  categoryOpen && 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-500'
                )}
              >
                <span className={cn(!categoryValue && 'text-plum-400 dark:text-[#8a8d91]')}>
                  {categoryValue ? categoryLabel(categoryValue) : '— Chọn danh mục —'}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-plum-400 transition-transform duration-200',
                    categoryOpen && 'rotate-180 text-brand-500'
                  )}
                />
              </button>

              <AnimatePresence>
                {categoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-brand-500/15 bg-white p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#242526]"
                  >
                    {GROUP_CATEGORIES.map((c) => {
                      const isSelected = categoryValue === c.value
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setValue('category', c.value, { shouldDirty: true, shouldValidate: true })
                            setCategoryOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all cursor-pointer',
                            isSelected
                              ? 'bg-brand-500/10 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                              : 'font-medium text-plum-700 hover:bg-plum-900/[0.04] dark:text-plum-200 dark:hover:bg-[#3a3b3c]'
                          )}
                        >
                          <span>{c.label}</span>
                          {isSelected && (
                            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-brand-500 text-white">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.category && <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-plum-900">Loại hội nhóm</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'PUBLIC', label: 'Công khai', icon: Globe },
                    { value: 'PRIVATE', label: 'Riêng tư', icon: Lock },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon
                  const isSelected = privacy === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('privacy', opt.value, { shouldDirty: true })}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-center text-sm font-bold transition-all cursor-pointer',
                        isSelected
                          ? 'border-brand-400/70 bg-brand-500/10 text-brand-700 shadow-2xs'
                          : 'border-plum-900/10 bg-plum-900/[0.03] text-plum-600 hover:border-plum-900/20 hover:bg-plum-900/[0.05]',
                      )}
                    >
                      <Icon size={16} className={isSelected ? 'text-brand-600' : 'text-plum-400'} />
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Chủ đề */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">Chủ đề / sở thích liên quan</label>
            <input type="hidden" {...register('topicsText')} />
            <div className="flex gap-2">
              <input
                value={topicInput}
                onChange={(event) => {
                  setTopicInput(event.target.value)
                  if (topicsError) setTopicsError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTopics()
                  }
                }}
                maxLength={GROUP_TOPIC_MAX_LENGTH}
                placeholder="Nhập chủ đề"
                className={`h-11 ${FIELD_CLASS}`}
              />
              <Button type="button" variant="primary" size="md" onClick={addTopics} disabled={!topicInput.trim()} leftIcon={<Plus size={16} />}>
                Thêm
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span key={topic.toLowerCase()} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                    {topic}
                    <button type="button" onClick={() => removeTopic(topic)} aria-label={`Xóa chủ đề ${topic}`} className="rounded-full p-0.5 transition-colors hover:bg-brand-100 dark:hover:bg-brand-500/20">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {topicsError && <p className="mt-1 text-xs text-rose-500">{topicsError}</p>}
          </div>

          {/* Mô tả */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">
              Mô tả <span className="text-rose-500">*</span>
            </label>
            <textarea {...register('description')} rows={5} maxLength={GROUP_DESCRIPTION_MAX} placeholder="Hội nhóm này dành cho ai, hoạt động gì?" className={`py-3 ${FIELD_CLASS}`} />
            {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
          </div>

          {/* Quy định tham gia */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-plum-900">Quy định tham gia</label>
            <textarea {...register('joinRules')} rows={3} maxLength={GROUP_RULES_MAX} placeholder="VD: Tôn trọng thành viên, không quảng cáo..." className={`py-3 ${FIELD_CLASS}`} />
            {errors.joinRules && <p className="mt-1 text-xs text-rose-500">{errors.joinRules.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isPending || uploading} leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}>
              {isEdit ? (isPending ? 'Đang lưu…' : 'Lưu thay đổi') : isPending ? 'Đang tạo…' : 'Tạo hội nhóm'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
