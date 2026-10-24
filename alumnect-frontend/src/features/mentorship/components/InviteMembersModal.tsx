import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, X, Loader2, CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { Card, toast, Avatar, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { mentoringGroupApi } from '../api/mentoringGroupApi'
import type { MentoringGroupData, MentoringGroupMemberData } from '../model/mentoringRequestTypes'
import { useSearchUsers } from '@/features/user'

interface InviteMembersModalProps {
  isOpen: boolean
  onClose: () => void
  group?: MentoringGroupData | null
  groupId?: number
  groupName?: string
  existingMembers?: MentoringGroupMemberData[]
  onInviteSuccess?: () => void
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  group,
  groupId,
  groupName,
  existingMembers = [],
  onInviteSuccess,
}) => {
  const queryClient = useQueryClient()
  const effectiveGroupId = group?.id || groupId || 0
  const effectiveGroupName = group?.name || groupName || ''
  const effectiveMembers = group?.members || existingMembers || []
  const effectiveLeaderId = group?.leaderId

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const { data: searchResults, isFetching: isSearching } = useSearchUsers(
    { query: debouncedSearch, page: 0, size: 8 },
    { enabled: isOpen && debouncedSearch.length >= 2 }
  )

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => mentoringGroupApi.invite(effectiveGroupId, [userId]),
    onSuccess: () => {
      toast.success('Đã gửi lời mời thành công!')
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      onInviteSuccess?.()
      setInvitingUserId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi lời mời')
      setInvitingUserId(null)
    },
  })

  if (!isOpen) return null

  const candidates = searchResults?.content || []

  const handleInvite = (userId: number) => {
    setInvitingUserId(userId)
    inviteMutation.mutate(userId)
  }

  const getMemberStatus = (userId: number) => {
    if (effectiveLeaderId && userId === effectiveLeaderId) return 'LEADER'
    const member = effectiveMembers.find((m) => m.userId === userId)
    return member ? member.status : 'NOT_MEMBER'
  }

  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-50"
      maxWidthClassName="max-w-lg"
      className="fade-in zoom-in-95 duration-150"
    >
        <Card hover={false} className="border border-border-strong p-6 shadow-2xl dark:bg-surface">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary-solid">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">Mời thành viên vào nhóm</h2>
                <p className="text-xs text-text-subtle truncate max-w-[280px]">{effectiveGroupName}</p>
              </div>
            </div>
            <button aria-label="Đóng"
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text-muted"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm sinh viên hoặc cựu sinh viên theo tên hoặc email..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm sinh viên hoặc cựu sinh viên theo tên hoặc email..."
                className="w-full rounded-xl border border-border-strong py-2.5 pl-10 pr-3.5 text-xs text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:bg-bg"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary-solid" />
              )}
            </div>
            <p className="mt-1.5 text-xs text-text-subtle">
              Nhập tối thiểu 2 ký tự để tìm kiếm người dùng trong hệ thống
            </p>
          </div>

          {/* Results list */}
          <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
            {debouncedSearch.length < 2 ? (
              <div className="py-8 text-center text-xs text-text-subtle">
                Hãy nhập tên hoặc email người bạn muốn mời
              </div>
            ) : isSearching && candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-subtle">Đang tìm kiếm...</div>
            ) : candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-subtle">Không tìm thấy người dùng phù hợp</div>
            ) : (
              candidates.map((candidate) => {
                const status = getMemberStatus(candidate.userId)
                const isInvitingThis = invitingUserId === candidate.userId

                return (
                  <div
                    key={candidate.userId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-2 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={candidate.avatarUrl || undefined}
                        name={candidate.fullName}
                        size={38}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-text">
                          {candidate.fullName}
                        </p>
                        <p className="truncate text-xs text-text-subtle">
                          {candidate.email}
                        </p>
                        {candidate.major && (
                          <span className="inline-block rounded-md bg-surface-3 px-1.5 py-0.5 text-xs font-medium text-text-muted mt-0.5">
                            {typeof candidate.major === 'object' && candidate.major !== null
                              ? (candidate.major as { name?: string }).name || ''
                              : String(candidate.major)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {status === 'LEADER' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-solid">
                          Trưởng nhóm
                        </span>
                      ) : status === 'JOINED' || status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                          <CheckCircle2 size={13} /> Đã tham gia
                        </span>
                      ) : status === 'PENDING' || status === 'INVITED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">
                          <Clock size={13} /> Đang chờ
                        </span>
                      ) : status === 'DECLINED' || status === 'REMOVED' || status === 'CANCELLED' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isInvitingThis}
                          onClick={() => handleInvite(candidate.userId)}
                          leftIcon={isInvitingThis ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        >
                          Mời lại
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isInvitingThis}
                          onClick={() => handleInvite(candidate.userId)}
                          leftIcon={isInvitingThis ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                        >
                          Mời
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-text-subtle">
              Đang có {effectiveMembers.filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length}/{group?.maxMembers || 10} thành viên
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </Card>
      </DialogFrame>
  )
}
