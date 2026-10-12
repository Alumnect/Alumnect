import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Crown, Globe, Lock, MessagesSquare, Share2, Users } from 'lucide-react'
import { Avatar, Badge, Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { ShareModal } from '@/features/feed'
import { categoryLabel } from '../model/group'
import type { GroupDetail } from '../model/group'
import { useCreateGroupChat, useJoinGroupChat } from '../hooks/useGroupActions'
import { GroupCover } from './GroupCover'
import { GroupMembershipActions } from './GroupMembershipActions'

/** Ảnh bìa gọn, thông tin nhóm và thao tác thành viên trong phần nội dung bên dưới. */
export function GroupDetailHeader({
  group,
  onLeave,
}: {
  group: GroupDetail
  onManage?: () => void
  onLeave: () => void
}) {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const navigate = useNavigate()
  const createChatMut = useCreateGroupChat()
  const joinChatMut = useJoinGroupChat()

  const isPrivate = group.privacy === 'PRIVATE'
  const createdDate = group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : ''
  const isActiveMember = group.viewerMembershipStatus === 'ACTIVE'
  const isOwner = group.viewerRole === 'OWNER'

  const handleOpenChat = () => {
    if (group.conversationId) {
      navigate(`/app/messages?conversationId=${group.conversationId}`)
    }
  }

  const handleJoinChat = () => {
    joinChatMut.mutate(group.id, {
      onSuccess: (res) => {
        toast.success('Đã tham gia nhóm trò chuyện!')
        navigate(`/app/messages?conversationId=${res.conversationId}`)
      },
      onError: (err) => {
        toast.error((err as Error)?.message || 'Không thể tham gia nhóm trò chuyện, vui lòng thử lại.')
      },
    })
  }

  const handleCreateChat = () => {
    createChatMut.mutate(group.id, {
      onSuccess: (res) => {
        toast.success('Khởi tạo nhóm trò chuyện thành công!')
        navigate(`/app/messages?conversationId=${res.conversationId}`)
      },
      onError: (err) => {
        toast.error((err as Error)?.message || 'Không thể tạo nhóm trò chuyện, vui lòng thử lại.')
      },
    })
  }

  return (
    <Card hover={false} className="overflow-hidden rounded-3xl border border-plum-900/[0.08] p-0 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <GroupCover
        url={group.coverImageUrl}
        name={group.name}
        aspect="h-40 sm:h-52 lg:h-64 xl:h-72"
        fit="contain"
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="violet" className="rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                  {categoryLabel(group.category)}
                </Badge>
                <Badge
                  tone={isPrivate ? 'gold' : 'aqua'}
                  icon={isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                >
                  {isPrivate ? 'Riêng tư' : 'Công khai'}
                </Badge>
                {group.status === 'INACTIVE' && (
                  <Badge tone="neutral" className="rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                    Tạm ngừng
                  </Badge>
                )}
              </div>

              <h1 className="mt-1.5 break-words text-2xl font-black leading-tight tracking-tight text-plum-900 sm:text-3xl dark:text-white">
                {group.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-plum-500 dark:text-[#b0b3b8]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users size={16} className="text-brand-500" />
                  <strong className="text-plum-900 dark:text-white">{group.memberCount}</strong> thành viên
                </span>

                {createdDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={15} /> Thành lập {createdDate}
                  </span>
                )}

                {group.owner && (
                  <Link
                    to={`/app/profile?userId=${group.owner.userId}`}
                    className="inline-flex min-w-0 items-center gap-1.5 font-medium text-plum-700 transition-colors hover:text-brand-600 dark:text-plum-300 dark:hover:text-brand-400"
                  >
                    <Crown size={15} className="shrink-0 text-amber-500" />
                    <Avatar src={group.owner.avatarUrl ?? ''} name={group.owner.fullName} size={20} />
                    <span className="truncate">{group.owner.fullName}</span>
                    <span className="hidden shrink-0 text-xs text-plum-400 sm:inline dark:text-[#b0b3b8]">(Người sáng lập)</span>
                  </Link>
                )}
              </div>
            </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            {/* Nút Nhắn tin nhóm / Tham gia nhóm chat / Tạo nhóm chat */}
            {isActiveMember && (
              group.conversationId ? (
                group.isConversationMember ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<MessagesSquare size={16} />}
                    onClick={handleOpenChat}
                    className="rounded-xl shadow-xs"
                  >
                    Nhắn tin nhóm
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<MessagesSquare size={16} />}
                    onClick={handleJoinChat}
                    disabled={joinChatMut.isPending}
                    className="rounded-xl shadow-xs"
                  >
                    {joinChatMut.isPending ? 'Đang tham gia...' : 'Tham gia nhóm chat'}
                  </Button>
                )
              ) : (
                isOwner && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<MessagesSquare size={16} />}
                    onClick={handleCreateChat}
                    disabled={createChatMut.isPending}
                    className="rounded-xl border border-brand-500/20 bg-brand-50/70 text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {createChatMut.isPending ? 'Đang khởi tạo...' : 'Tạo nhóm chat'}
                  </Button>
                )
              )
            )}

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Share2 size={16} />}
              onClick={() => setShareModalOpen(true)}
              className="rounded-xl border border-plum-900/10 bg-plum-900/[0.03] dark:border-[#393a3b] dark:bg-[#3a3b3c]"
            >
              Chia sẻ
            </Button>

            <GroupMembershipActions group={group} size="sm" onLeave={onLeave} hideManageButton={true} />
          </div>
        </div>
      </div>

      {/* Modal chia sẻ hội nhóm cao cấp chuẩn Bảng tin */}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareItem={{
            title: group.name,
            subtitle: `${group.memberCount} thành viên • ${group.description || 'Hội nhóm trên AlumNect'}`,
            thumbnail: group.coverImageUrl,
            url: `${window.location.origin}/app/groups/${group.id}`,
            typeLabel: 'hội nhóm',
          }}
        />
      )}
    </Card>
  )
}
