import React, { forwardRef, useState, useCallback } from 'react'
import {
  Platform,
  RefreshControl,
  ScrollView as NativeScrollView,
  type ScrollViewProps,
  type ScrollViewInstance,
} from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'

export interface AppScrollViewProps extends ScrollViewProps {
  /** Tắt tính năng pull-to-refresh tự động (ví dụ modal, sheet chọn hoặc form nhạy cảm) */
  disablePullToRefresh?: boolean
  /** Callback refresh tùy biến cho trang có logic reload riêng */
  onRefresh?: () => void | Promise<unknown>
  /** Trạng thái refreshing từ component cha */
  refreshing?: boolean
}

/**
 * ScrollView chuẩn hóa toàn ứng dụng:
 * - Hỗ trợ thao tác kéo xuống (Pull-to-refresh) tự động trên TOÀN BỘ các màn hình.
 * - Tự động refetch tất cả các active React Queries của màn hình hiện tại khi kéo xuống.
 * - Rung haptic feedback nhẹ nhàng khi bắt đầu kéo làm mới.
 * - Hiển thị spinner refresh đồng bộ màu chủ đề t.primary.
 */
export const ScrollView = forwardRef<ScrollViewInstance, AppScrollViewProps>(function ScrollView(
  {
    horizontal,
    contentContainerStyle,
    disablePullToRefresh = false,
    onRefresh,
    refreshing: externalRefreshing,
    refreshControl,
    ...props
  },
  ref
) {
  const theme = useTheme()
  const qc = useQueryClient()
  const [internalRefreshing, setInternalRefreshing] = useState(false)

  const isRefreshing = externalRefreshing !== undefined ? externalRefreshing : internalRefreshing

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setInternalRefreshing(true)
    const minWait = new Promise((resolve) => setTimeout(resolve, 600))
    try {
      if (onRefresh) {
        await Promise.all([onRefresh(), minWait])
      } else {
        await Promise.all([qc.refetchQueries({ type: 'active' }), minWait])
      }
    } catch {
      /* Bỏ qua lỗi mạng trong lúc kéo làm mới */
    } finally {
      setInternalRefreshing(false)
    }
  }, [onRefresh, qc])

  const effectiveRefreshControl =
    refreshControl !== undefined
      ? refreshControl
      : !horizontal && !disablePullToRefresh
      ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.card}
          />
        )
      : undefined

  return (
    <NativeScrollView
      ref={ref}
      horizontal={horizontal}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={effectiveRefreshControl}
      contentContainerStyle={[!horizontal && { paddingBottom: 32 }, contentContainerStyle]}
      {...props}
    />
  )
})
