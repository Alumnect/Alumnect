import { useState } from 'react'
import { Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Ảnh bìa hội nhóm với khung tỉ lệ cố định để mọi thẻ đồng nhất kích thước; hiển thị nền gradient + biểu tượng
 * khi chưa có ảnh hoặc ảnh tải lỗi.
 */
export function GroupCover({ url, name, className }: { url?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn('relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-500/25 via-violet-400/20 to-aqua-400/25', className)}>
      {url && !failed ? (
        <img src={url} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-brand-600/70">
          <Users2 size={40} />
        </div>
      )}
    </div>
  )
}
