import { forwardRef, useMemo, type ReactNode } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { format, isValid, parse } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('vi', vi)

export type DateTimePickerMode = 'date' | 'time' | 'datetime'

/** Định dạng giá trị chuỗi trao đổi với form, trùng với input gốc: date, time, datetime-local. */
const VALUE_FORMAT: Record<DateTimePickerMode, string> = {
  date: 'yyyy-MM-dd',
  time: 'HH:mm',
  datetime: "yyyy-MM-dd'T'HH:mm",
}

const DISPLAY_FORMAT: Record<DateTimePickerMode, string> = {
  date: 'dd/MM/yyyy',
  time: 'HH:mm',
  datetime: 'dd/MM/yyyy HH:mm',
}

const PLACEHOLDER: Record<DateTimePickerMode, string> = {
  date: 'Chọn ngày',
  time: 'Chọn giờ',
  datetime: 'Chọn ngày giờ',
}

function toDate(value: string | undefined | null, mode: DateTimePickerMode): Date | null {
  if (!value) return null
  const parsed = parse(value, VALUE_FORMAT[mode], new Date())
  return isValid(parsed) ? parsed : null
}

interface DateTimePickerProps {
  value?: string | null
  onChange: (value: string) => void
  mode?: DateTimePickerMode
  /** Giá trị nhỏ nhất / lớn nhất, cùng định dạng với `value`. */
  min?: string
  max?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  /** `sm` dùng cho bộ lọc / form dày đặc. */
  size?: 'md' | 'sm'
  /** Cho phép xoá giá trị đã chọn. */
  clearable?: boolean
  className?: string
  popperPlacement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
}

interface TriggerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leading: ReactNode
  invalid?: boolean
  fieldSize: 'md' | 'sm'
}

const Trigger = forwardRef<HTMLInputElement, TriggerProps>(function Trigger(
  { leading, invalid, fieldSize, className, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">{leading}</span>
      <input
        ref={ref}
        readOnly
        autoComplete="off"
        aria-invalid={invalid || undefined}
        {...rest}
        className={cn(
          'w-full cursor-pointer rounded-xl border bg-surface text-text outline-none transition placeholder:text-text-subtle',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
          fieldSize === 'sm' ? 'h-9 pl-8 pr-2.5 text-xs' : 'h-11 pl-10 pr-3.5 text-sm',
          invalid ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border hover:border-border-strong',
          className,
        )}
      />
    </div>
  )
})

/**
 * Chọn ngày / giờ / ngày+giờ dùng chung toàn hệ thống (thay cho input gốc của trình duyệt).
 * Giá trị là chuỗi cùng định dạng input gốc nên thay thế trực tiếp trong form (register + setValue hoặc state).
 */
export function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  min,
  max,
  id,
  placeholder,
  disabled,
  invalid,
  size = 'md',
  clearable = false,
  className,
  popperPlacement = 'bottom-start',
}: DateTimePickerProps) {
  const selected = useMemo(() => toDate(value, mode), [value, mode])
  const minDate = useMemo(() => toDate(min, mode) ?? undefined, [min, mode])
  const maxDate = useMemo(() => toDate(max, mode) ?? undefined, [max, mode])
  const iconSize = size === 'sm' ? 14 : 16
  const leading = mode === 'time' ? <Clock size={iconSize} /> : <CalendarDays size={iconSize} />

  return (
    <DatePicker
      id={id}
      selected={selected}
      onChange={(date: Date | null) => onChange(date ? format(date, VALUE_FORMAT[mode]) : '')}
      locale="vi"
      dateFormat={DISPLAY_FORMAT[mode]}
      showTimeSelect={mode !== 'date'}
      showTimeSelectOnly={mode === 'time'}
      timeFormat="HH:mm"
      timeIntervals={15}
      timeCaption="Giờ"
      minDate={mode === 'time' ? undefined : minDate}
      maxDate={mode === 'time' ? undefined : maxDate}
      showMonthDropdown={mode !== 'time'}
      showYearDropdown={mode !== 'time'}
      dropdownMode="select"
      isClearable={clearable && !disabled}
      disabled={disabled}
      placeholderText={placeholder ?? PLACEHOLDER[mode]}
      wrapperClassName="w-full"
      popperClassName="alumnect-datepicker-popper"
      popperPlacement={popperPlacement}
      popperProps={{ strategy: 'fixed' }}
      customInput={<Trigger leading={leading} invalid={invalid} fieldSize={size} className={className} />}
    />
  )
}
