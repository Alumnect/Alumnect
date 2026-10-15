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
      <div className="p-8 text-center text-xs text-plum-400 dark:text-[#8a8d91]">
        Chưa có lịch sử phiên bản nào được ghi nhận.
      </div>
    )
  }

  // Sắp xếp phiên bản mới nhất lên đầu
  const sortedSnapshots = [...snapshots].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-plum-900/[0.06] pb-3 dark:border-white/10">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/5 text-violet-600 dark:bg-violet-600/40 dark:text-violet-400">
          <History className="h-4 w-4" />
        </span>
        <h4 className="font-display text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">
          Lịch sử điều chỉnh điều khoản ({snapshots.length} phiên bản)
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
                className={`absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#242526] transition-colors ${
                  isLatest
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-cream-300 text-plum-600 dark:bg-white/20 dark:text-white'
                }`}
              >
                <GitCommit className="h-3 w-3" />
              </span>

              {/* Thẻ phiên bản */}
              <div
                className={`rounded-2xl p-4 border text-xs transition-all ${
                  isLatest
                    ? 'bg-brand-50/40 border-brand-200/60 shadow-xs dark:bg-brand-700/20 dark:border-brand-700/30'
                    : 'bg-white border-plum-900/[0.08] dark:bg-[#242526] dark:border-[#393a3b]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum-900/[0.04] pb-2 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-plum-900 dark:text-[#f0f2f5]">
                      Phiên bản {snap.version}
                    </span>
                    {isLatest && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-plum-400 dark:text-[#8a8d91]">
                    {formattedDate}
                  </span>
                </div>

                {/* Người sửa & Ghi chú */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={snap.modifiedByAvatar || undefined}
                      name={snap.modifiedByName || 'Thành viên'}
                      size={24}
                    />
                    <span className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                      {snap.modifiedByName || 'Thành viên'}
                    </span>
                  </div>

                  <span className="font-semibold text-mint-700 dark:text-mint-400">
                    {formattedPrice}
                  </span>
                </div>

                {snap.changeNote && (
                  <p className="mt-2 rounded-xl bg-cream-100/60 p-2.5 text-[11px] text-plum-600 dark:bg-white/5 dark:text-[#b0b3b8] italic">
                    &ldquo;{snap.changeNote}&rdquo;
                  </p>
                )}

                {/* Tóm tắt nhanh phạm vi công việc */}
                <p className="mt-2 text-[11px] text-plum-500 line-clamp-2 dark:text-[#8a8d91]">
                  <strong>Phạm vi:</strong> {snap.taskScope}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
