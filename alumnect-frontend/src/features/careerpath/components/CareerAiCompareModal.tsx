/**
 * CareerAiCompareModal — "So sánh lộ trình với tôi" [C2]: bảng so sánh song song hồ sơ người xem và một cựu sinh viên
 * bất kỳ, bóc tách các nấc thang thực tế đã đi qua, điểm chung, khoảng trống cần bù và lời khuyên.
 */
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RotateCcw,
  GitCompare,
  Target,
  Zap,
} from 'lucide-react'
import { Modal, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCareerAiCompare } from '../hooks/useCareerPath'
import type { LadderStep, PersonCard } from '../model/aiCompare'

function PersonHeader({ person, isViewer }: { person: PersonCard; isViewer: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-3.5">
      <Avatar src={person.avatarUrl ?? undefined} name={person.name} size={48} className="rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-extrabold text-text">{isViewer ? t('career.aiYou') : person.name}</p>
        </div>
        {isViewer && person.name && <p className="truncate text-xs text-text-subtle">{person.name}</p>}
        <p className="mt-0.5 text-xs text-text-muted">
          {person.currentRole
            ? `${person.currentRole}${person.company ? ` · ${person.company}` : ''}`
            : person.majorName || t('career.aiStudentFallback')}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-text-subtle">
          {person.cohort != null && <span>{t('career.cohortLabel', { cohort: person.cohort })}</span>}
          {person.yearsSinceFirstJob != null && <span>· {t('career.aiYearsSince', { count: person.yearsSinceFirstJob })}</span>}
          {person.companyCount > 0 && <span>· {t('career.aiCompanies', { count: person.companyCount })}</span>}
        </div>
      </div>
    </div>
  )
}

function Ladder({ steps, accent }: { steps: LadderStep[]; accent: 'viewer' | 'target' }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5">
      {steps.map((s, i) => (
        <li key={`${s.period}-${s.company}-${i}`} className="relative">
          <span
            className={cn(
              'absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface',
              accent === 'target' ? 'bg-primary-solid' : 'bg-orange-400',
            )}
          />
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-subtle">{s.period}</p>
          <p className="text-sm font-bold text-text">{s.title}</p>
          {s.company && (
            <p className="flex items-center gap-1 text-xs text-text-muted">
              <Building2 size={11} /> {s.company}
            </p>
          )}
          {s.takeawayVi && (
            <p className="mt-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs leading-relaxed text-text">{s.takeawayVi}</p>
          )}
        </li>
      ))}
    </ol>
  )
}

function ListCard({
  title,
  items,
  icon,
  tone,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
  tone: string
}) {
  if (items.length === 0) return null
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <p className={cn('mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide', tone)}>
        {icon} {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-text">
            <ArrowRight size={13} className="mt-1 shrink-0 text-text-subtle" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CareerAiCompareModal({
  targetUserId,
  targetName,
  onClose,
}: {
  targetUserId: number
  targetName: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const viewerId = useAuthStore((s) => s.user?.id)
  const { data, isLoading, isError, error, refetch, isFetching } = useCareerAiCompare(viewerId, targetUserId)

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('career.aiCompareTitle', { name: targetName })}
      icon={<GitCompare size={18} className="text-primary-solid" />}
      maxWidthClassName="max-w-4xl"
      zIndexClassName="z-[120]"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      {(isLoading || (isFetching && !data)) && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-text-muted">
          <Loader2 size={26} className="animate-spin text-primary-solid" />
          {t('career.aiComparing')}
        </div>
      )}

      {isError && !isFetching && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle size={24} />
          </span>
          <p className="text-sm font-semibold text-text">{(error as Error)?.message || t('career.aiCompareError')}</p>
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={() => refetch()}>
            {t('common.tryAgain')}
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Hai hồ sơ cạnh nhau */}
          <div className="grid gap-3 md:grid-cols-2">
            <PersonHeader person={data.viewerPerson} isViewer />
            <PersonHeader person={data.targetPerson} isViewer={false} />
          </div>

          {/* Tóm tắt */}
          {data.comparisonSummaryVi && (
            <div className="rounded-2xl border border-primary-soft-border bg-primary-soft p-4 text-sm leading-relaxed text-text">
              {data.comparisonSummaryVi}
            </div>
          )}

          {/* Hai lộ trình song song */}
          <div className="grid gap-5 md:grid-cols-2">
            <section>
              <h3 className="mb-3 text-sm font-extrabold text-text">{t('career.aiYourJourney')}</h3>
              {data.viewerLadder.length > 0 ? (
                <Ladder steps={data.viewerLadder} accent="viewer" />
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  <p>{t('career.aiNoExperience')}</p>
                  {(data.viewerPerson.majorName || data.viewerPerson.skills.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {data.viewerPerson.majorName && (
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-solid">
                          {data.viewerPerson.majorName}
                        </span>
                      )}
                      {data.viewerPerson.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-3 text-sm font-extrabold text-text">{t('career.aiTargetJourney', { name: data.targetPerson.name })}</h3>
              {data.historicalLadder.length > 0 ? (
                <Ladder steps={data.historicalLadder} accent="target" />
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                  {t('career.aiTargetNoHistory')}
                </div>
              )}
            </section>
          </div>

          {/* Điểm chung / khoảng trống / kỹ năng đòn bẩy */}
          <div className="grid gap-3 md:grid-cols-3">
            <ListCard title={t('career.aiShared')} items={data.sharedStrengths} icon={<CheckCircle2 size={14} />} tone="text-success" />
            <ListCard title={t('career.aiGaps')} items={data.keyGapsToBridge} icon={<Target size={14} />} tone="text-warning" />
            <ListCard title={t('career.aiTransferable')} items={data.transferableSkills} icon={<Zap size={14} />} tone="text-info" />
          </div>

          {/* Lời khuyên */}
          {data.actionableAdviceVi && (
            <div className="flex gap-3 rounded-2xl border border-warning-border bg-warning-soft p-4">
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-warning" />
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-warning">{t('career.aiAdvice')}</p>
                <p className="text-sm leading-relaxed text-text">{data.actionableAdviceVi}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
