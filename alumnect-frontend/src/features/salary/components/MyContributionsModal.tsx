/**
 * MyContributionsModal — Modal xem lại các lượt đóng góp lương của chính mình (UC51 - Edit salary
 * contribution). Chỉ hiển thị được từ nút "Đóng góp của tôi" (chỉ Alumni thấy), liệt kê các lượt đã
 * đóng góp kèm nút "Sửa" (mở `ContributeSalaryModal` ở chế độ chỉnh sửa) và "Xóa" (mở
 * `DeleteSalaryContributionModal` xác nhận — UC52 - Delete salary contribution).
 */
import { useState } from 'react'
import { AlertTriangle, LineChart, Pencil, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Modal, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useMyContributions } from '../hooks/useSalary'
import type { SalaryContribution } from '../model/salary'
import { DeleteSalaryContributionModal } from './DeleteSalaryContributionModal'

export function MyContributionsModal({ onClose, onEdit }: { onClose: () => void; onEdit: (contribution: SalaryContribution) => void }) {
  const { data, isLoading, isError, error, refetch } = useMyContributions()
  const contributions = data ?? []
  const [deleting, setDeleting] = useState<SalaryContribution | null>(null)

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
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={13} />} onClick={() => onEdit(c)}>
                  Sửa
                </Button>
                <button
                  onClick={() => setDeleting(c)}
                  aria-label="Xóa"
                  className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
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
            toast.success('Đã xóa dữ liệu lương thành công')
          }}
        />
      )}
    </Modal>
  )
}
