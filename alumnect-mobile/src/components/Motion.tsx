import React, { createContext, useContext, useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Pressable, StyleSheet, type PressableProps, type ViewProps } from 'react-native'
import { DURATION, EASING } from '@/theme/motion'

const ReducedMotion = createContext(true)

/** One accessibility listener for the whole app, including changes while it is open. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(true)
  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value) }).catch(() => {})
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => { active = false; subscription.remove() }
  }, [])
  return <ReducedMotion.Provider value={reduced}>{children}</ReducedMotion.Provider>
}

export const useReducedMotion = () => useContext(ReducedMotion)
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** Native-driver feedback; does not reflow the list or animate its height. */
export function MotionPressable({ style, onPressIn, onPressOut, disabled, ...props }: PressableProps) {
  const reduced = useReducedMotion()
  const [scale] = useState(() => new Animated.Value(1))
  const [pressed, setPressed] = useState(false)
  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: pressed && !disabled && !reduced ? 0.975 : 1,
      duration: reduced ? 0 : pressed ? DURATION.instant : 180,
      easing: EASING.emphasizedDecel,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [pressed, disabled, reduced, scale])
  const resolved = StyleSheet.flatten(typeof style === 'function' ? style({ pressed }) : style)
  return <AnimatedPressable {...props} disabled={disabled}
    onPressIn={(event) => { setPressed(true); onPressIn?.(event) }}
    onPressOut={(event) => { setPressed(false); onPressOut?.(event) }}
    style={[resolved, { transform: [...(Array.isArray(resolved?.transform) ? resolved.transform : []), { scale }] }]} />
}

/** Fade + rise on mount theo chuẩn Meetup Content transition (FastOutSlowIn). `delay` staggers siblings. */
export function Enter({ children, style, delay = 0, duration = 320, ...props }: ViewProps & { delay?: number; duration?: number }) {
  const reduced = useReducedMotion()
  const [progress] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : duration,
      delay: reduced ? 0 : delay,
      easing: EASING.legacy,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [progress, reduced, delay, duration])
  return (
    <Animated.View
      {...props}
      style={[
        style,
        {
          opacity: reduced ? 1 : progress,
          transform: [
            {
              translateY: reduced
                ? 0
                : progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}
