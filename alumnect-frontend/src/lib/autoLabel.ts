/**
 * Nối nhãn hiển thị với ô nhập cho trình đọc màn hình.
 *
 * Nhiều form viết `<label>Tiêu đề</label>` ngay trước ô nhập nhưng không có `htmlFor`/`id`, nên trình đọc màn hình
 * và điều khiển bằng giọng nói không biết nhãn nào thuộc ô nào. Thay vì sửa từng form, hàm này theo dõi DOM và gán
 * `for`/`id` khi nhãn chưa gắn với control và phần tử liền sau nó chứa đúng một ô nhập. Nhãn đã có `for`, bao quanh
 * control, hoặc mơ hồ (nhiều ô nhập) được giữ nguyên. Thêm `data-no-autolabel` vào nhãn để bỏ qua.
 */
const CONTROL = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea'

let counter = 0

function wire(label: HTMLLabelElement) {
  if (label.hasAttribute('for') || label.hasAttribute('data-no-autolabel') || label.control) return
  const next = label.nextElementSibling
  if (!next) return

  let control: Element | null = null
  if (next.matches(CONTROL)) control = next
  else {
    const found = next.querySelectorAll(CONTROL)
    if (found.length === 1) control = found[0]
  }
  if (!control || (control as HTMLInputElement).labels?.length) return

  if (!control.id) control.id = `auto-label-${++counter}`
  label.htmlFor = control.id
}

function scan(root: Element) {
  if (root instanceof HTMLLabelElement) wire(root)
  root.querySelectorAll<HTMLLabelElement>('label:not([for])').forEach(wire)
}

export function installAutoLabel() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return

  const pending = new Set<Element>()
  let frame = 0
  const flush = () => {
    frame = 0
    const roots = [...pending]
    pending.clear()
    for (const root of roots) if (root.isConnected) scan(root)
  }

  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) pending.add(node)
      })
    }
    if (pending.size && !frame) frame = requestAnimationFrame(flush)
  }).observe(document.body, { childList: true, subtree: true })

  scan(document.body)
}
