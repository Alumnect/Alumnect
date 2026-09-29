import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, Crown, Globe, Lock, Share2, Users } from 'lucide-react'
import { Avatar, Badge, Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { categoryLabel } from '../model/group'
import type { GroupDetail } from '../model/group'
import { GroupCover } from './GroupCover'
import { GroupMembershipActions } from './GroupMembershipActions'

/** Phần đầu trang chi tiết hội nhóm theo phong cách Threads/Reddit: ảnh bìa trải rộng, huy hiệu nhóm nổi, nút chia sẻ và thao tác thành viên. */
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
  const initial = (group.name || 'G').trim().charAt(0).toUpperCase()

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
      {/* Khung ảnh bìa tỷ lệ hiện đại */}
      <div className="relative">
        <GroupCover url={group.coverImageUrl} name={group.name} aspect="aspect-[21/8] min-h-[160px] sm:min-h-[220px]" />

        {/* Gradient mờ chân ảnh bìa để làm nổi emblem */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="px-5 pb-6 pt-0 sm:px-8">
        {/* Hàng chứa Emblem đại diện nổi lên 50% ảnh bìa & Các nút thao tác */}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          {/* Emblem tròn/squircle của nhóm */}
          <div className="-mt-10 sm:-mt-14 relative z-10 flex items-end gap-3.5">
            <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-3xl bg-gradient-to-tr from-brand-500 via-coral-500 to-gold-400 text-2xl sm:text-3xl font-black text-white shadow-soft ring-4 ring-white dark:ring-[#242526]">
              {initial}
            </div>

            <div className="mb-1 hidden sm:flex flex-wrap items-center gap-1.5">
              <Badge tone="violet" className="rounded-full px-3 py-0.5 text-xs font-bold">
                {categoryLabel(group.category)}
              </Badge>
              <Badge
                tone={isPrivate ? 'gold' : 'aqua'}
                icon={isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                className="rounded-full px-3 py-0.5 text-xs font-bold"
              >
                {isPrivate ? 'Riêng tư' : 'Công khai'}
              </Badge>
              {group.status === 'INACTIVE' && (
                <Badge tone="neutral" className="rounded-full px-3 py-0.5 text-xs font-bold">
                  Tạm ngừng
                </Badge>
              )}
            </div>
          </div>

          {/* Nhóm nút thao tác chính: Chia sẻ + Tham gia / Quản lý / Rời */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
              onClick={handleShare}
              className="rounded-xl border border-plum-900/10 bg-plum-900/[0.03] dark:border-[#393a3b] dark:bg-[#3a3b3c]"
            >
              {copied ? 'Đã chép link' : 'Chia sẻ'}
            </Button>

            <GroupMembershipActions group={group} size="md" onLeave={onLeave} hideManageButton={true} />
          </div>
        </div>

        {/* Badges hiển thị trên màn hình nhỏ */}
        <div className="mt-3 flex sm:hidden flex-wrap items-center gap-1.5">
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

        {/* Tên nhóm & Thông tin chi tiết */}
        <div className="mt-3">
          <h1 className="text-2xl font-black tracking-tight text-plum-900 sm:text-3xl dark:text-white">
            {group.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-plum-500 dark:text-[#b0b3b8]">
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
                className="inline-flex items-center gap-1.5 font-medium text-plum-700 transition-colors hover:text-brand-600 dark:text-plum-300 dark:hover:text-brand-400"
              >
                <Crown size={15} className="text-amber-500" />
                <Avatar src={group.owner.avatarUrl ?? ''} name={group.owner.fullName} size={20} />
                <span>{group.owner.fullName}</span>
                <span className="text-xs text-plum-400 dark:text-[#b0b3b8]">(Người sáng lập)</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
