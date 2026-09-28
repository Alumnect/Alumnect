import { Link } from 'react-router-dom'
import { Globe, Lock, Users } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { categoryLabel } from '../model/group'
import type { GroupCard as GroupCardData } from '../model/group'
import { GroupCover } from './GroupCover'
import { GroupMembershipActions } from './GroupMembershipActions'

/** Thẻ hội nhóm (Group Card) trong danh sách: ảnh bìa đồng nhất, mô tả giới hạn 2 dòng, nút thao tác theo trạng thái tham gia. */
export function GroupCard({ group }: { group: GroupCardData }) {
  const isPrivate = group.privacy === 'PRIVATE'
  const detailPath = `/app/groups/${group.id}`

  return (
    <Card hover className="flex h-full flex-col p-0">
      <Link to={detailPath} className="block" aria-label={`Xem hội nhóm ${group.name}`}>
        <GroupCover url={group.coverImageUrl} name={group.name} />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="violet" className="px-2 py-0.5 text-[10px]">
            {categoryLabel(group.category)}
          </Badge>
          <Badge tone={isPrivate ? 'gold' : 'aqua'} icon={isPrivate ? <Lock size={10} /> : <Globe size={10} />} className="px-2 py-0.5 text-[10px]">
            {isPrivate ? 'Riêng tư' : 'Công khai'}
          </Badge>
          {group.status === 'INACTIVE' && (
            <Badge tone="neutral" className="px-2 py-0.5 text-[10px]">
              Tạm ngừng
            </Badge>
          )}
        </div>

        <Link to={detailPath}>
          <h3 className="line-clamp-1 text-base font-bold leading-snug text-plum-900 transition-colors hover:text-brand-600">{group.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-plum-500">{group.shortDescription}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-plum-500">
            <Users size={15} /> {group.memberCount} thành viên
          </span>
          <GroupMembershipActions group={group} size="sm" />
        </div>
      </div>
    </Card>
  )
}
