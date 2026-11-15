/** Hiển thị chuỗi chữ số dạng 1.250.000 (dấu chấm ngăn cách hàng nghìn) cho ô nhập số tiền. */
export const formatMoneyInput = (digits?: string | null) => {
  const clean = (digits ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return clean ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
}

/** Lấy lại chuỗi chữ số thuần từ giá trị người dùng gõ (bỏ dấu chấm, chữ...). */
export const parseMoneyInput = (text: string) => text.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
