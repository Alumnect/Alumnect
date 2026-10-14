import { useState, useId } from 'react'
import {
  Scale,
  X,
  GraduationCap,
  RotateCcw,
  AlertTriangle,
  Loader2,
  DollarSign,
  Percent,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useResolveAdminTicket } from '../hooks/useAdmin'
import type {
  MentoringDisputeTicket,
  MentoringTicketDecision,
  AdminResolveTicketPayload,
} from '@/features/mentorship'

interface AdminResolveTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: MentoringDisputeTicket | null
  totalEscrowAmount?: number
}

const PRESET_REASONS = [
  {
    label: 'Mentor hoàn thành đủ',
    text: 'Căn cứ các Work Log đã nghiệm thu và sản phẩm bàn giao cuối cùng, Cố vấn đã hoàn thành đầy đủ nghĩa vụ theo thỏa thuận Deal ban đầu.',
  },
  {
    label: 'Nghiệm thu 1 phần (Hòa giải)',
    text: 'Hai bên đã thống nhất nghiệm thu một phần khối lượng công việc thực tế. Phần học phí tương ứng được chi trả cho Cố vấn và phần còn lại hoàn trả cho Học viên.',
  },
  {
    label: 'Hoàn trả toàn bộ học viên',
    text: 'Cố vấn vi phạm thời hạn cam kết nghiêm trọng hoặc không cung cấp được kết quả công việc hợp lệ. Ban Quản Trị quyết định hủy nhiệm vụ và hoàn lại toàn bộ học phí cho Học viên.',
  },
]

export function AdminResolveTicketModal({
  isOpen,
  onClose,
  ticket,
  totalEscrowAmount,
}: AdminResolveTicketModalProps) {
  const resolveMutation = useResolveAdminTicket()
  const mentorAmountId = useId()
  const studentRefundId = useId()
  const disputeFeeId = useId()

  const availableFund =
    totalEscrowAmount && totalEscrowAmount > 0
      ? totalEscrowAmount
      : ticket?.totalAmount && ticket.totalAmount > 0
      ? ticket.totalAmount
      : 0

  const [decision, setDecision] = useState<MentoringTicketDecision>('PARTIAL_SPLIT')
  const [splitMode, setSplitMode] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT')
  const [mentorPercentage, setMentorPercentage] = useState<number>(50)
  const [mentorAmount, setMentorAmount] = useState<number>(Math.round(availableFund / 2))
  const [studentRefund, setStudentRefund] = useState<number>(availableFund - Math.round(availableFund / 2))
  const [disputeFee, setDisputeFee] = useState<number>(0)
  const [decisionReason, setDecisionReason] = useState<string>('')
  const [isConfirmStep, setIsConfirmStep] = useState<boolean>(false)

  if (!isOpen || !ticket) return null

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ'

  // Tính toán số tiền thực tế theo phương án
  const netFund = Math.max(0, availableFund - disputeFee)
  let calculatedMentorAmount = 0
  let calculatedStudentRefund = 0

  if (decision === 'FULL_MENTOR_PAYMENT') {
    calculatedMentorAmount = netFund
    calculatedStudentRefund = 0
  } else if (decision === 'FULL_STUDENT_REFUND') {
    calculatedMentorAmount = 0
    calculatedStudentRefund = netFund
  } else {
    // PARTIAL_SPLIT
    if (splitMode === 'PERCENTAGE') {
      calculatedMentorAmount = Math.round((netFund * mentorPercentage) / 100)
      calculatedStudentRefund = netFund - calculatedMentorAmount
    } else {
      calculatedMentorAmount = mentorAmount
      calculatedStudentRefund = studentRefund
    }
  }

  const totalAllocated = calculatedMentorAmount + calculatedStudentRefund + disputeFee
  const isFundBalanced = Math.abs(totalAllocated - availableFund) === 0

  const handlePercentageChange = (pct: number) => {
    setMentorPercentage(pct)
    const m = Math.round((netFund * pct) / 100)
    setMentorAmount(m)
    setStudentRefund(netFund - m)
  }

  const handleMentorAmountChange = (val: number) => {
    setMentorAmount(val)
    setStudentRefund(Math.max(0, netFund - val))
  }

  const handleSubmit = async () => {
    if (!decisionReason.trim() || decisionReason.trim().length < 10) {
      toast.error('Vui lòng nhập lý do phán quyết chi tiết (tối thiểu 10 ký tự)')
      return
    }

    if (!isFundBalanced) {
      toast.error(
        `Tổng số tiền phân bổ (${formatVnd(totalAllocated)}) không khớp với tổng quỹ Escrow (${formatVnd(availableFund)})`
      )
      return
    }

    const payload: AdminResolveTicketPayload = {
      decision,
      decisionReason: decisionReason.trim(),
      mentorAmount: calculatedMentorAmount,
      studentRefund: calculatedStudentRefund,
      disputeFee,
      splitMode,
      mentorPercentage: splitMode === 'PERCENTAGE' ? mentorPercentage : undefined,
      studentPercentage: splitMode === 'PERCENTAGE' ? 100 - mentorPercentage : undefined,
    }

    try {
      await resolveMutation.mutateAsync({
        ticketId: ticket.id,
        payload,
      })
      toast.success('Ban hành phán quyết và giải quyết Ticket thành công!')
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể giải quyết Ticket'
      toast.error(msg)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Scale className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/20 text-purple-100 font-semibold">
                  {ticket.ticketCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Phán quyết Admin (UC120)
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                {ticket.taskTitle || ticket.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quỹ Escrow khả dụng */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Tổng quỹ ký quỹ Escrow của Task
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                {formatVnd(availableFund)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <span className="block">Học viên: <strong className="text-slate-700 dark:text-slate-200">{ticket.student?.fullName || ticket.studentName || 'Học viên'}</strong></span>
              <span className="block">Cố vấn: <strong className="text-slate-700 dark:text-slate-200">{ticket.mentor?.fullName || ticket.mentorName || 'Cố vấn'}</strong></span>
            </div>
          </div>

          {/* Chọn 3 phương án lớn */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Chọn phương án giải quyết (Decision Option) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Full Mentor */}
              <div
                onClick={() => setDecision('FULL_MENTOR_PAYMENT')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  decision === 'FULL_MENTOR_PAYMENT'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  {decision === 'FULL_MENTOR_PAYMENT' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Chi toàn bộ Mentor</div>
                <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Cố vấn nhận 100% thù lao, Học viên 0đ
                </p>
              </div>

              {/* Option 2: Partial Split */}
              <div
                onClick={() => setDecision('PARTIAL_SPLIT')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  decision === 'PARTIAL_SPLIT'
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  {decision === 'PARTIAL_SPLIT' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Hòa giải chia tỷ lệ</div>
                <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Phân chia thù lao & hoàn tiền theo thỏa thuận
                </p>
              </div>

              {/* Option 3: Full Student Refund */}
              <div
                onClick={() => setDecision('FULL_STUDENT_REFUND')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  decision === 'FULL_STUDENT_REFUND'
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  {decision === 'FULL_STUDENT_REFUND' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Hoàn trả toàn bộ</div>
                <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Học viên hoàn 100%, Cố vấn nhận 0đ
                </p>
              </div>
            </div>
          </div>

          {/* Cấu hình phân chia chi tiết (nếu là PARTIAL_SPLIT) */}
          {decision === 'PARTIAL_SPLIT' && (
            <div className="p-4 bg-purple-50/30 dark:bg-purple-950/10 rounded-xl border border-purple-200 dark:border-purple-800/40 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  Cơ chế phân chia hòa giải
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSplitMode('AMOUNT')}
                    className={`px-2.5 py-1 text-2xs rounded-md font-medium transition-colors flex items-center gap-1 ${
                      splitMode === 'AMOUNT'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" /> Số tiền
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('PERCENTAGE')}
                    className={`px-2.5 py-1 text-2xs rounded-md font-medium transition-colors flex items-center gap-1 ${
                      splitMode === 'PERCENTAGE'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Percent className="w-3 h-3" /> Tỷ lệ %
                  </button>
                </div>
              </div>

              {splitMode === 'PERCENTAGE' ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-400">Mentor: {mentorPercentage}%</span>
                    <span className="text-blue-700 dark:text-blue-400">Student: {100 - mentorPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={mentorPercentage}
                    onChange={(e) => handlePercentageChange(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs text-slate-500">
                    <span>{formatVnd(calculatedMentorAmount)}</span>
                    <span>{formatVnd(calculatedStudentRefund)}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={mentorAmountId} className="text-2xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Thù lao Cố vấn (VNĐ)
                    </label>
                    <input
                      id={mentorAmountId}
                      type="number"
                      min="0"
                      max={netFund}
                      value={mentorAmount}
                      onChange={(e) => handleMentorAmountChange(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={studentRefundId} className="text-2xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Hoàn trả Học viên (VNĐ)
                    </label>
                    <input
                      id={studentRefundId}
                      type="number"
                      min="0"
                      max={netFund}
                      value={studentRefund}
                      onChange={(e) => setStudentRefund(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phí xử lý tranh chấp (nếu có) */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label htmlFor={disputeFeeId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Phí xử lý tranh chấp (Dispute Fee)
              </label>
              <span className="text-3xs text-slate-500 dark:text-slate-400">
                Khấu trừ vào quỹ trước khi phân bổ theo chính sách nếu áp dụng (mặc định 0đ)
              </span>
            </div>
            <div className="w-32">
              <input
                id={disputeFeeId}
                type="number"
                min="0"
                max={availableFund}
                value={disputeFee}
                onChange={(e) => setDisputeFee(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Bảng đối soát tài chính phân bổ */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="text-2xs uppercase tracking-wider text-slate-400 font-bold mb-1">
              Bảng đối soát tài chính phân bổ
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">Cố vấn (Mentor) thực nhận:</span>
              <span className="font-bold text-emerald-400">{formatVnd(calculatedMentorAmount)}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">Học viên (Student) hoàn trả:</span>
              <span className="font-bold text-blue-400">{formatVnd(calculatedStudentRefund)}</span>
            </div>
            {disputeFee > 0 && (
              <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-300">Phí xử lý tranh chấp:</span>
                <span className="font-bold text-amber-400">{formatVnd(disputeFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1 font-bold">
              <span>Tổng phân bổ / Quỹ khả dụng:</span>
              <span className={isFundBalanced ? 'text-emerald-400' : 'text-red-400'}>
                {formatVnd(totalAllocated)} / {formatVnd(availableFund)}
              </span>
            </div>
            {!isFundBalanced && (
              <div className="text-3xs text-red-400 font-medium">
                ⚠️ Tổng tiền phân bổ không khớp quỹ Escrow. Vui lòng điều chỉnh lại số tiền!
              </div>
            )}
          </div>

          {/* Lý do phán quyết */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Căn cứ & Lý do phán quyết <span className="text-red-500">*</span>
              </label>
              <span className="text-3xs text-slate-400">Tối thiểu 10 ký tự</span>
            </div>

            {/* Nút Preset */}
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {PRESET_REASONS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDecisionReason(p.text)}
                  className="px-2 py-0.5 text-3xs font-medium rounded-md bg-purple-100/60 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" /> {p.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Nhập căn cứ pháp lý, khối lượng công việc hoàn thành và lý do đưa ra phán quyết này..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Cảnh báo pháp lý */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-2xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Phán quyết này là quyết định cuối cùng và sẽ khép lại Ticket. Hệ thống sẽ cập nhật trạng thái Task và tự động tạo các giao dịch giải ngân/hoàn tiền độc lập trong sổ quỹ Mentoring.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={resolveMutation.isPending}>
            Hủy bỏ
          </Button>
          <div className="flex items-center gap-2">
            {!isConfirmStep ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (!decisionReason.trim() || decisionReason.trim().length < 10) {
                    toast.error('Vui lòng nhập lý do phán quyết chi tiết (tối thiểu 10 ký tự)')
                    return
                  }
                  if (!isFundBalanced) {
                    toast.error('Tổng tiền phân bổ chưa khớp với quỹ Escrow')
                    return
                  }
                  setIsConfirmStep(true)
                }}
                disabled={!isFundBalanced}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Xác nhận phán quyết
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmStep(false)}
                  disabled={resolveMutation.isPending}
                >
                  Quay lại sửa
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={resolveMutation.isPending}
                  className="bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5"
                >
                  {resolveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang ban hành...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" /> Ban hành & Quyết toán
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
