import {
  POSTER_PALETTES,
  POSTER_SCENES,
  drawScene,
  mix,
  rgba,
  roundRectPath,
} from './posterScenes'
import type { PosterPalette, PosterPaletteId, PosterSceneId } from './posterScenes'

/**
 * HTML5 Canvas Poster Engine cho AI Studio [B1].
 * Vẽ tấm Poster HD 1200x675: nền Gradient đa điểm + lưới ánh sáng 3D, cụm đồ vật 3D/Isometric ở nửa phải theo
 * `illustrationScene`, bố cục chữ Tiếng Việt ở nửa trái (Badge, Headline, Pill, thẻ kính mờ, địa điểm, tác giả,
 * logo AlumNect). Chữ được vẽ trực tiếp bằng Canvas nên luôn sắc nét và đúng dấu tiếng Việt 100%. Mất ~50ms
 * trên trình duyệt; đổi cảnh vật/màu chỉ cần vẽ lại (0ms gọi AI).
 */

export const POSTER_WIDTH = 1200
export const POSTER_HEIGHT = 675

export { POSTER_PALETTES, POSTER_SCENES }
export type { PosterPalette, PosterPaletteId, PosterSceneId }

/** Loại bài viết — quyết định biểu tượng của "viên thuốc" thông tin chính. */
export type PosterKind = 'recruitment' | 'event' | 'achievement' | 'normal'

/** Cấu hình thiết kế Poster do AI (hoặc Template cục bộ) trả về — khớp `posterSpec` của Backend. */
export interface PosterSpec {
  illustrationScene: string
  colorPalette: string
  badgeText?: string | null
  headline: string
  subheadline?: string | null
  highlightPill?: string | null
  locationText?: string | null
  bulletPoints?: string[] | null
}

export interface PosterRenderOptions {
  /** Tên người đăng (hiển thị cùng avatar chữ cái đầu ở góc dưới). */
  authorName?: string
  kind?: PosterKind
}

// Dùng Plus Jakarta Sans cho cả tiêu đề: Sora trên Google Fonts không có subset tiếng Việt nên dấu sẽ rơi sang font khác.
const FONT_DISPLAY = '"Plus Jakarta Sans","Inter","Segoe UI",Roboto,Arial,sans-serif'
const FONT_TEXT = '"Plus Jakarta Sans","Inter","Segoe UI",Roboto,Arial,sans-serif'

const DEFAULT_SCENE: PosterSceneId = 'COMMUNITY_NETWORK_GLOBE'
const DEFAULT_PALETTE: PosterPaletteId = 'FPT_SIGNATURE'

const SCENE_LAYOUT: Partial<Record<PosterSceneId, { x: number; y: number; s: number }>> = {
  EVENT_STAGE_SPOTLIGHT: { x: 928, y: 338, s: 0.84 },
  TECH_CODE_WORKSPACE: { x: 910, y: 335, s: 0.98 },
  TROPHY_ACHIEVEMENT_GOLD: { x: 915, y: 330, s: 1 },
}

const SCENE_IDS = new Set<string>(POSTER_SCENES.map((s) => s.id))

export function resolveScene(id: string | undefined | null): PosterSceneId {
  const up = (id ?? '').toUpperCase()
  return SCENE_IDS.has(up) ? (up as PosterSceneId) : DEFAULT_SCENE
}

export function resolvePalette(id: string | undefined | null): PosterPalette {
  const up = (id ?? '').toUpperCase() as PosterPaletteId
  return POSTER_PALETTES[up] ?? POSTER_PALETTES[DEFAULT_PALETTE]
}

/** Bỏ emoji/ký tự tượng hình khỏi chuỗi (Canvas tự vẽ biểu tượng vector thay thế, tránh lệch font emoji giữa các máy). */
export function stripEmoji(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/\p{Extended_Pictographic}|\u200d|\ufe0f/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ====================================================================== font

let fontsPromise: Promise<void> | null = null

/** Đảm bảo web font (có subset tiếng Việt) đã tải xong trước khi vẽ để dấu không bị rơi về font hệ thống. */
export function ensurePosterFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  const sample = 'Tiếng Việt ăâêôơư ĐẠỆỔ'
  const loads = [
    `800 56px "Plus Jakarta Sans"`,
    `600 22px "Plus Jakarta Sans"`,
    `700 22px "Plus Jakarta Sans"`,
    `800 22px "Plus Jakarta Sans"`,
  ].map((f) => document.fonts.load(f, sample).catch(() => []))
  fontsPromise = Promise.race([
    Promise.all(loads).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 1800)),
  ])
  return fontsPromise
}

// ====================================================================== đo & ngắt dòng chữ

type Ctx = CanvasRenderingContext2D

function setLetterSpacing(ctx: Ctx, value: string) {
  const c = ctx as Ctx & { letterSpacing?: string }
  if ('letterSpacing' in c) c.letterSpacing = value
}

function wrapLines(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function ellipsize(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/** Tìm cỡ chữ lớn nhất (≤ max) để tiêu đề nằm gọn trong `maxLines` dòng. */
function fitHeadline(ctx: Ctx, text: string, maxWidth: number, maxLines: number, maxSize: number, minSize: number) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `800 ${size}px ${FONT_DISPLAY}`
    const lines = wrapLines(ctx, text, maxWidth)
    if (lines.length <= maxLines) return { size, lines }
  }
  ctx.font = `800 ${minSize}px ${FONT_DISPLAY}`
  const lines = wrapLines(ctx, text, maxWidth)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = ellipsize(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth)
    return { size: minSize, lines: kept }
  }
  return { size: minSize, lines }
}

// ====================================================================== nền & trang trí

function drawBackground(ctx: Ctx, p: PosterPalette) {
  const W = POSTER_WIDTH
  const H = POSTER_HEIGHT

  // Nền Gradient sâu, điện ảnh
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, p.bg[0])
  g.addColorStop(0.5, p.bg[1])
  g.addColorStop(1, p.bg[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Vùng sáng đa điểm tạo chiều sâu trường ảnh (Depth of Field)
  const blobs: [number, number, number, string, number][] = [
    [W * 0.76, H * 0.42, 580, p.accent2, 0.32], // Quầng sáng rực rỡ sau vật thể 3D
    [W * 0.85, H * 0.25, 420, p.accent, 0.22],  // Điểm nhấn viền sáng trên
    [W * 0.15, H * 0.90, 480, p.accent, 0.18],  // Quầng sáng phản chiếu góc trái dưới
    [W * 0.45, -30, 400, p.accent2, 0.15],      // Ánh sáng tự nhiên từ trên rọi xuống
  ]
  blobs.forEach(([x, y, r, c, a]) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, rgba(c, a))
    rg.addColorStop(0.65, rgba(c, a * 0.35))
    rg.addColorStop(1, rgba(c, 0))
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, W, H)
  })

  // Sân khấu ánh sáng hiện đại (thay thế lưới dây cổ điển)
  ctx.save()
  const stageX = W * 0.76
  const stageY = H * 0.65

  // Đế phản quang mờ ảo dưới chân vật thể
  const stageGlow = ctx.createRadialGradient(stageX, stageY + 30, 0, stageX, stageY + 30, 360)
  stageGlow.addColorStop(0, rgba(p.accent2, 0.22))
  stageGlow.addColorStop(0.4, rgba(p.accent, 0.12))
  stageGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = stageGlow
  ctx.beginPath()
  ctx.ellipse(stageX, stageY + 30, 360, 110, 0, 0, Math.PI * 2)
  ctx.fill()

  // Vòng quỹ đạo ánh sáng công nghệ tinh tế
  ctx.strokeStyle = rgba(p.accent2, 0.25)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(stageX, stageY + 25, 290, 85, -0.08, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = rgba(p.accent, 0.18)
  ctx.lineWidth = 1
  ctx.setLineDash([6, 12])
  ctx.beginPath()
  ctx.ellipse(stageX, stageY + 35, 340, 100, -0.08, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Các dải sóng ánh sáng mềm mại (Cinematic Light Waves)
  const drawWave = (yOffset: number, amp: number, color: string, alpha: number) => {
    const waveGrad = ctx.createLinearGradient(0, 0, W, 0)
    waveGrad.addColorStop(0, 'rgba(255,255,255,0)')
    waveGrad.addColorStop(0.4, rgba(color, alpha))
    waveGrad.addColorStop(0.8, rgba(color, alpha * 0.6))
    waveGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = waveGrad
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(0, stageY + yOffset)
    ctx.bezierCurveTo(
      W * 0.35,
      stageY + yOffset - amp,
      W * 0.65,
      stageY + yOffset + amp,
      W,
      stageY + yOffset - amp * 0.5,
    )
    ctx.stroke()
  }
  drawWave(50, 45, p.accent2, 0.28)
  drawWave(75, 35, p.accent, 0.2)
  drawWave(95, 25, '#ffffff', 0.12)
  ctx.restore()

  // Bụi sao và hạt bokeh đa tầng (Stardust & Bokeh)
  for (let i = 0; i < 36; i++) {
    const x = (i * 187 + 45) % W
    const y = (i * 123 + 20) % H
    const r = 1.5 + ((i * 5) % 8)
    const isBig = r > 6
    const alpha = isBig ? 0.04 + ((i * 7) % 6) / 100 : 0.2 + ((i * 11) % 15) / 40
    ctx.fillStyle = isBig ? rgba(p.accent2, alpha) : rgba('#ffffff', alpha)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (isBig) {
      // Quầng mờ cho hạt bokeh lớn
      ctx.fillStyle = rgba(p.accent2, alpha * 0.3)
      ctx.beginPath()
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Viền sáng tinh tế quanh tấm poster
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.5
  roundRectPath(ctx, 1, 1, W - 2, H - 2, 0)
  ctx.stroke()
}

// ====================================================================== thành phần chữ

function drawLogo(ctx: Ctx, x: number, y: number, p: PosterPalette) {
  const s = 40
  const g = ctx.createLinearGradient(x, y, x + s, y + s)
  g.addColorStop(0, p.accent)
  g.addColorStop(1, p.accent2)
  ctx.fillStyle = g
  roundRectPath(ctx, x, y, s, s, 11)
  ctx.fill()
  // ký hiệu "A" + hai nút kết nối
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 9, y + 30)
  ctx.lineTo(x + s / 2, y + 9)
  ctx.lineTo(x + s - 9, y + 30)
  ctx.moveTo(x + 14.5, y + 23)
  ctx.lineTo(x + s - 14.5, y + 23)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x + s / 2, y + 8, 3.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `800 28px ${FONT_DISPLAY}`
  setLetterSpacing(ctx, '0px')
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Alum', x + s + 12, y + s / 2 + 1)
  const w = ctx.measureText('Alum').width
  ctx.fillStyle = p.accent
  ctx.fillText('Nect', x + s + 12 + w, y + s / 2 + 1)
}

function drawBadge(ctx: Ctx, text: string, x: number, y: number, maxWidth: number, p: PosterPalette): number {
  ctx.font = `800 17px ${FONT_TEXT}`
  setLetterSpacing(ctx, '2px')
  const label = ellipsize(ctx, text.toUpperCase(), maxWidth - 56)
  const w = ctx.measureText(label).width + 44
  const h = 38
  const g = ctx.createLinearGradient(x, y, x + w, y)
  g.addColorStop(0, p.accent)
  g.addColorStop(1, mix(p.accent, p.accent2, 0.65))
  ctx.shadowColor = rgba(p.accent, 0.55)
  ctx.shadowBlur = 18
  ctx.fillStyle = g
  roundRectPath(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.shadowBlur = 0
  // chấm sáng đầu badge
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x + 20, y + h / 2, 4.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0b1020'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 34, y + h / 2 + 1)
  setLetterSpacing(ctx, '0px')
  return h
}

type IconKind = 'coin' | 'calendar' | 'star' | 'pin' | 'check' | 'chat'

function drawIcon(ctx: Ctx, kind: IconKind, cx: number, cy: number, size: number, color: string) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2, size / 9)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = size / 2
  switch (kind) {
    case 'coin':
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'calendar':
      roundRectPath(ctx, -r, -r * 0.8, size, size * 0.9, 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-r, -r * 0.2)
      ctx.lineTo(r, -r * 0.2)
      ctx.moveTo(-r * 0.5, -r * 1.1)
      ctx.lineTo(-r * 0.5, -r * 0.5)
      ctx.moveTo(r * 0.5, -r * 1.1)
      ctx.lineTo(r * 0.5, -r * 0.5)
      ctx.stroke()
      ctx.fillRect(-r * 0.55, r * 0.15, r * 0.4, r * 0.4)
      break
    case 'star': {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const px = Math.cos(a) * rad
        const py = Math.sin(a) * rad
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'pin':
      ctx.beginPath()
      ctx.moveTo(0, r * 1.05)
      ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 1.0, -r * 1.1, 0, -r * 1.1)
      ctx.bezierCurveTo(r * 1.0, -r * 1.1, r * 1.4, -r * 0.1, 0, r * 1.05)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.beginPath()
      ctx.arc(0, -r * 0.3, r * 0.38, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'check':
      ctx.beginPath()
      ctx.moveTo(-r * 0.55, 0)
      ctx.lineTo(-r * 0.1, r * 0.45)
      ctx.lineTo(r * 0.62, -r * 0.4)
      ctx.stroke()
      break
    case 'chat':
      roundRectPath(ctx, -r, -r * 0.8, size, size * 0.75, 6)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-r * 0.4, r * 0.0)
      ctx.lineTo(-r * 0.7, r * 0.75)
      ctx.lineTo(r * 0.05, r * 0.0)
      ctx.stroke()
      break
  }
  ctx.restore()
}

function pillIcon(kind: PosterKind | undefined): IconKind {
  if (kind === 'recruitment') return 'coin'
  if (kind === 'event') return 'calendar'
  if (kind === 'achievement') return 'star'
  return 'chat'
}

function drawPill(ctx: Ctx, text: string, x: number, y: number, maxWidth: number, p: PosterPalette, icon: IconKind): { w: number; h: number } {
  const h = 52
  ctx.font = `800 24px ${FONT_TEXT}`
  const label = ellipsize(ctx, text, maxWidth - 78)
  const w = ctx.measureText(label).width + 78
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, p.accent)
  g.addColorStop(1, mix(p.accent, p.accent2, 0.8))
  ctx.shadowColor = rgba(p.accent, 0.5)
  ctx.shadowBlur = 22
  ctx.fillStyle = g
  roundRectPath(ctx, x, y, w, h, 16)
  ctx.fill()
  ctx.shadowBlur = 0
  // vòng tròn chứa biểu tượng
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath()
  ctx.arc(x + 30, y + h / 2, 17, 0, Math.PI * 2)
  ctx.fill()
  drawIcon(ctx, icon, x + 30, y + h / 2, 17, '#0b1020')
  ctx.fillStyle = '#0b1020'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 58, y + h / 2 + 1)
  return { w, h }
}

function drawLocationChip(ctx: Ctx, text: string, x: number, y: number, maxWidth: number, p: PosterPalette): number {
  const h = 52
  ctx.font = `700 20px ${FONT_TEXT}`
  const label = ellipsize(ctx, text, maxWidth - 64)
  const w = ctx.measureText(label).width + 64
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRectPath(ctx, x, y, w, h, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  drawIcon(ctx, 'pin', x + 26, y + h / 2, 17, p.accent2)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 46, y + h / 2 + 1)
  return w
}

function drawBulletCard(ctx: Ctx, text: string, x: number, y: number, w: number, p: PosterPalette): number {
  const h = 46
  // thẻ kính mờ (Glassmorphism)
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, 'rgba(255,255,255,0.20)')
  g.addColorStop(1, 'rgba(255,255,255,0.07)')
  ctx.fillStyle = g
  roundRectPath(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'
  ctx.lineWidth = 1.4
  ctx.stroke()
  // thanh nhấn bên trái
  ctx.fillStyle = p.accent
  roundRectPath(ctx, x + 1, y + 10, 5, h - 20, 3)
  ctx.fill()
  // dấu tích
  ctx.fillStyle = rgba(p.accent2, 0.28)
  ctx.beginPath()
  ctx.arc(x + 32, y + h / 2, 14, 0, Math.PI * 2)
  ctx.fill()
  drawIcon(ctx, 'check', x + 32, y + h / 2, 17, p.accent2)

  let size = 20
  ctx.font = `600 ${size}px ${FONT_TEXT}`
  while (size > 15 && ctx.measureText(text).width > w - 76) {
    size -= 1
    ctx.font = `600 ${size}px ${FONT_TEXT}`
  }
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(ellipsize(ctx, text, w - 76), x + 56, y + h / 2 + 1)
  return h
}

function drawFooterWatermark(ctx: Ctx, x: number, y: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `600 13px ${FONT_TEXT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Mạng lưới Sinh viên & Cựu sinh viên Đại học FPT • AlumNect', x, y)
  ctx.restore()
}

// ====================================================================== vẽ toàn bộ Poster

/**
 * Vẽ Poster lên một Canvas 2D context đã có kích thước 1200x675. Hàm đồng bộ, không phụ thuộc DOM nên có thể
 * gọi lại tức thì (0ms gọi AI) khi người dùng đổi cảnh vật/bảng màu.
 */
export function drawPoster(ctx: Ctx, spec: PosterSpec, opts: PosterRenderOptions = {}) {
  const W = POSTER_WIDTH
  const H = POSTER_HEIGHT
  const palette = resolvePalette(spec.colorPalette)
  const scene = resolveScene(spec.illustrationScene)

  ctx.save()
  ctx.clearRect(0, 0, W, H)
  drawBackground(ctx, palette)

  // Nửa phải: cảnh vật 3D (mỗi cảnh có vị trí/tỉ lệ riêng để không lấn sang cột chữ)
  const layout = SCENE_LAYOUT[scene] ?? { x: 905, y: 330, s: 1 }
  drawScene(ctx, scene, palette, layout.x, layout.y, layout.s)

  // Nửa trái: chữ
  const left = 64
  const colW = 590
  drawLogo(ctx, left, 36, palette)

  const badge = stripEmoji(spec.badgeText) || 'CỘNG ĐỒNG ALUMNECT'
  const headline = stripEmoji(spec.headline).toUpperCase() || 'ALUMNECT'
  const sub = stripEmoji(spec.subheadline)
  const pillText = stripEmoji(spec.highlightPill)
  const loc = stripEmoji(spec.locationText)
  const bullets = (spec.bulletPoints ?? []).map(stripEmoji).filter(Boolean).slice(0, 3)

  // đo trước để căn khối nội dung theo chiều dọc
  ctx.textBaseline = 'alphabetic'
  const fit = fitHeadline(ctx, headline, colW, 3, 60, 34)
  const lineH = Math.round(fit.size * 1.16)
  const badgeH = 38
  const gap1 = 22
  const headH = lineH * fit.lines.length
  const subH = sub ? 40 : 0
  const chipsH = pillText || loc ? 52 : 0
  const bulletsH = bullets.length ? bullets.length * 46 + (bullets.length - 1) * 11 : 0
  const total =
    badgeH + gap1 + headH + (subH ? subH : 8) + (chipsH ? chipsH + 22 : 0) + (bulletsH ? bulletsH + 0 : 0)
  const top = 100
  const bottom = 612
  let y = top + Math.max(0, (bottom - top - total) / 2)

  drawBadge(ctx, badge, left, y, colW, palette)
  y += badgeH + gap1

  // tiêu đề với bóng đổ nhẹ để nổi trên nền
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `800 ${fit.size}px ${FONT_DISPLAY}`
  fit.lines.forEach((line, i) => {
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 4
    ctx.fillStyle = '#ffffff'
    ctx.fillText(line, left, y + i * lineH)
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  })
  y += headH

  if (sub) {
    ctx.font = `600 24px ${FONT_TEXT}`
    ctx.fillStyle = rgba('#ffffff', 0.82)
    ctx.textBaseline = 'top'
    ctx.fillText(ellipsize(ctx, sub, colW), left, y + 10)
    y += subH
  } else {
    y += 8
  }

  if (chipsH) {
    let cx = left
    y += 4
    if (pillText) {
      const { w } = drawPill(ctx, pillText, cx, y, colW, palette, pillIcon(opts.kind))
      cx += w + 14
    }
    if (loc && colW - (cx - left) > 150) {
      drawLocationChip(ctx, loc, cx, y, colW - (cx - left), palette)
    } else if (loc && !pillText) {
      drawLocationChip(ctx, loc, cx, y, colW, palette)
    }
    y += chipsH + 18
  }

  if (bullets.length) {
    const bottomLimit = H - 42
    const remainingH = bottomLimit - y
    const cardH = 46
    const minGap = 8
    const step = bullets.length > 1
      ? Math.min(54, Math.max(cardH + minGap, Math.floor(remainingH / bullets.length)))
      : 54
    bullets.forEach((b, i) => {
      const cardY = y + i * step
      if (cardY + cardH <= bottomLimit) {
        drawBulletCard(ctx, b, left, cardY, colW - 20, palette)
      }
    })
  }

  // chân poster: dòng nhận diện thương hiệu nhỏ gọn tinh tế ở sát đáy
  drawFooterWatermark(ctx, left, H - 22)

  // dải ánh sáng cạnh dưới
  const bar = ctx.createLinearGradient(0, 0, W, 0)
  bar.addColorStop(0, palette.accent)
  bar.addColorStop(1, palette.accent2)
  ctx.fillStyle = bar
  ctx.fillRect(0, H - 6, W, 6)

  ctx.restore()
}

/** Tạo Canvas rời (ngoài DOM) đúng kích thước Poster. */
export function createPosterCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  return canvas
}

/** Đợi font rồi vẽ Poster lên canvas có sẵn (dùng cho khung xem trước). */
export async function renderPoster(canvas: HTMLCanvasElement, spec: PosterSpec, opts: PosterRenderOptions = {}): Promise<void> {
  await ensurePosterFonts()
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas 2D')
  drawPoster(ctx, spec, opts)
}

/** Xuất canvas thành `File` PNG để upload lên Cloudflare R2 và gắn vào `mediaUrls` của bài viết. */
export function posterCanvasToFile(canvas: HTMLCanvasElement, fileName = 'alumnect-poster.png'): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Không thể xuất ảnh Poster'))
        return
      }
      resolve(new File([blob], fileName, { type: 'image/png' }))
    }, 'image/png')
  })
}

/** Vẽ Poster trên canvas ẩn rồi xuất thẳng ra `File` PNG HD 1200x675. */
export async function renderPosterToFile(spec: PosterSpec, opts: PosterRenderOptions = {}, fileName?: string): Promise<File> {
  const canvas = createPosterCanvas()
  await renderPoster(canvas, spec, opts)
  return posterCanvasToFile(canvas, fileName)
}
