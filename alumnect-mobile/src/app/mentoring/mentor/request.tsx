import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { RequestForm } from '@/components/RequestForm'

export default function DirectRequestScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  return <RequestForm mentorId={Number(id)} mentorName={name} />
}
