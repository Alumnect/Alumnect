import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Keyboard, Modal, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme'
import { useReducedMotion } from './Motion'

/** Thông số chuyển động dùng chung cho mọi popup dạng bảng trượt để các popup mở/đóng giống hệt nhau. */
export const SHEET_OPEN_MS = 320
export const SHEET_CLOSE_MS = 240
export const SHEET_EASE_OUT = Easing.bezier(0.32, 0.72, 0, 1)
export const SHEET_EASE_IN = Easing.bezier(0.4, 0, 1, 1)

/**
 * Khung popup dưới màn hình dùng chung (ActionSheet, Chia sẻ, Bộ lọc, Chọn mục, Bình luận...).
 * - Nền mờ chỉ làm mờ dần (không trượt cùng bảng như `animationType="slide"` của Modal) nên không bị giật/chớp.
 * - Bảng trượt bằng `translateY` chạy trên luồng native; đóng cũng có hiệu ứng, kể cả khi cha đặt `visible=false` ngay.
 * - Kéo thanh nắm xuống để đóng; thả sớm thì bật về.
 * - Tự nâng lên theo bàn phím và thu chiều cao tối đa để không tràn khỏi màn hình.
 */
export function SheetModal({
  visible,
  onClose,
  children,
  maxHeight = 0.9,
  height,
  radius = 24,
  handle = true,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  /** Tỉ lệ chiều cao tối đa so với màn hình (0–1). */
  maxHeight?: number
  /** Chiều cao cố định (px) nếu cần. */
  height?: number
  radius?: number
  handle?: boolean
}) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const { height: screenH } = useWindowDimensions()
  const [mounted, setMounted] = useState(visible)
  if (visible && !mounted) setMounted(true)
  const [slide] = useState(() => new Animated.Value(screenH))
  const [kb, setKb] = useState(0)
  const [rootH, setRootH] = useState(0)
  const visibleRef = useRef(visible)
  const reducedRef = useRef(reduced)
  const closeRef = useRef(onClose)
  useEffect(() => { visibleRef.current = visible; closeRef.current = onClose; reducedRef.current = reduced })

  useEffect(() => {
    if (visible) {
      slide.setValue(screenH)
      Animated.timing(slide, { toValue: 0, duration: reduced ? 0 : SHEET_OPEN_MS, easing: SHEET_EASE_OUT, useNativeDriver: true }).start()
    } else {
      Keyboard.dismiss()
      Animated.timing(slide, { toValue: screenH, duration: reduced ? 0 : SHEET_CLOSE_MS, easing: SHEET_EASE_IN, useNativeDriver: true }).start(({ finished }) => {
        if (finished && !visibleRef.current) setMounted(false)
      })
    }
  }, [visible, slide, screenH, reduced])

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKb(e.endCoordinates.height))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  // eslint-disable-next-line react-hooks/refs -- ref chỉ được đọc trong callback cử chỉ, không đọc lúc render.
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => slide.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        const back = () => reducedRef.current ? slide.setValue(0) : Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
        if (g.dy > 100 || g.vy > 0.8) {
          closeRef.current()
          // Cha có thể từ chối đóng (đang xử lý): khi đó bật bảng về chỗ cũ.
          setTimeout(() => { if (visibleRef.current) back() }, 60)
        } else back()
      },
      onPanResponderTerminate: () => { if (reducedRef.current) slide.setValue(0); else Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start() },
    }),
  )

  if (!mounted) return null

  // Nếu cửa sổ tự co lại khi bật bàn phím thì không cộng thêm chiều cao bàn phím lần nữa.
  const lift = kb > 0 && (rootH === 0 || rootH >= screenH - 60) ? kb : 0
  const avail = screenH - lift - insets.top - 8
  const sheetMax = Math.min(screenH * maxHeight, avail)
  const opacity = slide.interpolate({ inputRange: [0, screenH * 0.6], outputRange: [1, 0], extrapolate: 'clamp' })

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }} onLayout={(e) => setRootH(e.nativeEvent.layout.height)}>
        <Animated.View style={[StyleSheet.absoluteFill as object, { backgroundColor: t.overlay, opacity }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng" />
        </Animated.View>
        <Animated.View
          style={{
            backgroundColor: t.card,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            overflow: 'hidden',
            maxHeight: sheetMax,
            height: height ? Math.min(height, sheetMax) : undefined,
            marginBottom: lift,
            transform: [{ translateY: slide }],
          }}
        >
          {handle ? (
            <View {...pan.panHandlers} style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.controlBorder }} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}
