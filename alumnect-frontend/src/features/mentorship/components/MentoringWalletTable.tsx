import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { cn, vnd } from '@/lib/utils'
import { MentoringBadge } from './MentoringUi'
import type { MentoringWallet, MentoringWalletItem } from '../model/mentoringWalletTypes'

const PROVIDER_STATUS_LABELS: Record<string, string> = {
  QUEUED: 'Đang chờ gửi',
  BANK_ACCOUNT_REQUIRED: 'Cần cập nhật tài khoản ngân hàng',
  PROVIDER_UNAVAILABLE: 'Cổng chi tạm thời chưa tiếp nhận, hệ thống tự gửi lại',
  SUBMIT_UNKNOWN: 'Đang xác minh với cổng chi',
  RECEIVED: 'Cổng chi đã tiếp nhận',
  PROCESSING: 'Ngân hàng đang xử lý',
  REJECTED: 'Cổng chi từ chối',
  BELOW_MINIMUM: 'Dưới mức chi tối thiểu, Ban Quản Trị xử lý thủ công',
  INVALID_REQUEST: 'Lệnh chi không hợp lệ',
  MOCK_VOIDED: 'Lệnh cũ chưa chuyển tiền thật, chờ chi lại',
}

interface Props {
  wallet?: MentoringWallet
  isLoading: boolean
  counterpartLabel: string
  emptyTitle: string
  emptyDescription: string
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Summary({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <p className={cn('flex items-center gap-1.5 text-xs font-medium [&>svg]:h-3.5 [&>svg]:w-3.5', tone)}>
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-text">{vnd(value)}</p>
    </div>
  )
}

function StatusCell({ item }: { item: MentoringWalletItem }) {
  const badge =
    item.status === 'SUCCEEDED' ? (
      <MentoringBadge tone="mint" icon={<CheckCircle2 />}>Đã chuyển</MentoringBadge>
    ) : item.status === 'FAILED' ? (
      <MentoringBadge tone="coral" icon={<AlertTriangle />}>Chưa thành công</MentoringBadge>
    ) : (
      <MentoringBadge tone="gold" icon={<Clock />}>Đang xử lý</MentoringBadge>
    )
  return (
    <div className="space-y-1">
      {badge}
      {item.status !== 'SUCCEEDED' && item.providerStatus && (
        <p className="max-w-[260px] text-xs text-text-subtle">
          {PROVIDER_STATUS_LABELS[item.providerStatus] || item.providerStatus}
        </p>
      )}
    </div>
  )
}

/** Tổng hợp và danh sách các khoản chi ra (thù lao Mentor hoặc hoàn tiền Học viên). */
export function MentoringWalletTable({ wallet, isLoading, counterpartLabel, emptyTitle, emptyDescription }: Props) {
  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-2 dark:bg-white/[0.04]" />
  }
  const items = wallet?.items ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary icon={<CheckCircle2 />} label="Đã nhận" value={wallet?.totalReceived ?? 0} tone="text-success" />
        <Summary icon={<Clock />} label="Đang xử lý" value={wallet?.totalProcessing ?? 0} tone="text-warning" />
        <Summary icon={<AlertTriangle />} label="Chưa thành công" value={wallet?.totalFailed ?? 0} tone="text-danger" />
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
                <p className="text-xs text-text-subtle">
                  {item.counterpartName ? `${counterpartLabel}: ${item.counterpartName} · ` : ''}
                  {formatDate(item.transactedAt || item.createdAt)}
                </p>
              </li>
            ))}
          </ul>

          {/* Màn hình rộng: dạng bảng */}
          <table className="hidden w-full text-left text-sm sm:table">
            <thead className="border-b border-border bg-cream-100/60 text-xs font-semibold text-text-subtle dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">{counterpartLabel}</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
