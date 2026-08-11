import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import {
  AuthScaffold,
  Field,
  useForgotPassword,
  useVerifyResetOtp,
  useResetPassword,
  forgotSchema,
  otpFormSchema,
  passwordFormSchema
} from '@/features/auth'
import type { ForgotInput, OtpFormInput, PasswordFormInput } from '@/features/auth'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldown, setCooldown] = useState(300)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const forgotM = useForgotPassword()
  const verifyOtpM = useVerifyResetOtp()
  const resetPasswordM = useResetPassword()
  const navigate = useNavigate()

  // Load state from localStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('forgot_password_step') as 'email' | 'otp' | 'password' | null
    const savedEmail = localStorage.getItem('forgot_password_email')
    const savedOtp = localStorage.getItem('forgot_password_otp')
    const savedCooldownExpiry = localStorage.getItem('forgot_password_cooldown_expiry')

    if (savedStep && savedEmail) {
      setStep(savedStep)
      setEmail(savedEmail)
      if (savedOtp) setOtp(savedOtp)

      if (savedCooldownExpiry) {
        const expiry = parseInt(savedCooldownExpiry, 10)
        const remaining = Math.floor((expiry - Date.now()) / 1000)
        if (remaining > 0) {
          setCooldown(remaining)
        } else {
          setCooldown(0)
        }
      }
    }
  }, [])

  // Helper to change step and save
  const changeStep = (nextStep: 'email' | 'otp' | 'password') => {
    setStep(nextStep)
    localStorage.setItem('forgot_password_step', nextStep)
  }

  // Clear state on reset success or back
  const clearLocalStorage = () => {
    localStorage.removeItem('forgot_password_step')
    localStorage.removeItem('forgot_password_email')
    localStorage.removeItem('forgot_password_otp')
    localStorage.removeItem('forgot_password_cooldown_expiry')
  }

  // Cooldown countdown timer
  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown, step])

  // Form Step 1: Request OTP
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  // Form Step 2: Verify OTP
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    setValue: setOtpValue,
    formState: { errors: otpErrors },
  } = useForm<OtpFormInput>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' },
  })

  // Form Step 3: Input New Password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  // Handlers
  const handleSendOtp = async (data: ForgotInput) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await forgotM.mutateAsync(data)
      setEmail(data.email)
      localStorage.setItem('forgot_password_email', data.email)

      const expiry = Date.now() + 300000 // 5 minutes
      localStorage.setItem('forgot_password_cooldown_expiry', expiry.toString())
      setCooldown(300)

      setSuccessMsg(res.message)
      changeStep('otp')
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi gửi yêu cầu khôi phục mật khẩu')
    }
  }

  const handleVerifyOtp = async (data: OtpFormInput) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await verifyOtpM.mutateAsync({
        email,
        token: data.otp.trim(),
      })
      setOtp(data.otp.trim())
      localStorage.setItem('forgot_password_otp', data.otp.trim())
      setSuccessMsg(res.message)
      changeStep('password')
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã xác thực không hợp lệ')
      if (err.message && (err.message.includes('bị khóa') || err.message.includes('5 lần'))) {
        setCooldown(0)
        localStorage.removeItem('forgot_password_cooldown_expiry')
      }
    }
  }

  const handleResetPassword = async (data: PasswordFormInput) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await resetPasswordM.mutateAsync({
        email,
        token: otp,
        newPassword: data.newPassword,
      })
      setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!')
      clearLocalStorage()
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đặt lại mật khẩu')
    }
  }

  const handleResendOtp = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await forgotM.mutateAsync({ email })
      setSuccessMsg(res.message)

      const expiry = Date.now() + 300000 // 5 minutes
      localStorage.setItem('forgot_password_cooldown_expiry', expiry.toString())
      setCooldown(300)
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gửi lại mã OTP')
    }
  }

  return (
    <AuthScaffold>
      {step === 'email' && (
        <>
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 hover:text-plum-900 group transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Quay lại đăng nhập
          </Link>

          <h2 className="text-3xl font-extrabold text-plum-900 tracking-tight">Quên mật khẩu?</h2>
          <p className="mt-2 text-sm text-plum-500 leading-relaxed">
            Nhập email tài khoản của bạn. Hệ thống sẽ gửi một mã OTP 6 chữ số để xác minh danh tính.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2 animate-pop">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmitEmail(handleSendOtp)} noValidate>
            <Field
              label="Email đăng ký"
              type="email"
              placeholder="you@fpt.edu.vn"
              trailing={<Mail size={16} />}
              error={emailErrors.email?.message}
              {...registerEmail('email')}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={forgotM.isPending}
              rightIcon={forgotM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
            >
              {forgotM.isPending ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </Button>
          </form>
        </>
      )}

      {step === 'otp' && (
        <div className="animate-pop">
          <button
            type="button"
            onClick={() => {
              clearLocalStorage()
              setStep('email')
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 mb-6 group transition-colors"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Quay lại nhập email
          </button>

          <h2 className="text-3xl font-extrabold text-plum-900 tracking-tight">Xác thực mã OTP</h2>
          <p className="mt-2 text-sm text-plum-500 leading-relaxed">
            Mã OTP 6 số đã được gửi tới email <strong className="text-plum-900">{email}</strong>. Vui lòng nhập mã để tiếp tục.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl bg-mint-50 border border-mint-200/50 p-3 text-xs text-mint-700 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmitOtp(handleVerifyOtp)} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-plum-700">Mã xác thực OTP (6 chữ số)</span>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                {...registerOtp('otp')}
                onChange={(e) => {
                  const cleaned = e.target.value.slice(0, 6).replace(/\D/g, '')
                  e.target.value = cleaned
                  setOtpValue('otp', cleaned)
                }}
                className="h-12 w-full tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl border border-plum-900/10 bg-cream-100 px-4 text-plum-900 placeholder:text-plum-300 focus:border-brand-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                required
              />
              {otpErrors.otp && (
                <span className="mt-1 block text-xs font-medium text-coral-600">{otpErrors.otp.message}</span>
              )}
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={verifyOtpM.isPending}
              rightIcon={verifyOtpM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
            >
              {verifyOtpM.isPending ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            {cooldown > 0 ? (
              <p className="text-xs text-plum-400">
                Gửi lại mã OTP sau: <span className="font-semibold text-brand-600">{Math.floor(cooldown / 60)} phút {cooldown % 60} giây</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={forgotM.isPending}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
              >
                {forgotM.isPending ? 'Đang gửi...' : 'Gửi lại mã OTP mới'}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="animate-pop">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-brand-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Bước cuối cùng</span>
          </div>

          <h2 className="mt-1 text-3xl font-extrabold text-plum-900 tracking-tight">Thiết lập mật khẩu mới</h2>
          <p className="mt-2 text-sm text-plum-500 leading-relaxed">
            Xác thực OTP thành công. Vui lòng nhập mật khẩu mới của bạn dưới đây.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-coral-50 border border-coral-200/50 p-3 text-xs text-coral-600 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl bg-mint-50 border border-mint-200/50 p-3 text-xs text-mint-700 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmitPassword(handleResetPassword)} noValidate>
            <Field
              label="Mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 8 ký tự, có cả chữ và số"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
                  aria-label="Ẩn/hiện mật khẩu"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <Field
              label="Xác nhận mật khẩu mới"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.06] hover:text-plum-900 transition-colors"
                  aria-label="Ẩn/hiện mật khẩu"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              disabled={resetPasswordM.isPending}
              rightIcon={resetPasswordM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
            >
              {resetPasswordM.isPending ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </div>
      )}
    </AuthScaffold>
  )
}
