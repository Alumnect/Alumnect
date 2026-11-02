import { useEffect, useState } from 'react'

/** Trả về giá trị đã trễ `delay` ms — dùng debounce ô tìm kiếm để tránh gọi API sau mỗi phím gõ. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
