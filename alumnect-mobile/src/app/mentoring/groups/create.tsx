import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { groupApi } from '@/api/mentoringGroups'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { Plus } from '@/components/icons'

export default function CreateMentoringGroupScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
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
    <Screen keyboard bg={colors.bg}>
      <Header title="Tạo nhóm Cố vấn" subtitle="Cùng bạn bè học tập & nhận định hướng từ Mentor" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#24180E' : viridianSoft,
              borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            },
          ]}
        >
          <BrandIcon name="people2" size={44} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Txt size={14} weight="800" style={{ color: colors.text }}>
              Nhóm học viên Cố vấn
            </Txt>
            <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              Sau khi tạo nhóm, bạn có thể mời thêm thành viên và gửi yêu cầu cố vấn đại diện cho cả nhóm.
            </Txt>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Input
            label="Tên nhóm Cố vấn"
            placeholder="VD: Nhóm Đồ án Tốt nghiệp AI K17..."
            value={name}
            onChangeText={setName}
            error={error}
          />
          <Input
            label="Mô tả mục tiêu & chủ đề của nhóm"
            placeholder="Chia sẻ ngắn gọn mục tiêu chung của các thành viên trong nhóm..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button
            title="Khởi tạo nhóm Cố vấn"
            textColor="#FFFFFF"
            icon={<Plus size={16} color="#FFFFFF" weight="bold" />}
            onPress={submit}
            loading={create.isPending}
            style={{ backgroundColor: viridian, borderColor: viridian }}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
})
