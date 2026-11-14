import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Text } from '@/components/AppText'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Wifi, WifiOff } from '@/components/icons'
import { useTheme } from '@/theme'
import { useReducedMotion } from './Motion'
import { DURATION, EASING } from '@/theme/motion'

/**
 * Banner mạng ngoại tuyến & khôi phục kết nối chuẩn Meetup (MOTION-SPEC.md §4.5 & §6.1):
 * - Trượt nổi (floating pill) mượt mà từ cạnh trên, không đẩy dồn layout bên dưới.
 * - Khi mất mạng: Rung nhẹ cảnh báo, hiển thị badge màu đỏ/cam với icon WifiOff.
 * - Khi "mở mạng" trở lại: Banner chuyển sang xanh lá với icon Wifi "Đã kết nối lại mạng!",
 *   rung nhẹ xác nhận (VirtualKey) rồi tự thu gọn trượt biến mất sau 2 giây.
 */
export function OfflineBanner() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  const [status, setStatus] = useState<'idle' | 'offline' | 'restored'>('idle')
  const prevOfflineRef = useRef(false)
  const translateY = useRef(new Animated.Value(-80)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s: NetInfoState) => {
      // Chỉ coi là mất mạng khi chắc chắn isConnected === false
      const isOffline = s.isConnected === false

      if (isOffline) {
        prevOfflineRef.current = true
        setStatus('offline')
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
      } else if (prevOfflineRef.current) {
        // Vừa khôi phục kết nối sau khi offline ("lúc mở mạng")
        prevOfflineRef.current = false
        setStatus('restored')
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      } else {
        setStatus('idle')
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (status === 'idle') {
      translateY.setValue(-80)
      opacity.setValue(0)
      return
    }

    if (status === 'offline' || status === 'restored') {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduced ? 0 : DURATION.sheetIn,
          easing: EASING.emphasizedDecel,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduced ? 0 : DURATION.fast,
          easing: EASING.linear,
          useNativeDriver: true,
        }),
      ]).start()

      if (status === 'restored') {
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -80,
              duration: reduced ? 0 : DURATION.smooth,
              easing: EASING.emphasizedAccel,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: reduced ? 0 : DURATION.fast,
              easing: EASING.linear,
              useNativeDriver: true,
            }),
          ]).start(() => setStatus('idle'))
        }, 2200)
        return () => clearTimeout(timer)
      }
    }
  }, [status, reduced, translateY, opacity])

  if (status === 'idle') return null

  const isRestored = status === 'restored'
  const bgColor = isRestored ? '#079669' : '#DC2626'
  const message = isRestored
    ? 'Đã khôi phục kết nối mạng!'
    : 'Mất kết nối mạng • Đang xem dữ liệu đã lưu'

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + 6,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: bgColor }]}>
        {isRestored ? (
          <Wifi size={16} color="#fff" />
        ) : (
          <WifiOff size={16} color="#fff" />
        )}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
})
