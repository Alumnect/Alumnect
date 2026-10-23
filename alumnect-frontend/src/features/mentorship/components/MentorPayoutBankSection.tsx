import { useMemo } from 'react'
import { Building, User, Hash } from 'lucide-react'
import { SelectDropdown, type SelectOption } from '@/components/ui'
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

  const bankOptions = useMemo<SelectOption<string>[]>(() => {
    const list: SelectOption<string>[] = banks.map((bank) => ({
      value: bank.bin,
      label: bank.name,
      sublabel: bank.fullName ? `— ${bank.fullName}` : undefined,
      icon: bank.logo ? (
        <img
          src={bank.logo}
          alt=""
          className="h-4.5 w-7 shrink-0 rounded object-contain bg-white p-0.5 border border-border/50"
          loading="lazy"
        />
      ) : (
        <Building className="h-4 w-4 text-text-subtle shrink-0" />
      ),
    }))

    if (missingSavedBank) {
      list.unshift({
        value: bankBin,
        label: bankName || 'Ngân hàng đã lưu',
        sublabel: `BIN ${bankBin}`,
        icon: <Building className="h-4 w-4 text-text-subtle shrink-0" />,
      })
    }

    return list
  }, [banks, bankBin, bankName, missingSavedBank])

  return (
    <div className="bg-surface rounded-2xl border border-cream-300/80 dark:border-border p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-solid flex items-center justify-center font-bold">
            5
          </div>
          <div>
            <h3 className="font-semibold text-text text-lg">
              Tài khoản nhận thanh toán <span className="text-danger">*</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên ngân hàng */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary-solid" /> Ngân hàng <span className="text-danger">*</span>
            </label>
            <SelectDropdown
              value={bankBin}
              disabled={isLoading}
              placeholder={isLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng nhận tiền'}
              searchPlaceholder="Tìm ngân hàng theo tên viết tắt, tên đầy đủ hoặc mã BIN..."
              options={bankOptions}
              onChange={(selectedVal) => {
                const selected = banks.find((bank) => bank.bin === selectedVal)
                onBankBinChange(String(selectedVal))
                onBankNameChange(selected?.name ?? '')
              }}
              panelClassName="w-full sm:max-w-none"
              buttonClassName="h-10.5 rounded-xl text-sm"
              icon={<Building className="h-4 w-4" />}
            />
            {isError && (
              <p className="mt-1 text-xs text-danger">
                Không tải được danh sách ngân hàng từ VietQR.{' '}
                <button type="button" className="underline font-semibold" onClick={() => refetch()}>
                  Thử lại
                </button>
              </p>
            )}
            {selectedBank && (
              <div className="mt-2 flex items-center gap-2 text-xs text-text-subtle">
                {selectedBank.logo && (
                  <img src={selectedBank.logo} alt="" className="h-5 w-auto rounded bg-surface px-1" loading="lazy" />
                )}
                <span>{selectedBank.fullName || selectedBank.name} · BIN {selectedBank.bin}</span>
              </div>
            )}
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-primary-solid" /> Số tài khoản <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="VD: 0123456789"
              value={bankAccountNumber}
              onChange={(e) => onBankAccountNumberChange(e.target.value.replace(/\s+/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border-strong bg-surface text-text text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-primary transition placeholder:text-text-subtle dark:placeholder:text-text-subtle"
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-solid" /> Chủ tài khoản (IN HOA, không dấu) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="VD: NGUYEN VAN A"
              value={bankAccountHolder}
              onChange={(e) => onBankAccountHolderChange(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border-strong bg-surface text-text text-sm font-semibold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-primary transition placeholder:text-text-subtle dark:placeholder:text-text-subtle"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
