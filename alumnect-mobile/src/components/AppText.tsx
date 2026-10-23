import React from 'react'
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextStyle } from 'react-native'
import { fontFor } from '@/theme'

/**
 * Với font tuỳ chỉnh, Android bỏ qua `fontWeight` mà chỉ nhìn `fontFamily`.
 * Hàm này đọc `fontWeight` trong style và đổi thành đúng họ font (Be Vietnam Pro) để mọi nơi trong app
 * (kể cả `<Text style={{ fontWeight: '700' }}>` viết tay) đều dùng cùng một font.
 */
function withFont(style: unknown): TextStyle {
  const flat = (StyleSheet.flatten(style as TextStyle) ?? {}) as TextStyle
  const { fontWeight, ...rest } = flat
  return { ...rest, fontFamily: flat.fontFamily ?? fontFor(fontWeight) }
}

type TextProps = React.ComponentProps<typeof RNText>
type TextInputProps = React.ComponentProps<typeof RNTextInput>

/** Thay thế `Text` của react-native: cùng props, tự chọn họ font theo `fontWeight`. */
export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={withFont(style)} />
}

/** Thay thế `TextInput` của react-native: cùng props, tự chọn họ font theo `fontWeight`. */
export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput {...props} style={withFont(style)} />
}
