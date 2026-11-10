import React from 'react'
import { Image } from 'expo-image'

/**
 * Minh họa màu từ bộ Meetup trong E:/Clone UIUX: dùng cho tiêu đề mục,
 * lối tắt cộng đồng, thông tin sự kiện và trạng thái trống.
 * Icon thao tác nhỏ (quay lại, tìm kiếm, đóng) dùng Phosphor để giữ nét rõ.
 */
const SOURCES = {
  calendar: require('../../assets/brand/calendar.webp'),
  pin: require('../../assets/brand/pin.webp'),
  world: require('../../assets/brand/world.webp'),
  people: require('../../assets/brand/people.webp'),
  people2: require('../../assets/brand/people2.webp'),
  suitcase: require('../../assets/brand/suitcase.webp'),
  coin: require('../../assets/brand/coin.webp'),
  chat: require('../../assets/brand/chat.webp'),
  task: require('../../assets/brand/task.webp'),
  list: require('../../assets/brand/list.webp'),
} as const

export type BrandIconName = keyof typeof SOURCES

export function BrandIcon({ name, size = 48 }: { name: BrandIconName; size?: number }) {
  return <Image source={SOURCES[name]} style={{ width: size, height: size }} contentFit="contain" cachePolicy="none" recyclingKey={name} accessible={false} />
}
