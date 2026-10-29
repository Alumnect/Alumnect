import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { History, GitCommit } from 'lucide-react'
import { Avatar } from '@/components/ui'
import type { MentoringDealSnapshot } from '../model/mentoringDealTypes'

interface MentoringDealHistoryTimelineProps {
  snapshots: MentoringDealSnapshot[]
  currentVersion: number
}

/**
 * Hiển thị dòng thời gian (Timeline) lịch sử các phiên bản Snapshot của Mentoring Deal (UC104).
 */
export function MentoringDealHistoryTimeline({
  snapshots,
  currentVersion,
}: MentoringDealHistoryTimelineProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-text-subtle dark:text-text-subtle">
        {t('mentoring.noVersionHistoryRecorded')}
      </div>
    )
  }

  // Sắp xếp phiên bản mới nhất lên đầu
  const sortedSnapshots = [...snapshots].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-info-soft text-info">
          <History className="h-4 w-4" />
        </span>
        <h4 className="font-display text-sm font-bold text-text">
          {t('mentoring.dealAdjustmentHistoryTitle', { count: snapshots.length })}
        </h4>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-2.5 before:w-0.5 before:bg-plum-900/10 dark:before:bg-white/10">
        {sortedSnapshots.map((snap) => {
          const isLatest = snap.version === currentVersion
          const formattedDate = format(new Date(snap.createdAt), 'dd/MM/yyyy HH:mm', {
            locale: vi,
          })
          const formattedPrice = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(snap.agreedPrice)

          return (
            <div key={snap.id} className="relative group">
              {/* Điểm nút Timeline */}
              <span
                className={`absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-border transition-colors ${
                  isLatest
                    ? 'bg-primary-solid text-on-primary shadow-xs'
                    : 'bg-surface-3 text-text-muted'
                }`}
              >
                <GitCommit className="h-3 w-3" />
              </span>

              {/* Thẻ phiên bản */}
              <div
                className={`rounded-2xl p-4 border text-xs transition ${
                  isLatest
                    ? 'bg-brand-50/40 border-primary-soft-border shadow-xs dark:bg-brand-700/20'
                    : 'bg-surface border-border'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">
                      {t('mentoring.versionBadge', { version: snap.version })}
                    </span>
                    {isLatest && (
                      <span className="rounded-full bg-primary-solid px-2 py-0.5 text-xs font-bold text-on-primary">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-subtle dark:text-text-subtle">
                    {formattedDate}
                  </span>
                </div>

                {/* Người sửa & Ghi chú */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={snap.modifiedByAvatar || undefined}
                      name={snap.modifiedByName || t('mentoring.memberFallback')}
                      size={24}
                    />
                    <span className="font-bold text-text">
                      {snap.modifiedByName || t('mentoring.memberFallback')}
                    </span>
                  </div>

                  <span className="font-semibold text-success">
                    {formattedPrice}
                  </span>
                </div>

                {snap.changeNote && (
                  <p className="mt-2 rounded-xl bg-cream-100/60 p-2.5 text-xs text-text-muted dark:bg-white/5 italic">
                    &ldquo;{snap.changeNote}&rdquo;
                  </p>
                )}

                {/* Tóm tắt nhanh phạm vi công việc */}
                <p className="mt-2 text-xs text-text-subtle line-clamp-2 dark:text-text-subtle">
                  <strong>{t('mentoring.scopePrefix')}</strong> {snap.taskScope}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
