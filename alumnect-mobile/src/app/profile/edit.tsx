import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Camera, GraduationCap, Link2, Phone, Plus, Sparkles, Star, UserRound, X } from '@/components/icons'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BottomBar, BrandCover, SectionCard } from '@/components/DetailBits'
import { SelectField } from '@/components/SelectField'
import { userApi } from '@/api/users'
import type { UserProfile, UserSkillRequest } from '@/api/users'
import { authApi } from '@/api/auth'
import { experienceApi } from '@/api/explore'
import { useAuthStore } from '@/store/authStore'
import { FPT_CAMPUSES, VN_CITIES } from '@/constants/filters'
import { pickImage, uploadImage } from '@/lib/upload'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

type Form = {
  fullName: string
  biography: string
  campus: string | null
  majorId: string | null
  cohort: string
  graduationYear: string
  phone: string
  city: string | null
}

const fromProfile = (p: UserProfile): Form => ({
  fullName: p.fullName ?? '',
  biography: p.biography ?? '',
  campus: p.campus ?? null,
  majorId: p.major?.id != null ? String(p.major.id) : null,
  cohort: p.cohort != null ? String(p.cohort) : '',
  graduationYear: p.graduationYear != null ? String(p.graduationYear) : '',
  phone: p.phone ?? '',
  city: p.city ?? null,
})

const BIO_MAX = 500

/** UC07: chỉnh sửa hồ sơ, đủ các trường như Web (cá nhân, học tập, liên hệ, liên kết, kỹ năng). */
export default function EditProfileScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: userApi.me })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors, staleTime: 30 * 60_000 })
  const exps = useQuery({ queryKey: ['experiences'], queryFn: experienceApi.list })

  const [f, setF] = useState<Form | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [cover, setCover] = useState<string | null>(null)
  const [links, setLinks] = useState<string[]>([])
  const [skills, setSkills] = useState<UserSkillRequest[]>([])
  const [newLink, setNewLink] = useState('')
  const [skillGroup, setSkillGroup] = useState('Khác')
  const [skillName, setSkillName] = useState('')
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const p = profile.data?.data
  if (p && !f) {
    setF(fromProfile(p))
    setAvatar(p.avatarUrl || null)
    setCover(p.coverUrl || null)
    setLinks(p.socialLinks ? [...p.socialLinks] : [])
    setSkills((p.skills ?? []).map((s, i) => ({ groupName: s.groupName, skillName: s.skillName, sortOrder: s.sortOrder ?? i + 1 })))
  }
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((x) => (x ? { ...x, [k]: v } : x))

  const save = useMutation({
    mutationFn: () =>
      userApi.update({
        fullName: f!.fullName.trim(),
        avatarUrl: avatar,
        coverUrl: cover,
        headline: p?.headline ?? null,
        biography: f!.biography.trim() || null,
        campus: f!.campus || null,
        majorId: f!.majorId ? Number(f!.majorId) : null,
        cohort: f!.cohort ? Number(f!.cohort) : null,
        graduationYear: f!.graduationYear ? Number(f!.graduationYear) : null,
        phone: f!.phone.trim() || null,
        city: f!.city || null,
        socialLinks: links,
        skills: skills.map((s, i) => ({ ...s, sortOrder: i + 1 })),
      }),
    onSuccess: (res) => {
      toast.success('Đã lưu thông tin hồ sơ thành công!')
      if (user) setUser({ ...user, name: res.data.fullName, avatarUrl: res.data.avatarUrl || undefined })
      qc.invalidateQueries({ queryKey: ['profile'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const changeImage = async (kind: 'avatar' | 'cover') => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(kind)
    try {
      const url = await uploadImage(img, kind === 'avatar' ? 'avatars' : 'common')
      if (kind === 'avatar') setAvatar(url)
      else setCover(url)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(null)
    }
  }

  const addLink = () => {
    const link = newLink.trim()
    if (!link) return
    if (!/^https?:\/\/\S+\.\S+/.test(link)) return setErrors((e) => ({ ...e, link: 'Liên kết phải bắt đầu bằng http:// hoặc https:// (VD: https://linkedin.com/...)' }))
    if (links.includes(link)) return setErrors((e) => ({ ...e, link: 'Liên kết cá nhân này đã tồn tại' }))
    setErrors(({ link: _drop, ...rest }) => rest)
    setLinks([...links, link])
    setNewLink('')
  }
  const addSkill = () => {
    const name = skillName.trim()
    const group = skillGroup.trim() || 'Khác'
    if (!name) return
    if (skills.some((s) => s.groupName === group && s.skillName.toLowerCase() === name.toLowerCase())) return toast.info('Kỹ năng này đã có trong danh sách.')
    setSkills([...skills, { groupName: group, skillName: name, sortOrder: skills.length + 1 }])
    setSkillName('')
  }

  const submit = () => {
    if (!f) return
    const e: Record<string, string> = {}
    const name = f.fullName.trim()
    const year = new Date().getFullYear()
    if (!name) e.fullName = 'Họ và tên không được để trống'
    else if (name.length > 150) e.fullName = 'Họ và tên không được vượt quá 150 ký tự'
    else if (/\d/.test(name)) e.fullName = 'Họ và tên hiển thị không được chứa số'
    if (f.biography.trim().length > BIO_MAX) e.biography = `Giới thiệu không được vượt quá ${BIO_MAX} ký tự`
    if (f.cohort && (Number(f.cohort) < 1 || Number(f.cohort) > 50)) e.cohort = 'Khóa học không hợp lệ (1 – 50)'
    if (f.graduationYear && (Number(f.graduationYear) < 2006 || Number(f.graduationYear) > year + 10)) e.graduationYear = `Năm tốt nghiệp từ 2006 đến ${year + 10}`
    if (f.phone.trim() && !/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(f.phone.trim())) e.phone = 'Số điện thoại Việt Nam không hợp lệ (VD: 0905123456)'
    setErrors(e)
    if (Object.keys(e).length) return toast.error('Vui lòng kiểm tra lại các trường được đánh dấu.')
    save.mutate()
  }

  if (profile.isError) return <Screen><Header title="Chỉnh sửa hồ sơ" /><Empty text="Không tải được hồ sơ." error={profile.error} onRetry={() => { void profile.refetch() }} /></Screen>
  if (profile.isLoading || !f) return <Screen><Header title="Chỉnh sửa hồ sơ" /><Loading /></Screen>
  const groups = Array.from(new Set(skills.map((s) => s.groupName)))

  return (
    <Screen bg={t.card}>
      <Header title="Chỉnh sửa hồ sơ" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Ảnh bìa + ảnh đại diện */}
          <View style={{ backgroundColor: t.card, marginBottom: 16, paddingBottom: 16 }}>
            <Pressable onPress={() => changeImage('cover')} accessibilityRole="button" accessibilityLabel="Đổi ảnh bìa">
              {cover ? <Image source={{ uri: cover }} style={{ height: 140, backgroundColor: t.inputBg }} contentFit="cover" /> : <BrandCover height={140} />}
              <View style={{ position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)' }}>
                <Camera size={14} color="#fff" />
                <Txt size={12} weight="700" color="#fff">{uploading === 'cover' ? 'Đang tải...' : 'Đổi ảnh bìa'}</Txt>
              </View>
            </Pressable>
            <View style={{ alignItems: 'center', marginTop: -50 }}>
              <Pressable onPress={() => changeImage('avatar')} accessibilityRole="button" accessibilityLabel="Đổi ảnh đại diện">
                <View style={{ borderWidth: 4, borderColor: t.card, borderRadius: 60 }}>
                  <Avatar uri={avatar} name={f.fullName} size={100} />
                </View>
                <View style={{ position: 'absolute', right: 2, bottom: 6, width: 34, height: 34, borderRadius: 17, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.card }}>
                  <Camera size={15} color="#fff" />
                </View>
              </Pressable>
              <Txt muted size={12} style={{ marginTop: 6 }}>{uploading === 'avatar' ? 'Đang tải ảnh...' : 'Chạm để đổi ảnh đại diện'}</Txt>
            </View>
          </View>

          <SectionCard title="Thông tin cá nhân" icon={<UserRound size={18} color={t.primary} />}>
            <Input label="Họ và tên hiển thị *" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} placeholder="Nhập họ và tên..." />
            <Input label="Giới thiệu bản thân" value={f.biography} onChangeText={set('biography')} multiline error={errors.biography} placeholder="Mô tả bản thân, phong cách làm việc, sở thích..." />
            <Txt muted size={12} style={{ alignSelf: 'flex-end', marginTop: -10 }} color={f.biography.length > BIO_MAX ? t.danger : undefined}>{`${f.biography.length}/${BIO_MAX}`}</Txt>
          </SectionCard>

          <SectionCard title="Học tập tại FPTU" icon={<GraduationCap size={18} color={t.primary} />}>
            <SelectField label="Cơ sở đào tạo" value={f.campus} options={FPT_CAMPUSES.map((c) => ({ value: c, label: c }))} onChange={set('campus')} placeholder="-- Chọn cơ sở --" />
            <SelectField
              label="Chuyên ngành"
              value={f.majorId}
              options={(majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: `${m.name} (${m.code})` }))}
              onChange={set('majorId')}
              placeholder="-- Chọn chuyên ngành --"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Khóa" value={f.cohort} onChangeText={(v) => set('cohort')(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="VD: 17" error={errors.cohort} maxLength={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Năm tốt nghiệp" value={f.graduationYear} onChangeText={(v) => set('graduationYear')(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="VD: 2025" error={errors.graduationYear} maxLength={4} />
              </View>
            </View>
            {p?.studentCode ? <Txt muted size={12}>{`Mã sinh viên: ${p.studentCode} (không thể thay đổi)`}</Txt> : null}
          </SectionCard>

          <SectionCard title="Liên hệ" icon={<Phone size={18} color={t.primary} />}>
            <Input label="Số điện thoại" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="VD: 0905123456" error={errors.phone} />
            <SelectField label="Tỉnh / thành phố hiện tại" value={f.city} options={VN_CITIES.map((c) => ({ value: c, label: c }))} onChange={set('city')} placeholder="-- Chọn tỉnh / thành --" />
          </SectionCard>

          <SectionCard title="Liên kết cá nhân" icon={<Link2 size={18} color={t.primary} />}>
            <Txt muted size={12} style={{ marginBottom: 8 }}>LinkedIn, GitHub, Portfolio...</Txt>
            {links.map((l, i) => (
              <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.divider }}>
                <Link2 size={15} color={t.textMuted} />
                <Txt size={13} style={{ flex: 1 }} numberOfLines={1} color={t.info}>{l}</Txt>
                <Pressable onPress={() => setLinks(links.filter((_, j) => j !== i))} hitSlop={8} accessibilityRole="button" accessibilityLabel="Xoá liên kết">
                  <X size={16} color={t.textMuted} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Input value={newLink} onChangeText={setNewLink} placeholder="https://linkedin.com/in/..." autoCapitalize="none" keyboardType="url" error={errors.link} onSubmitEditing={addLink} />
              </View>
              <Button title="Thêm" size="sm" variant="secondary" icon={<Plus size={14} color={t.primary} />} onPress={addLink} style={{ height: 48 }} />
            </View>
          </SectionCard>

          <SectionCard title="Kỹ năng chuyên môn" icon={<Sparkles size={18} color={t.primary} />}>
            {groups.length === 0 ? <Txt muted size={13} style={{ marginBottom: 16 }}>Chưa có kỹ năng nào. Thêm kỹ năng để mentor và nhà tuyển dụng dễ tìm thấy bạn.</Txt> : null}
            {groups.map((g) => (
              <View key={g} style={{ marginBottom: 16 }}>
                <Txt muted size={12} weight="700" style={{ marginBottom: 6 }}>{g.toUpperCase()}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {skills.map((s, i) =>
                    s.groupName === g ? (
                      <Pressable key={`${s.groupName}-${s.skillName}`} onPress={() => setSkills(skills.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={`Xoá kỹ năng ${s.skillName}`}>
                        <Tag label={s.skillName} icon={<X size={11} color={t.primary} />} />
                      </Pressable>
                    ) : null,
                  )}
                </View>
              </View>
            ))}
            <View style={{ marginTop: 6, padding: 12, borderRadius: 14, backgroundColor: t.surface }}>
              <Txt size={13} weight="700" style={{ marginBottom: 8 }}>Thêm kỹ năng</Txt>
              <Input label="Nhóm kỹ năng" value={skillGroup} onChangeText={setSkillGroup} placeholder="VD: Programming" />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Input label="Tên kỹ năng" value={skillName} onChangeText={setSkillName} placeholder="VD: ReactJS, Java" onSubmitEditing={addSkill} returnKeyType="done" />
                </View>
                <Button title="Thêm" size="sm" icon={<Plus size={14} color="#fff" />} onPress={addSkill} style={{ height: 48, marginTop: 21 }} />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            title="Kinh nghiệm làm việc"
            icon={<Briefcase size={18} color={t.primary} />}
            right={<Txt size={13} weight="700" color={t.primary} onPress={() => router.push('/profile/experience')}>+ Thêm</Txt>}
          >
            {(exps.data ?? []).length === 0 ? <Txt muted size={13}>Chưa có kinh nghiệm nào.</Txt> : null}
            {(exps.data ?? []).map((e, i, arr) => (
              <Pressable
                key={e.id}
                onPress={() => router.push({ pathname: '/profile/experience', params: { id: String(e.id) } })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.divider, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={17} color={t.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Txt weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{e.title}</Txt>
                    {e.isPrimary ? <Star size={13} color={t.warning} fill={t.warning} /> : null}
                  </View>
                  <Txt muted size={13} numberOfLines={1}>{e.company}</Txt>
                  <Txt muted size={12}>{`${e.startDate} — ${e.isCurrent ? 'Hiện tại' : e.endDate ?? ''}`}</Txt>
                </View>
              </Pressable>
            ))}
          </SectionCard>
          <Card flat style={{ marginHorizontal: 16, backgroundColor: 'transparent' }}>
            <Txt muted size={12} style={{ textAlign: 'center' }}>Email và mã sinh viên được quản lý bởi nhà trường, không thể sửa tại đây.</Txt>
          </Card>
        </ScrollView>
        <BottomBar>
          <Button title="Huỷ" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Lưu thay đổi" onPress={submit} loading={save.isPending} disabled={!!uploading} style={{ flex: 2 }} />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  )
}
