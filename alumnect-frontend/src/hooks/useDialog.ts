import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Hành vi hộp thoại modal dùng chung (WAI-ARIA dialog pattern):
 *  - tiêu điểm ban đầu vào hộp thoại, Tab/Shift+Tab chỉ xoay vòng bên trong;
 *  - Escape đóng hộp thoại trên cùng (nhiều hộp thoại lồng nhau không đóng nhầm);
 *  - phần nền phía sau được đặt `inert` (không focus / không đọc được bằng trình đọc màn hình);
 *  - khóa cuộn trang theo bộ đếm (hộp thoại lồng nhau không mở khóa cuộn khi đóng cái trong);
 *  - trả tiêu điểm về phần tử đã mở hộp thoại khi đóng.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

type Entry = { el: HTMLElement; close: () => void }
const stack: Entry[] = []
let scrollLocks = 0
let savedOverflow = ''
const inertOwners = new Map<HTMLElement, number>()

function lockScroll() {
  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
}
function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = savedOverflow
}

/** Đặt inert cho mọi con trực tiếp của <body> trừ gốc chứa hộp thoại hiện tại (và vùng thông báo toast). */
function applyInert(dialog: HTMLElement): HTMLElement[] {
  const keep = dialog.closest('body > *')
  const changed: HTMLElement[] = []
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue
    if (child === keep || child.tagName === 'SCRIPT' || child.hasAttribute('data-keep-interactive')) continue
    const count = inertOwners.get(child) ?? 0
    inertOwners.set(child, count + 1)
    if (count === 0) child.setAttribute('inert', '')
    changed.push(child)
  }
  return changed
}
function releaseInert(changed: HTMLElement[]) {
  for (const child of changed) {
    const count = (inertOwners.get(child) ?? 1) - 1
    if (count <= 0) {
      inertOwners.delete(child)
      child.removeAttribute('inert')
    } else {
      inertOwners.set(child, count)
    }
  }
}

export function getFocusable(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
  )
}

export function useDialog(
  ref: RefObject<HTMLElement | null>,
  { open, onClose, initialFocus }: { open: boolean; onClose: () => void; initialFocus?: RefObject<HTMLElement | null> },
) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const entry: Entry = { el, close: () => closeRef.current() }
    stack.push(entry)
    lockScroll()
    const inertChanged = applyInert(el)

    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    const target =
      initialFocus?.current ??
      el.querySelector<HTMLElement>('[data-autofocus], [autofocus]') ??
      getFocusable(el).find((n) => !n.hasAttribute('data-dialog-close')) ??
      el
    // Chờ một frame để phần tử đã được hiển thị (animation vào) rồi mới focus
    const raf = requestAnimationFrame(() => target.focus({ preventScroll: true }))

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== entry) return
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.stopPropagation()
        entry.close()
        return
      }
      if (event.key !== 'Tab') return
      const items = getFocusable(el)
      if (items.length === 0) {
        event.preventDefault()
        el.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === el)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (!el.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      const index = stack.indexOf(entry)
      if (index >= 0) stack.splice(index, 1)
      releaseInert(inertChanged)
      unlockScroll()
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true })
    }
    // initialFocus là ref ổn định; chỉ chạy lại khi mở/đóng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref])
}
