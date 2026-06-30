import { useState } from 'react'
import type { ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Image with graceful degradation: a soft pastel gradient placeholder shows
 * while loading (shimmer) and stays if the source fails — so a broken external
 * photo never shows ugly alt text or an empty box.
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  fallback,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  fallback?: ReactNode
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-brand-200 via-violet-300 to-coral-300', className)}>
      {status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-700',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
      {status === 'loading' && <div className="absolute inset-0 shimmer" />}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center text-white/70">
          {fallback ?? <ImageOff size={28} strokeWidth={1.6} />}
        </div>
      )}
    </div>
  )
}
