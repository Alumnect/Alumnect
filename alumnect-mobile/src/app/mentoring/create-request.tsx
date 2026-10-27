import React from 'react'
import { RequestForm } from '@/components/RequestForm'
import { useLocalSearchParams } from 'expo-router'

export default function CreateRequestScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>()
  return <RequestForm initialGroupId={groupId ? Number(groupId) : undefined} />
}
