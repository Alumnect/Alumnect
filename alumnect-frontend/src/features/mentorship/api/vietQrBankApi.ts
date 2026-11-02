/**
 * Danh sách ngân hàng Việt Nam từ VietQR (public, không cần key).
 * Gọi trực tiếp từ trình duyệt vì API cho phép CORS và không chứa dữ liệu nhạy cảm.
 */
const VIETQR_BANKS_URL = 'https://api.vietqr.io/v2/banks'

export interface PayoutBank {
  bin: string
  /** Tên ngắn lưu vào tài khoản nhận tiền, VD: "Vietcombank" */
  name: string
  fullName?: string
  logo?: string
}

interface VietQrBank {
  bin: string
  shortName: string
  name: string
  logo: string
  transferSupported: number
}

interface VietQrBanksResponse {
  code: string
  desc: string
  data: VietQrBank[]
}

export const vietQrBankApi = {
  /** Chỉ trả về ngân hàng nhận được chuyển khoản nhanh, vì PayOS Kênh chi chỉ chi được tới các ngân hàng này. */
  getTransferBanks: async (): Promise<PayoutBank[]> => {
    const response = await fetch(VIETQR_BANKS_URL)
    if (!response.ok) throw new Error(`VietQR trả về HTTP ${response.status}`)
    const body = (await response.json()) as VietQrBanksResponse
    if (body.code !== '00' || !Array.isArray(body.data)) throw new Error(body.desc || 'VietQR trả về dữ liệu không hợp lệ')
    return body.data
      .filter((bank) => bank.transferSupported === 1 && /^\d{6}$/.test(bank.bin))
      .map((bank) => ({ bin: bank.bin, name: bank.shortName, fullName: bank.name, logo: bank.logo }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  },
}
