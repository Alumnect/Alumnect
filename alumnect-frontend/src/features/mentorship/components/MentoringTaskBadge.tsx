import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, Gavel, PlayCircle, XCircle } from 'lucide-react'
import type { MentoringTaskStatus, MentoringTaskUIStage } from '../model/mentoringTaskTypes'
import { MentoringBadge, type MentoringTone } from './MentoringUi'

interface MentoringTaskBadgeProps {
  status: MentoringTaskStatus
  className?: string
}

const TASK_STATUS: Record<MentoringTaskStatus, { label: string; tone: MentoringTone; icon: ReactNode }> = {
  PREPARATION: { label: 'Chuẩn bị', tone: 'gold', icon: <Clock /> },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'brand', icon: <PlayCircle /> },
  SUBMITTED: { label: 'Chờ nghiệm thu', tone: 'navy', icon: <FileCheck2 /> },
  COMPLETED: { label: 'Hoàn thành', tone: 'mint', icon: <CheckCircle2 /> },
  DISPUTED: { label: 'Đang tranh chấp', tone: 'coral', icon: <AlertTriangle /> },
  RESOLVED: { label: 'Đã phân xử', tone: 'neutral', icon: <Gavel /> },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: <XCircle /> },
}

/** Huy hiệu trạng thái của Mentoring Task (UC105 - UC108, UC120). */
export function MentoringTaskBadge({ status, className }: MentoringTaskBadgeProps) {
  const config = TASK_STATUS[status] ?? TASK_STATUS.CANCELLED
  return (
    <MentoringBadge tone={config.tone} icon={config.icon} className={className}>
      {config.label}
    </MentoringBadge>
  )
}

const TASK_STAGE: Record<MentoringTaskUIStage, { label: string; tone: MentoringTone }> = {
  PREPARATION: { label: 'Giai đoạn 1 · Chuẩn bị', tone: 'gold' },
  IN_PROGRESS: { label: 'Giai đoạn 2 · Thực hiện', tone: 'brand' },
  ENDING: { label: 'Giai đoạn 3 · Kết thúc', tone: 'navy' },
}

/** Huy hiệu giai đoạn hiển thị (PREPARATION, IN_PROGRESS, ENDING). */
export function MentoringTaskStageBadge({ stage, className }: { stage: MentoringTaskUIStage; className?: string }) {
  const config = TASK_STAGE[stage] ?? TASK_STAGE.ENDING
  return (
    <MentoringBadge tone={config.tone} className={className}>
      {config.label}
    </MentoringBadge>
  )
}
