import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, X, Loader2 } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { Card, toast, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { mentoringGroupApi } from '../api/mentoringGroupApi'
import type { MentoringGroupData } from '../model/mentoringRequestTypes'

interface CreateMentoringGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessRedirect?: boolean
  onCreated?: (group: MentoringGroupData) => void
}

export const CreateMentoringGroupModal: React.FC<CreateMentoringGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect = true,
  onCreated,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => mentoringGroupApi.create({ name: name.trim(), description: description.trim() }),
    onSuccess: (data) => {
      toast.success(t('mentoring.createGroupSuccess'))
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      setName('')
      setDescription('')
      setError(null)
      onClose()
      if (onCreated) {
        onCreated(data)
      } else if (onSuccessRedirect && data?.id) {
        navigate(`/app/mentoring/groups/${data.id}`)
      }
    },
    onError: (err: Error) => {
      setError(err.message || t('mentoring.createGroupError'))
      toast.error(err.message || t('mentoring.createGroupError'))
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('mentoring.groupNameRequired'))
      return
    }
    if (name.trim().length < 2) {
      setError(t('mentoring.groupNameMinLength'))
      return
    }
    setError(null)
    createMutation.mutate()
  }

  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-50"
      maxWidthClassName="max-w-lg"
      className="fade-in zoom-in-95 duration-150"
    >
      <Card hover={false} className="border border-border-strong p-6 shadow-2xl dark:bg-surface">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary-solid">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">{t('mentoring.createGroupModalTitle')}</h2>
              <p className="text-xs text-text-subtle">{t('mentoring.createGroupModalSubtitle')}</p>
            </div>
          </div>
          <button
            aria-label={t('common.close')}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text-muted"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-soft p-3 text-xs font-medium text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-text mb-1.5">
              {t('mentoring.groupNameLabel')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('mentoring.groupNamePlaceholder')}
              maxLength={200}
              className="w-full rounded-xl border border-border-strong px-3.5 py-2.5 text-xs text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:bg-bg"
              autoFocus
            />
            <span className="mt-1 block text-xs text-text-subtle">{t('mentoring.groupNameMaxChars')}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1.5">
              {t('mentoring.groupDescLabel')} <span className="text-text-subtle font-normal">{t('mentoring.optionalLabel')}</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('mentoring.groupDescPlaceholder')}
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-border-strong px-3.5 py-2.5 text-xs text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:bg-bg resize-none"
            />
          </div>

          <div className="rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning">
            {t('mentoring.groupLeaderNotice')}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={createMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || !name.trim()}
              leftIcon={createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {createMutation.isPending ? t('mentoring.creatingGroup') : t('mentoring.btnCreateGroup')}
            </Button>
          </div>
        </form>
      </Card>
    </DialogFrame>
  )
}

