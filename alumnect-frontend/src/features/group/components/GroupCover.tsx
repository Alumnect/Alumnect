import { useState } from 'react'
import { Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Bảng màu gradient ngẫu hứng nhưng đồng nhất theo tên hội nhóm khi chưa có ảnh bìa */
const GRADIENT_PALETTES = [
  'from-brand-500/30 via-coral-400/20 to-gold-400/30 text-brand-600',
  'from-violet-600/30 via-brand-500/20 to-sky-400/30 text-violet-700',
  'from-sky-500/30 via-aqua-400/20 to-mint-400/30 text-sky-700',
  'from-mint-500/30 via-brand-400/20 to-gold-400/30 text-mint-700',
  'from-coral-500/30 via-violet-400/20 to-brand-500/30 text-coral-600',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length]
}

/**
 * Ảnh bìa hội nhóm với khung tỉ lệ cố định; hiển thị hiệu ứng chuyển sắc sang trọng
 * cùng ký tự viết tắt nghệ thuật khi chưa có ảnh hoặc ảnh tải lỗi.
 */
export function GroupCover({
  url,
  name,
  className,
  aspect = 'aspect-[16/9]',
  showInitial = false,
  fit = 'cover',
}: {
  url?: string | null
  name: string
  className?: string
  aspect?: string
  showInitial?: boolean
  fit?: 'cover' | 'contain'
}) {
  const [failed, setFailed] = useState(false)
  const palette = getGradient(name || 'Group')
  const initial = (name || 'G').trim().charAt(0).toUpperCase()

  return (
    <div className={cn('relative w-full overflow-hidden bg-gradient-to-br', aspect, palette, className)}>
      {url && !failed ? (
        <>
          {fit === 'contain' && (
            <img
              src={url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
            />
          )}
          <img
            src={url}
            alt={name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className={cn(
              'relative h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]',
              fit === 'contain' ? 'object-contain' : 'object-cover',
            )}
          />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-tr from-plum-900/10 via-transparent to-white/20 p-4 text-center">
          {showInitial ? (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/70 shadow-sm backdrop-blur-md dark:bg-black/40">
              <span className="text-3xl font-extrabold tracking-tight">{initial}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 opacity-80">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/60 shadow-sm backdrop-blur-md dark:bg-black/30">
                <Users2 size={24} />
              </span>
              <span className="max-w-[80%] truncate text-xs font-bold tracking-wide uppercase opacity-75">{name}</span>
            </div>
          )}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}
