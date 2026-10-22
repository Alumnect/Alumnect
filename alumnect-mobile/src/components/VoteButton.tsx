import React, { useState } from 'react'
import { Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { ArrowBigUp } from 'lucide-react-native'
import { Txt } from './ui'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Nút upvote có cập nhật lạc quan, dùng cho câu hỏi và câu trả lời. */
export function VoteButton({ voted, votes, onVote, onUnvote }: { voted: boolean; votes: number; onVote: () => Promise<unknown>; onUnvote: () => Promise<unknown> }) {
  const t = useTheme()
  const [state, setState] = useState({ voted, votes })
  const m = useMutation({
    mutationFn: (next: boolean) => (next ? onVote() : onUnvote()),
    onSuccess: (_d, next) => {
      if (next) toast.success('Đã ghi nhận bình chọn!')
    },
    onError: (e, next) => {
      setState((p) => ({ voted: !next, votes: p.votes + (next ? -1 : 1) }))
      toast.error(errMsg(e))
    },
  })
  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !state.voted
    setState((p) => ({ voted: next, votes: p.votes + (next ? 1 : -1) }))
    m.mutate(next)
  }
  return (
    <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }} hitSlop={8}>
      <ArrowBigUp size={24} color={state.voted ? t.primary : t.textMuted} fill={state.voted ? t.primary : 'transparent'} />
      <Txt weight="700" color={state.voted ? t.primary : t.textMuted}>{state.votes}</Txt>
    </Pressable>
  )
}
