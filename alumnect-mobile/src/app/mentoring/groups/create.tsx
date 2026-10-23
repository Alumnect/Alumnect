import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { groupApi } from '@/api/mentoringGroups'
import { toast, errMsg } from '@/lib/toast'

export default function CreateMentoringGroupScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: () => groupApi.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (g) => {
      toast.success('Tạo nhóm mentoring thành công')
      qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
      router.replace({ pathname: '/mentoring/groups/[id]', params: { id: String(g.id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    if (!name.trim()) return setError('Tên nhóm không được để trống')
    setError('')
    create.mutate()
  }

  return (
    <Screen>
      <Header title="Tạo nhóm Mentoring" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Input label="Tên nhóm" value={name} onChangeText={setName} error={error} />
        <Input label="Mô tả" value={description} onChangeText={setDescription} multiline />
        <Button title="Tạo nhóm" onPress={submit} loading={create.isPending} />
      </ScrollView>
    </Screen>
  )
}
