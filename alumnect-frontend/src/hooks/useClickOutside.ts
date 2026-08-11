import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Gọi `onOutside` khi người dùng bấm chuột ra ngoài phần tử `ref`.
 * Chỉ gắn listener khi `active` = true (thường là lúc dropdown/menu đang mở) để tránh listener thừa;
 * luôn gọi callback mới nhất mà không cần re-subscribe mỗi lần render.
 *
 * @param ref Ref tới phần tử bao ngoài (vùng "bên trong")
 * @param onOutside Hàm chạy khi bấm ra ngoài (VD đóng dropdown)
 * @param active Bật/tắt lắng nghe (mặc định true)
 */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void, active = true) {
  const cb = useRef(onOutside)
  cb.current = onOutside

  useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [ref, active])
}
