import { useState } from 'react'
import { Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Nền phẳng nhạt theo tên hội nhóm khi chưa có ảnh bìa (cùng bảng sắc ngữ nghĩa của hệ thống) */
const PALETTES = [
  'bg-primary-soft text-primary-solid',
  'bg-info-soft text-info',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-danger-soft text-danger',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTES[Math.abs(hash) % PALETTES.length]
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
    <div className={cn('relative w-full overflow-hidden', aspect, palette, className)}>
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
        <div className="absolute inset-0 grid place-items-center p-4 text-center">
          {showInitial ? (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface/70">
              <span className="text-3xl font-extrabold tracking-tight">{initial}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface/60">
                <Users2 size={24} />
              </span>
              <span className="max-w-[80%] truncate text-xs font-bold tracking-wide uppercase">{name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
