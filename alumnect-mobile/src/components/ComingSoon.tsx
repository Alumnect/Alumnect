import React from 'react'
import { Empty, Screen } from './ui'
import { Header } from './Header'

/** Khung tạm cho các màn hình đang được xây dựng ở các đợt tiếp theo. */
export function ComingSoon({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <Screen>
      {back ? <Header title={title} /> : null}
      <Empty text={`${title} đang được phát triển.`} />
    </Screen>
  )
}
