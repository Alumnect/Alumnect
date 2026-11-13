/** Định dạng số liệu: chưa tải = "—" */
export const fmtCount = (v: number | undefined | null) => (v === undefined || v === null ? '—' : v.toLocaleString('vi-VN'))
