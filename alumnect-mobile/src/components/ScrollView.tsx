import React, { forwardRef } from 'react'
import { Platform, ScrollView as NativeScrollView, type ScrollViewProps, type ScrollViewInstance } from 'react-native'

/** Consistent scrolling and room after the last field, including landscape phones. */
export const ScrollView = forwardRef<ScrollViewInstance, ScrollViewProps>(function ScrollView({ horizontal, contentContainerStyle, ...props }, ref) {
  return (
    <NativeScrollView
      ref={ref}
      horizontal={horizontal}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[!horizontal && { paddingBottom: 32 }, contentContainerStyle]}
      {...props}
    />
  )
})
