import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type WordRevealProps = {
  text: string
  className?: string
  delay?: number
  /** className applied to highlighted words (wrapped in *asterisks*) */
  highlightClass?: string
}

/**
 * Animated heading that reveals word-by-word on mount.
 * Wrap a word in *asterisks* to apply the highlight (gradient) class.
 */
export function WordReveal({ text, className, delay = 0, highlightClass = 'text-gradient' }: WordRevealProps) {
  const reduce = useReducedMotion()
  const words = text.split(' ')

  if (reduce) {
    return (
      <span className={className}>
        {words.map((w, i) => {
          const hl = w.startsWith('*') && w.endsWith('*')
          const clean = hl ? w.slice(1, -1) : w
          return (
            <span key={i} className={hl ? highlightClass : undefined}>
              {clean}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <motion.span
      className={cn('inline', className)}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}
    >
      {words.map((w, i) => {
        const hl = w.startsWith('*') && w.endsWith('*')
        const clean = hl ? w.slice(1, -1) : w
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className={cn('inline-block', hl && highlightClass)}
              variants={{
                hidden: { y: '110%', opacity: 0 },
                show: { y: '0%', opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {clean}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        )
      })}
    </motion.span>
  )
}
