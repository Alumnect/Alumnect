import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, Gavel, PlayCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MentoringTaskStatus, MentoringTaskUIStage } from '../model/mentoringTaskTypes'
import { MentoringBadge, type MentoringTone } from './MentoringUi'

interface MentoringTaskBadgeProps {
  status: MentoringTaskStatus
  className?: string
}

const TASK_STATUS_CONFIG: Record<MentoringTaskStatus, { labelKey: string; tone: MentoringTone; icon: ReactNode }> = {
  PREPARATION: { labelKey: 'mentoring.taskStatusPreparation', tone: 'gold', icon: <Clock /> },
  IN_PROGRESS: { labelKey: 'mentoring.taskStatusInProgress', tone: 'brand', icon: <PlayCircle /> },
  SUBMITTED: { labelKey: 'mentoring.taskStatusSubmitted', tone: 'navy', icon: <FileCheck2 /> },
  COMPLETED: { labelKey: 'mentoring.taskStatusCompleted', tone: 'mint', icon: <CheckCircle2 /> },
  DISPUTED: { labelKey: 'mentoring.taskStatusDisputed', tone: 'coral', icon: <AlertTriangle /> },
  RESOLVED: { labelKey: 'mentoring.taskStatusResolved', tone: 'neutral', icon: <Gavel /> },
  CANCELLED: { labelKey: 'mentoring.taskStatusCancelled', tone: 'neutral', icon: <XCircle /> },
}

/** Huy hiệu trạng thái của Mentoring Task (UC105 - UC108, UC120). */
export function MentoringTaskBadge({ status, className }: MentoringTaskBadgeProps) {
  const { t } = useTranslation()
  const config = TASK_STATUS_CONFIG[status] ?? TASK_STATUS_CONFIG.CANCELLED
  return (
    <MentoringBadge tone={config.tone} icon={config.icon} className={className}>
      {t(config.labelKey)}
    </MentoringBadge>
  )
}

const TASK_STAGE_CONFIG: Record<MentoringTaskUIStage, { labelKey: string; tone: MentoringTone }> = {
  PREPARATION: { labelKey: 'mentoring.stagePreparation', tone: 'gold' },
  IN_PROGRESS: { labelKey: 'mentoring.stageInProgress', tone: 'brand' },
  ENDING: { labelKey: 'mentoring.stageEnding', tone: 'navy' },
}

/** Huy hiệu giai đoạn hiển thị (PREPARATION, IN_PROGRESS, ENDING). */
export function MentoringTaskStageBadge({ stage, className }: { stage: MentoringTaskUIStage; className?: string }) {
  const { t } = useTranslation()
  const config = TASK_STAGE_CONFIG[stage] ?? TASK_STAGE_CONFIG.ENDING
  return (
    <MentoringBadge tone={config.tone} className={className}>
      {t(config.labelKey)}
    </MentoringBadge>
  )
}

