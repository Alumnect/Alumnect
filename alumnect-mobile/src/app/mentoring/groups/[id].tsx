import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Txt, SearchBar, Tag } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { ActionSheet } from '@/components/ActionSheet'
import { groupApi, isActiveMember, isPendingMember } from '@/api/mentoringGroups'
import type { GroupMember } from '@/api/mentoringGroups'
import { userApi } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { useDebounced } from '@/lib/hooks'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { ChevronRight, LogOut, Pencil, XCircle } from '@/components/icons'

type Confirm = { title: string; action: () => void } | null

/** Chi tiết nhóm Mentoring: Meetup GroupTimeline x Instagram Group Profile x Kakao Bento (Cam - Trắng - Đen). */
export default function MentoringGroupDetailScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const gid = Number(id)
  const me = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [kw, setKw] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const query = useDebounced(kw, 300).trim()

  const q = useQuery({ queryKey: ['mentoring-groups', 'detail', gid], queryFn: () => groupApi.detail(gid) })
  const search = useQuery({
    queryKey: ['group-invite-search', query],
    enabled: query.length >= 2,
    queryFn: () => userApi.search({ query, size: 8 }),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['mentoring-groups'] })
  const onOk = (msg: string, after?: () => void) => () => {
    toast.success(msg)
    refresh()
    after?.()
  }
  const onErr = (e: unknown) => toast.error(errMsg(e))

  const save = useMutation({
    mutationFn: () => groupApi.update(gid, { name: name.trim(), description: desc.trim() }),
    onSuccess: onOk('Đã cập nhật nhóm', () => setEditing(false)),
    onError: onErr,
  })
  const invite = useMutation({
    mutationFn: (uid: number) => groupApi.invite(gid, [uid]),
    onSuccess: onOk('Đã gửi lời mời vào nhóm'),
    onError: onErr,
  })
  const remove = useMutation({
    mutationFn: (uid: number) => groupApi.remove(gid, uid),
    onSuccess: onOk('Đã xoá thành viên khỏi nhóm'),
    onError: onErr,
  })
  const cancelInv = useMutation({
    mutationFn: (uid: number) => groupApi.cancelInvitationByUser(gid, uid),
    onSuccess: onOk('Đã thu hồi lời mời'),
    onError: onErr,
  })
  const leave = useMutation({
    mutationFn: () => groupApi.leave(gid),
    onSuccess: onOk('Đã rời nhóm', () => router.back()),
    onError: onErr,
  })
  const del = useMutation({
    mutationFn: () => groupApi.delete(gid),
    onSuccess: onOk('Đã xoá nhóm', () => router.back()),
    onError: onErr,
  })

  const g = q.data
  if (q.isLoading)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Nhóm Cố vấn" />
        <Loading />
      </Screen>
    )
  if (!g)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Nhóm Cố vấn" />
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy nhóm." />
      </Screen>
    )

  const isLeader = g.canManage || String(me?.id) === String(g.leaderId)
  const active = g.members.filter(isActiveMember)
  const pending = g.members.filter(isPendingMember)
  const iAmJoined = active.some((m) => String(m.userId) === String(me?.id))
  const memberIds = new Set(g.members.filter((m) => isActiveMember(m) || isPendingMember(m)).map((m) => m.userId))
  const pct = Math.min(100, Math.round((active.length / Math.max(1, g.maxMembers)) * 100))
  const remainingSlots = Math.max(0, g.maxMembers - active.length)

  const MemberRow = ({ m, action, last }: { m: GroupMember; action?: React.ReactNode; last?: boolean }) => (
    <View style={[styles.memberRow, { borderBottomColor: last ? 'transparent' : colors.borderSubtle }]}>
      <Avatar uri={m.avatarUrl} name={m.fullName} size={44} ring={m.leader} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Txt weight="800" size={15} style={{ color: colors.text, flexShrink: 1 }}>
            {m.fullName}
          </Txt>
          {m.leader ? (
            <View style={{ backgroundColor: viridianSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Txt size={10} weight="800" style={{ color: viridian }}>
                Trưởng nhóm
              </Txt>
            </View>
          ) : null}
        </View>
        {m.major ? (
          <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
            {m.major}
          </Txt>
        ) : null}
      </View>
      {action}
    </View>
  )

  return (
    <Screen keyboard bg={colors.bg}>
      <Header
        title={g.name}
        subtitle={`${active.length}/${g.maxMembers} thành viên chính thức`}
        right={
          isLeader ? (
            <Pressable
              onPress={() => {
                setName(g.name)
                setDesc(g.description ?? '')
                setEditing(true)
              }}
              style={[styles.editHeaderBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Pencil size={13} color={viridian} />
              <Txt size={12} weight="700" style={{ color: colors.text }}>
                Sửa
              </Txt>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Meetup x Instagram Group Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.eyebrowRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <BrandIcon name="sparkle" size={15} />
              <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.5 }}>
                NHÓM HỌC TẬP & CỐ VẤN
              </Txt>
            </View>
            <Tag label={g.status === 'ACTIVE' ? 'Hoạt động' : g.status} tone="success" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View style={[styles.iconBox, { backgroundColor: viridianSoft, borderColor: viridian }]}>
              <BrandIcon name="people2" size={38} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={19} weight="800" style={{ color: colors.text }}>
                {g.name}
              </Txt>
              <Txt size={13} weight="500" style={{ color: colors.textSecondary, marginTop: 2 }}>
                {`Trưởng nhóm: `}
                <Txt size={13} weight="700" style={{ color: colors.text }}>
                  {g.leaderName ?? '—'}
                </Txt>
              </Txt>
            </View>
          </View>

          {g.description && !editing ? (
            <View style={[styles.descBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Txt size={13} style={{ color: colors.textSecondary, lineHeight: 20 }}>
                {g.description}
              </Txt>
            </View>
          ) : null}

          {/* Meetup Capacity Meter */}
          <View style={[styles.capacityBox, { borderTopColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Txt size={11} weight="700" style={{ color: colors.textSecondary }}>
                {`Sĩ số nhóm (${active.length}/${g.maxMembers} thành viên)`}
              </Txt>
              <Txt size={11} weight="800" style={{ color: viridian }}>
                {remainingSlots > 0 ? `Còn ${remainingSlots} chỗ trống` : 'Đã đủ thành viên'}
              </Txt>
            </View>
            <View style={[styles.capacityTrack, { backgroundColor: colors.surface }]}>
              <View style={[styles.capacityFill, { width: `${pct}%`, backgroundColor: viridian }]} />
            </View>
          </View>
        </View>

        {editing ? (
          <Card style={{ marginBottom: 14 }}>
            <Input label="Tên nhóm cố vấn" value={name} onChangeText={setName} />
            <Input label="Mô tả mục tiêu của nhóm" value={desc} onChangeText={setDesc} multiline />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="Lưu thay đổi"
                textColor="#FFFFFF"
                style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                loading={save.isPending}
                disabled={!name.trim()}
                onPress={() => save.mutate()}
              />
              <Button title="Huỷ" variant="outline" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            </View>
          </Card>
        ) : null}

        {/* Active Members Bento Card */}
        <View style={[styles.sectionBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: viridianSoft }]}>
              <BrandIcon name="people" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                {`Thành viên chính thức (${active.length}/${g.maxMembers})`}
              </Txt>
              <Txt size={11} style={{ color: colors.textTertiary }}>
                Danh sách thành viên cùng tham gia phiên cố vấn
              </Txt>
            </View>
          </View>

          {active.map((m, idx) => (
            <MemberRow
              key={m.id}
              m={m}
              last={idx === active.length - 1}
              action={
                isLeader && !m.leader ? (
                  <Pressable
                    onPress={() => setConfirm({ title: `Xoá ${m.fullName} khỏi nhóm?`, action: () => remove.mutate(m.userId) })}
                    style={[styles.removeMemberBtn, { backgroundColor: isDark ? '#3A1717' : '#FEE2E2' }]}
                  >
                    <Txt color="#EF4444" size={11} weight="800">
                      Xoá
                    </Txt>
                  </Pressable>
                ) : undefined
              }
            />
          ))}
        </View>

        {/* Pending Invitations */}
        {pending.length > 0 ? (
          <View style={[styles.sectionBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: viridianSoft }]}>
                <BrandIcon name="calendar" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={15} style={{ color: colors.text }}>
                  {`Đang chờ phản hồi (${pending.length})`}
                </Txt>
                <Txt size={11} style={{ color: colors.textTertiary }}>
                  Lời mời đã gửi và đang đợi sinh viên xác nhận
                </Txt>
              </View>
            </View>
            {pending.map((m, idx) => (
              <MemberRow
                key={m.id}
                m={m}
                last={idx === pending.length - 1}
                action={
                  isLeader ? (
                    <Pressable
                      onPress={() => cancelInv.mutate(m.userId)}
                      style={[styles.removeMemberBtn, { backgroundColor: isDark ? '#3A1717' : '#FEE2E2' }]}
                    >
                      <Txt color="#EF4444" size={11} weight="800">
                        Thu hồi
                      </Txt>
                    </Pressable>
                  ) : undefined
                }
              />
            ))}
          </View>
        ) : null}

        {/* Invite New Members */}
        {isLeader && g.status === 'ACTIVE' ? (
          <View style={[styles.sectionBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: viridianSoft }]}>
                <BrandIcon name="chat" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={15} style={{ color: colors.text }}>
                  Mời thêm thành viên
                </Txt>
                <Txt size={11} style={{ color: colors.textTertiary }}>
                  Tìm và gửi lời mời bạn bè cùng tham gia nhóm cố vấn
                </Txt>
              </View>
            </View>
            <SearchBar value={kw} onChangeText={setKw} placeholder="Tìm sinh viên theo tên (tối thiểu 2 ký tự)..." />
            {(search.data?.data.content ?? []).map((u, idx, arr) => (
              <View
                key={u.userId}
                style={[styles.memberRow, { borderBottomColor: idx === arr.length - 1 ? 'transparent' : colors.borderSubtle }]}
              >
                <Avatar uri={u.avatarUrl} name={u.fullName} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt weight="700" size={14} style={{ color: colors.text }}>
                    {u.fullName}
                  </Txt>
                  {u.headline ? (
                    <Txt muted size={12} numberOfLines={1}>
                      {u.headline}
                    </Txt>
                  ) : null}
                </View>
                {memberIds.has(u.userId) ? (
                  <View style={[styles.joinedBadge, { backgroundColor: colors.surface }]}>
                    <Txt muted size={11} weight="600">
                      Đã trong nhóm
                    </Txt>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => invite.mutate(u.userId)}
                    style={{ backgroundColor: viridian, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 }}
                  >
                    <Txt color="#FFFFFF" weight="800" size={12}>
                      + Mời
                    </Txt>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Group Requests */}
        {g.requests && g.requests.length > 0 ? (
          <View style={[styles.sectionBento, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: viridianSoft }]}>
                <BrandIcon name="writing" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={15} style={{ color: colors.text }}>
                  Yêu cầu cố vấn của nhóm
                </Txt>
                <Txt size={11} style={{ color: colors.textTertiary }}>
                  Các bài toán nhóm đã đăng tìm Mentor
                </Txt>
              </View>
            </View>
            {g.requests.map((r, idx) => (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/mentoring/request/[id]', params: { id: String(r.id) } })}
                style={[
                  styles.memberRow,
                  { borderBottomColor: idx === g.requests!.length - 1 ? 'transparent' : colors.borderSubtle },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Txt weight="700" size={14} numberOfLines={2} style={{ color: colors.text }}>
                    {r.title}
                  </Txt>
                  <Txt muted size={12} style={{ marginTop: 2 }}>
                    {r.status}
                    {r.targetMentorName ? ` · ${r.targetMentorName}` : ''}
                  </Txt>
                </View>
                <ChevronRight size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Subtle Danger / Leave Action Row (Không dùng khối nút đỏ đặc choáng chỗ) */}
        {isLeader ? (
          <Pressable
            onPress={() => setConfirm({ title: 'Xoá vĩnh viễn nhóm này?', action: () => del.mutate() })}
            style={({ pressed }) => [
              styles.dangerCardRow,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? '#451A1A' : '#FECACA',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.dangerIconWrap, { backgroundColor: isDark ? '#3A1717' : '#FEE2E2' }]}>
              <XCircle size={17} color="#EF4444" weight="bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="700" style={{ color: '#EF4444' }}>
                Giải tán & Xoá nhóm cố vấn
              </Txt>
              <Txt size={11} style={{ color: colors.textTertiary, marginTop: 1 }}>
                Xoá vĩnh viễn nhóm khi chưa có yêu cầu hoặc nhiệm vụ đang chạy
              </Txt>
            </View>
            <ChevronRight size={15} color="#EF4444" />
          </Pressable>
        ) : iAmJoined ? (
          <Pressable
            onPress={() => setConfirm({ title: 'Bạn chắc chắn muốn rời nhóm?', action: () => leave.mutate() })}
            style={({ pressed }) => [
              styles.dangerCardRow,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? '#451A1A' : '#FECACA',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.dangerIconWrap, { backgroundColor: isDark ? '#3A1717' : '#FEE2E2' }]}>
              <LogOut size={16} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="700" style={{ color: '#EF4444' }}>
                Rời khỏi nhóm cố vấn
              </Txt>
              <Txt size={11} style={{ color: colors.textTertiary, marginTop: 1 }}>
                Ngừng tham gia các yêu cầu cố vấn tiếp theo của nhóm
              </Txt>
            </View>
            <ChevronRight size={15} color="#EF4444" />
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Meetup Sticky Bottom Action Bar cho Trưởng nhóm */}
      {isLeader && g.status === 'ACTIVE' ? (
        <View
          style={[
            styles.stickyBottomBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.borderSubtle,
              paddingBottom: Math.max(12, insets.bottom + 8),
            },
          ]}
        >
          <Pressable
            onPress={() => router.push({ pathname: '/mentoring/create-request', params: { groupId: String(g.id) } })}
            style={({ pressed }) => [
              styles.primaryStickyBtn,
              {
                backgroundColor: viridian,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View style={styles.primaryStickyIconBadge}>
              <BrandIcon name="pencil" size={16} />
            </View>
            <Txt size={15} weight="800" style={{ color: '#FFFFFF' }}>
              Tạo yêu cầu Cố vấn cho nhóm
            </Txt>
          </Pressable>
        </View>
      ) : null}

      <ActionSheet
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        actions={
          confirm
            ? [
                {
                  label: 'Xác nhận',
                  danger: true,
                  onPress: () => {
                    const a = confirm.action
                    setConfirm(null)
                    a()
                  },
                },
              ]
            : []
        }
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  capacityBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  capacityTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: {
    height: 8,
    borderRadius: 4,
  },
  sectionBento: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeMemberBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  joinedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dangerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 2,
  },
  dangerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryStickyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
  },
  primaryStickyIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
