import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { PostForm } from '@/components/PostForm'
import type { PostType } from '@/api/feed'

const TYPES: PostType[] = ['normal', 'achievement', 'recruitment', 'event']

export default function CreatePostScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>()
  return <PostForm initialType={TYPES.includes(type as PostType) ? (type as PostType) : undefined} />
}
