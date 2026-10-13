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
        return <Sparkles className="h-4 w-4 text-emerald-600" />
      case 'WORK_LOG_SUBMITTED':
        return <FileEdit className="h-4 w-4 text-violet-600" />
      case 'WORK_LOG_UPDATED':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'WORK_LOG_CONFIRMED':
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />
      case 'TASK_CANCELLED':
        return <XCircle className="h-4 w-4 text-rose-600" />
      case 'TASK_DISPUTED':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      default:
        return <Clock className="h-4 w-4 text-primary" />
    }
  }

  const getEventBg = (eventType: string) => {
    switch (eventType) {
      case 'TASK_ACTIVATED':
      case 'PAYMENT_SUCCESS':
        return 'bg-emerald-100 ring-emerald-300 dark:bg-emerald-950/60 dark:ring-emerald-700'
      case 'WORK_LOG_SUBMITTED':
        return 'bg-violet-100 ring-violet-300 dark:bg-violet-950/60 dark:ring-violet-700'
      case 'WORK_LOG_UPDATED':
        return 'bg-amber-100 ring-amber-300 dark:bg-amber-950/60 dark:ring-amber-700'
      case 'WORK_LOG_CONFIRMED':
      case 'TASK_COMPLETED':
        return 'bg-teal-100 ring-teal-300 dark:bg-teal-950/60 dark:ring-teal-700'
      case 'TASK_CANCELLED':
        return 'bg-rose-100 ring-rose-300 dark:bg-rose-950/60 dark:ring-rose-700'
      case 'TASK_DISPUTED':
        return 'bg-amber-100 ring-amber-300 dark:bg-amber-950/60 dark:ring-amber-700'
      default:
        return 'bg-primary/10 ring-primary/30'
    }
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
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

              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-background/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-foreground">{event.title}</h4>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line mb-2">
                  {event.description}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
