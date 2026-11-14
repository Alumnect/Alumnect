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
  pencil: require('../../assets/brand/pencil.webp'),
  writing: require('../../assets/brand/writing.webp'),
  megaphone: require('../../assets/brand/megaphone.webp'),
  check: require('../../assets/brand/check.webp'),
  fist: require('../../assets/brand/fist.webp'),
  star: require('../../assets/brand/star.webp'),
  sparkle: require('../../assets/brand/sparkle.webp'),
  gift: require('../../assets/brand/gift.webp'),
  heart: require('../../assets/brand/heart.webp'),
  computer: require('../../assets/brand/computer.webp'),
  copy: require('../../assets/brand/copy.webp'),
  lock: require('../../assets/brand/lock.webp'),
  building: require('../../assets/brand/building.webp'),
  video: require('../../assets/brand/video.webp'),
  pray: require('../../assets/brand/pray.webp'),
  photo: require('../../assets/brand/photo.webp'),
  music: require('../../assets/brand/music.webp'),
  painting: require('../../assets/brand/painting.webp'),
  mentalhealth: require('../../assets/brand/mentalhealth.webp'),
  tree: require('../../assets/brand/tree.webp'),
  potion: require('../../assets/brand/potion.webp'),
  videogame: require('../../assets/brand/videogame.webp'),
  ball: require('../../assets/brand/ball.webp'),
  cat: require('../../assets/brand/cat.webp'),
  pizza: require('../../assets/brand/pizza.webp'),
  child: require('../../assets/brand/child.webp'),
  binoculars: require('../../assets/brand/binoculars.webp'),
  alarm_clock: require('../../assets/brand/alarm_clock.webp'),
  badge_pro: require('../../assets/brand/badge_pro.webp'),
  badge_plus: require('../../assets/brand/badge_plus.webp'),
} as const

export type BrandIconName = keyof typeof SOURCES

export function BrandIcon({ name, size = 48 }: { name: BrandIconName; size?: number }) {
  return <Image source={SOURCES[name]} style={{ width: size, height: size }} contentFit="contain" cachePolicy="none" recyclingKey={name} accessible={false} />
}
