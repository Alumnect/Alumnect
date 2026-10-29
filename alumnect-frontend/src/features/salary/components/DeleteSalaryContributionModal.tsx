/**
 * DeleteSalaryContributionModal — Modal xác nhận xóa 1 lượt đóng góp lương (UC52 - Delete salary
 * contribution).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (CỨNG, không thể hoàn tác).
 *  - Chỉ mở được từ `MyContributionsModal` (đã đảm bảo chính chủ), Backend vẫn kiểm tra lại sở hữu.
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const deleteMut = useDeleteSalaryContribution()

  const handleDelete = () => {
    deleteMut.mutate(contribution.id, { onSuccess: onDeleted })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteMut.isPending}>
        {t('common.cancel')}
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteMut.isPending}
        leftIcon={deleteMut.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-danger bg-danger text-text-inverse hover:opacity-90"
      >
        {deleteMut.isPending ? t('common.processing') : t('common.delete')}
      </Button>
    </div>
  )

  return (
    <Modal isOpen onClose={deleteMut.isPending ? () => {} : onClose} title={t('salary.deleteSalaryTitle')} icon={<AlertTriangle size={18} className="text-danger" />} footer={footer}>
      <p className="text-sm text-text-muted">
        {t('salary.deleteSalaryConfirm', { title: contribution.jobTitle })}
      </p>
      {deleteMut.isError && (
        <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {(deleteMut.error as Error)?.message || t('salary.deleteError')}
        </p>
      )}
    </Modal>
  )
}
