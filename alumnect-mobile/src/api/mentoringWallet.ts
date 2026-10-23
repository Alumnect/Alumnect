import http from '@/lib/http'
import type { ApiResponse } from '@/lib/http'

export type WalletLedgerStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface WalletItem {
  ledgerId: number
  taskId?: number | null
  taskTitle?: string | null
  counterpartName?: string | null
  amount: number
  status: WalletLedgerStatus
  providerStatus?: string | null
  note?: string | null
  transactedAt?: string | null
  createdAt: string
}

export interface Wallet {
  totalReceived: number
  totalProcessing: number
  totalFailed: number
  bankAccountRequired: boolean
  items: WalletItem[]
}

export interface RefundAccount {
  bankName: string
  bankBin: string
  bankAccountNumber: string
  bankAccountHolder: string
  updatedAt?: string
}

export const WALLET_STATUS_LABEL: Record<WalletLedgerStatus, string> = { PENDING: 'Đang xử lý', SUCCEEDED: 'Thành công', FAILED: 'Thất bại' }

const d = <T>(p: Promise<ApiResponse<T>>) => p.then((r) => r.data)

/** Khớp MentoringWalletController: /mentoring/wallet/{earnings|refunds|refund-account}. */
export const walletApi = {
  earnings: () => d(http.get<unknown, ApiResponse<Wallet>>('/mentoring/wallet/earnings')),
  refunds: () => d(http.get<unknown, ApiResponse<Wallet>>('/mentoring/wallet/refunds')),
  refundAccount: () => d(http.get<unknown, ApiResponse<RefundAccount | null>>('/mentoring/wallet/refund-account')),
  saveRefundAccount: (p: RefundAccount) => d(http.put<unknown, ApiResponse<RefundAccount>>('/mentoring/wallet/refund-account', p)),
}
