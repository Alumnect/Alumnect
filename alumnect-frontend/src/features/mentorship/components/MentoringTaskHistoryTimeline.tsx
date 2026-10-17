import { Clock, CheckCircle2, FileEdit, AlertTriangle, XCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MentoringTaskHistoryEvent } from '../model/mentoringTaskTypes'

interface MentoringTaskHistoryTimelineProps {
  history: MentoringTaskHistoryEvent[]
}

export function MentoringTaskHistoryTimeline({ history }: MentoringTaskHistoryTimelineProps) {
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'TASK_ACTIVATED':
      case 'PAYMENT_SUCCESS':
        return <Sparkles className="h-4 w-4 text-success" />
      case 'WORK_LOG_SUBMITTED':
        return <FileEdit className="h-4 w-4 text-info" />
      case 'WORK_LOG_UPDATED':
        return <Clock className="h-4 w-4 text-warning" />
      case 'WORK_LOG_CONFIRMED':
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'TASK_CANCELLED':
        return <XCircle className="h-4 w-4 text-danger" />
      case 'TASK_DISPUTED':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      default:
        return <Clock className="h-4 w-4 text-primary-solid" />
    }
  }

  const getEventBg = (eventType: string) => {
    switch (eventType) {
      case 'TASK_ACTIVATED':
      case 'PAYMENT_SUCCESS':
        return 'bg-success-soft ring-success-border'
      case 'WORK_LOG_SUBMITTED':
        return 'bg-info-soft ring-info-border'
      case 'WORK_LOG_UPDATED':
        return 'bg-warning-soft ring-warning-border'
      case 'WORK_LOG_CONFIRMED':
      case 'TASK_COMPLETED':
        return 'bg-success-soft ring-success-border'
      case 'TASK_CANCELLED':
        return 'bg-danger-soft ring-danger-border'
      case 'TASK_DISPUTED':
        return 'bg-warning-soft ring-warning-border'
      default:
        return 'bg-brand-600/10 ring-brand-600/30'
    }
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary-solid" />
        <h3 className="text-base font-bold text-foreground">Nhật ký tiến trình & Lịch sử nhiệm vụ (Audit Trail)</h3>
      </div>

      {(!history || history.length === 0) ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Chưa có sự kiện nào được ghi nhận cho nhiệm vụ này.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {history.map((event, idx) => (
            <div key={event.id || idx} className="relative group">
              {/* Event bullet */}
              <div
                className={cn(
                  'absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-2',
                  getEventBg(event.eventType)
                )}
              >
                {getEventIcon(event.eventType)}
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 transition-colors hover:border-brand-600/40 hover:bg-background/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-foreground">{event.title}</h4>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line mb-2">
                  {event.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{event.actorName}</span>
                  <span>•</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-medium">{event.actorRole}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
