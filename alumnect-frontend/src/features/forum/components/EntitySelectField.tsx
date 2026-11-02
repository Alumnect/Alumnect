/**
 * EntitySelectField — Ô chọn ĐƠN (có dòng "bỏ chọn") cho form: thể loại/ngành khi đặt câu hỏi (UC40), ngành/khu vực ở bảng lương…
 * Chỉ là lớp mỏng trên SelectDropdown để dùng chung hành vi bàn phím chuẩn (↑/↓, Home/End, Esc) và ARIA.
 */
import type { ReactNode } from 'react'
import { SelectDropdown } from '@/components/ui/SelectDropdown'

/** Một lựa chọn phẳng trong field. */
export type SelectOption<T = number | string> = { id: T; name: string }

const NONE = '__none__'

export function EntitySelectField<T extends number | string = number>({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  buttonIcon,
  searchable = false,
  itemIcon,
  disabled = false,
  direction = 'auto',
  label,
}: {
  items: SelectOption<T>[] | undefined
  value: T | null
  onChange: (id: T | null) => void
  placeholder: string
  searchPlaceholder?: string
  buttonIcon?: ReactNode
  searchable?: boolean
  itemIcon?: (name: string) => ReactNode
  disabled?: boolean
  direction?: 'auto' | 'top' | 'bottom'
  /** Nhãn của trường cho trình đọc màn hình (mặc định dùng placeholder). */
  label?: string
}) {
  const options = [{ value: NONE as string | number, label: placeholder }, ...(items ?? []).map((it) => ({ value: it.id as string | number, label: it.name, icon: itemIcon?.(it.name) }))]
  return (
    <SelectDropdown<string | number>
      value={value == null ? NONE : value}
      onChange={(v) => onChange(v === NONE ? null : (v as T))}
      options={options}
      placeholder={placeholder}
      label={label ?? placeholder}
      icon={buttonIcon}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder ?? 'Tìm…'}
      disabled={disabled}
      direction={direction}
    />
  )
}
