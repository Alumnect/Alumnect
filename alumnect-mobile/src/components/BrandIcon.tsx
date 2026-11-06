import React from 'react'
import { Image } from 'expo-image'

/**
 * Bộ minh họa màu (nét cọ) lấy từ Meetup, chỉ dùng cho các chỗ hiển thị lớn:
 * dòng thông tin sự kiện và màn hình trống. Icon chức năng (tab, nút, tag) vẫn dùng Phosphor đơn sắc.
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
  return <Image source={SOURCES[name]} style={{ width: size, height: size }} contentFit="contain" accessible={false} />
}
