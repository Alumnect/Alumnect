import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { 
  KeyRound, Eye, EyeOff, Loader2, AlertCircle, LogOut, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChangePassword } from '../hooks/useUserMutations'
import { changePasswordSchema } from '../model/schemas'
import type { ChangePasswordFormValues } from '../model/schemas'
import { Button } from '@/components/ui/Button'
import { Modal, toast } from '@/components/ui'
import { Field, useLogoutAllDevices } from '@/features/auth'

export function ChangePasswordForm() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const changePasswordMutation = useChangePassword()
  const logoutAllDevicesMutation = useLogoutAllDevices()

  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingValues, setPendingValues] = useState<ChangePasswordFormValues | null>(null)

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

  // 1. Submit Form bước 1: Hỏi xác nhận đăng xuất thiết bị khác
  const handleFormSubmit = (values: ChangePasswordFormValues) => {
    setErrorMessage(null)
    setPendingValues(values)
    setShowConfirmModal(true)
  }

  // 2. Thực hiện đổi mật khẩu theo lựa chọn của người dùng
  const executeChangePassword = async (logoutOthers: boolean) => {
    if (!pendingValues) return

    setShowConfirmModal(false)
    setErrorMessage(null)

    try {
      const res = await changePasswordMutation.mutateAsync({
        oldPassword: pendingValues.oldPassword,
        newPassword: pendingValues.newPassword,
        confirmNewPassword: pendingValues.confirmNewPassword,
      })

      // Backend trả về: "Đổi mật khẩu thành công!"
      const successMsg = res.message || 'Đổi mật khẩu thành công!'
      reset()

      if (logoutOthers) {
        // Thu hồi toàn bộ session đăng nhập trên các thiết bị khác
        try {
          await logoutAllDevicesMutation.mutateAsync()
        } catch (err) {
          console.error('Lỗi khi thu hồi tokens:', err)
        }
        
        // Xóa tokens cục bộ ở client và chuyển hướng về trang login
        logout()
        navigate('/login', {
          state: {
            successMessage: `${successMsg} Bạn đã được đăng xuất khỏi tất cả các thiết bị.`,
          },
          replace: true,
        })
      } else {
        // Giữ đăng nhập: Thông báo Toast gọn gàng
        toast.success(successMsg)
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setPendingValues(null)
    }
  }

  return (
    <div className="w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-plum-900/5">
      <div className="flex items-center gap-2">
        <KeyRound className="text-brand-500 animate-pulse" size={24} />
        <h2 className="text-2xl font-extrabold text-plum-900 tracking-tight">Đổi mật khẩu</h2>
      </div>
      <p className="mt-1 text-sm text-plum-500">Bảo vệ tài khoản của bạn bằng cách cập nhật mật khẩu định kỳ.</p>

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
            onClick={() => executeChangePassword(true)}
            disabled={changePasswordMutation.isPending || logoutAllDevicesMutation.isPending}
            className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePasswordMutation.isPending || logoutAllDevicesMutation.isPending ? 'Đang xử lý...' : 'Đăng xuất mọi thiết bị'}
          </button>
          
          {/* Nút duy trì đăng nhập */}
          <button
            type="button"
            onClick={() => executeChangePassword(false)}
            disabled={changePasswordMutation.isPending}
            className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-semibold text-plum-700 bg-plum-900/[0.04] hover:bg-plum-900/[0.08] active:bg-plum-900/[0.12] transition-colors cursor-pointer disabled:opacity-50"
          >
            Duy trì đăng nhập
          </button>
        </div>
      </Modal>
    </div>
  )
}
