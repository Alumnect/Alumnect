import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building, CheckCircle2, RotateCcw, Save, ShieldAlert } from 'lucide-react'
import { Container, toast, SelectDropdown, type SelectOption } from '@/components/ui'
import { MentorPageHeader, MentoringTermsGate, TASK_QUERY_KEYS } from '@/features/mentorship'
import { mentoringWalletApi } from '@/features/mentorship/api/mentoringWalletApi'
import { MentoringWalletTable } from '@/features/mentorship/components/MentoringWalletTable'
import {
  MentoringActionButton,
  MentoringActionCard,
  MentoringField,
  MentoringStatusStrip,
} from '@/features/mentorship/components/MentoringUi'
import { MENTORING_INPUT } from '@/features/mentorship/model/mentoringUiUtils'
import { usePayoutBanks } from '@/features/mentorship/hooks/usePayoutBanks'
import type { RefundAccount } from '@/features/mentorship/model/mentoringWalletTypes'

const EMPTY: RefundAccount = { bankName: '', bankBin: '', bankAccountNumber: '', bankAccountHolder: '' }

/**
 * Hoàn tiền Mentoring: tài khoản nhận hoàn tiền và các khoản hoàn.
 * Tài khoản là bắt buộc trước khi Học viên gửi hoặc đồng ý thỏa thuận dừng Task.
 */
function MentoringRefundsContent() {
  const queryClient = useQueryClient()
  const { banks, isLoading: banksLoading } = usePayoutBanks()
  // Bản nháp đang sửa; chưa sửa thì hiển thị tài khoản đã lưu
  const [draft, setDraft] = useState<RefundAccount | null>(null)

  const refunds = useQuery({ queryKey: ['mentoring-wallet', 'refunds'], queryFn: mentoringWalletApi.getRefunds })
  const account = useQuery({ queryKey: ['mentoring-wallet', 'refund-account'], queryFn: mentoringWalletApi.getRefundAccount })

  const saved = account.data ?? null
  const form: RefundAccount = draft ?? saved ?? EMPTY
  const dirty = draft !== null

  const selectedBank = banks.find((b) => b.bin === form.bankBin)

  const bankOptions = useMemo<SelectOption<string>[]>(() => {
    const list: SelectOption<string>[] = banks.map((b) => ({
      value: b.bin,
      label: b.name,
      sublabel: b.fullName ? `— ${b.fullName}` : undefined,
      icon: b.logo ? (
        <img
          src={b.logo}
          alt=""
          className="h-4.5 w-7 shrink-0 rounded object-contain bg-white p-0.5 border border-border/50"
          loading="lazy"
        />
      ) : (
        <Building className="h-4 w-4 text-text-subtle shrink-0" />
      ),
    }))

    if (form.bankBin && !banks.some((b) => b.bin === form.bankBin)) {
      list.unshift({
        value: form.bankBin,
        label: form.bankName || 'Ngân hàng đã lưu',
        sublabel: `BIN ${form.bankBin}`,
        icon: <Building className="h-4 w-4 text-text-subtle shrink-0" />,
      })
    }

    return list
  }, [banks, form.bankBin, form.bankName])

  const save = useMutation({
    mutationFn: () => mentoringWalletApi.saveRefundAccount(form),
    onSuccess: () => {
      toast.success('Đã lưu tài khoản nhận hoàn tiền')
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-wallet'] })
      // Quyền thao tác của Task (hasRefundAccount) phụ thuộc tài khoản này
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể lưu tài khoản'),
  })

  const accountNumberValid = /^\d{6,30}$/.test(form.bankAccountNumber)
  const canSave = Boolean(form.bankBin && accountNumberValid && form.bankAccountHolder.trim()) && dirty

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<RotateCcw className="h-4 w-4" />}
        eyebrow="Thanh toán Mentoring"
        title="Hoàn tiền"
        description="Khoản hoàn khi Task dừng theo thỏa thuận hoặc được Ban Quản Trị phân xử sẽ chuyển về tài khoản bạn khai báo."
      />

      {refunds.data?.bankAccountRequired && (
        <MentoringActionCard tone="coral" icon={<ShieldAlert />} title="Có khoản hoàn tiền đang chờ tài khoản">
          Khai báo tài khoản bên dưới, hệ thống sẽ chuyển tiền ngay sau khi lưu.
        </MentoringActionCard>
      )}

      <section className="rounded-2xl border border-border bg-surface shadow-xs">
        {account.isSuccess &&
          (saved ? (
            <MentoringStatusStrip tone="mint" icon={<CheckCircle2 />} className="rounded-t-2xl">
              Đã khai báo: {saved.bankName} ••• {saved.bankAccountNumber.slice(-4)} · {saved.bankAccountHolder}
            </MentoringStatusStrip>
          ) : (
            <MentoringStatusStrip tone="gold" icon={<ShieldAlert />} className="rounded-t-2xl">
              Chưa khai báo — bắt buộc trước khi gửi hoặc đồng ý thỏa thuận dừng Task.
            </MentoringStatusStrip>
          ))}

        <div className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-text">Tài khoản nhận hoàn tiền</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <MentoringField label="Ngân hàng" required>
                <SelectDropdown
                  value={form.bankBin}
                  disabled={banksLoading}
                  placeholder={banksLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng'}
                  searchPlaceholder="Tìm ngân hàng theo tên viết tắt, tên đầy đủ hoặc mã BIN..."
                  options={bankOptions}
                  onChange={(selectedBin) => {
                    const bank = banks.find((b) => b.bin === selectedBin)
                    setDraft({
                      ...form,
                      bankBin: String(selectedBin),
                      bankName: bank?.name ?? form.bankName ?? '',
                    })
                  }}
                  panelClassName="w-full sm:max-w-none"
                  buttonClassName="h-10.5 rounded-xl text-sm"
                  icon={<Building className="h-4 w-4" />}
                />
              </MentoringField>
              {selectedBank && (
                <div className="mt-2 flex items-center gap-2 text-xs text-text-subtle">
                  {selectedBank.logo && (
                    <img
                      src={selectedBank.logo}
                      alt=""
                      className="h-5 w-auto rounded bg-surface px-1 border border-border/40"
                      loading="lazy"
                    />
                  )}
                  <span className="font-medium text-text">{selectedBank.fullName || selectedBank.name}</span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-mono font-semibold text-text-subtle">
                    BIN {selectedBank.bin}
                  </span>
                </div>
              )}
            </div>
            <MentoringField
              label="Số tài khoản"
              required
              hint={form.bankAccountNumber && !accountNumberValid ? 'Số tài khoản gồm 6–30 chữ số.' : undefined}
            >
              <input
                className={MENTORING_INPUT}
                inputMode="numeric"
                placeholder="Ví dụ: 0123456789"
                value={form.bankAccountNumber}
                onChange={(e) => setDraft({ ...form, bankAccountNumber: e.target.value.replace(/\D/g, '') })}
              />
            </MentoringField>
            <MentoringField label="Tên chủ tài khoản" required hint="IN HOA, không dấu, đúng như trên thẻ ngân hàng.">
              <input
                className={`${MENTORING_INPUT} uppercase`}
                placeholder="NGUYEN VAN A"
                value={form.bankAccountHolder}
                onChange={(e) => setDraft({ ...form, bankAccountHolder: e.target.value.toUpperCase() })}
              />
            </MentoringField>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            {dirty && (
              <MentoringActionButton intent="ghost" onClick={() => setDraft(null)} disabled={save.isPending}>
                Hoàn tác
              </MentoringActionButton>
            )}
            <MentoringActionButton
              intent="primary"
              icon={<Save className="h-3.5 w-3.5" />}
              loading={save.isPending}
              disabled={!canSave}
              onClick={() => save.mutate()}
            >
              {saved ? 'Cập nhật tài khoản' : 'Lưu tài khoản'}
            </MentoringActionButton>
          </div>
        </div>
      </section>

      <MentoringWalletTable
        wallet={refunds.data}
        isLoading={refunds.isLoading}
        counterpartLabel="Mentor"
        emptyTitle="Chưa có khoản hoàn tiền nào"
        emptyDescription="Khoản hoàn xuất hiện khi Task dừng có hoàn tiền hoặc được phân xử hoàn tiền."
      />
    </div>
  )
}

export function MentoringRefundsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringRefundsContent />
      </MentoringTermsGate>
    </Container>
  )
}
