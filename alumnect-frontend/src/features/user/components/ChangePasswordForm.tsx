import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { 
  KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, LogOut, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChangePassword } from '../hooks/useUserMutations'
import { changePasswordSchema } from '../model/schemas'
import type { ChangePasswordFormValues } from '../model/schemas'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui'
import { Field, useLogoutAllDevices } from '@/features/auth'

export function ChangePasswordForm() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const changePasswordMutation = useChangePassword()
  const logoutAllDevicesMutation = useLogoutAllDevices()

  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [backendSuccessMessage, setBackendSuccessMessage] = useState('')
  
  // Trạng thái hiển thị modal hỏi đăng xuất
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema) as any,
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  // Khi người dùng bấm submit form
  const handleFormSubmit = async (values: ChangePasswordFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      // 1. Gọi API đổi mật khẩu thành công trước
      const res = await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      })

      // 2. Đổi mật khẩu thành công: Mở modal xác nhận hỏi đăng xuất
      setBackendSuccessMessage(res.message || 'Đổi mật khẩu thành công!')
      setShowConfirmModal(true)
      reset() // Clear form nhập liệu ngay lập tức
    } catch (err: any) {
      console.error(err)
      // Hiển thị thông báo lỗi từ backend
      setErrorMessage(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đổi mật khẩu.')
    }
  }

  // Gọi API đăng xuất hoặc giữ đăng nhập sau khi đổi thành công
  const handleLogoutDecision = async (logoutAll: boolean) => {
    setShowConfirmModal(false)
    
    if (logoutAll) {
      try {
        // Gọi API thu hồi tất cả refresh tokens trong DB
        await logoutAllDevicesMutation.mutateAsync()
      } catch (err) {
        console.error('Lỗi khi thu hồi tokens:', err)
      }
      
      // Xóa tokens cục bộ ở client và chuyển hướng về trang login
      logout()
      navigate('/login', {
        state: {
          successMessage: backendSuccessMessage ? `${backendSuccessMessage} Bạn đã được đăng xuất khỏi tất cả các thiết bị.` : 'Đổi mật khẩu thành công! Bạn đã được đăng xuất khỏi tất cả các thiết bị.',
        },
        replace: true,
      })
    } else {
      // Giữ đăng nhập: Chỉ hiển thị thông báo thành công tại chỗ
      setSuccessMessage(backendSuccessMessage || 'Đổi mật khẩu thành công!')
    }
  }

  return (
    <div className="w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-plum-900/5">
      <div className="flex items-center gap-2">
        <KeyRound className="text-brand-500 animate-pulse" size={24} />
        <h2 className="text-2xl font-extrabold text-plum-900 tracking-tight">Đổi mật khẩu</h2>
      </div>
      <p className="mt-1 text-sm text-plum-500">Bảo vệ tài khoản của bạn bằng cách cập nhật mật khẩu định kỳ.</p>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="mt-4 rounded-xl bg-teal-50 border border-teal-200/50 p-3 text-xs text-teal-700 flex items-start gap-2 animate-pop">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-teal-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2 animate-pop">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-coral-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Mật khẩu cũ */}
        <Field
          label="Mật khẩu hiện tại"
          type={showOldPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu hiện tại"
          icon={<Lock size={16} />}
          error={errors.oldPassword?.message}
          {...register('oldPassword')}
          trailing={
            <button
              type="button"
              onClick={() => setShowOldPassword((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
              aria-label="Ẩn/hiện mật khẩu cũ"
            >
              {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {/* Mật khẩu mới */}
        <Field
          label="Mật khẩu mới"
          type={showNewPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu mới"
          icon={<Lock size={16} />}
          error={errors.newPassword?.message}
          {...register('newPassword')}
          trailing={
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
              aria-label="Ẩn/hiện mật khẩu mới"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {/* Xác nhận mật khẩu mới */}
        <Field
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Xác nhận mật khẩu mới"
          icon={<Lock size={16} />}
          error={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
              aria-label="Ẩn/hiện mật khẩu xác nhận"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-6"
          disabled={changePasswordMutation.isPending}
          rightIcon={changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
        >
          {changePasswordMutation.isPending ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>

      {/* CONFIRMATION MODAL - HỎI ĐĂNG XUẤT */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận đổi mật khẩu"
        icon={<LogOut size={18} />}
        maxWidthClassName="max-w-md"
      >
        <p className="text-sm leading-relaxed text-plum-600">
          Bạn có muốn đăng xuất khỏi tài khoản trên tất cả các thiết bị sau khi đổi mật khẩu thành công không?
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Nút đăng xuất tất cả */}
          <button
            type="button"
            onClick={() => handleLogoutDecision(true)}
            disabled={logoutAllDevicesMutation.isPending}
            className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutAllDevicesMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất mọi thiết bị'}
          </button>
          
          {/* Nút duy trì đăng nhập */}
          <button
            type="button"
            onClick={() => handleLogoutDecision(false)}
            className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-semibold text-plum-700 bg-plum-900/[0.04] hover:bg-plum-900/[0.08] active:bg-plum-900/[0.12] transition-colors cursor-pointer"
          >
            Duy trì đăng nhập
          </button>
        </div>
      </Modal>
    </div>
  )
}
