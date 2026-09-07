/**
 * MyContributionsModal — Modal xem lại các lượt đóng góp lương của chính mình (UC51 - Edit salary
 * contribution). Chỉ hiển thị được từ nút "Đóng góp của tôi" (chỉ Alumni thấy), liệt kê các lượt đã
 * đóng góp kèm nút "Sửa" mở `ContributeSalaryModal` ở chế độ chỉnh sửa.
 */
import { AlertTriangle, LineChart, Pencil, RefreshCw, ShieldCheck } from 'lucide-react'
import { Modal, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useMyContributions } from '../hooks/useSalary'
import type { SalaryContribution } from '../model/salary'

export function MyContributionsModal({ onClose, onEdit }: { onClose: () => void; onEdit: (contribution: SalaryContribution) => void }) {
  const { data, isLoading, isError, error, refetch } = useMyContributions()
  const contributions = data ?? []

  return (
    <Modal isOpen onClose={onClose} title="Đóng góp của tôi" icon={<ShieldCheck size={18} className="text-brand-600" />} maxWidthClassName="max-w-lg">
      <p className="mb-4 text-xs text-plum-500">Chỉ bạn thấy được danh sách này — người khác không biết đây là dữ liệu của bạn.</p>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-plum-900/[0.04]" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={20} />
          </span>
          <p className="text-sm text-plum-500">{(error as Error)?.message ?? 'Không tải được danh sách đóng góp của bạn.'}</p>
          <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={<LineChart size={22} />}
          title="Bạn chưa đóng góp dữ liệu lương nào"
          description="Đóng góp mẫu lương đầu tiên để giúp cộng đồng cựu sinh viên có thêm dữ liệu tham khảo."
        />
      ) : (
        <div className="space-y-2.5">
          {contributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-plum-900/8 bg-white p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-plum-900">{c.jobTitle}</p>
                <p className="mt-0.5 truncate text-xs text-plum-400">
                  {[c.industry, c.company, c.region].filter(Boolean).join(' · ') || 'Chưa có thêm chi tiết'}
                </p>
                <p className="mt-1 text-xs font-semibold text-brand-600">
                  {c.grossAmount.toLocaleString('vi-VN')} {c.currency} / tháng
                </p>
              </div>
              <Button size="sm" variant="secondary" leftIcon={<Pencil size={13} />} onClick={() => onEdit(c)} className="shrink-0">
                Sửa
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
