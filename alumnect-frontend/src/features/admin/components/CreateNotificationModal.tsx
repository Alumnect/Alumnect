import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Search,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Avatar, toast } from '@/components/ui'
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

const RECIPIENT_OPTIONS: { id: RecipientOption; label: string }[] = [
  { id: 'ALL_USERS', label: 'Tất cả người dùng' },
  { id: 'STUDENT', label: 'Sinh viên' },
  { id: 'ALUMNI', label: 'Cựu sinh viên' },
  { id: 'ADMIN', label: 'Quản trị viên' },
  { id: 'SPECIFIC_USER', label: 'Người dùng cụ thể' },
]

const EXPIRATION_OPTIONS: { id: ExpirationOption; label: string }[] = [
  { id: 'FOREVER', label: 'Không giới hạn' },
  { id: 'ONE_DAY', label: '1 ngày' },
  { id: 'ONE_WEEK', label: '1 tuần' },
  { id: 'ONE_MONTH', label: '1 tháng' },
  { id: 'ONE_YEAR', label: '1 năm' },
  { id: 'CUSTOM', label: 'Tùy chỉnh' },
]

/**
 * Custom Admin Dropdown / Select Component (NO AI LOOK)
 * Tuân thủ chuẩn thiết kế thực dụng: cao 40px, font 14px, bo góc 8px, viền xám nhẹ,
 * popup menu tự định vị (lên/xuống), hỗ trợ bàn phím (Arrow, Enter, Escape) và click-outside.
 */
interface CustomSelectOption<T extends string = string> {
  id: T
  label: string
  disabled?: boolean
}

interface CustomSelectProps<T extends string = string> {
  id?: string
  value: T
  options: CustomSelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}

function CustomSelect<T extends string = string>({
  id,
  value,
  options,
  onChange,
  placeholder = 'Chọn một mục...',
  disabled = false,
  error,
  className,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.id === value)

  // Tính toán hướng mở (trên hay dưới) tùy theo không gian màn hình
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        setOpenUpwards(true)
      } else {
        setOpenUpwards(false)
      }
    }
  }, [])

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  // Cập nhật highlighted index khi mở menu
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      const currentIndex = options.findIndex((opt) => opt.id === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, options, value, updatePosition])

  // Cuộn option được highlight vào tầm nhìn khi dùng phím
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const item = menuRef.current.children[highlightedIndex] as HTMLElement | undefined
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, highlightedIndex])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
      case 'Tab':
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (highlightedIndex >= 0 && options[highlightedIndex] && !options[highlightedIndex].disabled) {
          onChange(options[highlightedIndex].id)
          setIsOpen(false)
          triggerRef.current?.focus()
        }
        break
      case 'Home':
        e.preventDefault()
        setHighlightedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setHighlightedIndex(options.length - 1)
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Ô Trigger Dropdown */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-left flex items-center justify-between gap-2 transition-colors cursor-pointer select-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-300 hover:border-slate-400 focus:border-[#F27024] focus:ring-1 focus:ring-[#F27024] focus:outline-none',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 hover:border-slate-300'
        )}
      >
        <span
          className={cn(
            'truncate min-w-0 flex-1 leading-normal',
            selectedOption ? 'text-slate-800 font-normal' : 'text-slate-400'
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-slate-400 shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180 text-slate-600'
          )}
        />
      </button>

      {/* Menu lựa chọn */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute left-0 right-0 z-50 min-w-full bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 max-h-[280px] overflow-y-auto focus:outline-none select-none',
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
        >
          {options.map((opt, index) => {
            const isSelected = opt.id === value
            const isHighlighted = index === highlightedIndex

            return (
              <div
                key={opt.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange(opt.id)
                    setIsOpen(false)
                    triggerRef.current?.focus()
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'min-h-[36px] px-3 py-2 text-sm rounded-md flex items-center justify-between cursor-pointer transition-colors leading-snug',
                  isSelected
                    ? 'bg-orange-50/70 text-[#F27024] font-medium'
                    : isHighlighted
                    ? 'bg-slate-50 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50',
                  opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <span className="truncate flex-1">{opt.label}</span>
                {isSelected && <Check size={16} className="text-[#F27024] shrink-0 ml-2" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

  // 2. Expiration Option
  const [expirationType, setExpirationType] = useState<ExpirationOption>('FOREVER')
  const [expireDate, setExpireDate] = useState('')
  const [expireTime, setExpireTime] = useState('')

  // Inline Validation Errors
  const [errors, setErrors] = useState<{
    title?: string
    content?: string
    recipient?: string
    schedule?: string
    expiration?: string
  }>({})

  const createMutation = useCreateSystemNotification()

  // Reset form when modal opens
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
      setErrors({})
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

  // Safe close with unsaved draft confirmation
  const handleSafeClose = useCallback(() => {
    if (createMutation.isPending) return
    if (title.trim() || content.trim()) {
      const confirmed = window.confirm(
        'Bạn có nội dung thông báo chưa gửi. Bạn có chắc muốn đóng và hủy bản nháp?'
      )
      if (!confirmed) return
    }
    onClose()
  }, [createMutation.isPending, title, content, onClose])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSafeClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleSafeClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {}

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề thông báo'
    }
    if (!content.trim()) {
      newErrors.content = 'Vui lòng nhập nội dung thông báo'
    }

    if (recipientChoice === 'SPECIFIC_USER' && !selectedUser) {
      newErrors.recipient = 'Vui lòng tìm và chọn một người nhận cụ thể'
    }

    // 1. Validate Schedule
    let scheduledAtIso: string | undefined = undefined
    let sendReferenceTime = Date.now()

    if (sendType === 'SCHEDULE') {
      if (!scheduleDate || !scheduleTime) {
        newErrors.schedule = 'Vui lòng chọn đầy đủ ngày và giờ hẹn gửi'
      } else {
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`)
        if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= Date.now()) {
          newErrors.schedule = 'Thời điểm hẹn gửi phải nằm ở tương lai'
        } else {
          sendReferenceTime = scheduledDateTime.getTime()
          scheduledAtIso = scheduledDateTime.toISOString()
        }
      }
    }

    // 2. Validate Expiration
    let expiresAtIso: string | undefined = undefined
    if (expirationType === 'CUSTOM') {
      if (!expireDate || !expireTime) {
        newErrors.expiration = 'Vui lòng chọn đầy đủ ngày và giờ hết hạn'
      } else {
        const expDateTime = new Date(`${expireDate}T${expireTime}:00`)
        if (isNaN(expDateTime.getTime())) {
          newErrors.expiration = 'Thời điểm hết hạn không hợp lệ'
        } else if (expDateTime.getTime() <= sendReferenceTime) {
          newErrors.expiration = 'Thời điểm hết hạn phải sau thời điểm gửi'
        } else {
          expiresAtIso = expDateTime.toISOString()
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      if (firstError) toast.error(firstError)
      return
    }

    setErrors({})

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
          ? 'Đã lên lịch gửi thông báo thành công'
          : 'Đã gửi thông báo thành công'
      )
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi thông báo')
    }
  }

  // Get human readable recipient summary for footer
  const getRecipientSummary = () => {
    switch (recipientChoice) {
      case 'ALL_USERS':
        return 'Gửi đến: Tất cả người dùng'
      case 'STUDENT':
        return 'Gửi đến: Sinh viên'
      case 'ALUMNI':
        return 'Gửi đến: Cựu sinh viên'
      case 'ADMIN':
        return 'Gửi đến: Quản trị viên'
      case 'SPECIFIC_USER':
        return selectedUser ? `Gửi đến: ${selectedUser.fullName}` : 'Chưa chọn người nhận'
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        onClick={handleSafeClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
              Gửi thông báo
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Soạn thông báo gửi đến nhóm người nhận.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSafeClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="broadcast-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Người nhận */}
          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-slate-700">
              Người nhận <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_OPTIONS.map((opt) => {
                const isSelected = recipientChoice === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRecipientChoice(opt.id)
                      setErrors((prev) => ({ ...prev, recipient: undefined }))
                      if (opt.id !== 'SPECIFIC_USER') setSelectedUser(null)
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border cursor-pointer',
                      isSelected
                        ? 'border-[#F27024] bg-orange-50/60 text-[#F27024]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {/* Selected Specific User Tag or Search Box */}
            {recipientChoice === 'SPECIFIC_USER' && (
              <div className="pt-2 space-y-2">
                {selectedUser ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <Avatar src={selectedUser.avatarUrl} name={selectedUser.fullName} size={24} />
                    <span className="text-[13px] font-medium text-slate-800">
                      {selectedUser.fullName}
                    </span>
                    <span className="text-[12px] text-slate-400">({selectedUser.email})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="ml-1 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Xóa người nhận"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative max-w-md">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email người nhận..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                    />
                    {isSearchingUser && (
                      <Loader2
                        size={15}
                        className="absolute right-3 top-2.5 animate-spin text-slate-400"
                      />
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u)
                              setUserQuery('')
                              setSearchResults([])
                              setErrors((prev) => ({ ...prev, recipient: undefined }))
                            }}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <Avatar src={u.avatarUrl} name={u.fullName} size={28} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 truncate">
                                {u.fullName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {errors.recipient && (
                  <p className="text-[12px] text-red-500 font-medium">{errors.recipient}</p>
                )}
              </div>
            )}
          </div>

          {/* 2. Tiêu đề */}
          <div className="space-y-1.5">
            <label htmlFor="broadcast-title" className="block text-[13px] font-medium text-slate-700">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              id="broadcast-title"
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              placeholder="Nhập tiêu đề thông báo..."
              className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-colors',
                errors.title
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none'
                  : 'border-slate-300 focus:border-[#F27024] focus:ring-1 focus:ring-[#F27024] focus:outline-none'
              )}
            />
            {errors.title && (
              <p className="text-[12px] text-red-500 font-medium">{errors.title}</p>
            )}
          </div>

          {/* 3. Nội dung */}
          <div className="space-y-1.5">
            <label htmlFor="broadcast-content" className="block text-[13px] font-medium text-slate-700">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              id="broadcast-content"
              required
              rows={5}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }))
              }}
              placeholder="Nhập nội dung thông báo..."
              className={cn(
                'w-full rounded-lg border bg-white p-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors leading-relaxed',
                errors.content
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none'
                  : 'border-slate-300 focus:border-[#F27024] focus:ring-1 focus:ring-[#F27024] focus:outline-none'
              )}
            />
            {errors.content && (
              <p className="text-[12px] text-red-500 font-medium">{errors.content}</p>
            )}
          </div>

          {/* 4. Tùy chọn gửi & thời hạn */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thời điểm gửi */}
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-slate-700">
                Thời điểm gửi
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="sendOption"
                    checked={sendType === 'NOW'}
                    onChange={() => {
                      setSendType('NOW')
                      setErrors((prev) => ({ ...prev, schedule: undefined }))
                    }}
                    className="text-[#F27024] focus:ring-[#F27024]"
                  />
                  <span>Gửi ngay</span>
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="sendOption"
                    checked={sendType === 'SCHEDULE'}
                    onChange={() => setSendType('SCHEDULE')}
                    className="text-[#F27024] focus:ring-[#F27024]"
                  />
                  <span>Hẹn giờ gửi</span>
                </label>
              </div>

              {sendType === 'SCHEDULE' && (
                <div className="pt-1.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        required={sendType === 'SCHEDULE'}
                        value={scheduleDate}
                        onChange={(e) => {
                          setScheduleDate(e.target.value)
                          setErrors((prev) => ({ ...prev, schedule: undefined }))
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        required={sendType === 'SCHEDULE'}
                        value={scheduleTime}
                        onChange={(e) => {
                          setScheduleTime(e.target.value)
                          setErrors((prev) => ({ ...prev, schedule: undefined }))
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                      />
                    </div>
                  </div>
                  {errors.schedule && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.schedule}</p>
                  )}
                </div>
              )}
            </div>

            {/* Thời hạn hiệu lực (Custom Select) */}
            <div className="space-y-2">
              <label htmlFor="expiration-type-select" className="block text-[13px] font-medium text-slate-700">
                Thời hạn hiệu lực
              </label>

              <CustomSelect
                id="expiration-type-select"
                value={expirationType}
                options={EXPIRATION_OPTIONS}
                onChange={(val) => {
                  setExpirationType(val)
                  setErrors((prev) => ({ ...prev, expiration: undefined }))
                }}
                error={errors.expiration}
              />

              {expirationType === 'CUSTOM' && (
                <div className="pt-1.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        required={expirationType === 'CUSTOM'}
                        value={expireDate}
                        onChange={(e) => {
                          setExpireDate(e.target.value)
                          setErrors((prev) => ({ ...prev, expiration: undefined }))
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        required={expirationType === 'CUSTOM'}
                        value={expireTime}
                        onChange={(e) => {
                          setExpireTime(e.target.value)
                          setErrors((prev) => ({ ...prev, expiration: undefined }))
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
                      />
                    </div>
                  </div>
                  {errors.expiration && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.expiration}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <div className="text-[13px] text-slate-500 font-normal">
            {getRecipientSummary()}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="broadcast-form"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F27024] hover:bg-[#d95d16] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {createMutation.isPending && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {createMutation.isPending
                ? 'Đang gửi...'
                : sendType === 'SCHEDULE'
                ? 'Lên lịch gửi'
                : 'Gửi thông báo'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
