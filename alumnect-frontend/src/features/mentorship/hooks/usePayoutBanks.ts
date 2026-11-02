import { useQuery } from '@tanstack/react-query'
import { vietQrBankApi } from '../api/vietQrBankApi'

/**
 * Danh sách ngân hàng nhận payout lấy từ VietQR, cache 24h.
 */
export function usePayoutBanks() {
  const query = useQuery({
    queryKey: ['vietqr', 'transfer-banks'],
    queryFn: vietQrBankApi.getTransferBanks,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  })

  return {
    banks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
