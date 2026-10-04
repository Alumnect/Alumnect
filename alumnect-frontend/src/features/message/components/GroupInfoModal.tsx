import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Users, UserPlus, LogOut, ShieldCheck, UserX, Edit2, Check, Loader2, Camera, Crown, Trash2 } from 'lucide-react'
import { Avatar, Button, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { chatApi } from '../api/chatApi'
import {
  useGroupMembers,
  useAddMembers,
  useRemoveMember,
  useUpdateGroup,
  useDeleteConversation,
} from '../hooks/useChat'
import type { Conversation, ChatCandidateUser } from '../model/types'

interface GroupInfoModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation
  onLeftGroup: () => void
  onConversationUpdated?: (updated: Conversation) => void
}

interface ConfirmAction {
  type: 'leave' | 'remove' | 'transfer_and_leave' | 'disband'
  userId: number
  userName: string
  userAvatar?: string | null
}

export function GroupInfoModal({ isOpen, onClose, conversation, onLeftGroup, onConversationUpdated }: GroupInfoModalProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const conversationId = conversation.id

  const { data: members = [], isLoading: isLoadingMembers } = useGroupMembers(conversationId)
  const addMembersMutation = useAddMembers()
  const removeMemberMutation = useRemoveMember()
  const updateGroupMutation = useUpdateGroup()
  const deleteConversationMutation = useDeleteConversation()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState(conversation.title || '')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(conversation.avatarUrl || null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [selectedNewAdminId, setSelectedNewAdminId] = useState<number | null>(null)

  useEffect(() => {
    setCurrentAvatarUrl(conversation.avatarUrl || null)
    setNewTitle(conversation.title || '')
  }, [conversation.id, conversation.avatarUrl, conversation.title])

  const [isAddingMember, setIsAddingMember] = useState(false)
  const [searchAdd, setSearchAdd] = useState('')
  const [addCandidates, setAddCandidates] = useState<ChatCandidateUser[]>([])
  const [isSearchingAdd, setIsSearchingAdd] = useState(false)

  // Tự động tải danh sách thành viên gợi ý ngay khi mở "Thêm thành viên" hoặc khi tìm kiếm
  useEffect(() => {
    if (!isOpen || !isAddingMember) return

    let isMounted = true
    const timer = setTimeout(async () => {
      setIsSearchingAdd(true)
      try {
        const res = await chatApi.searchUsersForChat(searchAdd.trim())
        if (isMounted) {
          const existingIds = members.map((m) => m.userId)
          const filtered = (res.data || []).filter((u) => !existingIds.includes(u.userId))
          setAddCandidates(filtered)
        }
      } catch (e) {
        console.error('Lỗi tìm kiếm:', e)
      } finally {
        if (isMounted) setIsSearchingAdd(false)
      }
    }, searchAdd.trim() ? 250 : 0)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, isAddingMember, searchAdd, members])

  const currentMember = members.find((m) => String(m.userId) === String(currentUserId))
  const isAdmin =
    currentMember?.role === 'ADMIN' ||
    (conversation?.adminId != null && String(conversation.adminId) === String(currentUserId))
  const isCommunityGroup = Boolean(conversation?.communityGroupId)
  const isCommunityOwner = isCommunityGroup && isAdmin
  const otherMembers = members.filter((m) => String(m.userId) !== String(currentUserId))

  // Xử lý đổi ảnh đại diện nhóm
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !conversationId) return

    setIsUploadingAvatar(true)
    try {
      const uploadRes = await chatApi.uploadAttachment(file)
      const res = await updateGroupMutation.mutateAsync({
        conversationId,
        payload: { avatarUrl: uploadRes.url },
      })
      setCurrentAvatarUrl(uploadRes.url)
      if (onConversationUpdated && res?.data) {
        onConversationUpdated(res.data)
      }
    } catch (err) {
      console.error('Lỗi tải ảnh đại diện nhóm:', err)
      toast.error('Không thể tải ảnh đại diện nhóm lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Xử lý đổi tên nhóm
  const handleSaveTitle = async () => {
    if (!conversationId || !newTitle.trim() || newTitle === conversation.title) {
      setIsEditingTitle(false)
      return
    }
    const res = await updateGroupMutation.mutateAsync({
      conversationId,
      payload: { title: newTitle.trim() },
    })
    if (onConversationUpdated && res?.data) {
      onConversationUpdated(res.data)
    }
    setIsEditingTitle(false)
    toast.success('Đã cập nhật tên nhóm')
  }

  // Cập nhật từ khóa tìm kiếm thành viên
  const handleSearchAdd = (kw: string) => {
    setSearchAdd(kw)
  }

  // Thêm thành viên
  const handleAddUser = async (targetUserId: number) => {
    if (!conversationId) return
    try {
      const res = await addMembersMutation.mutateAsync({
        conversationId,
        payload: { memberIds: [targetUserId] },
      })
      if (onConversationUpdated && res?.data) {
        onConversationUpdated(res.data)
      }
      setAddCandidates((prev) => prev.filter((u) => u.userId !== targetUserId))
      toast.success('Đã thêm thành viên vào nhóm')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể thêm thành viên')
    }
  }

  // Bấm nút rời nhóm: Nếu là admin và còn thành viên khác thì mở giao diện chọn admin mới (trừ nhóm chat hội nhóm)
  const handleLeaveClick = () => {
    if (isCommunityOwner) {
      toast.error('Bạn là Chủ sở hữu hội nhóm nên không thể rời nhóm trò chuyện này.')
      return
    }
    if (isCommunityGroup) {
      setConfirmAction({
        type: 'leave',
        userId: Number(currentUserId) || 0,
        userName: 'Bạn',
      })
      return
    }
    if (isAdmin && otherMembers.length > 0) {
      setSelectedNewAdminId(otherMembers[0]?.userId ?? null)
      setConfirmAction({
        type: 'transfer_and_leave',
        userId: Number(currentUserId) || 0,
        userName: 'Bạn',
      })
    } else {
      setConfirmAction({
        type: 'leave',
        userId: Number(currentUserId) || 0,
        userName: 'Bạn',
      })
    }
  }

  // Bấm nút giải tán nhóm (chỉ dành cho Chủ sở hữu / Trưởng nhóm)
  const handleDisbandClick = () => {
    setConfirmAction({
      type: 'disband',
      userId: Number(currentUserId) || 0,
      userName: conversation.title || 'Nhóm trò chuyện',
    })
  }

  // Thực hiện xóa, rời nhóm hoặc giải tán nhóm qua Modal xác nhận
  const handleConfirmAction = async () => {
    if (!confirmAction || !conversationId) return
    const { type, userId } = confirmAction

    if (type === 'disband') {
      try {
        await deleteConversationMutation.mutateAsync(conversationId)
        toast.success('Đã giải tán nhóm trò chuyện thành công')
        setConfirmAction(null)
        onLeftGroup()
        onClose()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi giải tán nhóm')
      }
      return
    }

    try {
      const newAdminId = type === 'transfer_and_leave' ? (selectedNewAdminId ?? undefined) : undefined
      await removeMemberMutation.mutateAsync({ conversationId, userId, newAdminId })
      if (type === 'leave' || type === 'transfer_and_leave') {
        toast.success('Đã rời khỏi nhóm')
        setConfirmAction(null)
        onLeftGroup()
        onClose()
      } else {
        toast.success('Đã xóa thành viên khỏi nhóm')
        setConfirmAction(null)
        if (onConversationUpdated) {
          onConversationUpdated({
            ...conversation,
            memberCount: Math.max(1, (conversation.memberCount || members.length) - 1),
          })
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  if (!isOpen || !conversationId) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] sm:max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#242526] dark:text-[#f0f2f5]">
        {/* Header - Cố định ở đỉnh modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-plum-900/10 px-5 py-3.5 dark:border-[#393a3b]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Users size={16} />
            </div>
            <h3 className="text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">Thông tin nhóm</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-plum-400 hover:bg-plum-900/5 hover:text-plum-700 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung cuộn mượt mà bên trong, không bao giờ tràn màn hình */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 min-h-0">
          {/* Group Name & Stats */}
          <div className="mb-3 text-center">
            <div className="relative mx-auto mb-2 h-16 w-16 group">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-brand-50 text-xl font-bold text-brand-600 shadow-inner ring-2 ring-brand-500/20 dark:bg-brand-500/20 dark:text-brand-400">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="Group" className="h-full w-full object-cover" />
                ) : (
                  <Users size={28} />
                )}
              </div>

              {/* Nút đổi ảnh đại diện nhóm */}
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Đổi ảnh đại diện nhóm"
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 cursor-pointer disabled:pointer-events-none"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={16} className="mb-0.5" />
                    <span className="text-[9px] font-bold">Đổi ảnh</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {isEditingTitle ? (
              <div className="mx-auto flex max-w-xs items-center gap-1.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 w-full rounded-xl border border-brand-500 px-3 text-xs font-bold text-plum-900 focus:outline-none dark:bg-[#3a3b3c] dark:text-[#f0f2f5]"
                />
                <Button size="sm" onClick={handleSaveTitle} className="h-8 rounded-xl bg-brand-600 px-3">
                  <Check size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h4 className="text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">{conversation.title}</h4>
                <button
                  onClick={() => {
                    setNewTitle(conversation.title || '')
                    setIsEditingTitle(true)
                  }}
                  className="text-plum-400 hover:text-brand-600 dark:text-[#b0b3b8]"
                  title="Đổi tên nhóm"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}

            <p className="mt-0.5 text-[11px] text-plum-400 dark:text-[#b0b3b8]">{members.length} thành viên</p>
          </div>

          {/* Members section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-plum-600 dark:text-[#b0b3b8]">
                Thành viên ({members.length})
              </h5>
            <button
              onClick={() => {
                if (isAddingMember) {
                  setIsAddingMember(false)
                  setSearchAdd('')
                } else {
                  setIsAddingMember(true)
                  setSearchAdd('')
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
            >
              <UserPlus size={13} />
              {isAddingMember ? 'Đóng tìm kiếm' : 'Thêm thành viên'}
            </button>
          </div>

          {/* Add member search panel */}
          {isAddingMember && (
            <div className="mb-3 rounded-2xl border border-brand-500/20 bg-brand-50/50 p-3 dark:border-[#393a3b] dark:bg-[#3a3b3c]/50">
              <input
                type="text"
                value={searchAdd}
                onChange={(e) => handleSearchAdd(e.target.value)}
                placeholder="Nhập tên thành viên cần thêm..."
                className="h-8 w-full rounded-xl border border-plum-900/10 bg-white px-3 text-xs text-plum-900 focus:outline-none dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#f0f2f5]"
              />
              {isSearchingAdd ? (
                <div className="flex justify-center py-2.5">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                </div>
              ) : addCandidates.length > 0 ? (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-0.5">
                  {addCandidates.map((u) => (
                    <div
                      key={u.userId}
                      className="flex items-center justify-between rounded-lg bg-white p-1.5 text-xs shadow-2xs dark:bg-[#242526]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatarUrl || undefined} name={u.fullName} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-plum-900 dark:text-[#f0f2f5]">{u.fullName}</p>
                          <p className="truncate text-[10px] text-plum-400 dark:text-[#b0b3b8]">{u.headline || u.major || 'Thành viên'}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddUser(u.userId)}
                        className="h-6 shrink-0 rounded-lg bg-brand-600 px-2 text-[10px] text-white hover:bg-brand-700"
                      >
                        Thêm
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchAdd.trim() ? (
                <p className="mt-2 text-center text-[11px] text-plum-400">Không tìm thấy thành viên phù hợp</p>
              ) : (
                <p className="mt-2 text-center text-[11px] text-plum-400">Không có thành viên mới để thêm</p>
              )}
            </div>
          )}

          {/* Member List */}
          <div className="no-scrollbar max-h-36 space-y-1.5 overflow-y-auto rounded-2xl border border-plum-900/10 p-1.5 dark:border-[#393a3b]">
            {isLoadingMembers ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-brand-500" />
              </div>
            ) : (
              members.map((m) => {
                const isUserAdmin =
                  m.role === 'ADMIN' ||
                  (conversation.adminId != null && String(conversation.adminId) === String(m.userId))
                const isMe = String(m.userId) === String(currentUserId)
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-plum-900/[0.02] dark:hover:bg-[#3a3b3c]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={m.avatar || undefined} name={m.fullName} size={30} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
                            {m.fullName} {isMe && '(Bạn)'}
                          </p>
                          {isUserAdmin && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <ShieldCheck size={10} />
                              Trưởng nhóm
                            </span>
                          )}
                        </div>
                        {m.major && <p className="text-[10px] text-plum-400 dark:text-[#b0b3b8]">{m.major}</p>}
                      </div>
                    </div>

                    {isAdmin && !isMe && (!isCommunityGroup || !isUserAdmin) && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: 'remove',
                            userId: m.userId,
                            userName: m.fullName,
                            userAvatar: m.avatar,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        title="Xóa thành viên khỏi nhóm"
                      >
                        <UserX size={13} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (Leave / Disband) - Cố định ở chân modal */}
        <div className="shrink-0 border-t border-plum-900/10 bg-slate-50/70 px-5 py-3 dark:border-[#393a3b] dark:bg-[#1f2021]/70">
          {isCommunityOwner ? (
            <button
              type="button"
              onClick={handleDisbandClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 py-2.5 text-xs font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 hover:text-red-700 active:scale-98 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <Trash2 size={14} />
              Giải tán nhóm
            </button>
          ) : isAdmin && !isCommunityGroup ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleLeaveClick}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] py-2.5 px-3 text-xs font-bold text-plum-700 transition-all hover:bg-plum-900/[0.06] hover:text-plum-900 active:scale-98 dark:border-white/10 dark:bg-white/5 dark:text-[#e4e6eb] dark:hover:bg-white/10"
              >
                <LogOut size={14} className="text-plum-500 dark:text-[#b0b3b8]" />
                Rời khỏi nhóm
              </button>
              <button
                type="button"
                onClick={handleDisbandClick}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-red-200/80 bg-red-50/80 py-2.5 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:text-red-700 active:scale-98 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                Giải tán nhóm
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLeaveClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:text-red-700 active:scale-98 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <LogOut size={14} />
              Rời khỏi nhóm
            </button>
          )}
        </div>

        {/* In-card Confirmation Overlay: Thiết kế tinh tế, không mở thêm cửa sổ modal thứ 2 */}
        {confirmAction && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl bg-white/95 p-6 text-center backdrop-blur-md dark:bg-[#242526]/95 animate-in fade-in zoom-in-95 duration-200">
            {confirmAction.type === 'transfer_and_leave' ? (
              <>
                {/* Icon chỉ định trưởng nhóm */}
                <div className="relative mb-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm ring-6 ring-amber-500/10 dark:bg-amber-500/20 dark:text-amber-400">
                    <Crown size={28} />
                  </div>
                </div>

                <h4 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5]">
                  Chỉ định Trưởng nhóm mới
                </h4>

                <p className="mt-1 max-w-xs text-xs text-plum-500 dark:text-[#b0b3b8]">
                  Bạn là trưởng nhóm. Hãy chọn người kế nhiệm trước khi rời nhóm:
                </p>

                {/* Danh sách thành viên để chọn */}
                <div className="my-3.5 max-h-40 w-full max-w-xs space-y-1.5 overflow-y-auto rounded-2xl border border-plum-900/10 p-1.5 text-left dark:border-[#393a3b]">
                  {otherMembers.map((m) => {
                    const isSelected = selectedNewAdminId === m.userId
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => setSelectedNewAdminId(m.userId)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 transition-all text-left',
                          isSelected
                            ? 'bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200'
                            : 'hover:bg-plum-900/[0.04] dark:hover:bg-[#3a3b3c]'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={m.avatar || undefined} name={m.fullName} size={30} />
                          <div>
                            <p className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">{m.fullName}</p>
                            {m.major && <p className="text-[10px] text-plum-400 dark:text-[#b0b3b8]">{m.major}</p>}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'grid h-4 w-4 place-items-center rounded-full border transition-all',
                            isSelected
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-plum-300 dark:border-gray-600'
                          )}
                        >
                          {isSelected && <Check size={10} />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex w-full max-w-xs items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={removeMemberMutation.isPending}
                    className="flex-1 rounded-xl bg-plum-900/5 py-2.5 text-xs font-semibold text-plum-700 transition-colors hover:bg-plum-900/10 disabled:opacity-50 dark:bg-[#3a3b3c] dark:text-[#e4e6eb] dark:hover:bg-[#4e4f50]"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={!selectedNewAdminId || removeMemberMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/25 transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                  >
                    {removeMemberMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <LogOut size={14} />
                    )}
                    Chuyển & Rời nhóm
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Avatar / Icon preview */}
                <div className="relative mb-3.5">
                  {confirmAction.type === 'remove' ? (
                    <>
                      <div className="h-16 w-16 overflow-hidden rounded-2xl ring-4 ring-rose-100 shadow-md dark:ring-rose-900/30">
                        <Avatar
                          src={confirmAction.userAvatar || undefined}
                          name={confirmAction.userName}
                          size={64}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-white dark:ring-[#242526]">
                        <UserX size={12} />
                      </div>
                    </>
                  ) : confirmAction.type === 'disband' ? (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm ring-8 ring-rose-500/10 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-500/10">
                      <Trash2 size={26} />
                    </div>
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm ring-8 ring-rose-500/10 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-500/10">
                      <LogOut size={26} />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-base font-bold text-plum-900 dark:text-[#f0f2f5]">
                  {confirmAction.type === 'remove'
                    ? 'Xóa thành viên?'
                    : confirmAction.type === 'disband'
                    ? 'Giải tán nhóm trò chuyện?'
                    : 'Rời nhóm?'}
                </h4>

                {/* Message */}
                <p className="mt-1.5 max-w-xs text-xs text-plum-500 dark:text-[#b0b3b8]">
                  {confirmAction.type === 'remove' ? (
                    <>
                      Xóa <strong className="font-semibold text-plum-900 dark:text-white">{confirmAction.userName}</strong> khỏi nhóm này?
                    </>
                  ) : confirmAction.type === 'disband' ? (
                    <>
                      Bạn có chắc muốn giải tán nhóm <strong className="font-semibold text-plum-900 dark:text-white">{confirmAction.userName}</strong>? Toàn bộ tin nhắn và lịch sử trò chuyện sẽ bị xóa vĩnh viễn.
                    </>
                  ) : (
                    'Bạn có chắc muốn rời nhóm này?'
                  )}
                </p>

                {/* Action buttons */}
                <div className="mt-5 flex w-full max-w-xs items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={removeMemberMutation.isPending || deleteConversationMutation.isPending}
                    className="flex-1 rounded-xl bg-plum-900/5 py-2.5 text-xs font-semibold text-plum-700 transition-colors hover:bg-plum-900/10 disabled:opacity-50 dark:bg-[#3a3b3c] dark:text-[#e4e6eb] dark:hover:bg-[#4e4f50]"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={removeMemberMutation.isPending || deleteConversationMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/25 transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                  >
                    {(removeMemberMutation.isPending || deleteConversationMutation.isPending) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : confirmAction.type === 'remove' ? (
                      <UserX size={14} />
                    ) : confirmAction.type === 'disband' ? (
                      <Trash2 size={14} />
                    ) : (
                      <LogOut size={14} />
                    )}
                    {confirmAction.type === 'remove'
                      ? 'Xóa'
                      : confirmAction.type === 'disband'
                      ? 'Giải tán nhóm'
                      : 'Rời nhóm'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
