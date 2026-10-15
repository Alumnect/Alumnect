import { Building, User, Hash } from 'lucide-react'
import { usePayoutBanks } from '../hooks/usePayoutBanks'

interface Props {
  bankName: string
  bankBin: string
  bankAccountNumber: string
  bankAccountHolder: string
  onBankNameChange: (val: string) => void
  onBankBinChange: (val: string) => void
  onBankAccountNumberChange: (val: string) => void
  onBankAccountHolderChange: (val: string) => void
}

export const MentorPayoutBankSection: React.FC<Props> = ({
  bankName,
  bankBin,
  bankAccountNumber,
  bankAccountHolder,
  onBankNameChange,
  onBankBinChange,
  onBankAccountNumberChange,
  onBankAccountHolderChange,
}) => {
  const { banks, isLoading, isError, refetch } = usePayoutBanks()
  const selectedBank = banks.find((bank) => bank.bin === bankBin)
  // Giữ lựa chọn đã lưu trước đó dù ngân hàng không còn trong danh sách hiện tại.
  const missingSavedBank = bankBin && !selectedBank

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-cream-300/80 dark:border-[#393a3b] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-[#393a3b] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            5
          </div>
          <div>
            <h3 className="font-semibold text-plum-800 dark:text-[#f0f2f5] text-lg">
              Tài khoản nhận thanh toán <span className="text-coral-500">*</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên ngân hàng */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-plum-700 dark:text-[#f0f2f5] mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-brand-600" /> Ngân hàng <span className="text-coral-500">*</span>
            </label>
            <select
              value={bankBin}
              disabled={isLoading}
              onChange={(event) => {
                const selected = banks.find((bank) => bank.bin === event.target.value)
                onBankBinChange(event.target.value)
                onBankNameChange(selected?.name ?? '')
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-plum-800 dark:text-[#f0f2f5] text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all placeholder:text-plum-400 dark:placeholder:text-[#8a8d91]"
            >
              <option value="">{isLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng nhận tiền'}</option>
              {missingSavedBank && <option value={bankBin}>{bankName || 'Ngân hàng đã lưu'} · {bankBin}</option>}
              {banks.map((bank) => (
                <option key={bank.bin} value={bank.bin}>
                  {bank.name}{bank.fullName ? ` — ${bank.fullName}` : ''}
                </option>
              ))}
            </select>
            {isError && (
              <p className="mt-1 text-[11px] text-coral-600">
                Không tải được danh sách ngân hàng từ VietQR.{' '}
                <button type="button" className="underline font-semibold" onClick={() => refetch()}>
                  Thử lại
                </button>
              </p>
            )}
            {selectedBank && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                {selectedBank.logo && (
                  <img src={selectedBank.logo} alt="" className="h-5 w-auto rounded bg-white px-1" loading="lazy" />
                )}
                <span>{selectedBank.fullName || selectedBank.name} · BIN {selectedBank.bin}</span>
              </div>
            )}
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-plum-700 dark:text-[#f0f2f5] mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-brand-600" /> Số tài khoản <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="VD: 0123456789"
              value={bankAccountNumber}
              onChange={(e) => onBankAccountNumberChange(e.target.value.replace(/\s+/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-plum-800 dark:text-[#f0f2f5] text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all placeholder:text-plum-400 dark:placeholder:text-[#8a8d91]"
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-plum-700 dark:text-[#f0f2f5] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" /> Chủ tài khoản (IN HOA, không dấu) <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="VD: NGUYEN VAN A"
              value={bankAccountHolder}
              onChange={(e) => onBankAccountHolderChange(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 dark:border-[#4e4f50] bg-white dark:bg-[#18191a] text-plum-800 dark:text-[#f0f2f5] text-sm font-semibold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all placeholder:text-plum-400 dark:placeholder:text-[#8a8d91]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
