/**
 * MyContributionsModal — Modal xem lại các lượt đóng góp lương của chính mình (UC51 - Edit salary
 * contribution). Chỉ hiển thị được từ nút "Đóng góp của tôi" (chỉ Alumni thấy), liệt kê các lượt đã
 * đóng góp kèm nút "Sửa" (mở `ContributeSalaryModal` ở chế độ chỉnh sửa) và "Xóa" (mở
 * `DeleteSalaryContributionModal` xác nhận — UC52 - Delete salary contribution).
 */
import { useState } from 'react'
import { AlertTriangle, LineChart, Pencil, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useMyContributions } from '../hooks/useSalary'
import type { SalaryContribution } from '../model/salary'
import { getIndustryIcon } from '../model/salary'
import { DeleteSalaryContributionModal } from './DeleteSalaryContributionModal'

export function MyContributionsModal({ onClose, onEdit }: { onClose: () => void; onEdit: (contribution: SalaryContribution) => void }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError, error, refetch } = useMyContributions()
  const contributions = data ?? []
  const [deleting, setDeleting] = useState<SalaryContribution | null>(null)

  return (
    <Modal isOpen onClose={onClose} title={t('salary.myContributionsTitle')} icon={<ShieldCheck size={18} className="text-primary-solid" />} maxWidthClassName="max-w-lg">

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle size={20} />
          </span>
          <p className="text-sm text-text-subtle">{(error as Error)?.message ?? t('salary.loadMyContributionsError')}</p>
          <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={() => refetch()}>
            {t('common.tryAgain')}
          </Button>
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={<LineChart size={22} />}
          title={t('salary.noMyContributions')}
          description={t('salary.noMyContributionsDesc')}
        />
      ) : (
        <div className="space-y-2.5">
          {contributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{c.jobTitle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-subtle">
                  {c.industry && (() => {
                    const IndIcon = getIndustryIcon(c.industry)
                    return (
                      <span className="inline-flex items-center gap-1 font-medium text-primary-solid bg-primary-soft px-1.5 py-0.5 rounded">
                        <IndIcon size={11} className="shrink-0" />
                        <span>{c.industry}</span>
                      </span>
                    )
                  })()}
                  {[c.company, c.region].filter(Boolean).map((text, i) => (
                    <span key={i} className="text-text-subtle">· {text}</span>
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-primary-solid">
                  {c.grossAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {c.currency} {t('salary.perMonth')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={13} />} onClick={() => onEdit(c)}>
                  {t('common.edit')}
                </Button>
                <button
                  onClick={() => setDeleting(c)}
                  aria-label={t('common.delete')}
                  className="grid h-8 w-8 place-items-center rounded-lg text-text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xác nhận xóa (UC52) — chồng lên danh sách, danh sách tự cập nhật sau khi xóa (cache invalidate) */}
      {deleting && (
        <DeleteSalaryContributionModal
          contribution={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            toast.success(t('salary.deleteSalarySuccess'))
          }}
        />
      )}
    </Modal>
  )
}
