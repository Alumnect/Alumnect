import { Link } from 'react-router-dom'
import { Globe, Lock, Users } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { categoryLabel } from '../model/group'
import type { GroupCard as GroupCardData } from '../model/group'
import { GroupCover } from './GroupCover'
import { GroupMembershipActions } from './GroupMembershipActions'

/** Thẻ hội nhóm (Group Card) theo phong cách Threads/Instagram hiện đại: ảnh bìa góc bo lớn, huy hiệu nổi, minh chứng cộng đồng và nút thao tác nhanh. */
export function GroupCard({ group }: { group: GroupCardData }) {
  const isPrivate = group.privacy === 'PRIVATE'
  const detailPath = `/app/groups/${group.id}`
  const initial = (group.name || 'G').trim().charAt(0).toUpperCase()

  return (
    <Card hover className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-plum-900/[0.08] p-0 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      {/* Khung ảnh bìa với huy hiệu nổi trên ảnh */}
      <Link to={detailPath} className="relative block overflow-hidden" aria-label={`Xem hội nhóm ${group.name}`}>
        <GroupCover url={group.coverImageUrl} name={group.name} aspect="aspect-[16/9]" />

        {/* Badges kính mờ nổi trên góc ảnh bìa */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-bold text-plum-900 shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-white">
            {categoryLabel(group.category)}
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md ${
              isPrivate
                ? 'bg-amber-500/85 text-white dark:bg-amber-600/80'
                : 'bg-emerald-600/85 text-white dark:bg-emerald-700/80'
            }`}
          >
            {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
            {isPrivate ? 'Riêng tư' : 'Công khai'}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 pt-3">
        {/* Emblem/Avatar đại diện của nhóm đè nhẹ cạnh ảnh bìa */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-brand-500 to-coral-400 text-sm font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-[#242526]">
              {initial}
            </div>
            {group.status === 'INACTIVE' && (
              <Badge tone="neutral" className="px-2 py-0.5 text-[10px]">
                Tạm ngừng
              </Badge>
            )}
          </div>
        </div>

        {/* Tiêu đề & Mô tả */}
        <Link to={detailPath} className="group/title block">
          <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-plum-900 transition-colors group-hover/title:text-brand-600 dark:text-white dark:group-hover/title:text-brand-400">
            {group.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
          {group.shortDescription}
        </p>

        {/* Phần minh chứng xã hội (Social Proof) & Nút tham gia */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-plum-900/[0.06] pt-4 dark:border-[#393a3b]">
          <div className="flex items-center gap-2">
            {/* Cụm avatar mini chồng lớp (Stack) */}
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 ring-2 ring-white dark:bg-brand-900 dark:text-brand-300 dark:ring-[#242526]">
                {initial}
              </span>
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 ring-2 ring-white dark:bg-violet-900 dark:text-violet-300 dark:ring-[#242526]">
                <Users size={11} />
              </span>
            </div>
            <span className="text-xs font-semibold text-plum-600 dark:text-[#b0b3b8]">
              {group.memberCount} thành viên
            </span>
          </div>

          <GroupMembershipActions group={group} size="sm" />
        </div>
      </div>
    </Card>
  )
}
