import { useState, useRef, useEffect } from 'react'
import { X, Users, UserPlus, LogOut, ShieldCheck, UserX, Edit2, Check, Loader2, Camera, Crown, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, toast, DialogFrame } from '@/components/ui'
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
  const { t } = useTranslation()
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
      toast.error(t('messages.groupAvatarError', 'Không thể tải ảnh đại diện nhóm lên. Vui lòng thử lại.'))
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
    toast.success(t('messages.groupUpdatedSuccess', 'Đã cập nhật tên nhóm'))
  }

  // Cập nhật từ khóa tìm kiếm thành viên
  const handleSearchAdd = (kw: string) => {
    setSearchAdd(kw)
  }

  // Thêm thành viên
  const handleAddUser = async (targetUserId: number) => {
    try {
      const res = await addMembersMutation.mutateAsync({
        conversationId: conversationId!,
        payload: { memberIds: [targetUserId] },
      })
      if (onConversationUpdated && res?.data) {
        onConversationUpdated(res.data)
      }
      setAddCandidates((prev) => prev.filter((u) => u.userId !== targetUserId))
      toast.success(t('messages.memberAddedSuccess', 'Đã thêm thành viên vào nhóm'))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('messages.cannotAddMemberError', 'Không thể thêm thành viên'))
    }
  }

  // Bấm nút rời nhóm: Nếu là admin và còn thành viên khác thì mở giao diện chọn admin mới (trừ nhóm chat hội nhóm)
  const handleLeaveClick = () => {
    if (isCommunityOwner) {
      toast.error(t('messages.ownerCannotLeave', 'Bạn là Chủ sở hữu hội nhóm nên không thể rời nhóm trò chuyện này.'))
      return
    }
    if (isCommunityGroup) {
      setConfirmAction({
        type: 'leave',
        userId: Number(currentUserId) || 0,
        userName: t('messages.you', 'Bạn'),
      })
      return
    }
    if (isAdmin && otherMembers.length > 0) {
      setSelectedNewAdminId(otherMembers[0]?.userId ?? null)
      setConfirmAction({
        type: 'transfer_and_leave',
        userId: Number(currentUserId) || 0,
        userName: t('messages.you', 'Bạn'),
      })
    } else {
      setConfirmAction({
        type: 'leave',
        userId: Number(currentUserId) || 0,
        userName: t('messages.you', 'Bạn'),
      })
    }
  }

  // Bấm nút giải tán nhóm (chỉ dành cho Chủ sở hữu / Trưởng nhóm)
  const handleDisbandClick = () => {
    setConfirmAction({
      type: 'disband',
      userId: Number(currentUserId) || 0,
      userName: conversation.title || t('messages.chatGroup', 'Nhóm trò chuyện'),
    })
  }

  // Thực hiện xóa, rời nhóm hoặc giải tán nhóm qua Modal xác nhận
  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, userId } = confirmAction

    if (type === 'disband') {
      try {
        await deleteConversationMutation.mutateAsync(conversationId!)
        toast.success(t('messages.groupDisbandedSuccess', 'Đã giải tán nhóm trò chuyện thành công'))
        setConfirmAction(null)
        onLeftGroup()
        onClose()
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || t('messages.groupDisbandError', 'Có lỗi xảy ra khi giải tán nhóm'))
      }
      return
    }

    try {
      const newAdminId = type === 'transfer_and_leave' ? (selectedNewAdminId ?? undefined) : undefined
      await removeMemberMutation.mutateAsync({ conversationId: conversationId!, userId, newAdminId })
      if (type === 'leave' || type === 'transfer_and_leave') {
        toast.success(t('messages.leftGroupSuccess', 'Đã rời khỏi nhóm'))
        setConfirmAction(null)
        onLeftGroup()
        onClose()
      } else {
        toast.success(t('messages.memberRemovedSuccess', 'Đã xóa thành viên khỏi nhóm'))
        setConfirmAction(null)
        if (onConversationUpdated) {
          onConversationUpdated({
            ...conversation,
            memberCount: Math.max(1, (conversation.memberCount || members.length) - 1),
          })
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('common.error', 'Có lỗi xảy ra, vui lòng thử lại'))
    }
  }

  if (!isOpen || !conversationId) return null

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[9999]"
      maxWidthClassName="max-w-md"
      className="flex flex-col overflow-hidden dark:text-text"
    >
        {/* Header - Cố định ở đỉnh modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary-solid">
              <Users size={16} />
            </div>
            <h3 className="text-sm font-bold text-text">{t('messages.groupInfoTitle', 'Thông tin nhóm')}</h3>
          </div>
          <button aria-label={t('common.close', 'Đóng')}
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung cuộn mượt mà bên trong, không bao giờ tràn màn hình */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 min-h-0">
          {/* Group Name & Stats */}
          <div className="mb-3 text-center">
            <div className="relative mx-auto mb-2 h-16 w-16 group">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-xl font-bold text-primary-solid shadow-inner ring-2 ring-primary/20">
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
                title={t('messages.changeGroupPhotoTitle', 'Đổi ảnh đại diện nhóm')}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 cursor-pointer disabled:pointer-events-none"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={16} className="mb-0.5" />
                    <span className="text-xs font-bold">{t('messages.changeGroupPhoto', 'Đổi ảnh')}</span>
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
                  className="h-8 w-full rounded-xl border border-primary px-3 text-xs font-bold text-text focus:outline-none dark:bg-surface-2"
                />
                <Button size="sm" onClick={handleSaveTitle} className="h-8 rounded-xl bg-primary-solid px-3">
                  <Check size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h4 className="text-sm font-bold text-text">{conversation.title}</h4>
                <button
                  onClick={() => {
                    setNewTitle(conversation.title || '')
                    setIsEditingTitle(true)
                  }}
                  className="text-text-subtle hover:text-primary-solid"
                  title={t('messages.renameGroupTitle', 'Đổi tên nhóm')}
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}

            <p className="mt-0.5 text-xs text-text-subtle">
              {t('messages.membersCount', { count: members.length })}
            </p>
          </div>

          {/* Members section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                {t('messages.membersHeader', { count: members.length })}
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
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-solid hover:underline"
            >
              <UserPlus size={13} />
              {isAddingMember ? t('messages.closeSearch', 'Đóng tìm kiếm') : t('messages.addMember', 'Thêm thành viên')}
            </button>
          </div>

          {/* Add member search panel */}
          {isAddingMember && (
            <div className="mb-3 rounded-2xl border border-primary-soft-border bg-primary-soft p-3">
              <input
                type="text"
                value={searchAdd}
                onChange={(e) => handleSearchAdd(e.target.value)}
                placeholder={t('messages.searchMemberToAdd', 'Nhập tên thành viên cần thêm...')}
                className="h-8 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text focus:outline-none"
              />
              {isSearchingAdd ? (
                <div className="flex justify-center py-2.5">
                  <Loader2 size={16} className="animate-spin text-primary-solid" />
                </div>
              ) : addCandidates.length > 0 ? (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-0.5">
                  {addCandidates.map((u) => (
                    <div
                      key={u.userId}
                      className="flex items-center justify-between rounded-lg bg-surface p-1.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatarUrl || undefined} name={u.fullName} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text">{u.fullName}</p>
                          <p className="truncate text-xs text-text-subtle">{u.headline || u.major || t('messages.memberRole', 'Thành viên')}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddUser(u.userId)}
                        className="h-6 shrink-0 rounded-lg bg-primary-solid px-2 text-xs text-on-primary hover:bg-primary-hover"
                      >
                        {t('common.add', 'Thêm')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchAdd.trim() ? (
                <p className="mt-2 text-center text-xs text-text-subtle">{t('messages.noMatchingMembers', 'Không tìm thấy thành viên phù hợp')}</p>
              ) : (
                <p className="mt-2 text-center text-xs text-text-subtle">{t('messages.noNewMembersToAdd', 'Không có thành viên mới để thêm')}</p>
              )}
            </div>
          )}

          {/* Member List */}
          <div className="no-scrollbar max-h-36 space-y-1.5 overflow-y-auto rounded-2xl border border-border p-1.5">
            {isLoadingMembers ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-primary-solid" />
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
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={m.avatar || undefined} name={m.fullName} size={30} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-text">
                            {m.fullName} {isMe && t('messages.youSuffix', '(Bạn)')}
                          </p>
                          {isUserAdmin && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-soft px-1.5 py-0.2 text-xs font-bold text-warning">
                              <ShieldCheck size={10} />
                              {t('messages.groupLeader', 'Trưởng nhóm')}
                            </span>
                          )}
                        </div>
                        {m.major && <p className="text-xs text-text-subtle">{m.major}</p>}
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
                        className="inline-flex items-center gap-1 rounded-lg border border-danger-border bg-danger-soft px-2 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger-border/60 hover:text-danger"
                        title={t('messages.removeMemberAria', 'Xóa thành viên khỏi nhóm')}
                      >
                        <UserX size={13} />
                        <span>{t('common.delete', 'Xóa')}</span>
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
        <div className="shrink-0 border-t border-border bg-surface-2 px-5 py-3 dark:bg-[#1f2021]/70">
          {isCommunityOwner ? (
            <button
              type="button"
              onClick={handleDisbandClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger-border bg-danger-soft py-2.5 text-xs font-bold text-danger shadow-sm transition hover:bg-danger-border/60 hover:text-danger active:scale-98"
            >
              <Trash2 size={14} />
              {t('messages.disbandGroup', 'Giải tán nhóm')}
            </button>
          ) : isAdmin && !isCommunityGroup ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleLeaveClick}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 py-2.5 px-3 text-xs font-bold text-text-muted transition hover:bg-border hover:text-text active:scale-98"
              >
                <LogOut size={14} className="text-text-subtle" />
                {t('messages.leaveGroup', 'Rời khỏi nhóm')}
              </button>
              <button
                type="button"
                onClick={handleDisbandClick}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-danger-border bg-danger-soft py-2.5 px-3 text-xs font-bold text-danger transition hover:bg-danger-border/60 hover:text-danger active:scale-98"
              >
                <Trash2 size={14} className="text-danger" />
                {t('messages.disbandGroup', 'Giải tán nhóm')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLeaveClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger-border bg-danger-soft py-2.5 text-xs font-bold text-danger transition hover:bg-danger-border/60 hover:text-danger active:scale-98"
            >
              <LogOut size={14} />
              {t('messages.leaveGroup', 'Rời khỏi nhóm')}
            </button>
          )}
        </div>

        {/* In-card Confirmation Overlay: Thiết kế tinh tế, không mở thêm cửa sổ modal thứ 2 */}
        {confirmAction && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl bg-surface p-6 text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {confirmAction.type === 'transfer_and_leave' ? (
              <>
                {/* Icon chỉ định trưởng nhóm */}
                <div className="relative mb-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-warning-soft text-warning shadow-sm ring-6 ring-warning">
                    <Crown size={28} />
                  </div>
                </div>

                <h4 className="text-base font-bold text-text">
                  {t('messages.assignLeaderTitle', 'Chỉ định Trưởng nhóm mới')}
                </h4>

                <p className="mt-1 max-w-xs text-xs text-text-subtle">
                  {t('messages.assignLeaderDesc', 'Bạn là trưởng nhóm. Hãy chọn người kế nhiệm trước khi rời nhóm:')}
                </p>

                {/* Danh sách thành viên để chọn */}
                <div className="my-3.5 max-h-40 w-full max-w-xs space-y-1.5 overflow-y-auto rounded-2xl border border-border p-1.5 text-left">
                  {otherMembers.map((m) => {
                    const isSelected = selectedNewAdminId === m.userId
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => setSelectedNewAdminId(m.userId)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 transition text-left',
                          isSelected
                            ? 'bg-warning-soft text-warning ring-1 ring-warning'
                            : 'hover:bg-surface-2'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={m.avatar || undefined} name={m.fullName} size={30} />
                          <div>
                            <p className="text-xs font-bold text-text">{m.fullName}</p>
                            {m.major && <p className="text-xs text-text-subtle">{m.major}</p>}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'grid h-4 w-4 place-items-center rounded-full border transition',
                            isSelected
                              ? 'border-warning bg-warning text-text-inverse'
                              : 'border-border-strong'
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
                    className="flex-1 rounded-xl bg-surface-2 py-2.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-3 disabled:opacity-50"
                  >
                    {t('common.cancel', 'Hủy')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={!selectedNewAdminId || removeMemberMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-danger py-2.5 text-xs font-semibold text-text-inverse shadow-md shadow-rose-600/25 transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {removeMemberMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <LogOut size={14} />
                    )}
                    {t('messages.transferAndLeaveChat', 'Chuyển & Rời nhóm')}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Avatar / Icon preview */}
                <div className="relative mb-3.5">
                  {confirmAction.type === 'remove' ? (
                    <>
                      <div className="h-16 w-16 overflow-hidden rounded-2xl ring-4 ring-danger-border shadow-md">
                        <Avatar
                          src={confirmAction.userAvatar || undefined}
                          name={confirmAction.userName}
                          size={64}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-danger text-text-inverse shadow-sm ring-2 ring-surface">
                        <UserX size={12} />
                      </div>
                    </>
                  ) : confirmAction.type === 'disband' ? (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-danger-soft text-danger shadow-sm ring-8 ring-danger">
                      <Trash2 size={26} />
                    </div>
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-danger-soft text-danger shadow-sm ring-8 ring-danger">
                      <LogOut size={26} />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-base font-bold text-text">
                  {confirmAction.type === 'remove'
                    ? t('messages.removeMemberPrompt', 'Xóa thành viên?')
                    : confirmAction.type === 'disband'
                    ? t('messages.disbandGroupPrompt', 'Giải tán nhóm trò chuyện?')
                    : t('messages.leaveGroupPrompt', 'Rời nhóm?')}
                </h4>

                {/* Message */}
                <p className="mt-1.5 max-w-xs text-xs text-text-subtle">
                  {confirmAction.type === 'remove' ? (
                    t('messages.removeMemberConfirmFull', { name: confirmAction.userName })
                  ) : confirmAction.type === 'disband' ? (
                    t('messages.disbandGroupConfirmFull', { name: confirmAction.userName })
                  ) : (
                    t('messages.leaveGroupConfirmFull', 'Bạn có chắc muốn rời nhóm này?')
                  )}
                </p>

                {/* Action buttons */}
                <div className="mt-5 flex w-full max-w-xs items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={removeMemberMutation.isPending || deleteConversationMutation.isPending}
                    className="flex-1 rounded-xl bg-surface-2 py-2.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-3 disabled:opacity-50"
                  >
                    {t('common.cancel', 'Hủy')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={removeMemberMutation.isPending || deleteConversationMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-danger py-2.5 text-xs font-semibold text-text-inverse shadow-md shadow-rose-600/25 transition hover:opacity-90 active:scale-95 disabled:opacity-50"
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
                      ? t('common.delete', 'Xóa')
                      : confirmAction.type === 'disband'
                      ? t('messages.disbandGroup', 'Giải tán nhóm')
                      : t('messages.leaveGroup', 'Rời khỏi nhóm')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogFrame>
}
