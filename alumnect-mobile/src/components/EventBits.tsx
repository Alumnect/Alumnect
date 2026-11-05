import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { CalendarCheck, CalendarDays, Globe } from '@/components/icons'
import { Avatar, Tag, Txt } from './ui'
import { radius, useTheme } from '@/theme'

/* ------------------------------------------------------------------ */
/* Thời gian                                                          */
/* ------------------------------------------------------------------ */

const HOUR = 3_600_000
const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, '0')

/** Giờ dạng 24h "18:30". */
export const timeOf = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Thứ trong tuần viết đầy đủ, viết hoa chữ đầu: "Thứ Năm", "Chủ Nhật". */
export function weekdayOf(d: Date): string {
  const name = d.toLocaleDateString('vi-VN', { weekday: 'long' })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Mốc nửa đêm của ngày chứa `d`, dùng để so sánh theo ngày lịch. */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Số ngày lịch từ hôm nay tới ngày của `d` (0 là hôm nay, 1 là ngày mai). */
export const daysUntil = (d: Date, now = new Date()) => Math.round((startOfDay(d) - startOfDay(now)) / DAY)

/** Dòng ngày giờ nổi bật trên thẻ: "THỨ NĂM, 05/11 · 18:30"; thêm năm nếu khác năm hiện tại. */
export function eventEyebrow(start: Date, now = new Date()): string {
  const year = start.getFullYear() !== now.getFullYear() ? `/${start.getFullYear()}` : ''
  return `${weekdayOf(start)}, ${pad(start.getDate())}/${pad(start.getMonth() + 1)}${year} · ${timeOf(start)}`.toUpperCase()
}

/** Dòng ngày ngắn cho thanh đáy: "T5, 05/11 · 18:30". */
export function eventShortDate(start: Date): string {
  const short = start.toLocaleDateString('vi-VN', { weekday: 'short' })
  return `${short}, ${pad(start.getDate())}/${pad(start.getMonth() + 1)} · ${timeOf(start)}`
}

/** Ngày đầy đủ: "Thứ Năm, 05 tháng 11, 2026". */
export function eventFullDate(start: Date): string {
  return `${weekdayOf(start)}, ${pad(start.getDate())} tháng ${start.getMonth() + 1}, ${start.getFullYear()}`
}

/** Khoảng giờ: "18:30 – 21:00"; nếu kết thúc khác ngày thì kèm ngày kết thúc. */
export function eventTimeRange(start: Date, end?: Date | null): string {
  if (!end) return timeOf(start)
  const sameDay = startOfDay(start) === startOfDay(end)
  return `${timeOf(start)} – ${timeOf(end)}${sameDay ? '' : ` (${pad(end.getDate())}/${pad(end.getMonth() + 1)})`}`
}

/** Khoảng cách tới giờ bắt đầu bằng lời: "Đang diễn ra", "Bắt đầu sau 3 giờ", "Ngày mai", "Còn 5 ngày". */
export function startsIn(start: Date, end?: Date | null, now = new Date()): string | null {
  const ms = start.getTime() - now.getTime()
  const endMs = (end ?? new Date(start.getTime() + 2 * HOUR)).getTime()
  if (ms <= 0) return now.getTime() <= endMs ? 'Đang diễn ra' : 'Đã kết thúc'
  if (ms < HOUR) return `Bắt đầu sau ${Math.max(1, Math.round(ms / 60_000))} phút`
  const days = daysUntil(start, now)
  if (days === 0) return `Bắt đầu sau ${Math.round(ms / HOUR)} giờ`
  if (days === 1) return 'Ngày mai'
  if (days <= 30) return `Còn ${days} ngày`
  return null
}

/** Nhóm hiển thị trong danh sách: Đã diễn ra, Hôm nay, Ngày mai, Tuần này, Tuần sau (tuần tính từ thứ Hai), rồi theo tháng. */
export function dayGroupLabel(start: Date, now = new Date()): string {
  const days = daysUntil(start, now)
  if (days < 0) return 'Đã diễn ra'
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  const daysLeftInWeek = 6 - ((now.getDay() + 6) % 7)
  if (days <= daysLeftInWeek) return 'Tuần này'
  if (days <= daysLeftInWeek + 7) return 'Tuần sau'
  const year = start.getFullYear() !== now.getFullYear() ? `, ${start.getFullYear()}` : ''
  return `Tháng ${start.getMonth() + 1}${year}`
}

/* ------------------------------------------------------------------ */
/* Địa điểm                                                           */
/* ------------------------------------------------------------------ */

const PLATFORMS: [RegExp, string][] = [
  [/meet\.google\.com/i, 'Google Meet'],
  [/zoom\.(us|com)/i, 'Zoom'],
  [/teams\.(microsoft|live)\.com/i, 'Microsoft Teams'],
  [/discord\.(gg|com)/i, 'Discord'],
  [/(facebook|fb)\.com/i, 'Facebook'],
  [/youtube\.com|youtu\.be/i, 'YouTube'],
]

/** Nhận diện địa điểm trực tuyến: đường dẫn web hoặc từ khóa nền tảng họp. */
export function isOnlineLocation(location?: string | null): boolean {
  const value = (location ?? '').trim()
  return /^https?:\/\//i.test(value) || /\b(online|zoom|google meet|microsoft teams|trực tuyến)\b/i.test(value)
}

/** Tên nền tảng của sự kiện trực tuyến để hiển thị thay cho đường dẫn thô. */
export function onlinePlatform(location?: string | null): string {
  const value = location ?? ''
  return PLATFORMS.find(([pattern]) => pattern.test(value))?.[1] ?? 'Liên kết trực tuyến'
}

/** Đường dẫn mở được của sự kiện trực tuyến, null nếu địa điểm không phải URL. */
export function onlineUrl(location?: string | null): string | null {
  const match = (location ?? '').match(/https?:\/\/\S+/i)
  return match ? match[0] : null
}

/** Dòng địa điểm ngắn gọn cho thẻ: tên nền tảng nếu trực tuyến, ngược lại là địa chỉ. */
export function locationLabel(location?: string | null): string | null {
  if (!location?.trim()) return null
  return isOnlineLocation(location) ? `Trực tuyến · ${onlinePlatform(location)}` : location.trim()
}

/** Đường dẫn tìm kiếm địa điểm trên Google Maps, mở được cả trên Android, iOS và web. */
export const mapsUrl = (location: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

/* ------------------------------------------------------------------ */
/* Trạng thái                                                         */
/* ------------------------------------------------------------------ */

export type EventPhase = 'cancelled' | 'live' | 'ended' | 'full' | 'open'

/** Giai đoạn của sự kiện, dùng chung để chọn nhãn và nút hành động cho thống nhất. */
export function eventPhase({ status, start, end, count, capacity, started }: {
  status?: string | null
  start: Date
  end?: Date | null
  count: number
  capacity?: number | null
  started?: boolean
}): EventPhase {
  if (status === 'CANCELLED') return 'cancelled'
  const now = Date.now()
  const endMs = (end ?? new Date(start.getTime() + 2 * HOUR)).getTime()
  if (started || start.getTime() <= now) return now <= endMs ? 'live' : 'ended'
  if (capacity && count >= capacity) return 'full'
  return 'open'
}

/**
 * Nhãn trạng thái của sự kiện; trả về null khi không có gì cần nhấn mạnh.
 * `onCover` làm nhãn thành viên thuốc trắng chữ màu, để nổi cả trên ảnh lẫn trên mảng màu thương hiệu.
 */
export function EventStatusTag({ phase, registered, onCover, style: baseStyle }: { phase: EventPhase; registered?: boolean; onCover?: boolean; style?: ViewStyle }) {
  const t = useTheme()
  const style: ViewStyle | undefined = onCover ? { ...baseStyle, backgroundColor: 'transparent' } : baseStyle
  const tag =
    phase === 'cancelled' ? <Tag label="Đã hủy" tone="danger" style={style} /> :
    phase === 'live' ? <Tag label="Đang diễn ra" tone="primary" style={style} /> :
    phase === 'ended' ? <Tag label="Đã kết thúc" tone="neutral" style={style} /> :
    registered ? <Tag label="Đã đăng ký" tone="success" icon={<CalendarCheck size={12} color={t.success} />} style={style} /> :
    phase === 'full' ? <Tag label="Hết chỗ" tone="warning" style={style} /> :
    null
  if (!tag || !onCover) return tag
  return <View style={{ borderRadius: radius.sm, backgroundColor: t.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>{tag}</View>
}

/* ------------------------------------------------------------------ */
/* Thành phần giao diện                                               */
/* ------------------------------------------------------------------ */

/** Ô lịch nhỏ: tháng trên dải màu thương hiệu, ngày số lớn bên dưới. */
export function DateBadge({ date, size = 56, style }: { date: Date; size?: number; style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View
      accessible
      accessibilityLabel={eventFullDate(date)}
      style={[{ width: size, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center' }, style]}
    >
      <View style={{ alignSelf: 'stretch', backgroundColor: t.primary, paddingVertical: 2 }}>
        <Txt size={11} weight="700" color={t.onPrimary} style={{ textAlign: 'center' }}>{`THG ${date.getMonth() + 1}`}</Txt>
      </View>
      <Txt size={size >= 56 ? 22 : 18} weight="800" style={{ paddingTop: 2, fontVariant: ['tabular-nums'] }}>{pad(date.getDate())}</Txt>
      <Txt muted size={11} style={{ paddingBottom: 4 }}>{date.toLocaleDateString('vi-VN', { weekday: 'short' })}</Txt>
    </View>
  )
}

/**
 * Ảnh bìa sự kiện. Không có ảnh thì dùng mảng màu thương hiệu kèm ô lịch,
 * để thẻ trong danh sách luôn cùng chiều cao và không lộ khung trống.
 */
export function EventCover({ uri, start, online, height = 160, rounded = false, dim = false, children }: {
  uri?: string | null
  start: Date
  online?: boolean
  height?: number
  rounded?: boolean
  /** Làm mờ riêng phần ảnh (sự kiện đã hủy hoặc kết thúc), không làm mờ nhãn nằm đè lên. */
  dim?: boolean
  children?: React.ReactNode
}) {
  const t = useTheme()
  const corner: ViewStyle = rounded ? { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg } : {}
  return (
    <View style={[{ height, backgroundColor: t.primaryTint, overflow: 'hidden' }, corner]}>
      <View style={[StyleSheet.absoluteFill, dim && { opacity: 0.55 }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" transition={200} accessibilityIgnoresInvertColors />
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <DateBadge date={start} size={64} />
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
              {online ? <Globe size={26} color={t.primary} /> : <CalendarDays size={26} color={t.primary} />}
            </View>
          </View>
        )}
      </View>
      {children}
    </View>
  )
}

/** Dải avatar chồng nhau kiểu "những người sẽ tham gia", có ô "+N" cho phần còn lại. */
export function AvatarStack({ people, total, size = 32, max = 5 }: {
  people: { name: string; uri?: string | null }[]
  total?: number
  size?: number
  max?: number
}) {
  const t = useTheme()
  const shown = people.slice(0, max)
  const rest = Math.max(0, (total ?? people.length) - shown.length)
  if (shown.length === 0) return null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shown.map((p, i) => (
        <View key={`${p.name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -size * 0.28, borderRadius: size, borderWidth: 2, borderColor: t.card, zIndex: max - i }}>
          <Avatar uri={p.uri} name={p.name} size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View style={{ marginLeft: -size * 0.28, width: size + 4, height: size + 4, borderRadius: size, borderWidth: 2, borderColor: t.card, backgroundColor: t.inputBg, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={12} weight="600" muted>{`+${rest > 99 ? 99 : rest}`}</Txt>
        </View>
      ) : null}
    </View>
  )
}

/** Câu tóm tắt người tham gia: "Minh Anh, Thu Hà và 3 người khác". */
export function attendeeSummary(names: string[], total: number): string {
  if (total <= 0) return 'Hãy là người đầu tiên tham gia'
  const firstNames = names.slice(0, 2).map((n) => n.trim().split(/\s+/).slice(-2).join(' '))
  const others = total - firstNames.length
  if (firstNames.length === 0) return `${total} người sẽ tham gia`
  return others > 0 ? `${firstNames.join(', ')} và ${others} người khác` : firstNames.join(' và ')
}

/** Thanh sức chứa kèm câu "Còn N chỗ"; ẩn thanh khi sự kiện không giới hạn số lượng. */
export function CapacityMeter({ count, capacity, compact }: { count: number; capacity?: number | null; compact?: boolean }) {
  const t = useTheme()
  if (!capacity) {
    return compact ? null : <Txt muted size={13}>Không giới hạn số lượng tham gia</Txt>
  }
  const full = count >= capacity
  const left = Math.max(0, capacity - count)
  const pct = Math.min(1, count / capacity)
  const almost = !full && left <= Math.max(3, Math.ceil(capacity * 0.1))
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: compact ? 4 : 6, borderRadius: 3, backgroundColor: t.inputBg, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, backgroundColor: full || almost ? t.warning : t.primary }} />
      </View>
      {compact ? null : (
        <Txt size={13} weight={full || almost ? '600' : '400'} color={full || almost ? t.warning : t.textMuted}>
          {full ? `Đã đủ ${capacity} chỗ` : almost ? `Chỉ còn ${left} chỗ` : `Còn ${left} / ${capacity} chỗ`}
        </Txt>
      )}
    </View>
  )
}
