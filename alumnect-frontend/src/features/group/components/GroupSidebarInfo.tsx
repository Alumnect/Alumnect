import { PenSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/primitives'
import type { GroupDetail } from '../model/group'

interface GroupSidebarInfoProps {
  group: GroupDetail
  isActiveMember: boolean
}

export function GroupSidebarInfo({ group: _group }: GroupSidebarInfoProps) {
  const { t } = useTranslation()
  return (
    <aside className="sticky top-20">
      <Card
        hover={false}
        className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary-solid">
            <PenSquare size={16} />
          </div>
          <h3 className="font-bold text-sm text-text">
            {t('groups.communityContribution')}
          </h3>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
          {t('groups.communityContributionDesc')}
        </p>
      </Card>
    </aside>
  )
}
