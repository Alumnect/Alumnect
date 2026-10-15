import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, X, Loader2 } from 'lucide-react'
import { Card, toast } from '@/components/ui'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => mentoringGroupApi.create({ name: name.trim(), description: description.trim() }),
    onSuccess: (data) => {
      toast.success('Tạo nhóm mentoring thành công!')
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
      setError(err.message || 'Không thể tạo nhóm mentoring')
      toast.error(err.message || 'Không thể tạo nhóm mentoring')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Vui lòng nhập tên nhóm')
      return
    }
    if (name.trim().length < 2) {
      setError('Tên nhóm phải từ 2 ký tự trở lên')
      return
    }
    setError(null)
    createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-150">
        <Card hover={false} className="border border-plum-900/15 p-6 shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
          <div className="flex items-center justify-between border-b border-plum-900/10 pb-4 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-plum-900 dark:text-white">Tạo nhóm Mentoring</h2>
                <p className="text-xs text-plum-500 dark:text-plum-400">Mô hình Group-First: tạo nhóm trước khi gửi yêu cầu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-plum-400 hover:bg-plum-900/5 hover:text-plum-700 dark:text-plum-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-coral-200 bg-coral-50 p-3 text-xs font-medium text-coral-700 dark:border-coral-900/40 dark:bg-coral-900/20 dark:text-coral-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-plum-900 dark:text-white mb-1.5">
                Tên nhóm <span className="text-coral-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nhóm đồ án tốt nghiệp Capstone K16, Nhóm học Java Spring..."
                maxLength={200}
                className="w-full rounded-xl border border-plum-900/15 px-3.5 py-2.5 text-xs text-plum-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-[#3a3b3c] dark:bg-[#18191a] dark:text-white"
                autoFocus
              />
              <span className="mt-1 block text-[11px] text-plum-400 dark:text-plum-400">Tối đa 200 ký tự</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-plum-900 dark:text-white mb-1.5">
                Mô tả nhóm <span className="text-plum-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả mục tiêu, định hướng hoặc các thành viên cần tìm..."
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-plum-900/15 px-3.5 py-2.5 text-xs text-plum-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-[#3a3b3c] dark:bg-[#18191a] dark:text-white resize-none"
              />
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              💡 Sau khi tạo nhóm, bạn sẽ là <strong>Trưởng nhóm</strong> và có thể mời các thành viên tham gia trước khi submit Mentoring Request.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={createMutation.isPending}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={createMutation.isPending || !name.trim()}
                leftIcon={createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
