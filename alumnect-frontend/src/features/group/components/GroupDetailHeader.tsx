import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, Crown, Globe, Lock, Share2, Users } from 'lucide-react'
import { Avatar, Badge, Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { categoryLabel } from '../model/group'
import type { GroupDetail } from '../model/group'
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
  const [copied, setCopied] = useState(false)
  const isPrivate = group.privacy === 'PRIVATE'
  const createdDate = group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : ''

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast.success('Đã sao chép liên kết hội nhóm vào bộ nhớ tạm!')
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      toast.info('Vui lòng sao chép đường dẫn trên thanh địa chỉ trình duyệt.')
    }
  }

  return (
    <Card hover={false} className="overflow-hidden rounded-3xl border border-plum-900/[0.08] p-0 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <GroupCover url={group.coverImageUrl} name={group.name} aspect="h-32 sm:h-44 lg:h-48" />

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
            <Button
              variant="secondary"
              size="sm"
              leftIcon={copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
              onClick={handleShare}
              className="rounded-xl border border-plum-900/10 bg-plum-900/[0.03] dark:border-[#393a3b] dark:bg-[#3a3b3c]"
            >
              {copied ? 'Đã chép link' : 'Chia sẻ'}
            </Button>

            <GroupMembershipActions group={group} size="sm" onLeave={onLeave} hideManageButton={true} />
          </div>
        </div>
      </div>
    </Card>
  )
}
