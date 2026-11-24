import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Clock, Receipt, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { vnd } from '@/lib/utils'
import { MentoringBadge } from './MentoringUi'
import { StatTile } from '@/components/brand/BrandBlocks'
import { MentoringFinanceReportModal } from './MentoringFinanceReportModal'
import { MentoringTaskReportModal } from './MentoringTaskReportModal'
import type { MentoringWallet, MentoringWalletItem } from '../model/mentoringWalletTypes'

const PROVIDER_STATUS_KEY_MAP: Record<string, string> = {
  QUEUED: 'mentoring.provStatusQueued',
  BANK_ACCOUNT_REQUIRED: 'mentoring.provStatusBankRequired',
  PROVIDER_UNAVAILABLE: 'mentoring.provStatusProviderUnavailable',
  SUBMIT_UNKNOWN: 'mentoring.provStatusSubmitUnknown',
  RECEIVED: 'mentoring.provStatusReceived',
  PROCESSING: 'mentoring.provStatusProcessing',
  REJECTED: 'mentoring.provStatusRejected',
  INVALID_REQUEST: 'mentoring.provStatusInvalidRequest',
  MOCK_VOIDED: 'mentoring.provStatusMockVoided',
}

interface Props {
  wallet?: MentoringWallet
  isLoading: boolean
  counterpartLabel: string
  emptyTitle: string
  emptyDescription: string
  party?: 'mentor' | 'student'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusCell({ item }: { item: MentoringWalletItem }) {
  const { t } = useTranslation()
  const badge =
    item.status === 'SUCCEEDED' ? (
      <MentoringBadge tone="mint" icon={<CheckCircle2 />}>{t('mentoring.walletBadgeTransferred')}</MentoringBadge>
    ) : item.status === 'FAILED' ? (
      <MentoringBadge tone="coral" icon={<AlertTriangle />}>{t('mentoring.walletBadgeFailed')}</MentoringBadge>
    ) : (
      <MentoringBadge tone="gold" icon={<Clock />}>{t('mentoring.walletBadgeProcessing')}</MentoringBadge>
    )
  return (
    <div className="space-y-1">
      {badge}
      {/* Không hiện ghi chú "dưới mức chi tối thiểu" cho người dùng; Admin vẫn thấy trạng thái này ở trang quản trị */}
      {item.status !== 'SUCCEEDED' && item.providerStatus && item.providerStatus !== 'BELOW_MINIMUM' && (
        <p className="max-w-[260px] text-xs text-text-subtle">
          {PROVIDER_STATUS_KEY_MAP[item.providerStatus] ? t(PROVIDER_STATUS_KEY_MAP[item.providerStatus]) : item.providerStatus}
        </p>
      )}
    </div>
  )
}

/** Tổng hợp và danh sách các khoản chi ra (thù lao Mentor hoặc hoàn tiền Học viên). */
export function MentoringWalletTable({ wallet, isLoading, counterpartLabel, emptyTitle, emptyDescription, party }: Props) {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')
  const [selectedReportItem, setSelectedReportItem] = useState<MentoringWalletItem | null>(null)
  const [selectedInvoiceTaskId, setSelectedInvoiceTaskId] = useState<number | null>(null)

  const invoiceButtonLabel = isEn ? 'Invoice' : 'Hóa đơn'

  const invoiceButtonTitle = party === 'mentor'
    ? (isEn ? 'View and download Mentor invoice' : 'Xem và tải hóa đơn Phía Cố vấn')
    : party === 'student'
    ? (isEn ? 'View and download Learner invoice' : 'Xem và tải hóa đơn Phía Học viên')
    : (isEn ? 'View and download invoice' : 'Xem và tải hóa đơn')

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-2 dark:bg-white/[0.04]" />
  }
  const items = wallet?.items ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={<CheckCircle2 />} tone="green" label={t('mentoring.walletSummaryReceived')} value={vnd(wallet?.totalReceived ?? 0)} />
        <StatTile icon={<Clock />} tone="amber" label={t('mentoring.walletSummaryProcessing')} value={vnd(wallet?.totalProcessing ?? 0)} />
        <StatTile icon={<AlertTriangle />} tone="red" label={t('mentoring.walletSummaryFailed')} value={vnd(wallet?.totalFailed ?? 0)} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {/* Di động: dạng danh sách */}
          <ul className="divide-y divide-plum-900/[0.06] sm:hidden dark:divide-white/10">
            {items.map((item) => (
              <li key={item.ledgerId} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{item.taskId ? `Task #${item.taskId}` : '—'}</p>
                    {item.taskTitle && <p className="truncate text-xs text-text-subtle">{item.taskTitle}</p>}
                  </div>
                  <p className="shrink-0 font-display text-sm font-bold text-text">{vnd(item.amount)}</p>
                </div>
                <StatusCell item={item} />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-xs text-text-subtle">
                    {item.counterpartName ? `${counterpartLabel}: ${item.counterpartName} · ` : ''}
                    {formatDate(item.transactedAt || item.createdAt)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {item.taskId && (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceTaskId(item.taskId!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition cursor-pointer"
                        title={invoiceButtonTitle}
                      >
                        <Receipt className="h-3 w-3 shrink-0" />
                        {invoiceButtonLabel}
                      </button>
                    )}
                    {item.status === 'FAILED' && item.taskId && (
                      <button
                        type="button"
                        onClick={() => setSelectedReportItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/30 transition cursor-pointer"
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Báo cáo
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Màn hình rộng: dạng bảng */}
          <table className="hidden w-full text-left text-sm sm:table">
            <thead className="border-b border-border bg-cream-100/60 text-xs font-semibold text-text-subtle dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">{t('mentoring.walletTableColTask')}</th>
                <th className="px-4 py-3">{counterpartLabel}</th>
                <th className="px-4 py-3 text-right">{t('mentoring.walletTableColAmount')}</th>
                <th className="px-4 py-3">{t('mentoring.walletTableColStatus')}</th>
                <th className="px-4 py-3">{t('mentoring.walletTableColTime')}</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum-900/[0.05] dark:divide-white/5">
              {items.map((item) => (
                <tr key={item.ledgerId} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text">{item.taskId ? `Task #${item.taskId}` : '—'}</p>
                    {item.taskTitle && <p className="max-w-[220px] truncate text-xs text-text-subtle">{item.taskTitle}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{item.counterpartName || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text">{vnd(item.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusCell item={item} />
                  </td>
                  <td className="px-4 py-3 text-xs text-text-subtle">{formatDate(item.transactedAt || item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.taskId && (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceTaskId(item.taskId!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition cursor-pointer"
                          title={invoiceButtonTitle}
                        >
                          <Receipt className="h-3.5 w-3.5 shrink-0" />
                          {invoiceButtonLabel}
                        </button>
                      )}
                      {item.status === 'FAILED' && item.taskId && (
                        <button
                          type="button"
                          onClick={() => setSelectedReportItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/30 transition cursor-pointer"
                          title="Báo cáo sự cố dòng tiền cho Ban Quản Trị"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Báo cáo
                        </button>
                      )}
                      {!item.taskId && item.status !== 'FAILED' && (
                        <span className="text-text-subtle text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Báo cáo sự cố dòng tiền */}
      <MentoringFinanceReportModal
        isOpen={Boolean(selectedReportItem)}
        onClose={() => setSelectedReportItem(null)}
        item={selectedReportItem}
      />

      {/* Modal Hóa đơn điện tử riêng theo vai trò Cố vấn / Học viên */}
      {selectedInvoiceTaskId && (
        <MentoringTaskReportModal
          taskId={selectedInvoiceTaskId}
          isOpen={Boolean(selectedInvoiceTaskId)}
          partyView={party}
          isMentor={party === 'mentor'}
          isStudent={party === 'student'}
          onClose={() => setSelectedInvoiceTaskId(null)}
        />
      )}
    </div>
  )
}
