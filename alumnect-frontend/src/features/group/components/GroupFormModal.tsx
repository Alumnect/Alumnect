/**
 * GroupFormModal — Modal TẠO hội nhóm mới HOẶC CHỈNH SỬA thông tin hội nhóm (truyền `editGroup`).
 *
 * Trách nhiệm:
 *  - Form tên, danh mục, loại hội nhóm (công khai/riêng tư), chủ đề, mô tả, quy định tham gia, ảnh bìa (tùy chọn).
 *  - Validate bằng Zod (khớp Backend); chủ đề nhập dạng "AI, Machine Learning" (tối đa 5, mỗi chủ đề ≤ 50 ký tự).
 *  - Chế độ TẠO: thành công thì điều hướng sang trang chi tiết nhóm vừa tạo; chế độ SỬA: thành công thì đóng modal.
 *  - Ảnh bìa: upload qua presigned URL, xem trước và gỡ được.
 */
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Globe, ImagePlus, Loader2, Lock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DialogFrame, SelectDropdown, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { groupApi } from '../api/groupApi'
import { useCreateGroup, useUpdateGroup } from '../hooks/useGroupActions'
import {
  GROUP_CATEGORIES,
  GROUP_DESCRIPTION_MAX,
  GROUP_NAME_MAX,
  GROUP_RULES_MAX,
  GROUP_TOPIC_MAX_LENGTH,
  groupFormSchema,
  parseTopics,
  validateTopics,
} from '../model/group'
import type { GroupDetail, GroupFormValues, GroupInput } from '../model/group'
import { GroupCover } from './GroupCover'

const FIELD_CLASS =
  'w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle'

export function GroupFormModal({ onClose, editGroup }: { onClose: () => void; editGroup?: GroupDetail }) {
  const { t } = useTranslation()
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
          toast.success(t('groups.updateGroupSuccess'))
          onClose()
        },
        onError: (err) => toast.error((err as Error).message || t('groups.updateGroupError')),
      })
    } else {
      createMut.mutate(input, {
        onSuccess: (created) => {
          toast.success(t('groups.createGroupSuccess'))
          onClose()
          navigate(`/app/groups/${created.id}`)
        },
        onError: (err) => toast.error((err as Error).message || t('groups.createGroupError')),
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
      setUploadError(t('groups.onlyImagesAllowed'))
      return
    }
    setUploading(true)
    try {
      const url = await groupApi.uploadCover(file)
      setValue('coverImageUrl', url, { shouldDirty: true })
    } catch {
      setUploadError(t('groups.uploadError'))
    } finally {
      setUploading(false)
    }
  }


  return (
    <DialogFrame onClose={onClose} zIndexClassName="z-50" maxWidthClassName="max-w-2xl" className="overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{isEdit ? t('groups.editGroupTitle') : t('groups.createGroupTitle')}</h2>
          <button type="button" onClick={onClose} data-dialog-close aria-label={t('common.close')} className="grid h-10 w-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Ảnh nhóm */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">{t('groups.groupCoverLabel')}</label>
            <div className="relative overflow-hidden rounded-xl ring-1 ring-inset ring-border">
              <GroupCover url={coverImageUrl} name={nameValue || t('groups.defaultGroupName')} className="aspect-[21/9]" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setValue('coverImageUrl', null, { shouldDirty: true })}
                    className="rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:opacity-90"
                  >
                    {t('groups.removeCoverBtn')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-semibold text-text shadow-sm transition-colors hover:bg-surface disabled:opacity-60"
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                  {coverImageUrl ? t('groups.editCover') : t('groups.chooseCoverBtn')}
                </button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {uploadError && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs font-medium text-danger">
                <AlertTriangle size={13} className="shrink-0" /> {uploadError}
              </p>
            )}
          </div>

          {/* Tên */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">
              {t('groups.groupNameLabel')} <span className="text-danger">*</span>
            </label>
            <input {...register('name')} maxLength={GROUP_NAME_MAX} placeholder={t('groups.namePlaceholder')} className={`h-11 ${FIELD_CLASS}`} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Danh mục + loại hội nhóm */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-text">
                {t('groups.categoryLabelReq')} <span className="text-danger">*</span>
              </label>
              <SelectDropdown
                label={t('groups.categoryLabelReq')}
                value={categoryValue ?? ''}
                onChange={(v) => setValue('category', String(v), { shouldDirty: true, shouldValidate: true })}
                options={GROUP_CATEGORIES.map((c) => ({ value: c.value, label: t(`groups.categories.${c.value}`, { defaultValue: c.label }) }))}
                placeholder={t('groups.selectCategoryPrompt')}
              />
              {errors.category && <p className="mt-1 text-xs text-danger">{errors.category.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-text">{t('groups.groupTypeLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'PUBLIC', label: t('groups.public'), icon: Globe },
                    { value: 'PRIVATE', label: t('groups.private'), icon: Lock },
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
                        'flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-center text-sm font-bold transition cursor-pointer',
                        isSelected
                          ? 'border-brand-400/70 bg-primary-soft text-primary-solid shadow-2xs'
                          : 'border-border bg-surface-2 text-text-muted hover:border-border-strong hover:bg-surface-2',
                      )}
                    >
                      <Icon size={16} className={isSelected ? 'text-primary-solid' : 'text-text-subtle'} />
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Chủ đề */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">{t('groups.topicsLabelReq')}</label>
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
                aria-label={t('groups.topicInputAria')}
                placeholder={t('groups.topicInputPlaceholder')}
                className={`h-11 ${FIELD_CLASS}`}
              />
              <Button type="button" variant="primary" size="md" onClick={addTopics} disabled={!topicInput.trim()} leftIcon={<Plus size={16} />}>
                {t('groups.addTopicBtn')}
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span key={topic.toLowerCase()} className="inline-flex items-center gap-1.5 rounded-full border border-primary-soft-border bg-primary-soft px-3 py-1 text-xs font-medium text-primary-solid">
                    {topic}
                    <button type="button" onClick={() => removeTopic(topic)} aria-label={t('groups.removeTopic', { topic })} className="rounded-full p-0.5 transition-colors hover:bg-primary-soft">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {topicsError && <p className="mt-1 text-xs text-danger">{topicsError}</p>}
          </div>

          {/* Mô tả */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">
              {t('groups.descriptionLabelReq')} <span className="text-danger">*</span>
            </label>
            <textarea {...register('description')} rows={5} maxLength={GROUP_DESCRIPTION_MAX} placeholder={t('groups.descPlaceholder')} className={`py-3 ${FIELD_CLASS}`} />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>

          {/* Quy định tham gia */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-text">{t('groups.joinRulesLabel')}</label>
            <textarea {...register('joinRules')} rows={3} maxLength={GROUP_RULES_MAX} placeholder={t('groups.rulesPlaceholder')} className={`py-3 ${FIELD_CLASS}`} />
            {errors.joinRules && <p className="mt-1 text-xs text-danger">{errors.joinRules.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isPending || uploading} leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}>
              {isEdit ? (isPending ? t('common.saving') : t('common.saveChanges')) : isPending ? t('groups.creatingGroup') : t('groups.createGroup')}
            </Button>
          </div>
        </form>
    </DialogFrame>
  )
}
