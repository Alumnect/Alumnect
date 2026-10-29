import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Crown, Globe, Lock, MessagesSquare, Share2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Badge, Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { ShareModal } from '@/features/feed/components/ShareModal'
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
  const { t, i18n } = useTranslation()
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const navigate = useNavigate()
  const createChatMut = useCreateGroupChat()
  const joinChatMut = useJoinGroupChat()

  const isPrivate = group.privacy === 'PRIVATE'
  const createdDate = group.createdAt ? new Date(group.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') : ''
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
        toast.success(t('groups.joinedChatSuccess'))
        navigate(`/app/messages?conversationId=${res.conversationId}`)
      },
      onError: (err) => {
        toast.error((err as Error)?.message || t('groups.joinedChatError'))
      },
    })
  }

  const handleCreateChat = () => {
    createChatMut.mutate(group.id, {
      onSuccess: (res) => {
        toast.success(t('groups.createdChatSuccess'))
        navigate(`/app/messages?conversationId=${res.conversationId}`)
      },
      onError: (err) => {
        toast.error((err as Error)?.message || t('groups.createdChatError'))
      },
    })
  }

  return (
    <Card hover={false} className="overflow-hidden rounded-3xl border border-border p-0 shadow-card dark:bg-surface">
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
                <Badge tone="violet" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {t(`groups.categories.${group.category}`, { defaultValue: categoryLabel(group.category) })}
                </Badge>
                <Badge
                  tone={isPrivate ? 'gold' : 'aqua'}
                  icon={isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                >
                  {isPrivate ? t('groups.private') : t('groups.public')}
                </Badge>
                {group.status === 'INACTIVE' && (
                  <Badge tone="neutral" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {t('groups.pausedBadge')}
                  </Badge>
                )}
              </div>

              <h1 className="mt-1.5 break-words text-2xl font-black leading-tight tracking-tight text-text sm:text-3xl">
                {group.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-subtle">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users size={16} className="text-primary-solid" />
                  <strong className="text-text">{group.memberCount}</strong> {t('groups.members')}
                </span>

                {createdDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={15} /> {t('groups.established', { date: createdDate })}
                  </span>
                )}

                {group.owner && (
                  <Link
                    to={`/app/profile?userId=${group.owner.userId}`}
                    className="inline-flex min-w-0 items-center gap-1.5 font-medium text-text-muted transition-colors hover:text-primary-solid"
                  >
                    <Crown size={15} className="shrink-0 text-warning" />
                    <Avatar src={group.owner.avatarUrl ?? ''} name={group.owner.fullName} size={20} />
                    <span className="truncate">{group.owner.fullName}</span>
                    <span className="hidden shrink-0 text-xs text-text-subtle sm:inline">{t('groups.founderBadge')}</span>
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
                    {t('groups.chatBtn')}
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
                    {joinChatMut.isPending ? t('groups.joiningChat') : t('groups.joinChatBtn')}
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
                    className="rounded-xl border border-primary-soft-border bg-brand-50/70 text-primary-solid hover:bg-primary-soft dark:bg-brand-500/10"
                  >
                    {createChatMut.isPending ? t('groups.creatingChat') : t('groups.createChatBtn')}
                  </Button>
                )
              )
            )}

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Share2 size={16} />}
              onClick={() => setShareModalOpen(true)}
              className="rounded-xl border border-border bg-surface-2"
            >
              {t('groups.share')}
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
            subtitle: `${group.memberCount} ${t('groups.members')} • ${group.description || 'AlumNect'}`,
            thumbnail: group.coverImageUrl,
            url: `${window.location.origin}/app/groups/${group.id}`,
            typeLabel: t('groups.groupNoun'),
          }}
        />
      )}
    </Card>
  )
}
