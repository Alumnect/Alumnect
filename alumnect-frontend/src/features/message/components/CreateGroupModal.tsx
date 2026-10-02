import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Users, Search, Check, Loader2, Camera } from 'lucide-react'
import { Avatar, Button, toast } from '@/components/ui'
import { chatApi } from '../api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { useCreateGroup } from '../hooks/useChat'
import type { Conversation } from '../model/types'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (group: Conversation) => void
}

interface SelectableUser {
  id: number
  email?: string
  fullName: string
  avatarUrl?: string | null
  headline?: string | null
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [groupName, setGroupName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [candidates, setCandidates] = useState<SelectableUser[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const createGroupMutation = useCreateGroup()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const res = await chatApi.uploadAttachment(file)
      setAvatarUrl(res.url)
    } catch (err) {
      console.error('Lỗi tải ảnh đại diện nhóm:', err)
      toast.error('Không thể tải ảnh đại diện lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Load danh sách người theo dõi hoặc tìm kiếm thành viên chuẩn cho chat
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await chatApi.searchUsersForChat(search.trim())
        if (isMounted) {
          const list = (res.data || [])
            .filter((u) => String(u.userId) !== String(currentUserId))
            .map((u) => ({
              id: u.userId,
              fullName: u.fullName,
              avatarUrl: u.avatarUrl,
              headline: u.headline || u.major,
            }))
          setCandidates(list)
        }
      } catch (e) {
        console.error('Lỗi tìm kiếm thành viên:', e)
      } finally {
        if (isMounted) setIsSearching(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, search, currentUserId])

  if (!isOpen) return null

  const toggleSelect = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm trò chuyện.')
      return
    }
    if (selectedUserIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên khác vào nhóm.')
      return
    }

    try {
      const res = await createGroupMutation.mutateAsync({
        title: groupName.trim(),
        avatarUrl: avatarUrl || undefined,
        memberIds: selectedUserIds,
      })
      toast.success('Tạo nhóm trò chuyện thành công!')
      onCreated(res.data)
      onClose()
      setGroupName('')
      setAvatarUrl(null)
      setSelectedUserIds([])
      setSearch('')
    } catch (err: any) {
      console.error('Lỗi tạo nhóm:', err)
      let errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo nhóm trò chuyện. Vui lòng thử lại.'
      const fieldErrors = err?.data?.data || err?.response?.data?.data
      if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
        const firstVal = Object.values(fieldErrors)[0]
        if (typeof firstVal === 'string') {
          errorMsg = firstVal
        }
      }
      toast.error(errorMsg)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#242526] dark:text-[#f0f2f5]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-plum-900/10 px-6 py-4 dark:border-[#393a3b]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Users size={18} />
            </div>
            <h3 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5]">Tạo nhóm trò chuyện</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-plum-400 hover:bg-plum-900/5 hover:text-plum-700 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 flex items-center gap-3">
            {/* Avatar uploader */}
            <div className="relative shrink-0 group">
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600 shadow-inner ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:text-brand-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Group" className="h-full w-full object-cover" />
                ) : (
                  <Users size={22} />
                )}
              </div>
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh đại diện nhóm (không bắt buộc)"
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 cursor-pointer disabled:pointer-events-none"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-plum-700 dark:text-[#b0b3b8]">
                Tên nhóm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm trò chuyện..."
                className="h-10 w-full rounded-2xl border border-plum-900/15 bg-white px-3.5 text-sm text-plum-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-[#f0f2f5]"
              />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-plum-600 dark:text-[#b0b3b8]">
                Chọn thành viên ({selectedUserIds.length}) <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative flex items-center">
              <Search size={15} className="pointer-events-none absolute left-3 text-plum-400 dark:text-[#b0b3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên thành viên..."
                className="h-9 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-9 pr-3 text-xs text-plum-900 focus:border-brand-400 focus:bg-white focus:outline-none dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-[#f0f2f5]"
              />
            </div>
          </div>

          {/* List candidates */}
          <div className="no-scrollbar mt-3 max-h-56 space-y-1.5 overflow-y-auto rounded-2xl border border-plum-900/10 bg-plum-900/[0.01] p-2 dark:border-[#393a3b]">
            {isSearching ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-plum-400 dark:text-[#b0b3b8]">
                Không tìm thấy thành viên nào.
              </div>
            ) : (
              candidates.map((user) => {
                const isSelected = selectedUserIds.includes(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleSelect(user.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-500/20'
                        : 'hover:bg-plum-900/[0.04] dark:hover:bg-[#3a3b3c]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={user.avatarUrl || undefined} name={user.fullName} size={34} />
                      <div>
                        <p className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">{user.fullName}</p>
                        <p className="max-w-[200px] truncate text-[11px] text-plum-400 dark:text-[#b0b3b8]">
                          {user.email || user.headline}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-plum-900/25 bg-white dark:border-[#555] dark:bg-[#2b2c2d]'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-4 text-xs font-semibold">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.length === 0 || createGroupMutation.isPending}
              className="rounded-xl bg-brand-600 px-5 text-xs font-bold text-white hover:bg-brand-700"
            >
              {createGroupMutation.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
