/**
 * Định dạng chuỗi ngày sang định dạng "MM/YYYY".
 * Ví dụ: "2024-01-15" -> "01/2024", "2024-12" -> "12/2024".
 */
export const formatPeriodDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 2) {
    const year = parts[0]
    const month = String(parseInt(parts[1], 10)).padStart(2, '0')
    return `${month}/${year}`
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime())
    ? dateStr
    : `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

