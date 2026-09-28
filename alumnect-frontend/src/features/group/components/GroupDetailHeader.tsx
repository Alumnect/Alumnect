import { Link } from 'react-router-dom'
import { CalendarDays, Crown, Globe, Lock, Users } from 'lucide-react'
import { Avatar, Badge, Card } from '@/components/ui'
import { categoryLabel } from '../model/group'
import type { GroupDetail } from '../model/group'
import { GroupCover } from './GroupCover'
import { GroupMembershipActions } from './GroupMembershipActions'

/** Phần đầu trang chi tiết hội nhóm: ảnh bìa, tên, nhãn, số liệu, người sáng lập và nhóm nút thao tác theo quyền người xem. */
export function GroupDetailHeader({ group, onManage, onLeave }: { group: GroupDetail; onManage: () => void; onLeave: () => void }) {
  const isPrivate = group.privacy === 'PRIVATE'
  const createdDate = group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : ''

  return (
    <Card hover={false} className="p-0">
      <GroupCover url={group.coverImageUrl} name={group.name} className="aspect-[21/8]" />

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Badge tone="violet">{categoryLabel(group.category)}</Badge>
          <Badge tone={isPrivate ? 'gold' : 'aqua'} icon={isPrivate ? <Lock size={11} /> : <Globe size={11} />}>
            {isPrivate ? 'Riêng tư' : 'Công khai'}
          </Badge>
          {group.status === 'INACTIVE' && <Badge tone="neutral">Tạm ngừng hoạt động</Badge>}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold leading-tight text-plum-900 sm:text-3xl">{group.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-plum-500">
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} /> {group.memberCount} thành viên
              </span>
              {createdDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} /> Thành lập {createdDate}
                </span>
              )}
              {group.owner && (
                <Link to={`/app/profile?userId=${group.owner.userId}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                  <Crown size={15} className="text-amber-500" />
                  <Avatar src={group.owner.avatarUrl ?? ''} name={group.owner.fullName} size={20} />
                  <span className="font-medium text-plum-700">{group.owner.fullName}</span>
                </Link>
              )}
            </div>
          </div>

          <GroupMembershipActions group={group} size="md" onManage={onManage} onLeave={onLeave} />
        </div>
      </div>
    </Card>
  )
}
