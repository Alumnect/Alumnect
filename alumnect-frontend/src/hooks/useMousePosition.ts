import { useEffect } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Tracks the pointer position relative to the viewport center, normalised to
 * roughly [-0.5, 0.5] on each axis. Returns spring-smoothed motion values —
 * great for mouse-driven parallax. No-ops on touch devices.
 */
export function useMousePosition(stiffness = 60, damping = 18) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness, damping, mass: 0.5 })
  const sy = useSpring(y, { stiffness, damping, mass: 0.5 })

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX / window.innerWidth - 0.5)
      y.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [x, y, reduce])

  return { x: sx, y: sy }
}
