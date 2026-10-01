import { PenSquare } from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import type { GroupDetail } from '../model/group'

interface GroupSidebarInfoProps {
  group: GroupDetail
  isActiveMember: boolean
}

export function GroupSidebarInfo({ group: _group }: GroupSidebarInfoProps) {
  return (
    <aside className="sticky top-20">
      <Card
        hover={false}
        className="rounded-3xl border border-plum-900/[0.08] bg-white p-5 shadow-sm dark:border-[#393a3b] dark:bg-[#242526]"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <PenSquare size={16} />
          </div>
          <h3 className="font-bold text-sm text-plum-900 dark:text-white">
            Đóng góp cho cộng đồng
          </h3>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
          Cảm ơn bạn đã đồng hành. Mỗi chia sẻ và thảo luận của bạn đều giúp cộng đồng ngày càng phát triển.
        </p>
      </Card>
    </aside>
  )
}
