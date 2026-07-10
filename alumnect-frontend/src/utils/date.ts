/**
 * Định dạng chuỗi ngày sang định dạng "M/YYYY".
 * Ví dụ: "2024-01-15" -> "1/2024".
 */
export const formatPeriodDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : `${d.getMonth() + 1}/${d.getFullYear()}`
}
