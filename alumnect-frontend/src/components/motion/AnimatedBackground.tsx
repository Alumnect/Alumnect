import { AnimatePresence, motion, type Transition } from 'motion/react'
import {
  Children,
  cloneElement,
  type FocusEventHandler,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

type AnimatedBackgroundChildProps = {
  'data-id': string
  'data-checked'?: string
  className?: string
  children?: ReactNode
  onMouseEnter?: MouseEventHandler<HTMLElement>
  onMouseLeave?: MouseEventHandler<HTMLElement>
  onFocus?: FocusEventHandler<HTMLElement>
  onBlur?: FocusEventHandler<HTMLElement>
  onClick?: MouseEventHandler<HTMLElement>
}

type AnimatedBackgroundProps = {
  children: ReactElement<AnimatedBackgroundChildProps> | ReactElement<AnimatedBackgroundChildProps>[]
  value?: string | null
  defaultValue?: string
  className?: string
  transition?: Transition
  enableHover?: boolean
}

export function AnimatedBackground({
  children,
  value,
  defaultValue,
  className,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const uniqueId = useId()
  const visibleId = hoveredId ?? value ?? activeId

  return Children.map(children, (child, index) => {
    if (!child) return null

    const id = child.props['data-id']
    const interactionProps = enableHover
      ? {
          onMouseEnter: () => setHoveredId(id),
          onMouseLeave: () => setHoveredId(null),
          onFocus: () => setHoveredId(id),
          onBlur: () => setHoveredId(null),
        }
      : {
          onClick: () => setActiveId(id),
        }

    return cloneElement(
      child,
      {
        key: index,
        className: cn('relative inline-flex', child.props.className),
        'data-checked': visibleId === id ? 'true' : 'false',
        ...interactionProps,
      },
      <>
        <AnimatePresence initial={false}>
          {visibleId === id && (
            <motion.span
              layoutId={`animated-background-${uniqueId}`}
              className={cn('absolute inset-0', className)}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10 flex w-full items-center gap-3">{child.props.children}</span>
      </>,
    )
  })
}
