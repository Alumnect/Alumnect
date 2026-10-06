import React from 'react'
import { Building, User, Hash } from 'lucide-react'

interface Props {
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  onBankNameChange: (val: string) => void
  onBankAccountNumberChange: (val: string) => void
  onBankAccountHolderChange: (val: string) => void
}

export const MentorPayoutBankSection: React.FC<Props> = ({
  bankName,
  bankAccountNumber,
  bankAccountHolder,
  onBankNameChange,
  onBankAccountNumberChange,
  onBankAccountHolderChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f27024] flex items-center justify-center font-bold">
          5
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Tài khoản nhận thanh toán</h3>
          <p className="text-xs text-slate-500">Thông tin được bảo mật, chỉ dùng để chi trả cho bạn</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên ngân hàng */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#f27024]" /> Ngân hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={100}
              placeholder="VD: Vietcombank, MB Bank"
              value={bankName}
              onChange={(e) => onBankNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all"
            />
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#f27024]" /> Số tài khoản <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="VD: 0123456789"
              value={bankAccountNumber}
              onChange={(e) => onBankAccountNumberChange(e.target.value.replace(/\s+/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all"
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#f27024]" /> Chủ tài khoản (IN HOA, không dấu) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="VD: NGUYEN VAN A"
              value={bankAccountHolder}
              onChange={(e) => onBankAccountHolderChange(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-[#f27024]/20 focus:border-[#f27024] transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
