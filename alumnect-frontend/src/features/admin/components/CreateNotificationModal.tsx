import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Megaphone,
  Clock,
  Users,
  UserCheck,
  Search,
  Loader2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Hourglass,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, Avatar, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  adminApi,
  type NotificationDuration,
  type AdminUserDto,
} from '../api/adminApi'
import { useCreateSystemNotification } from '../hooks/useAdmin'

interface CreateNotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

type RecipientOption = 'ALL_USERS' | 'STUDENT' | 'ALUMNI' | 'ADMIN' | 'SPECIFIC_USER'
type SendOption = 'NOW' | 'SCHEDULE'
type ExpirationOption = 'FOREVER' | 'ONE_DAY' | 'ONE_WEEK' | 'ONE_MONTH' | 'ONE_YEAR' | 'CUSTOM'

export function CreateNotificationModal({ isOpen, onClose }: CreateNotificationModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // Recipients
  const [recipientChoice, setRecipientChoice] = useState<RecipientOption>('ALL_USERS')
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null)
  const [userQuery, setUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AdminUserDto[]>([])
  const [isSearchingUser, setIsSearchingUser] = useState(false)

  // 1. Send Option (Schedule vs Send Now)
  const [sendType, setSendType] = useState<SendOption>('NOW')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  // 2. Expiration Option (Never vs Presets vs Custom)
  const [expirationType, setExpirationType] = useState<ExpirationOption>('FOREVER')
  const [expireDate, setExpireDate] = useState('')
  const [expireTime, setExpireTime] = useState('')

  const createMutation = useCreateSystemNotification()

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTitle('')
      setContent('')
      setRecipientChoice('ALL_USERS')
      setSelectedUser(null)
      setUserQuery('')
      setSearchResults([])

      setSendType('NOW')
      setScheduleDate('')
      setScheduleTime('')

      setExpirationType('FOREVER')
      setExpireDate('')
      setExpireTime('')
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Debounced user search
  useEffect(() => {
    if (recipientChoice !== 'SPECIFIC_USER' || !userQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingUser(true)
      try {
        const res = await adminApi.getUsers({ query: userQuery.trim(), page: 0, size: 5 })
        setSearchResults(res.data?.content || [])
      } catch (err) {
        console.error('Lỗi tìm kiếm người dùng:', err)
      } finally {
        setIsSearchingUser(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [userQuery, recipientChoice])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo')
      return
    }
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo')
      return
    }

    if (recipientChoice === 'SPECIFIC_USER' && !selectedUser) {
      toast.error('Vui lòng tìm kiếm và chọn người nhận cụ thể')
      return
    }

    // 1. Xử lý Schedule
    let scheduledAtIso: string | undefined = undefined
    let sendReferenceTime = Date.now()

    if (sendType === 'SCHEDULE') {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Vui lòng chọn đầy đủ ngày và giờ hẹn phát thông báo')
        return
      }
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`)
      if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= Date.now()) {
        toast.error('Thời điểm hẹn gửi phải nằm ở tương lai')
        return
      }
      sendReferenceTime = scheduledDateTime.getTime()
      scheduledAtIso = scheduledDateTime.toISOString()
    }

    // 2. Xử lý Expiration
    let expiresAtIso: string | undefined = undefined
    if (expirationType === 'CUSTOM') {
      if (!expireDate || !expireTime) {
        toast.error('Vui lòng chọn đầy đủ ngày và giờ hết hạn thông báo')
        return
      }
      const expDateTime = new Date(`${expireDate}T${expireTime}:00`)
      if (isNaN(expDateTime.getTime())) {
        toast.error('Thời điểm hết hạn không hợp lệ')
        return
      }
      if (expDateTime.getTime() <= sendReferenceTime) {
        toast.error('Thời gian hết hiệu lực phải sau thời điểm gửi thông báo')
        return
      }
      expiresAtIso = expDateTime.toISOString()
    }

    const payloadRecipientType =
      recipientChoice === 'SPECIFIC_USER'
        ? 'SPECIFIC_USER'
        : recipientChoice === 'ALL_USERS'
        ? 'ALL_USERS'
        : 'USER_ROLE'

    const payloadRecipientRole =
      ['STUDENT', 'ALUMNI', 'ADMIN'].includes(recipientChoice) ? recipientChoice : undefined

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        recipientType: payloadRecipientType,
        recipientRole: payloadRecipientRole,
        recipientUserId: recipientChoice === 'SPECIFIC_USER' ? selectedUser?.id : undefined,
        durationType: expirationType as NotificationDuration,
        isScheduled: sendType === 'SCHEDULE',
        scheduledAt: scheduledAtIso,
        expiresAt: expiresAtIso,
      })

      toast.success(
        sendType === 'SCHEDULE'
          ? 'Đã lên lịch gửi thông báo thành công!'
          : 'Đã phát hành thông báo hệ thống thành công!'
      )
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo thông báo')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal Box */}
      <Card
        hover={false}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl border border-plum-950/15 rounded-3xl flex flex-col pop"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-brand-500 via-brand-600 to-gold-500 p-6 text-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-md ring-2 ring-white/30">
              <Megaphone size={22} className="text-white" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Tạo thông báo hệ thống</h2>
              <p className="text-xs text-brand-100 mt-0.5">
                Quản lý lịch gửi (Schedule), thời hạn hiệu lực (Expiration) và phát thanh realtime tới người dùng.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tiêu đề & Nội dung */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-plum-700 mb-1.5">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Thông báo họp lớp / Bảo trì hệ thống..."
                className="w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.02] px-4 py-2.5 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-plum-700 mb-1.5">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập chi tiết nội dung thông báo gửi tới người dùng..."
                className="w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Đối tượng nhận (Recipients) */}
          <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-plum-700">
              Đối tượng nhận (Recipients) <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'ALL_USERS', label: 'Tất cả người dùng', icon: Users },
                { id: 'STUDENT', label: 'Sinh viên', icon: GraduationCap },
                { id: 'ALUMNI', label: 'Cựu sinh viên', icon: Sparkles },
                { id: 'ADMIN', label: 'Quản trị viên', icon: ShieldCheck },
                { id: 'SPECIFIC_USER', label: 'Người dùng cụ thể', icon: UserCheck },
              ].map((opt) => {
                const Icon = opt.icon
                const isSelected = recipientChoice === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRecipientChoice(opt.id as RecipientOption)
                      if (opt.id !== 'SPECIFIC_USER') setSelectedUser(null)
                    }}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs font-bold',
                      isSelected
                        ? 'border-gold-400 bg-gold-50/70 ring-2 ring-gold-400/30 text-plum-950 shadow-2xs'
                        : 'border-plum-900/10 bg-white hover:border-plum-900/20 text-plum-700'
                    )}
                  >
                    <Icon size={15} className={isSelected ? 'text-gold-600' : 'text-plum-400'} />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tìm kiếm người dùng cụ thể */}
            {recipientChoice === 'SPECIFIC_USER' && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                <span className="text-xs text-plum-500 block font-medium">Tìm & chọn người nhận:</span>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gold-300 shadow-xs">
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedUser.avatarUrl} name={selectedUser.fullName} size={32} />
                      <div>
                        <p className="text-xs font-bold text-plum-950">{selectedUser.fullName}</p>
                        <p className="text-[11px] text-plum-400">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                    >
                      Đổi người khác
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-3 text-plum-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email người nhận..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full rounded-xl border border-plum-900/10 bg-white pl-9 pr-8 py-2 text-xs text-plum-900 placeholder:text-plum-400 focus:border-gold-400 focus:outline-none"
                    />
                    {isSearchingUser && (
                      <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-plum-400" />
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-plum-900/15 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-plum-900/5">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u)
                              setUserQuery('')
                              setSearchResults([])
                            }}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-gold-50/50 cursor-pointer transition-colors text-left"
                          >
                            <Avatar src={u.avatarUrl} name={u.fullName} size={28} />
                            <div>
                              <p className="text-xs font-bold text-plum-900">{u.fullName}</p>
                              <p className="text-[10px] text-plum-400">{u.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="border-plum-900/10" />

          {/* 1. Schedule Notification - Hẹn giờ gửi */}
          <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-plum-700 flex items-center gap-1.5">
                <Clock size={14} className="text-gold-500" /> 1. Gửi thông báo (Send)
              </label>
              <span className="text-[11px] text-plum-400 font-medium">Hẹn giờ gửi hoặc phát ngay</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setSendType('NOW')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  sendType === 'NOW'
                    ? 'border-gold-400 bg-gold-50/60 ring-2 ring-gold-400/30 text-plum-950 shadow-2xs'
                    : 'border-plum-900/10 bg-white hover:border-plum-900/20 text-plum-700'
                )}
              >
                <input
                  type="radio"
                  name="sendOption"
                  checked={sendType === 'NOW'}
                  onChange={() => setSendType('NOW')}
                  className="accent-gold-500"
                />
                <div>
                  <span className="text-xs font-bold block">Gửi ngay (Send Now)</span>
                  <span className="text-[10px] text-plum-400">Phát realtime ngay lập tức</span>
                </div>
              </label>

              <label
                onClick={() => setSendType('SCHEDULE')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  sendType === 'SCHEDULE'
                    ? 'border-gold-400 bg-gold-50/60 ring-2 ring-gold-400/30 text-plum-950 shadow-2xs'
                    : 'border-plum-900/10 bg-white hover:border-plum-900/20 text-plum-700'
                )}
              >
                <input
                  type="radio"
                  name="sendOption"
                  checked={sendType === 'SCHEDULE'}
                  onChange={() => setSendType('SCHEDULE')}
                  className="accent-gold-500"
                />
                <div>
                  <span className="text-xs font-bold block">Hẹn giờ (Schedule)</span>
                  <span className="text-[10px] text-plum-400">Tự động phát khi đến giờ</span>
                </div>
              </label>
            </div>

            {/* Field Date / Time chỉ hiển thị khi chọn Schedule */}
            {sendType === 'SCHEDULE' && (
              <div className="pt-2 animate-in fade-in duration-200 p-3 bg-white rounded-xl border border-gold-300 space-y-2">
                <span className="text-xs font-bold text-plum-800 block">Thời điểm phát thông báo:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-plum-500 font-medium block mb-1">
                      Ngày gửi (Date):
                    </label>
                    <input
                      type="date"
                      required={sendType === 'SCHEDULE'}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-lg border border-plum-900/15 bg-white px-3 py-1.5 text-xs text-plum-900 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-plum-500 font-medium block mb-1">
                      Giờ gửi (Time):
                    </label>
                    <input
                      type="time"
                      required={sendType === 'SCHEDULE'}
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-lg border border-plum-900/15 bg-white px-3 py-1.5 text-xs text-plum-900 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-plum-900/10" />

          {/* 2. Expiration - Thời gian hết hiệu lực */}
          <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-plum-700 flex items-center gap-1.5">
                <Hourglass size={14} className="text-gold-500" /> 2. Thời gian hết hiệu lực (Expiration)
              </label>
              <span className="text-[11px] text-plum-400 font-medium">Tách biệt hoàn toàn với Schedule</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'FOREVER', label: 'Không bao giờ hết hạn (Never)' },
                { id: 'ONE_DAY', label: '1 Ngày (1 Day)' },
                { id: 'ONE_WEEK', label: '1 Tuần (1 Week)' },
                { id: 'ONE_MONTH', label: '1 Tháng (1 Month)' },
                { id: 'ONE_YEAR', label: '1 Năm (1 Year)' },
                { id: 'CUSTOM', label: 'Tùy chỉnh (Custom)' },
              ].map((item) => {
                const isSelected = expirationType === item.id
                return (
                  <label
                    key={item.id}
                    onClick={() => setExpirationType(item.id as ExpirationOption)}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs font-bold',
                      isSelected
                        ? 'border-gold-400 bg-gold-50/60 ring-2 ring-gold-400/30 text-plum-950 shadow-2xs'
                        : 'border-plum-900/10 bg-white hover:border-plum-900/20 text-plum-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="expirationOption"
                      checked={isSelected}
                      onChange={() => setExpirationType(item.id as ExpirationOption)}
                      className="accent-gold-500"
                    />
                    <span>{item.label}</span>
                  </label>
                )
              })}
            </div>

            {/* Custom Expiration Date & Time */}
            {expirationType === 'CUSTOM' && (
              <div className="pt-2 animate-in fade-in duration-200 p-3 bg-white rounded-xl border border-gold-300 space-y-2">
                <span className="text-xs font-bold text-plum-800 block">Thời điểm hết hạn hiệu lực:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-plum-500 font-medium block mb-1">
                      Ngày hết hạn (Expiration Date):
                    </label>
                    <input
                      type="date"
                      required={expirationType === 'CUSTOM'}
                      value={expireDate}
                      onChange={(e) => setExpireDate(e.target.value)}
                      className="w-full rounded-lg border border-plum-900/15 bg-white px-3 py-1.5 text-xs text-plum-900 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-plum-500 font-medium block mb-1">
                      Giờ hết hạn (Expiration Time):
                    </label>
                    <input
                      type="time"
                      required={expirationType === 'CUSTOM'}
                      value={expireTime}
                      onChange={(e) => setExpireTime(e.target.value)}
                      className="w-full rounded-lg border border-plum-900/15 bg-white px-3 py-1.5 text-xs text-plum-900 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-plum-900/8 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
              Hủy bỏ (Cancel)
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 font-bold shadow-sm"
            >
              {createMutation.isPending && <Loader2 size={15} className="mr-1.5 animate-spin" />}
              {sendType === 'SCHEDULE' ? 'Lên lịch phát hành (Schedule)' : 'Tạo & Gửi ngay (Send Now)'}
            </Button>
          </div>
        </form>
      </Card>
    </div>,
    document.body
  )
}

