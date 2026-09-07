/**
 * DeleteSalaryContributionModal — Modal xác nhận xóa 1 lượt đóng góp lương (UC52 - Delete salary
 * contribution).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (CỨNG, không thể hoàn tác).
 *  - Chỉ mở được từ `MyContributionsModal` (đã đảm bảo chính chủ), Backend vẫn kiểm tra lại sở hữu.
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDeleteSalaryContribution } from '../hooks/useSalary'
import type { SalaryContribution } from '../model/salary'

export function DeleteSalaryContributionModal({
  contribution,
  onClose,
  onDeleted,
}: {
  contribution: SalaryContribution
  onClose: () => void
  onDeleted: () => void
}) {
  const deleteMut = useDeleteSalaryContribution()

  const handleDelete = () => {
    deleteMut.mutate(contribution.id, { onSuccess: onDeleted })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteMut.isPending}>
        Hủy
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteMut.isPending}
        leftIcon={deleteMut.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
      >
        {deleteMut.isPending ? 'Đang xóa…' : 'Xóa'}
      </Button>
    </div>
  )

  return (
    <Modal isOpen onClose={deleteMut.isPending ? () => {} : onClose} title="Xóa dữ liệu lương" icon={<AlertTriangle size={18} className="text-rose-500" />} footer={footer}>
      <p className="text-sm text-plum-600">
        Bạn có chắc muốn xóa lượt đóng góp <span className="font-semibold text-plum-900">"{contribution.jobTitle}"</span> này không? Hành động này{' '}
        <span className="font-semibold text-rose-600">không thể hoàn tác</span>.
      </p>
      {deleteMut.isError && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {(deleteMut.error as Error)?.message || 'Không thể xóa, vui lòng thử lại sau.'}
        </p>
      )}
    </Modal>
  )
}
