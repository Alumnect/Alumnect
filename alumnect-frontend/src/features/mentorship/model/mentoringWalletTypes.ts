export type WalletLedgerStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface MentoringWalletItem {
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

export interface MentoringWallet {
  totalReceived: number
  totalProcessing: number
  totalFailed: number
  bankAccountRequired: boolean
  items: MentoringWalletItem[]
}

export interface RefundAccount {
  bankName: string
  bankBin: string
  bankAccountNumber: string
  bankAccountHolder: string
  updatedAt?: string
}

export interface MentorReview {
  id: number
  mentorProfileId: number
  studentId: number
  rating: number
  comment?: string | null
  createdAt: string
}
