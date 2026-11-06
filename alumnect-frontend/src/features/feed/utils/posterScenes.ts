/**
 * Bộ cảnh vật đồ họa 3D/Isometric (vector, vẽ bằng HTML5 Canvas) và bảng phối màu cho Poster AI Studio [B1].
 * Mọi hình đều tự vẽ bằng code (không dùng ảnh ngoài) nên không làm "tainted canvas", xuất PNG được ngay.
 * Các hình trang trí dùng bộ sinh số giả ngẫu nhiên có hạt giống cố định -> cùng một cảnh luôn ra cùng một hình.
 */

export type PosterSceneId =
  | 'TECH_CODE_WORKSPACE'
  | 'AI_CLOUD_SERVER'
  | 'FINANCE_BANKING_TOWER'
  | 'CREATIVE_DESIGN_STUDIO'
  | 'EVENT_STAGE_SPOTLIGHT'
  | 'TROPHY_ACHIEVEMENT_GOLD'
  | 'STARTUP_ROCKET_LAUNCH'
  | 'COMMUNITY_NETWORK_GLOBE'

export type PosterPaletteId = 'FPT_SIGNATURE' | 'CYBER_INDIGO' | 'EMERALD_FINANCE' | 'ROYAL_GOLD' | 'CRIMSON_EVENT'

export interface PosterPalette {
  id: PosterPaletteId
  label: string
  /** 3 điểm màu nền Gradient (trên-trái → dưới-phải). */
  bg: [string, string, string]
  accent: string
  accent2: string
  /** 2 màu hiển thị ô chọn nhanh trên giao diện. */
  swatch: [string, string]
}

export const POSTER_SCENES: { id: PosterSceneId; label: string }[] = [
  { id: 'TECH_CODE_WORKSPACE', label: 'Laptop Code' },
  { id: 'AI_CLOUD_SERVER', label: 'Server AI' },
  { id: 'FINANCE_BANKING_TOWER', label: 'Tài chính' },
  { id: 'CREATIVE_DESIGN_STUDIO', label: 'Sáng tạo' },
  { id: 'EVENT_STAGE_SPOTLIGHT', label: 'Sân khấu' },
  { id: 'TROPHY_ACHIEVEMENT_GOLD', label: 'Cúp vàng' },
  { id: 'STARTUP_ROCKET_LAUNCH', label: 'Khởi nghiệp' },
  { id: 'COMMUNITY_NETWORK_GLOBE', label: 'Cộng đồng' },
]

export const POSTER_PALETTES: Record<PosterPaletteId, PosterPalette> = {
  FPT_SIGNATURE: {
    id: 'FPT_SIGNATURE',
    label: 'FPT',
    bg: ['#071a3d', '#0c3b86', '#0a2a63'],
    accent: '#ff7a1a',
    accent2: '#2fc4ff',
    swatch: ['#0c3b86', '#ff7a1a'],
  },
  CYBER_INDIGO: {
    id: 'CYBER_INDIGO',
    label: 'Cyber',
    bg: ['#0a0a28', '#2a1c7c', '#16104f'],
    accent: '#22d3ee',
    accent2: '#a78bfa',
    swatch: ['#2a1c7c', '#22d3ee'],
  },
  EMERALD_FINANCE: {
    id: 'EMERALD_FINANCE',
    label: 'Emerald',
    bg: ['#031a16', '#0a5c48', '#063a2f'],
    accent: '#34d399',
    accent2: '#fbbf24',
    swatch: ['#0a5c48', '#fbbf24'],
  },
  ROYAL_GOLD: {
    id: 'ROYAL_GOLD',
    label: 'Royal',
    bg: ['#150b2c', '#3b1f6b', '#26124a'],
    accent: '#fbbf24',
    accent2: '#f472b6',
    swatch: ['#3b1f6b', '#fbbf24'],
  },
  CRIMSON_EVENT: {
    id: 'CRIMSON_EVENT',
    label: 'Crimson',
    bg: ['#260813', '#7a1233', '#4a0c22'],
    accent: '#fb7185',
    accent2: '#fbbf24',
    swatch: ['#7a1233', '#fb7185'],
  },
}

// ====================================================================== tiện ích màu

type Pt = { x: number; y: number }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

export function mix(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`
}

const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t)
const darken = (hex: string, t: number) => mix(hex, '#000000', t)

/** Bộ sinh số giả ngẫu nhiên có hạt giống cố định (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ====================================================================== primitive vẽ hình

type Ctx = CanvasRenderingContext2D

const C30 = Math.cos(Math.PI / 6)

function poly(ctx: Ctx, pts: Pt[]) {
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba(color, alpha))
  g.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function shadowEllipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.35) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx)
  g.addColorStop(0, `rgba(0,0,0,${alpha})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, ry / rx)
  ctx.translate(-x, -y)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function spark(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.save()
  ctx.fillStyle = rgba(color, alpha)
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fill()
  ctx.restore()
}

function star5(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/** Hình học của khối hộp isometric: A (đỉnh sau), B (phải), C (trước), D (trái) của mặt trên. */
interface IsoGeom {
  A: Pt
  B: Pt
  C: Pt
  D: Pt
  w: number
  d: number
  h: number
}

/**
 * Vẽ khối hộp isometric 2:1. (x, y) là đỉnh sau của mặt trên; w chạy xuống-phải, d chạy xuống-trái, h là chiều cao.
 * Mặt trên sáng nhất, mặt trái trung bình, mặt phải tối nhất để tạo cảm giác 3D.
 */
function isoBox(ctx: Ctx, x: number, y: number, w: number, d: number, h: number, base: string): IsoGeom {
  const A = { x, y }
  const B = { x: x + w * C30, y: y + w * 0.5 }
  const D = { x: x - d * C30, y: y + d * 0.5 }
  const C = { x: x + (w - d) * C30, y: y + (w + d) * 0.5 }

  const left = ctx.createLinearGradient(0, D.y, 0, D.y + h + d)
  left.addColorStop(0, lighten(base, 0.05))
  left.addColorStop(1, darken(base, 0.18))
  ctx.fillStyle = left
  poly(ctx, [D, C, { x: C.x, y: C.y + h }, { x: D.x, y: D.y + h }])
  ctx.fill()

  const right = ctx.createLinearGradient(0, B.y, 0, B.y + h + w)
  right.addColorStop(0, darken(base, 0.22))
  right.addColorStop(1, darken(base, 0.45))
  ctx.fillStyle = right
  poly(ctx, [B, C, { x: C.x, y: C.y + h }, { x: B.x, y: B.y + h }])
  ctx.fill()

  const top = ctx.createLinearGradient(D.x, A.y, B.x, C.y)
  top.addColorStop(0, lighten(base, 0.38))
  top.addColorStop(1, lighten(base, 0.14))
  ctx.fillStyle = top
  poly(ctx, [A, B, C, D])
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(D.x, D.y)
  ctx.lineTo(C.x, C.y)
  ctx.lineTo(B.x, B.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(C.x, C.y)
  ctx.lineTo(C.x, C.y + h)
  ctx.stroke()
  return { A, B, C, D, w, d, h }
}

/** Vẽ lên mặt TRÁI của khối: hệ tọa độ cục bộ (u: 0..w dọc cạnh, v: 0..h hướng xuống). */
function onLeftFace(ctx: Ctx, g: IsoGeom, fn: (w: number, h: number) => void) {
  ctx.save()
  ctx.transform(C30, 0.5, 0, 1, g.D.x, g.D.y)
  fn(g.w, g.h)
  ctx.restore()
}

/** Vẽ lên mặt PHẢI của khối: u chạy xuống-trái dọc cạnh d. */
function onRightFace(ctx: Ctx, g: IsoGeom, fn: (d: number, h: number) => void) {
  ctx.save()
  ctx.transform(-C30, 0.5, 0, 1, g.B.x, g.B.y)
  fn(g.d, g.h)
  ctx.restore()
}

/** Vẽ lên mặt TRÊN của khối: u chạy xuống-phải (độ dài w), v chạy xuống-trái (độ dài d). */
function onTopFace(ctx: Ctx, g: IsoGeom, fn: (w: number, d: number) => void) {
  ctx.save()
  ctx.transform(C30, 0.5, -C30, 0.5, g.A.x, g.A.y)
  fn(g.w, g.d)
  ctx.restore()
}

function glass(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, accent: string) {
  roundRectPath(ctx, x, y, w, h, r)
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, 'rgba(255,255,255,0.32)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0.05)')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = rgba(lighten(accent, 0.4), 0.6)
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawReactHolo(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  glow(ctx, 0, 0, r * 1.8, color, 0.45)
  glass(ctx, -r * 1.15, -r * 1.15, r * 2.3, r * 2.3, 14, color)
  // Nhân nguyên tử trung tâm
  ctx.fillStyle = lighten(color, 0.7)
  ctx.shadowColor = color
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  // 3 vòng quỹ đạo electron
  ctx.strokeStyle = lighten(color, 0.45)
  ctx.lineWidth = 2.2
  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI) / 3)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.85, r * 0.32, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function drawTypeScriptHolo(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  glow(ctx, 0, 0, s * 1.6, '#3178c6', 0.5)
  roundRectPath(ctx, -s / 2, -s / 2, s, s, 12)
  const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2)
  g.addColorStop(0, '#388bfd')
  g.addColorStop(1, '#1f5394')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1.8
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${Math.round(s * 0.52)}px "Plus Jakarta Sans","Inter",Arial,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TS', 0, 1)
  ctx.restore()
}

function drawApiHolo(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  glow(ctx, 0, 0, s * 1.5, color, 0.45)
  const w = s * 1.45
  const h = s * 0.82
  glass(ctx, -w / 2, -h / 2, w, h, 10, color)
  ctx.fillStyle = lighten(color, 0.65)
  ctx.font = `800 ${Math.round(s * 0.36)}px "Plus Jakarta Sans","Inter",Arial,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('{ API }', 0, 1)
  ctx.restore()
}

function chip(ctx: Ctx, text: string, x: number, y: number, rot: number, p: PosterPalette, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.font = '800 22px "Plus Jakarta Sans","Inter","Segoe UI",Arial,sans-serif'
  const w = ctx.measureText(text).width + 34
  ctx.shadowColor = rgba(color, 0.6)
  ctx.shadowBlur = 18
  glass(ctx, -w / 2, -22, w, 44, 14, color)
  ctx.shadowBlur = 0
  ctx.fillStyle = lighten(color, 0.55)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 1)
  ctx.restore()
  void p
}

// ====================================================================== các cảnh vật

/** Mỗi cảnh vẽ trong hệ tọa độ có gốc ở tâm khu vực minh họa, kích thước tham chiếu ~460x460. */
type SceneFn = (ctx: Ctx, p: PosterPalette) => void

const sceneTech: SceneFn = (ctx, p) => {
  // 1. Quầng sáng sân khấu & Đổ bóng tiếp xúc thực tế (Ambient Occlusion & Contact Shadow)
  glow(ctx, 0, 15, 300, p.accent2, 0.4)
  shadowEllipse(ctx, 5, 230, 270, 56, 0.55)
  shadowEllipse(ctx, -10, 215, 180, 34, 0.4)

  // 2. Thân Laptop MacBook Pro Space Gray (Hợp kim nhôm nguyên khối)
  const baseW = 265
  const baseD = 180
  const baseH = 14
  const base = isoBox(ctx, -15, 95, baseW, baseD, baseH, '#253043')

  // Mặt trên laptop: Bàn phím & Trackpad
  onTopFace(ctx, base, (w, d) => {
    // Rãnh mở nắp máy ở cạnh trước
    ctx.fillStyle = '#0f172a'
    roundRectPath(ctx, w / 2 - 25, d - 3, 50, 4, 2)
    ctx.fill()

    // Hốc bàn phím âm vào thân máy (Recessed Keyboard Well)
    const kbX = 14
    const kbY = 12
    const kbW = w - 28
    const kbD = d - 72
    ctx.fillStyle = '#101622'
    roundRectPath(ctx, kbX, kbY, kbW, kbD, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Đèn nền bàn phím phát quang dịu (Keyboard Backlight)
    ctx.fillStyle = rgba(p.accent2, 0.14)
    roundRectPath(ctx, kbX + 2, kbY + 2, kbW - 4, kbD - 4, 3)
    ctx.fill()

    // Phím bấm có chiều sâu, viền sáng
    const cols = 14
    const rows = 5
    const kw = (kbW - 14) / cols
    const kh = (kbD - 12) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isSpace = r === rows - 1 && c >= 4 && c <= 9
        if (r === rows - 1 && c > 4 && c <= 9) continue
        const curW = isSpace ? kw * 6 - 3 : kw - 2.5
        const curH = kh - 2.5
        const kx = kbX + 7 + c * kw
        const ky = kbY + 6 + r * kh

        // Thân phím với đổ bóng nhỏ
        const keyGrad = ctx.createLinearGradient(kx, ky, kx, ky + curH)
        keyGrad.addColorStop(0, '#2d384e')
        keyGrad.addColorStop(1, '#1b2434')
        ctx.fillStyle = keyGrad
        roundRectPath(ctx, kx, ky, curW, curH, 2.2)
        ctx.fill()

        // Viền trên bắt sáng
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.lineWidth = 0.6
        ctx.stroke()

        // Ký tự phím phát sáng nhẹ
        if (!isSpace && (r < 4 || c < 3 || c > 10)) {
          ctx.fillStyle = 'rgba(255,255,255,0.32)'
          ctx.fillRect(kx + curW * 0.35, ky + curH * 0.35, curW * 0.3, 1.2)
        }
      }
    }

    // Bàn rê chuột cảm ứng Force Touch cỡ lớn
    const padW = 86
    const padH = 40
    const padX = w / 2 - padW / 2
    const padY = d - 50
    const padGrad = ctx.createLinearGradient(padX, padY, padX, padY + padH)
    padGrad.addColorStop(0, '#2b364a')
    padGrad.addColorStop(1, '#1c2536')
    ctx.fillStyle = padGrad
    roundRectPath(ctx, padX, padY, padW, padH, 6)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    ctx.stroke()
  })

  // 3. Màn hình Retina viền siêu mỏng & Giao diện Code IDE Chân thực
  const H = 215
  const screen = isoBox(ctx, -15, 95 - H, baseW, 10, H, '#161e2e')

  onLeftFace(ctx, screen, (w, h) => {
    // Viền màn hình & Khung hiển thị
    const m = 9
    roundRectPath(ctx, m, m, w - 2 * m, h - 2 * m, 7)
    ctx.fillStyle = '#0a0e1a'
    ctx.fill()

    ctx.save()
    roundRectPath(ctx, m, m, w - 2 * m, h - 2 * m, 7)
    ctx.clip()

    // Nền IDE lập trình VS Code / Cursor
    const ideBg = ctx.createLinearGradient(0, 0, w, h)
    ideBg.addColorStop(0, '#0c1222')
    ideBg.addColorStop(1, '#131b2e')
    ctx.fillStyle = ideBg
    ctx.fillRect(m, m, w - 2 * m, h - 2 * m)

    // Thanh tiêu đề macOS: 3 nút bấm giao diện đỏ, vàng, xanh
    const btnY = m + 11
    const dots: [number, string][] = [
      [m + 14, '#ef4444'], // Đỏ
      [m + 25, '#eab308'], // Vàng
      [m + 36, '#22c55e'], // Xanh
    ]
    dots.forEach(([bx, col]) => {
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(bx, btnY, 3.2, 0, Math.PI * 2)
      ctx.fill()
      // Điểm sáng phản chiếu trên nút
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(bx - 0.8, btnY - 0.8, 1, 0, Math.PI * 2)
      ctx.fill()
    })

    // Tab đang mở: "App.tsx"
    const tabX = m + 50
    const tabY = m + 4
    ctx.fillStyle = '#1e293b'
    roundRectPath(ctx, tabX, tabY, 82, 14, 3)
    ctx.fill()
    ctx.fillStyle = p.accent2
    ctx.beginPath()
    ctx.arc(tabX + 8, tabY + 7, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 8px monospace'
    ctx.fillText('App.tsx', tabX + 16, tabY + 10)

    // Cột số dòng code bên trái
    const gutterW = 22
    ctx.fillStyle = '#080d18'
    ctx.fillRect(m, m + 18, gutterW, h - 2 * m - 18)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(m + gutterW, m + 18)
    ctx.lineTo(m + gutterW, h - m)
    ctx.stroke()

    // Đoạn mã lập trình thực thụ với Syntax Highlighting rực rỡ
    const codeLines = [
      { num: '1', tokens: [{ text: 'import', col: '#f472b6' }, { text: ' React', col: '#38bdf8' }, { text: ' from', col: '#f472b6' }, { text: ' "react"', col: '#4ade80' }] },
      { num: '2', tokens: [{ text: 'import', col: '#f472b6' }, { text: ' { Alumnect }', col: '#facc15' }, { text: ' from', col: '#f472b6' }, { text: ' "@/core"', col: '#4ade80' }] },
      { num: '3', tokens: [{ text: 'export const', col: '#f472b6' }, { text: ' Workspace', col: '#38bdf8' }, { text: ' = () => {', col: '#e2e8f0' }] },
      { num: '4', tokens: [{ text: '  const', col: '#f472b6' }, { text: ' [ready]', col: '#93c5fd' }, { text: ' =', col: '#f472b6' }, { text: ' useState', col: '#c084fc' }, { text: '(true);', col: '#e2e8f0' }] },
      { num: '5', tokens: [{ text: '  return (', col: '#f472b6' }] },
      { num: '6', tokens: [{ text: '    <Alumnect.App', col: '#facc15' }, { text: ' active={ready}>', col: '#38bdf8' }] },
      { num: '7', tokens: [{ text: '      <Hero', col: '#facc15' }, { text: ' role="Frontend"', col: '#4ade80' }, { text: ' />', col: '#facc15' }] },
      { num: '8', tokens: [{ text: '      <TechStack', col: '#facc15' }, { text: ' ts', col: '#38bdf8' }, { text: ' react', col: '#38bdf8' }, { text: ' />', col: '#facc15' }] },
      { num: '9', tokens: [{ text: '    </Alumnect.App>', col: '#facc15' }] },
      { num: '10', tokens: [{ text: '  );', col: '#f472b6' }] },
      { num: '11', tokens: [{ text: '};', col: '#e2e8f0' }] },
    ]

    const startY = m + 32
    const lineH = 15.5
    codeLines.forEach((cl, i) => {
      const cy = startY + i * lineH
      // Số dòng
      ctx.fillStyle = '#475569'
      ctx.font = '600 8.5px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(cl.num, m + gutterW - 5, cy)

      // Các từ khóa màu
      ctx.textAlign = 'left'
      let cx = m + gutterW + 8
      cl.tokens.forEach((tk) => {
        ctx.fillStyle = tk.col
        ctx.font = '600 9px monospace'
        ctx.fillText(tk.text, cx, cy)
        cx += ctx.measureText(tk.text).width
      })
    })

    // Con trỏ soạn thảo phát sáng neon (Active Glowing Cursor)
    ctx.fillStyle = '#00f2fe'
    ctx.shadowColor = '#00f2fe'
    ctx.shadowBlur = 8
    ctx.fillRect(m + gutterW + 36, startY + 10 * lineH - 9, 2.5, 11)
    ctx.shadowBlur = 0

    // Vệt sáng phản chiếu mặt kính màn hình (Glossy Glass Reflection)
    const glassSheen = ctx.createLinearGradient(m, m, w - m, h - m)
    glassSheen.addColorStop(0, 'rgba(255,255,255,0.18)')
    glassSheen.addColorStop(0.35, 'rgba(255,255,255,0.04)')
    glassSheen.addColorStop(0.65, 'rgba(255,255,255,0)')
    ctx.fillStyle = glassSheen
    ctx.fillRect(m, m, w - 2 * m, h - 2 * m)
    ctx.restore()
  })

  // 4. Các Biểu tượng Hologram 3D Công nghệ Đẳng cấp
  drawReactHolo(ctx, -170, -145, 36, p.accent2)
  drawTypeScriptHolo(ctx, 175, -155, 48)
  drawApiHolo(ctx, -175, 40, 44, p.accent)

  // Điểm sáng Stardust & Lens Flare
  spark(ctx, -195, -45, 16, '#ffffff', 0.95)
  spark(ctx, 130, -245, 12, p.accent2, 0.95)
  spark(ctx, -85, -235, 10, p.accent, 0.9)
  spark(ctx, 195, 35, 9, '#ffffff', 0.85)
}

const sceneAi: SceneFn = (ctx, p) => {
  glow(ctx, 0, 0, 280, p.accent, 0.28)
  shadowEllipse(ctx, 0, 225, 250, 48, 0.45)

  const rackColor = '#2b3558'
  const drawRack = (x: number, y: number, units: number, w: number) => {
    const unitH = 42
    for (let u = units - 1; u >= 0; u--) {
      const yy = y + u * (unitH + 6)
      const g = isoBox(ctx, x, yy, w, 120, unitH, rackColor)
      onLeftFace(ctx, g, (fw, fh) => {
        ctx.fillStyle = 'rgba(8,12,28,0.55)'
        roundRectPath(ctx, 10, 8, fw - 20, fh - 16, 4)
        ctx.fill()
        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = 'rgba(148,163,184,0.35)'
          ctx.fillRect(18 + s * 22, 15, 15, 5)
          ctx.fillRect(18 + s * 22, 25, 15, 5)
        }
        const ledColors = [p.accent, '#34d399', p.accent2]
        for (let l = 0; l < 3; l++) {
          ctx.fillStyle = ledColors[(l + u) % 3]
          ctx.shadowColor = ledColors[(l + u) % 3]
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(fw - 22 - l * 14, fh / 2, 3.4, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
    }
  }
  drawRack(-70, -10, 4, 150)
  drawRack(70, 70, 3, 110)

  // Đám mây phát sáng phía trên
  const cx = -10
  const cy = -150
  glow(ctx, cx, cy, 200, p.accent2, 0.5)
  const cloud = ctx.createLinearGradient(0, cy - 70, 0, cy + 60)
  cloud.addColorStop(0, '#ffffff')
  cloud.addColorStop(1, lighten(p.accent2, 0.55))
  ctx.fillStyle = cloud
  ctx.shadowColor = rgba(p.accent2, 0.9)
  ctx.shadowBlur = 30
  ctx.beginPath()
  ctx.arc(cx - 70, cy + 20, 42, 0, Math.PI * 2)
  ctx.arc(cx - 20, cy - 18, 62, 0, Math.PI * 2)
  ctx.arc(cx + 50, cy - 4, 52, 0, Math.PI * 2)
  ctx.arc(cx + 92, cy + 26, 36, 0, Math.PI * 2)
  ctx.rect(cx - 100, cy + 20, 200, 42)
  ctx.fill()
  ctx.shadowBlur = 0

  // Chip AI
  ctx.save()
  ctx.translate(cx + 5, cy + 8)
  ctx.fillStyle = '#10183a'
  roundRectPath(ctx, -32, -32, 64, 64, 10)
  ctx.fill()
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 2.5
  ctx.stroke()
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = p.accent
    ctx.fillRect(i * 12 - 2, -42, 4, 10)
    ctx.fillRect(i * 12 - 2, 32, 4, 10)
    ctx.fillRect(-42, i * 12 - 2, 10, 4)
    ctx.fillRect(32, i * 12 - 2, 10, 4)
  }
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 28px "Plus Jakarta Sans","Inter",Arial,sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AI', 0, 2)
  ctx.restore()

  // Đường dữ liệu từ mây xuống server
  const links: [number, number, number, number][] = [
    [-40, -90, -10, 20],
    [30, -90, 120, 90],
  ]
  links.forEach(([x1, y1, x2, y2], i) => {
    ctx.strokeStyle = rgba(p.accent, 0.8)
    ctx.lineWidth = 2.5
    ctx.setLineDash([2, 9])
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo((x1 + x2) / 2 + (i ? 40 : -40), (y1 + y2) / 2, x2, y2)
    ctx.stroke()
    ctx.setLineDash([])
    glow(ctx, x2, y2, 18, p.accent, 0.8)
  })
  spark(ctx, 190, -120, 12, '#ffffff', 0.9)
  spark(ctx, -200, 10, 10, p.accent, 0.9)
  chip(ctx, 'Cloud', -185, -60, -0.1, p, p.accent2)
  chip(ctx, 'Data', 200, 10, 0.08, p, p.accent)
}

const sceneFinance: SceneFn = (ctx, p) => {
  glow(ctx, 0, -20, 270, p.accent2, 0.28)
  shadowEllipse(ctx, 0, 225, 270, 50, 0.45)
  const rand = rng(11)

  const tower = (x: number, y: number, w: number, d: number, h: number, base: string, lit: number) => {
    const g = isoBox(ctx, x, y, w, d, h, base)
    const windows = (u: number, hh: number, bright: number) => {
      const cols = Math.floor(u / 18)
      const rows = Math.floor((hh - 16) / 22)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = rand() < lit
          ctx.fillStyle = on ? rgba(lighten(p.accent2, 0.55), bright) : 'rgba(10,20,40,0.45)'
          ctx.fillRect(10 + c * 18, 12 + r * 22, 10, 13)
        }
      }
    }
    onLeftFace(ctx, g, (fw, fh) => windows(fw, fh, 0.95))
    onRightFace(ctx, g, (fd, fh) => windows(fd, fh, 0.7))
    return g
  }
  // Ba tòa nhà: sau → trước
  tower(70, -145, 90, 90, 280, '#3d6a8f', 0.55)
  const mid = tower(-60, -30, 100, 100, 215, '#2f7a6d', 0.6)
  // Ăng-ten
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(mid.A.x + 0, mid.A.y + 18)
  ctx.lineTo(mid.A.x + 0, mid.A.y - 40)
  ctx.stroke()
  glow(ctx, mid.A.x, mid.A.y - 42, 16, '#ef4444', 0.9)
  tower(-185, 50, 80, 80, 150, '#4b5f9e', 0.5)

  // Cột biểu đồ tăng trưởng + mũi tên
  const bars = [40, 70, 105, 150]
  bars.forEach((hh, i) => {
    const bx = 150 + i * 30
    const g = isoBox(ctx, bx, 150 - hh, 22, 22, hh, i === bars.length - 1 ? p.accent : mix(p.accent, p.accent2, 0.5))
    void g
  })
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = rgba(p.accent, 0.9)
  ctx.shadowBlur = 16
  ctx.beginPath()
  ctx.moveTo(130, 165)
  ctx.lineTo(180, 120)
  ctx.lineTo(215, 135)
  ctx.lineTo(262, 60)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(262, 60)
  ctx.lineTo(238, 64)
  ctx.moveTo(262, 60)
  ctx.lineTo(258, 85)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Chồng đồng tiền vàng
  const coinStack = (x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const yy = y - i * 11
      ctx.fillStyle = '#b7791f'
      ctx.beginPath()
      ctx.ellipse(x, yy + 9, 34, 13, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - 34, yy - 1, 68, 10)
      ctx.fillStyle = '#d99a1e'
      ctx.beginPath()
      ctx.ellipse(x, yy + 9, 34, 13, 0, 0, Math.PI)
      ctx.fill()
      const top = ctx.createLinearGradient(x - 30, yy - 8, x + 30, yy + 8)
      top.addColorStop(0, '#ffe08a')
      top.addColorStop(1, '#f5b82e')
      ctx.fillStyle = top
      ctx.beginPath()
      ctx.ellipse(x, yy - 1, 34, 13, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(146,92,10,0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(x, yy - 1, 23, 8, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  coinStack(-110, 205, 3)
  coinStack(-45, 215, 5)
  coinStack(30, 208, 2)
  spark(ctx, -215, -60, 12, '#ffffff', 0.9)
  spark(ctx, 215, -170, 10, p.accent2, 0.9)
}

const sceneCreative: SceneFn = (ctx, p) => {
  glow(ctx, 0, 0, 280, p.accent, 0.3)
  shadowEllipse(ctx, 0, 225, 240, 44, 0.4)

  // Artboard kính
  ctx.save()
  ctx.translate(-10, -10)
  ctx.rotate(-0.06)
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 18
  glass(ctx, -205, -190, 410, 300, 22, p.accent2)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  // đường cong Bézier + điểm neo
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-150, 60)
  ctx.bezierCurveTo(-90, -150, 40, 150, 150, -60)
  ctx.stroke()
  const anchors: [number, number][] = [[-150, 60], [150, -60]]
  anchors.forEach(([x, y]) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 7, y - 7, 14, 14)
    ctx.strokeStyle = p.accent
    ctx.lineWidth = 3
    ctx.strokeRect(x - 7, y - 7, 14, 14)
  })
  ctx.strokeStyle = rgba('#ffffff', 0.6)
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 5])
  ctx.beginPath()
  ctx.moveTo(-150, 60)
  ctx.lineTo(-90, -150)
  ctx.moveTo(150, -60)
  ctx.lineTo(40, 150)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Quả cầu 3D
  const sx = -120
  const sy = 120
  const sg = ctx.createRadialGradient(sx - 22, sy - 26, 6, sx, sy, 78)
  sg.addColorStop(0, lighten(p.accent, 0.7))
  sg.addColorStop(0.5, p.accent)
  sg.addColorStop(1, darken(p.accent, 0.5))
  ctx.fillStyle = sg
  ctx.shadowColor = rgba(p.accent, 0.6)
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.arc(sx, sy, 74, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Khối lập phương isometric
  isoBox(ctx, 120, 70, 100, 100, 100, p.accent2)

  // Hình tam giác kính
  ctx.save()
  ctx.translate(30, 150)
  ctx.rotate(0.15)
  const tg = ctx.createLinearGradient(-50, -60, 50, 50)
  tg.addColorStop(0, '#fde68a')
  tg.addColorStop(1, '#f59e0b')
  ctx.fillStyle = tg
  ctx.beginPath()
  ctx.moveTo(0, -62)
  ctx.lineTo(62, 46)
  ctx.lineTo(-62, 46)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Bảng màu
  const sw = [p.accent, p.accent2, '#34d399', '#fbbf24', '#f472b6']
  sw.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.shadowColor = rgba(c, 0.7)
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(-170 + i * 34, -215, 13, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0

  // Bút chì
  ctx.save()
  ctx.translate(190, -130)
  ctx.rotate(0.85)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(-10, -80, 20, 120)
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(2, -80, 8, 120)
  ctx.fillStyle = '#fde8c8'
  ctx.beginPath()
  ctx.moveTo(-10, 40)
  ctx.lineTo(10, 40)
  ctx.lineTo(0, 66)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.moveTo(-3.5, 58)
  ctx.lineTo(3.5, 58)
  ctx.lineTo(0, 66)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f472b6'
  ctx.fillRect(-10, -98, 20, 18)
  ctx.restore()
  spark(ctx, 205, 110, 12, '#ffffff', 0.9)
  spark(ctx, -205, -110, 9, p.accent2, 0.9)
}

const sceneStage: SceneFn = (ctx, p) => {
  glow(ctx, 0, -10, 300, p.accent, 0.3)
  shadowEllipse(ctx, 0, 230, 280, 48, 0.5)

  // Chùm đèn rọi (xếp lớp, cộng sáng)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const beams: [number, number, number][] = [[-130, -210, -70], [0, -215, 0], [130, -210, 70]]
  beams.forEach(([bx, by, tx], i) => {
    const g = ctx.createLinearGradient(bx, by, tx, 130)
    g.addColorStop(0, rgba(i === 1 ? p.accent2 : p.accent, 0.55))
    g.addColorStop(1, rgba(i === 1 ? p.accent2 : p.accent, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(bx - 14, by)
    ctx.lineTo(bx + 14, by)
    ctx.lineTo(tx + 90, 150)
    ctx.lineTo(tx - 90, 150)
    ctx.closePath()
    ctx.fill()
  })
  ctx.restore()

  // Giàn đèn + đèn rọi
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-210, -222)
  ctx.lineTo(210, -222)
  ctx.stroke()
  beams.forEach(([bx, by]) => {
    ctx.fillStyle = '#1e293b'
    roundRectPath(ctx, bx - 20, by - 14, 40, 34, 8)
    ctx.fill()
    glow(ctx, bx, by + 16, 28, '#ffffff', 0.95)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(bx, by + 16, 9, 0, Math.PI * 2)
    ctx.fill()
  })

  // Loa hai bên
  const spk = (x: number, y: number) => {
    const g = isoBox(ctx, x, y, 56, 56, 110, '#252d4a')
    onLeftFace(ctx, g, (w, h) => {
      ctx.fillStyle = '#0b1020'
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.32, 14, 0, Math.PI * 2)
      ctx.arc(w / 2, h * 0.7, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = rgba(p.accent, 0.8)
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }
  spk(-205, 10)
  spk(215, 10)

  // Sân khấu
  const stage = isoBox(ctx, 0, 60, 230, 170, 34, '#3b4470')
  onTopFace(ctx, stage, (w, d) => {
    ctx.strokeStyle = rgba(p.accent, 0.55)
    ctx.lineWidth = 2
    for (let i = 1; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo((w / 6) * i, 0)
      ctx.lineTo((w / 6) * i, d)
      ctx.stroke()
    }
  })
  onLeftFace(ctx, stage, (w, h) => {
    ctx.fillStyle = rgba(p.accent, 0.9)
    ctx.fillRect(0, h - 6, w, 6)
  })

  // Micro đứng trên sân khấu
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(40, 188)
  ctx.lineTo(40, 90)
  ctx.stroke()
  ctx.fillStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.ellipse(40, 192, 22, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  const mg = ctx.createLinearGradient(30, 40, 52, 90)
  mg.addColorStop(0, '#f1f5f9')
  mg.addColorStop(1, '#64748b')
  ctx.fillStyle = mg
  roundRectPath(ctx, 28, 36, 24, 52, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(15,23,42,0.4)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(30, 46 + i * 9)
    ctx.lineTo(50, 46 + i * 9)
    ctx.stroke()
  }

  // Khán giả (bóng đen) phía trước
  ctx.fillStyle = 'rgba(8,10,28,0.92)'
  const rand = rng(21)
  for (let i = 0; i < 11; i++) {
    const x = -230 + i * 46 + (rand() - 0.5) * 12
    const y = 232 + (i % 2) * 10
    ctx.beginPath()
    ctx.arc(x, y - 20, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x, y + 12, 22, 24, 0, Math.PI, 0)
    ctx.fill()
    if (i % 3 === 0) {
      ctx.fillRect(x + 14, y - 62, 4, 40)
    }
  }
  // Confetti
  const colors = [p.accent, p.accent2, '#ffffff', '#34d399', '#a78bfa']
  for (let i = 0; i < 38; i++) {
    ctx.save()
    ctx.translate(-230 + rand() * 460, -200 + rand() * 330)
    ctx.rotate(rand() * Math.PI)
    ctx.fillStyle = colors[i % colors.length]
    ctx.globalAlpha = 0.85
    ctx.fillRect(-5, -2.5, 10, 5)
    ctx.restore()
  }
}

const sceneTrophy: SceneFn = (ctx, p) => {
  // tia nắng xoay
  ctx.save()
  ctx.translate(0, -30)
  for (let i = 0; i < 16; i++) {
    ctx.rotate((Math.PI * 2) / 16)
    const g = ctx.createLinearGradient(0, 0, 0, -300)
    g.addColorStop(0, rgba('#fde68a', 0.34))
    g.addColorStop(1, rgba('#fde68a', 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-12, 0)
    ctx.lineTo(12, 0)
    ctx.lineTo(34, -300)
    ctx.lineTo(-34, -300)
    ctx.closePath()
    if (i % 2 === 0) ctx.fill()
  }
  ctx.restore()
  glow(ctx, 0, -30, 250, '#fbbf24', 0.45)
  shadowEllipse(ctx, 0, 196, 190, 36, 0.5)

  // Đế cúp: 2 tầng isometric
  const gold = '#d99a1e'
  isoBox(ctx, 0, 53, 190, 190, 30, '#4a3a86')
  const b2 = isoBox(ctx, 0, 53, 130, 130, 30, '#5b47a5')
  onLeftFace(ctx, b2, (w, h) => {
    ctx.fillStyle = '#fcd34d'
    roundRectPath(ctx, w / 2 - 34, 6, 68, h - 12, 4)
    ctx.fill()
  })

  // Thân & chén cúp
  const metal = ctx.createLinearGradient(-110, 0, 110, 0)
  metal.addColorStop(0, '#a76b0c')
  metal.addColorStop(0.28, '#ffe08a')
  metal.addColorStop(0.55, '#f5b82e')
  metal.addColorStop(1, '#8a5a0a')
  ctx.fillStyle = metal
  // chân cúp
  ctx.beginPath()
  ctx.moveTo(-22, 118)
  ctx.quadraticCurveTo(-8, 70, -14, 28)
  ctx.lineTo(14, 28)
  ctx.quadraticCurveTo(8, 70, 22, 118)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, 118, 48, 13, 0, 0, Math.PI * 2)
  ctx.fill()
  // tay cầm
  ctx.strokeStyle = metal
  ctx.lineWidth = 15
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-86, -118)
  ctx.bezierCurveTo(-160, -120, -150, -26, -76, -10)
  ctx.moveTo(86, -118)
  ctx.bezierCurveTo(160, -120, 150, -26, 76, -10)
  ctx.stroke()
  // chén
  ctx.fillStyle = metal
  ctx.beginPath()
  ctx.moveTo(-98, -158)
  ctx.lineTo(98, -158)
  ctx.bezierCurveTo(100, -40, 52, 20, 0, 30)
  ctx.bezierCurveTo(-52, 20, -100, -40, -98, -158)
  ctx.closePath()
  ctx.fill()
  // miệng cúp
  ctx.fillStyle = '#7a4d07'
  ctx.beginPath()
  ctx.ellipse(0, -158, 98, 20, 0, 0, Math.PI * 2)
  ctx.fill()
  const rim = ctx.createLinearGradient(-98, -170, 98, -150)
  rim.addColorStop(0, '#ffe9a3')
  rim.addColorStop(1, '#e8a317')
  ctx.strokeStyle = rim
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.ellipse(0, -158, 98, 20, 0, 0, Math.PI * 2)
  ctx.stroke()
  // vệt sáng
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.moveTo(-70, -140)
  ctx.bezierCurveTo(-76, -80, -52, -30, -24, -4)
  ctx.bezierCurveTo(-48, -40, -62, -90, -50, -140)
  ctx.closePath()
  ctx.fill()
  // ngôi sao
  ctx.fillStyle = '#fff7d6'
  ctx.shadowColor = '#fff3b0'
  ctx.shadowBlur = 18
  star5(ctx, 0, -86, 42)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = rgba('#b7791f', 0.8)
  ctx.lineWidth = 3
  star5(ctx, 0, -86, 42)
  ctx.stroke()
  void gold

  spark(ctx, -190, -150, 18, '#ffffff', 0.95)
  spark(ctx, 195, -90, 14, '#fff3b0', 0.95)
  spark(ctx, -150, 30, 10, p.accent, 0.95)
  spark(ctx, 150, -210, 11, '#ffffff', 0.9)
  spark(ctx, -60, -240, 9, '#fff3b0', 0.9)
}

const sceneRocket: SceneFn = (ctx, p) => {
  glow(ctx, 20, 10, 290, p.accent, 0.3)
  const rand = rng(5)
  // sao
  for (let i = 0; i < 28; i++) {
    spark(ctx, -230 + rand() * 460, -240 + rand() * 330, 2 + rand() * 5, '#ffffff', 0.4 + rand() * 0.6)
  }
  // hành tinh có vành đai
  ctx.save()
  ctx.translate(150, -150)
  const pg = ctx.createRadialGradient(-14, -16, 4, 0, 0, 56)
  pg.addColorStop(0, lighten(p.accent2, 0.6))
  pg.addColorStop(1, darken(p.accent2, 0.35))
  ctx.fillStyle = pg
  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = rgba('#ffffff', 0.7)
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.ellipse(0, 0, 86, 18, -0.35, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // khói bệ phóng
  const smoke = [[-120, 215, 58], [-50, 228, 66], [40, 222, 54], [120, 214, 50], [-170, 195, 40]]
  smoke.forEach(([x, y, r]) => {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(1, 'rgba(203,213,225,0.55)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // tên lửa nghiêng
  ctx.save()
  ctx.translate(0, 20)
  ctx.rotate(0.5)
  // ngọn lửa
  const flame = ctx.createLinearGradient(0, 120, 0, 300)
  flame.addColorStop(0, '#fff7d6')
  flame.addColorStop(0.35, '#fbbf24')
  flame.addColorStop(1, rgba('#ef4444', 0))
  ctx.fillStyle = flame
  ctx.shadowColor = '#fbbf24'
  ctx.shadowBlur = 40
  ctx.beginPath()
  ctx.moveTo(-34, 128)
  ctx.quadraticCurveTo(-48, 210, 0, 300)
  ctx.quadraticCurveTo(48, 210, 34, 128)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  // cánh
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.moveTo(-52, 40)
  ctx.quadraticCurveTo(-120, 100, -104, 168)
  ctx.lineTo(-48, 124)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(52, 40)
  ctx.quadraticCurveTo(120, 100, 104, 168)
  ctx.lineTo(48, 124)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = darken(p.accent, 0.3)
  ctx.beginPath()
  ctx.moveTo(0, 60)
  ctx.lineTo(18, 60)
  ctx.lineTo(18, 150)
  ctx.lineTo(0, 130)
  ctx.closePath()
  ctx.fill()
  // thân
  const body = ctx.createLinearGradient(-60, 0, 60, 0)
  body.addColorStop(0, '#c7d2e6')
  body.addColorStop(0.45, '#ffffff')
  body.addColorStop(1, '#8e9bb8')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(0, -190)
  ctx.bezierCurveTo(78, -110, 66, 40, 50, 130)
  ctx.lineTo(-50, 130)
  ctx.bezierCurveTo(-66, 40, -78, -110, 0, -190)
  ctx.closePath()
  ctx.fill()
  // mũi
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.moveTo(0, -190)
  ctx.bezierCurveTo(40, -150, 54, -126, 58, -108)
  ctx.lineTo(-58, -108)
  ctx.bezierCurveTo(-54, -126, -40, -150, 0, -190)
  ctx.closePath()
  ctx.fill()
  // đai
  ctx.fillStyle = p.accent
  ctx.fillRect(-56, 78, 112, 14)
  // cửa sổ
  ctx.fillStyle = '#10183a'
  ctx.beginPath()
  ctx.arc(0, -42, 30, 0, Math.PI * 2)
  ctx.fill()
  const win = ctx.createRadialGradient(-8, -52, 2, 0, -42, 26)
  win.addColorStop(0, lighten(p.accent2, 0.7))
  win.addColorStop(1, darken(p.accent2, 0.2))
  ctx.fillStyle = win
  ctx.beginPath()
  ctx.arc(0, -42, 23, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  spark(ctx, -190, -90, 14, '#ffffff', 0.95)
  spark(ctx, -90, -220, 10, p.accent, 0.95)
}

const sceneGlobe: SceneFn = (ctx, p) => {
  glow(ctx, 0, 0, 300, p.accent2, 0.3)
  const R = 150
  // quả cầu
  const sg = ctx.createRadialGradient(-50, -60, 10, 0, 0, R * 1.05)
  sg.addColorStop(0, lighten(p.accent2, 0.45))
  sg.addColorStop(0.55, mix(p.accent2, p.bg[1], 0.55))
  sg.addColorStop(1, darken(p.bg[0], 0.1))
  ctx.fillStyle = sg
  ctx.shadowColor = rgba(p.accent2, 0.7)
  ctx.shadowBlur = 40
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1.6
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.ellipse(0, 0, Math.abs(i) < 0.1 ? 4 : R * (1 - Math.abs(i) / 4), R, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = -3; i <= 3; i++) {
    const y = (R / 4) * i
    const half = Math.sqrt(Math.max(0, R * R - y * y))
    ctx.beginPath()
    ctx.ellipse(0, y, half, half * 0.18, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  // vài "lục địa"
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  const rand = rng(3)
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.ellipse(-90 + rand() * 180, -90 + rand() * 180, 18 + rand() * 30, 10 + rand() * 20, rand() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // vành sáng
  ctx.strokeStyle = rgba('#ffffff', 0.5)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.stroke()

  // quỹ đạo
  ctx.strokeStyle = rgba(p.accent, 0.65)
  ctx.lineWidth = 2.5
  ctx.setLineDash([3, 8])
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.ellipse(0, 0, 230, 80, -0.35, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // các "thành viên" quanh quả cầu
  const members = 8
  for (let i = 0; i < members; i++) {
    const a = (i / members) * Math.PI * 2 + 0.3
    const x = Math.cos(a) * 218
    const y = Math.sin(a) * 74
    const rx = x * Math.cos(-0.35) - y * Math.sin(-0.35)
    const ry = x * Math.sin(-0.35) + y * Math.cos(-0.35)
    // dây nối về tâm
    ctx.strokeStyle = rgba(p.accent, 0.55)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(rx, ry)
    ctx.quadraticCurveTo(rx * 0.4, ry * 0.4 - 30, 0, 0)
    ctx.stroke()
    const col = [p.accent, p.accent2, '#fbbf24', '#34d399'][i % 4]
    ctx.shadowColor = rgba(col, 0.8)
    ctx.shadowBlur = 16
    ctx.fillStyle = '#10183a'
    ctx.beginPath()
    ctx.arc(rx, ry, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = col
    ctx.lineWidth = 3.5
    ctx.stroke()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(rx, ry - 6, 7.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(rx, ry + 13, 12, 8, 0, Math.PI, 0)
    ctx.fill()
  }
  glow(ctx, 0, 0, 46, '#ffffff', 0.8)
  spark(ctx, -210, -150, 13, '#ffffff', 0.9)
  spark(ctx, 205, 150, 11, p.accent, 0.9)
}

const SCENES: Record<PosterSceneId, SceneFn> = {
  TECH_CODE_WORKSPACE: sceneTech,
  AI_CLOUD_SERVER: sceneAi,
  FINANCE_BANKING_TOWER: sceneFinance,
  CREATIVE_DESIGN_STUDIO: sceneCreative,
  EVENT_STAGE_SPOTLIGHT: sceneStage,
  TROPHY_ACHIEVEMENT_GOLD: sceneTrophy,
  STARTUP_ROCKET_LAUNCH: sceneRocket,
  COMMUNITY_NETWORK_GLOBE: sceneGlobe,
}

/** Vẽ cảnh vật vào vùng minh họa, tâm tại (cx, cy), thu phóng theo scale (1 = ~460px). */
export function drawScene(ctx: Ctx, scene: PosterSceneId, palette: PosterPalette, cx: number, cy: number, scale: number) {
  const fn = SCENES[scene] ?? SCENES.COMMUNITY_NETWORK_GLOBE
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  fn(ctx, palette)
  ctx.restore()
}
