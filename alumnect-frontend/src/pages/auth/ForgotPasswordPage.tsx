import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import { toast, FadeSwitch } from '@/components/ui'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldown, setCooldown] = useState(300)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isResetSuccess, setIsResetSuccess] = useState(false)
  const [resetCountdown, setResetCountdown] = useState(3)

  const forgotM = useForgotPassword()
  const verifyOtpM = useVerifyResetOtp()
  const resetPasswordM = useResetPassword()
  const navigate = useNavigate()

  // Đếm ngược chuyển trang khi đổi mật khẩu thành công
  useEffect(() => {
    if (!isResetSuccess) return
    if (resetCountdown <= 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setResetCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [isResetSuccess, resetCountdown, navigate])

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
      toast.success(res.message || t('auth.otpSentSuccess'))
      changeStep('otp')
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.otpSendError'))
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
      toast.success(t('auth.otpVerifySuccess'))
      changeStep('password')
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.otpInvalid'))
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
      setSuccessMsg(res.message || t('auth.resetPasswordSuccess'))
      setIsResetSuccess(true)
      setResetCountdown(3)
      clearLocalStorage()
      toast.success(t('auth.resetPasswordSuccess'))
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.resetPasswordError'))
    }
  }

  const handleResendOtp = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await forgotM.mutateAsync({ email })
      setSuccessMsg(res.message)
      toast.success(t('auth.resendOtpSuccess'))

      const expiry = Date.now() + 300000 // 5 minutes
      localStorage.setItem('forgot_password_cooldown_expiry', expiry.toString())
      setCooldown(300)
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.resendOtpError'))
    }
  }

  return (
    <AuthScaffold>
      <FadeSwitch id={step}>
{step === 'email' && (
        <>
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-subtle hover:text-text group transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> {t('common.back')} {t('common.login')}
          </Link>

          <h1 className="text-3xl font-extrabold text-text tracking-tight">{t('auth.forgotPassword')}</h1>
          <p className="mt-2 text-sm text-text-subtle leading-relaxed">
            {t('auth.forgotPasswordIntro')}
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-start gap-2 animate-pop">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmitEmail(handleSendOtp)} noValidate>
            <Field
              label={t('auth.email')}
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
              {forgotM.isPending ? t('common.processing') : t('auth.sendOtp')}
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
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-solid hover:text-primary-solid mb-6 group transition-colors"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> {t('auth.backToEnterEmail')}
          </button>

          <h1 className="text-3xl font-extrabold text-text tracking-tight">{t('auth.verifyOtpHeading')}</h1>
          <p className="mt-2 text-sm text-text-subtle leading-relaxed">
            {t('auth.verifyOtpSubheading', { email })}
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl bg-success-soft border border-success-border p-3 text-xs text-success flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmitOtp(handleVerifyOtp)} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-muted">{t('auth.otpInputLabel')}</span>
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
                className="h-12 w-full tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl border border-border bg-surface-2 px-4 text-text placeholder:text-plum-300 focus:border-brand-400/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                required
              />
              {otpErrors.otp && (
                <span className="mt-1 block text-xs font-medium text-danger">{otpErrors.otp.message}</span>
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
              {verifyOtpM.isPending ? t('auth.verifyingText') : t('auth.confirmOtpBtn')}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            {cooldown > 0 ? (
              <p className="text-xs text-text-subtle">
                {t('auth.resendOtpCountdown')}<span className="font-semibold text-primary-solid">{t('auth.minutesAndSeconds', { minutes: Math.floor(cooldown / 60), seconds: cooldown % 60 })}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={forgotM.isPending}
                className="text-xs font-bold text-primary-solid hover:text-primary-solid transition-colors disabled:opacity-50"
              >
                {forgotM.isPending ? t('auth.sendingText') : t('auth.resendNewOtpBtn')}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'password' && (
        isResetSuccess ? (
          <div className="animate-pop text-center py-4 space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success border border-success-border shadow-inner">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1.25, 1], opacity: 1 }}
                transition={{ duration: 0.45, type: 'spring', bounce: 0.55 }}
              >
                <CheckCircle2 size={46} className="text-success" />
              </motion.div>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-text tracking-tight">
                {t('auth.resetPasswordSuccess')}
              </h1>
              <p className="mt-2 text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
                {t('auth.passwordResetSuccessDesc')}
              </p>
            </div>

            {/* Khối loading chuyển trang kèm thanh tiến trình */}
            <div className="rounded-2xl bg-surface-2 p-4 border border-border text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-text-muted">
                <Loader2 size={15} className="animate-spin text-primary-solid" />
                <span>
                  {t('auth.redirectingToLogin', { seconds: resetCountdown })}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <motion.div
                  className="h-full bg-primary-solid rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(resetCountdown / 3) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full"
              rightIcon={<ArrowRight size={18} />}
            >
              {t('common.loginNow')}
            </Button>
          </div>
        ) : (
          <div className="animate-pop">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary-solid animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-solid">{t('nav.changePassword')}</span>
            </div>

            <h1 className="mt-1 text-3xl font-extrabold text-text tracking-tight">{t('nav.changePassword')}</h1>
            <p className="mt-2 text-sm text-text-subtle leading-relaxed">
              {t('auth.resetPasswordStepDesc')}
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmitPassword(handleResetPassword)} noValidate>
              <Field
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={resetPasswordM.isPending}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="flex h-6 w-6 items-center justify-center text-text-subtle hover:text-text-muted transition-colors cursor-pointer"
                    aria-label={t('auth.togglePasswordVisibility')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />

              <Field
                label={t('auth.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={resetPasswordM.isPending}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="flex h-6 w-6 items-center justify-center text-text-subtle hover:text-text-muted transition-colors cursor-pointer"
                    aria-label={t('auth.togglePasswordVisibility')}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                disabled={resetPasswordM.isPending}
                rightIcon={resetPasswordM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
              >
                {resetPasswordM.isPending ? t('common.processing') : t('nav.changePassword')}
              </Button>
            </form>
          </div>
        )
      )}
</FadeSwitch>
    </AuthScaffold>
  )
}
